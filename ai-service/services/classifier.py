import json
import os
from datetime import datetime, timezone
from pathlib import Path

from openai import AsyncOpenAI

from schemas import TriageRequest, TriageResponse

MODEL_NAME = "gpt-4o"
FLAG_THRESHOLD = 0.6
LOG_FILE = Path(__file__).resolve().parents[1] / "flagged_incidents.log"


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _extract_json(raw: str) -> dict:
    content = raw.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return json.loads(content.strip())


async def triage_incident(payload: TriageRequest) -> TriageResponse:
    client = _get_client()

    prompt = (
        "You are an emergency dispatch AI. Analyze this disaster SOS report and return ONLY valid JSON with these fields:\n"
        "- urgency: 'CRITICAL' | 'HIGH' | 'MODERATE'\n"
        "- category: 'FLOOD'|'FIRE'|'EARTHQUAKE'|'MEDICAL'|'RESCUE'|'SHELTER'|'FOOD'|'OTHER'\n"
        "- spam_score: float 0.0-1.0 (1.0 = definitely fake)\n"
        "- resources_needed: array of strings from ['BOAT','HELICOPTER','AMBULANCE','FIRE_ENGINE','MEDICAL_KIT','FOOD_PACK','WATER','ROPE','TENT']\n"
        "- summary: one sentence describing the emergency\n"
        "- people_estimate: integer estimate of people affected\n"
        "If photo is provided, analyze it to validate the report.\n"
        f"Description: {payload.description}\n"
        f"Reported category: {payload.category.value if payload.category else 'UNKNOWN'}"
    )

    user_content: list[dict] = [{"type": "text", "text": prompt}]
    if payload.photo_url:
        user_content.append({"type": "image_url", "image_url": {"url": str(payload.photo_url)}})

    completion = await client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You classify emergency incidents and return strict JSON only."},
            {"role": "user", "content": user_content},
        ],
    )
    raw = completion.choices[0].message.content or "{}"
    parsed = _extract_json(raw)
    result = TriageResponse(**parsed)

    if result.spam_score > FLAG_THRESHOLD:
        result.flagged_for_review = True
        await log_flagged_incident(payload, result)

    return result


async def log_flagged_incident(payload: TriageRequest, result: TriageResponse) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "incident_id": payload.incident_id,
        "description": payload.description,
        "photo_url": str(payload.photo_url) if payload.photo_url else None,
        "triage": result.model_dump(),
    }
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

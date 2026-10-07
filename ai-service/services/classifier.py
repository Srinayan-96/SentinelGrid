import json
import os
from datetime import datetime, timezone
from pathlib import Path

from google import genai
from google.genai import types

from schemas import TriageRequest, TriageResponse

MODEL_NAME = "gemini-2.5-flash"
FLAG_THRESHOLD = 0.6
LOG_FILE = Path(__file__).resolve().parents[1] / "flagged_incidents.log"


def _get_client() -> genai.Client:
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


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
        f"Description: {payload.description}\n"
        f"Reported category: {payload.category.value if payload.category else 'UNKNOWN'}"
    )
    
    # We use generate_content since this is standard for Gemini SDK.
    # Note: image processing would be supported if payload.photo_url exists and downloaded, but for now we rely on description text.

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.1,
        system_instruction="You classify emergency incidents and return strict JSON only."
    )
    
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=config,
    )
    
    raw = response.text or "{}"
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

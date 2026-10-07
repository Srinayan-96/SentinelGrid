import json
import os

from google import genai
from google.genai import types

from schemas import VolunteerMatchRequest, VolunteerMatchResponse

MODEL_NAME = "gemini-2.5-flash"


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


async def match_volunteers(payload: VolunteerMatchRequest) -> VolunteerMatchResponse:
    client = _get_client()
    prompt = (
        "Given this emergency and these available responders with their skills, location distance, and current load, "
        "rank the top 3 best matches. Return JSON object with key `matches` containing array items with fields "
        "`responder_id` and `reason`.\n"
        f"Incident:\n{json.dumps(payload.incident)}\n"
        f"Responders:\n{payload.model_dump_json()}\n"
    )
    
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.1,
        system_instruction="You rank emergency responder assignments. Return strict JSON only."
    )
    
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=config,
    )
    
    raw = response.text or '{"matches":[]}'
    parsed = _extract_json(raw)
    response_obj = VolunteerMatchResponse(**parsed)
    response_obj.matches = response_obj.matches[:3]
    return response_obj

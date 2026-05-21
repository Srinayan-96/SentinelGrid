import json
import os

from openai import AsyncOpenAI

from schemas import VolunteerMatchRequest, VolunteerMatchResponse

MODEL_NAME = "gpt-4o"


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


async def match_volunteers(payload: VolunteerMatchRequest) -> VolunteerMatchResponse:
    client = _get_client()
    prompt = (
        "Given this emergency and these available responders with their skills, location distance, and current load, "
        "rank the top 3 best matches. Return JSON object with key `matches` containing array items with fields "
        "`responder_id` and `reason`.\n"
        f"Incident:\n{json.dumps(payload.incident)}\n"
        f"Responders:\n{payload.model_dump_json()}\n"
    )
    completion = await client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You rank emergency responder assignments. Return strict JSON only."},
            {"role": "user", "content": prompt},
        ],
    )
    raw = completion.choices[0].message.content or '{"matches":[]}'
    parsed = _extract_json(raw)
    response = VolunteerMatchResponse(**parsed)
    response.matches = response.matches[:3]
    return response

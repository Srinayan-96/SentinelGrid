import json
import os

from google import genai

from schemas import SitRepRequest, SitRepResponse

MODEL_NAME = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


async def generate_sitrep(payload: SitRepRequest) -> SitRepResponse:
    client = _get_client()
    prompt = (
        "Generate a concise military-style situation report for emergency coordinators. Include: active incidents by zone, "
        "critical unresolved cases, forces deployed, estimated people still at risk. Be precise and factual.\n"
        f"Input grouped incidents: {payload.model_dump_json()}"
    )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    report_text = (response.text or "").strip()
    zone = "ALL_ZONES"
    if payload.grouped_incidents:
        zone = ",".join(sorted({item.zone for item in payload.grouped_incidents}))
    return SitRepResponse(
        zone=zone,
        report_text=report_text,
        stats=payload.kpi_snapshot,
    )

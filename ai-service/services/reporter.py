import json
import os

from openai import AsyncOpenAI

from schemas import SitRepRequest, SitRepResponse

MODEL_NAME = "gpt-4o"


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def generate_sitrep(payload: SitRepRequest) -> SitRepResponse:
    client = _get_client()
    prompt = (
        "Generate a concise military-style situation report for emergency coordinators. Include: active incidents by zone, "
        "critical unresolved cases, forces deployed, estimated people still at risk. Be precise and factual.\n"
        f"Input grouped incidents: {payload.model_dump_json()}"
    )

    completion = await client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.2,
        messages=[
            {"role": "system", "content": "You produce concise emergency operation situation reports."},
            {"role": "user", "content": prompt},
        ],
    )
    report_text = (completion.choices[0].message.content or "").strip()
    zone = "ALL_ZONES"
    if payload.grouped_incidents:
        zone = ",".join(sorted({item.zone for item in payload.grouped_incidents}))
    return SitRepResponse(
        zone=zone,
        report_text=report_text,
        stats=payload.kpi_snapshot,
    )

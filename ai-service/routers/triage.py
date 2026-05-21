from fastapi import APIRouter, HTTPException

from schemas import (
    TriageRequest,
    TriageResponse,
    VolunteerMatchRequest,
    VolunteerMatchResponse,
)
from services.classifier import triage_incident
from services.matcher import match_volunteers

router = APIRouter()


@router.post("/triage", response_model=TriageResponse)
async def triage_route(payload: TriageRequest):
    try:
        return await triage_incident(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Triage failed: {exc}") from exc


@router.post("/match-volunteers", response_model=VolunteerMatchResponse)
async def match_volunteers_route(payload: VolunteerMatchRequest):
    try:
        return await match_volunteers(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Volunteer match failed: {exc}") from exc

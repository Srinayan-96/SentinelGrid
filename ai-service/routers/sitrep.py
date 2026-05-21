from fastapi import APIRouter, HTTPException

from schemas import SitRepRequest, SitRepResponse
from services.reporter import generate_sitrep

router = APIRouter()


@router.post("/sitrep", response_model=SitRepResponse)
async def sitrep_route(payload: SitRepRequest):
    try:
        return await generate_sitrep(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sitrep generation failed: {exc}") from exc

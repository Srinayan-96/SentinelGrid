from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl, field_validator


class UrgencyEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"


class CategoryEnum(str, Enum):
    FLOOD = "FLOOD"
    FIRE = "FIRE"
    EARTHQUAKE = "EARTHQUAKE"
    MEDICAL = "MEDICAL"
    RESCUE = "RESCUE"
    SHELTER = "SHELTER"
    FOOD = "FOOD"
    OTHER = "OTHER"


class ResourceEnum(str, Enum):
    BOAT = "BOAT"
    HELICOPTER = "HELICOPTER"
    AMBULANCE = "AMBULANCE"
    FIRE_ENGINE = "FIRE_ENGINE"
    MEDICAL_KIT = "MEDICAL_KIT"
    FOOD_PACK = "FOOD_PACK"
    WATER = "WATER"
    ROPE = "ROPE"
    TENT = "TENT"


class TriageRequest(BaseModel):
    description: str = Field(min_length=10)
    photo_url: HttpUrl | None = None
    category: CategoryEnum | None = None
    incident_id: str | None = None


class TriageResponse(BaseModel):
    urgency: UrgencyEnum
    category: CategoryEnum
    spam_score: float = Field(ge=0.0, le=1.0)
    resources_needed: list[ResourceEnum]
    summary: str = Field(min_length=6, max_length=280)
    people_estimate: int = Field(ge=0, le=100000)
    flagged_for_review: bool = False

    @field_validator("resources_needed")
    @classmethod
    def dedupe_resources(cls, value: list[ResourceEnum]) -> list[ResourceEnum]:
        return list(dict.fromkeys(value))


class ResponderCandidate(BaseModel):
    responder_id: str
    skills: list[str] = []
    distance_km: float = Field(ge=0)
    current_load: int = Field(ge=0)
    force_id: str | None = None


class VolunteerMatchRequest(BaseModel):
    incident: dict[str, Any]
    responders: list[ResponderCandidate]


class VolunteerRankedItem(BaseModel):
    responder_id: str
    reason: str


class VolunteerMatchResponse(BaseModel):
    matches: list[VolunteerRankedItem] = Field(max_length=3)


class ZoneIncidentSnapshot(BaseModel):
    zone: str
    incidents: list[dict[str, Any]]


class SitRepRequest(BaseModel):
    grouped_incidents: list[ZoneIncidentSnapshot]
    deployed_forces: list[str] = []
    estimated_people_at_risk: int = Field(ge=0)
    kpi_snapshot: dict[str, Any] = {}


class SitRepResponse(BaseModel):
    zone: str
    report_text: str = Field(min_length=20)
    stats: dict[str, Any]

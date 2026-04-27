"""Phase 14 Plan 14-01 — Admin stats DTOs (D-A7 composite payload).

Single composite endpoint returns all three sub-charts in one round trip:
- Active users trend over the last 30 days (audit_log on-the-fly compute, D-X2)
- Methodology distribution (cheap project GROUP BY, D-X3)
- Project velocities top-30 (Phase 13 GetProjectIterationUseCase reuse, D-X4)
"""
from datetime import date as date_type
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class ActiveUsersTrendPointDTO(BaseModel):
    date: str  # ISO date — frontend parses for x-axis
    count: int

    model_config = ConfigDict(from_attributes=True)


class ProjectVelocityDTO(BaseModel):
    project_id: int
    key: str
    name: str
    progress: float
    velocity_history: List[float]

    model_config = ConfigDict(from_attributes=True)


class AdminStatsResponseDTO(BaseModel):
    active_users_trend: List[ActiveUsersTrendPointDTO]
    methodology_distribution: Dict[str, int]
    project_velocities: List[ProjectVelocityDTO]

    model_config = ConfigDict(from_attributes=True)

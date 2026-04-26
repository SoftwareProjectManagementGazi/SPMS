"""Phase 13 chart DTOs (D-X1..X3 contract shapes).

Wave 1 fat-infra contract: every downstream chart card renders against these
DTO shapes. snake_case fields per Phase 9 D-46 convention; the Frontend2
chart-service layer maps to camelCase before consumers see them.
"""
from pydantic import BaseModel, ConfigDict
from typing import List


# ---------------------------------------------------------------------------
# CFD (Cumulative Flow Diagram) — D-X1
# ---------------------------------------------------------------------------


class CFDDayDTO(BaseModel):
    """One day's snapshot of task counts per workflow bucket."""

    date: str
    todo: int
    progress: int
    review: int
    done: int

    model_config = ConfigDict(from_attributes=True)


class CFDResponseDTO(BaseModel):
    """CFD endpoint response shape."""

    days: List[CFDDayDTO]
    avg_wip: float
    avg_completion_per_day: float

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Lead / Cycle Time — D-X2
# ---------------------------------------------------------------------------


class LeadCycleBucketDTO(BaseModel):
    """One histogram bucket. ``range`` matches FE LEAD_CYCLE_BUCKETS labels."""

    range: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class LeadCycleStatsDTO(BaseModel):
    """Per-direction stats: average + percentiles + 5 buckets."""

    avg_days: float
    p50: float
    p85: float
    p95: float
    buckets: List[LeadCycleBucketDTO]

    model_config = ConfigDict(from_attributes=True)


class LeadCycleResponseDTO(BaseModel):
    """Lead/Cycle endpoint response — paired stats."""

    lead: LeadCycleStatsDTO
    cycle: LeadCycleStatsDTO

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Iteration Comparison — D-X3
# ---------------------------------------------------------------------------


class IterationSprintDTO(BaseModel):
    """One sprint's planned/completed/carried counts."""

    id: int
    name: str
    planned: int
    completed: int
    carried: int

    model_config = ConfigDict(from_attributes=True)


class IterationResponseDTO(BaseModel):
    """Iteration endpoint response — last N sprints ordered by end_date ASC."""

    sprints: List[IterationSprintDTO]

    model_config = ConfigDict(from_attributes=True)

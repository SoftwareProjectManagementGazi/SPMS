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


# ---------------------------------------------------------------------------
# Chart Capabilities — Reports migration v2 (Strategy D)
# ---------------------------------------------------------------------------
#
# Response shape for ``GET /api/v1/projects/{id}/chart-capabilities``. Maps
# directly to the keys in ``CHART_CAPABILITY_RULES`` so adding a new chart =
# adding a new rule + an optional bool field here (Pydantic allows extra keys
# but the FE expects the typed shape).


class ChartCapabilitiesResponseDTO(BaseModel):
    """Per-chart visibility flags computed from project state + workflow.

    Each field maps 1:1 to a key in ``app.domain.services.chart_applicability
    .CHART_CAPABILITY_RULES``. Frontend gates its chart cards on these booleans
    without having to mirror the rule definitions.
    """

    burndown: bool
    iteration: bool
    cfd: bool
    lead_cycle: bool
    phase_progress: bool
    team_load: bool
    summary: bool

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Phase Progress — Reports migration v2 (Strategy D differentiator)
# ---------------------------------------------------------------------------
#
# Replaces the Phase-13-era ``misc.jsx`` Phase Reports table with a real chart
# fed by an aggregation over ``tasks.phase_id`` joined to board column
# categories. The endpoint is methodology-agnostic — Strategy D gates it on
# ``phase_workflow.nodes.length > 0`` so Waterfall / custom workflows / any
# project with declared phases gets meaningful visualization.


class PhaseProgressEntryDTO(BaseModel):
    """One phase node's task breakdown by column category."""

    id: str  # phase_workflow.nodes[i].id — stable across renames
    name: str  # display label from phase_workflow.nodes[i].name
    order: int  # 0-based position in phase_workflow.nodes
    total: int
    done: int
    in_progress: int
    todo: int

    model_config = ConfigDict(from_attributes=True)


class PhaseProgressResponseDTO(BaseModel):
    """Phase progress endpoint response — ordered list of phase aggregates."""

    phases: List[PhaseProgressEntryDTO]

    model_config = ConfigDict(from_attributes=True)

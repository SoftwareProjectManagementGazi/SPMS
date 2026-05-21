from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime


class SummaryDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    active_tasks: int
    completed_tasks: int
    total_tasks: int
    completion_rate: float  # percentage 0-100

    # Reports migration v2 — prototype StatCards expose period-over-period
    # deltas (e.g. "Sprint Velocity 48 +6 pts"). Each delta is computed as
    # current_period - previous_period of the same length; ``None`` means
    # the previous period had no data (first run / fresh project) and the
    # frontend renders an em-dash placeholder instead of "+0".
    velocity_delta: Optional[float] = None  # absolute change in completed_tasks vs prev period
    completed_delta_pct: Optional[float] = None  # percent change in completion_rate vs prev period
    cycle_time_avg_days: Optional[float] = None  # avg cycle time over current period (computed from audit_log)
    cycle_time_delta_days: Optional[float] = None  # days change in cycle time vs prev period
    blockers_count: Optional[int] = None  # count of tasks in BLOCKED status (column.category = 'blocked' or name match)
    blockers_delta: Optional[int] = None  # absolute change in blockers vs prev period


class BurndownPointDTO(BaseModel):
    date: str  # ISO date string "YYYY-MM-DD"
    remaining: int
    total: int


class BurndownDTO(BaseModel):
    sprint_name: str
    sprint_id: int
    series: List[BurndownPointDTO]


class VelocityPointDTO(BaseModel):
    label: str  # sprint name or "W14" week label
    completed_count: int
    completed_points: int


class VelocityDTO(BaseModel):
    series: List[VelocityPointDTO]


class DistributionItemDTO(BaseModel):
    label: str  # status name or priority name
    count: int
    color: Optional[str] = None  # CSS variable hint


class DistributionDTO(BaseModel):
    group_by: str  # "status" or "priority"
    items: List[DistributionItemDTO]


class MemberPerformanceDTO(BaseModel):
    user_id: int
    full_name: str
    avatar_path: Optional[str] = None
    assigned: int
    completed: int
    in_progress: int
    on_time_pct: float  # 0-100, 1 decimal


class PerformanceDTO(BaseModel):
    members: List[MemberPerformanceDTO]


class TaskExportRowDTO(BaseModel):
    # Reports v2 audit: legacy DB rows have task_key=NULL because the
    # task_key writer didn't fire for seed data + several pre-Phase-13
    # create paths. The PDF/Excel exporters fall back to
    # f"{project.key}-{task_id}" when task_key is missing, so we now
    # carry task_id through the DTO for that derivation. Kept Optional
    # for backward-compat with any test fake that doesn't populate it.
    task_id: Optional[int] = None
    task_key: Optional[str]
    title: str
    status: Optional[str]  # column name
    assignee: Optional[str]  # full_name
    priority: Optional[str]
    sprint: Optional[str]  # sprint name
    points: Optional[int]
    created_at: Optional[datetime]
    due_date: Optional[datetime]
    updated_at: Optional[datetime]
    reporter: Optional[str]  # full_name

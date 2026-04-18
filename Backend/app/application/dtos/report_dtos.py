from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime


class SummaryDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    active_tasks: int
    completed_tasks: int
    total_tasks: int
    completion_rate: float  # percentage 0-100


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

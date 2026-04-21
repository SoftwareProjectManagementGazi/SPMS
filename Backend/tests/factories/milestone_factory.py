"""Milestone entity factory. Available once plan 09-05 lands the entity."""
from datetime import datetime
from typing import Any, List, Optional


def make_milestone(
    project_id: int = 1,
    name: Optional[str] = None,
    linked_phase_ids: Optional[List[str]] = None,
    target_date: Optional[datetime] = None,
    id: Optional[int] = None,
    **extra: Any,
):
    from app.domain.entities.milestone import Milestone, MilestoneStatus  # late import until entity exists
    return Milestone(
        id=id,
        project_id=project_id,
        name=name or "Test Milestone",
        target_date=target_date,
        status=MilestoneStatus.PENDING,
        linked_phase_ids=linked_phase_ids or [],
        **extra,
    )

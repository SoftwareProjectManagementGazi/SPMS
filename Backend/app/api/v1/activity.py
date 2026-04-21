"""API-02 Activity feed router.

Mounted at /api/v1 prefix so full path is /api/v1/projects/{project_id}/activity.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime

from app.api.deps.project import get_project_member
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.get_project_activity import GetProjectActivityUseCase
from app.application.dtos.activity_dtos import ActivityResponseDTO


router = APIRouter()


@router.get(
    "/projects/{project_id}/activity",
    response_model=ActivityResponseDTO,
)
async def get_project_activity(
    project_id: int,
    type: Optional[List[str]] = Query(default=None, alias="type[]"),
    user_id: Optional[int] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _member=Depends(get_project_member),
    audit_repo=Depends(get_audit_repo),
) -> ActivityResponseDTO:
    """D-46 / D-47: filtered paginated project activity feed.

    Query params:
    - ``type[]`` multi-value filter on audit_log.action
      (e.g. ``?type[]=task_created&type[]=phase_transition``)
    - ``user_id``, ``date_from``, ``date_to``, ``limit``, ``offset``

    Authorization: project member only (non-member returns 403 via get_project_member).
    Page size capped at 200 (T-09-09-03 DoS mitigation).
    """
    use_case = GetProjectActivityUseCase(audit_repo)
    return await use_case.execute(
        project_id=project_id,
        types=type,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )

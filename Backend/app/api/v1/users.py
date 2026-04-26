"""API-03 / D-17 User summary + led teams router."""
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.api.deps.auth import get_current_user
from app.api.deps.user import get_user_repo
from app.api.deps.project import get_project_repo
from app.api.deps.audit import get_audit_repo
from app.api.deps.task import get_task_repo
from app.api.deps.team import get_team_repo
from app.application.use_cases.get_user_summary import GetUserSummaryUseCase
from app.application.use_cases.manage_teams import GetLedTeamsUseCase
from app.application.use_cases.get_user_activity import GetUserActivityUseCase
from app.application.dtos.user_summary_dtos import UserSummaryResponseDTO
from app.application.dtos.activity_dtos import ActivityResponseDTO


router = APIRouter()


def _is_admin_role(current_user) -> bool:
    """Robust role check: handles both Role.name attribute and plain string roles.

    The user.role can be a Role entity (with `.name`) or a plain string in
    older fixtures; both spellings ("Admin", "admin") are accepted.
    """
    role = getattr(current_user, "role", None)
    if role is None:
        return False
    name = getattr(role, "name", role)
    if not isinstance(name, str):
        return False
    return name.lower() == "admin"


@router.get("/users/{user_id}/summary", response_model=UserSummaryResponseDTO)
async def get_user_summary(
    user_id: int,
    include_archived: bool = Query(default=False),
    _current=Depends(get_current_user),
    user_repo=Depends(get_user_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
    task_repo=Depends(get_task_repo),
) -> UserSummaryResponseDTO:
    """D-48 / D-49: user stats + projects + recent activity via asyncio.gather.

    Authorization: any authenticated user (T-09-09-02 accepted — admin/self use only;
    hardening deferred per SUMMARY.md).
    """
    uc = GetUserSummaryUseCase(user_repo, project_repo, audit_repo, task_repo)
    return await uc.execute(user_id=user_id, include_archived=include_archived)


@router.get("/users/me/led-teams")
async def get_my_led_teams(
    current_user=Depends(get_current_user),
    team_repo=Depends(get_team_repo),
    project_repo=Depends(get_project_repo),
):
    """D-17: teams the current user leads + their project memberships.

    Response shape: ``{teams: [{id, name, description}], project_ids: [int]}``
    Frontend uses this to decide whether to show Phase Gate / Milestone buttons (D-18).
    """
    uc = GetLedTeamsUseCase(team_repo, project_repo)
    return await uc.execute(user_id=current_user.id)


@router.get("/users/{user_id}/activity", response_model=ActivityResponseDTO)
async def get_user_activity(
    user_id: int,
    type: Optional[List[str]] = Query(default=None, alias="type[]"),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user=Depends(get_current_user),
    audit_repo=Depends(get_audit_repo),
) -> ActivityResponseDTO:
    """Phase 13 D-X4 user activity feed, viewer-privacy-filtered (admin bypass).

    - Filter by viewer's project memberships via team_projects (T-13-01-02 mitigation).
    - ``type[]`` multi-value filter on audit_log.action (matches Phase 9 D-46 alias).
    - Page size hard-capped at 200 (T-13-01-04 DoS mitigation).
    """
    is_admin = _is_admin_role(current_user)
    use_case = GetUserActivityUseCase(audit_repo)
    return await use_case.execute(
        target_user_id=user_id,
        viewer_user_id=current_user.id,
        is_admin=is_admin,
        types=type,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )

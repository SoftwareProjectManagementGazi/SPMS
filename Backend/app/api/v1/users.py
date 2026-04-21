"""API-03 / D-17 User summary + led teams router."""
from fastapi import APIRouter, Depends, Query

from app.api.deps.auth import get_current_user
from app.api.deps.user import get_user_repo
from app.api.deps.project import get_project_repo
from app.api.deps.audit import get_audit_repo
from app.api.deps.task import get_task_repo
from app.api.deps.team import get_team_repo
from app.application.use_cases.get_user_summary import GetUserSummaryUseCase
from app.application.use_cases.manage_teams import GetLedTeamsUseCase
from app.application.dtos.user_summary_dtos import UserSummaryResponseDTO


router = APIRouter()


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

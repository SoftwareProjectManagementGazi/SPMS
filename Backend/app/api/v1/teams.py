from fastapi import APIRouter, Depends, HTTPException, status as http_status
from typing import List
from app.domain.entities.user import User
from app.domain.repositories.team_repository import ITeamRepository
from app.domain.repositories.user_repository import IUserRepository
from app.application.use_cases.manage_teams import (
    CreateTeamUseCase,
    UpdateTeamUseCase,
    AddTeamMemberUseCase,
    RemoveTeamMemberUseCase,
    ListTeamsUseCase,
    SetTeamLeaderUseCase,
    DeleteTeamUseCase,
    LeaveTeamUseCase,
    GetTeamsStatsUseCase,
    GetTeamProjectsUseCase,
    GetTeamActivityUseCase,
)
from app.application.dtos.team_dtos import (
    TeamCreateDTO,
    TeamUpdateDTO,
    TeamResponseDTO,
    TeamMemberDTO,
    TeamLeaderUpdateDTO,
    TeamsStatsDTO,
    TeamProjectDTO,
    TeamActivityItemDTO,
)
from app.application.dtos.auth_dtos import UserListDTO
from app.api.dependencies import get_current_user, get_user_repo, get_team_repo
from app.api.deps.auth import require_admin, require_admin_or_project_manager

router = APIRouter(prefix="/teams", tags=["teams"])


# ---------------------------------------------------------------
# Helper — TeamResponseDTO oluşturmayı tek yerde topla
# ---------------------------------------------------------------
async def _build_team_response(
    team,
    team_repo: ITeamRepository,
    user_repo: IUserRepository,
    members_limit: int | None = None,
) -> TeamResponseDTO:
    member_ids = await team_repo.get_members(team.id)
    if members_limit is not None:
        member_ids = member_ids[:members_limit]
    members = []
    for uid in member_ids:
        u = await user_repo.get_by_id(uid)
        if u:
            members.append(
                UserListDTO(
                    id=u.id,
                    email=u.email,
                    username=u.full_name,
                    avatar_url=u.avatar,
                )
            )
    return TeamResponseDTO(
        id=team.id,
        name=team.name,
        description=team.description,
        owner_id=team.owner_id,
        leader_id=team.leader_id,
        color=team.color,
        department=team.department,
        created_at=team.created_at,
        members=members,
    )


# ---------------------------------------------------------------
# DİKKAT: /stats route'u, /{team_id} route'undan ÖNCE tanımlanmalı
# yoksa FastAPI "stats" stringini team_id olarak parse etmeye çalışır.
# ---------------------------------------------------------------
@router.get("/stats", response_model=TeamsStatsDTO)
async def get_teams_stats(
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    """Sayfa üst stats stripi: toplam takım, toplam üye, aktif görev, tamamlanma oranı."""
    use_case = GetTeamsStatsUseCase(team_repo)
    data = await use_case.execute(current_user)
    return TeamsStatsDTO(**data)


@router.get("", response_model=List[TeamResponseDTO])
async def list_my_teams(
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    use_case = ListTeamsUseCase(team_repo)
    teams = await use_case.execute(current_user)
    result = []
    for team in teams:
        # Liste kartında ilk 5 avatar yeterli
        result.append(await _build_team_response(team, team_repo, user_repo, members_limit=5))
    return result


@router.post("", response_model=TeamResponseDTO, status_code=201)
async def create_team(
    dto: TeamCreateDTO,
    current_user: User = Depends(require_admin_or_project_manager),
    team_repo: ITeamRepository = Depends(get_team_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    use_case = CreateTeamUseCase(team_repo, user_repo)
    team = await use_case.execute(current_user, dto)
    return await _build_team_response(team, team_repo, user_repo)


@router.post("/{team_id}/members", status_code=204)
async def add_team_member(
    team_id: int,
    dto: TeamMemberDTO,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    use_case = AddTeamMemberUseCase(team_repo, user_repo)
    await use_case.execute(current_user, team_id, dto.user_id)


@router.delete("/{team_id}/members/{user_id}", status_code=204)
async def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    use_case = RemoveTeamMemberUseCase(team_repo)
    await use_case.execute(current_user, team_id, user_id)


@router.get("/users/search", response_model=List[UserListDTO])
async def search_users_for_invite(
    q: str,
    current_user: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    """Search registered users by email or name for team invite (search-and-add flow)."""
    if len(q) < 2:
        return []
    users = await user_repo.search_by_email_or_name(q)
    return [
        UserListDTO(
            id=u.id,
            email=u.email,
            username=u.full_name,
            avatar_url=u.avatar,
        )
        for u in users
        if u.id != current_user.id
    ]


@router.get("/users/all", response_model=List[UserListDTO])
async def list_all_users_for_invite(
    current_user: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    """Return all users for client-side search in team invite flow."""
    users = await user_repo.get_all()
    return [
        UserListDTO(
            id=u.id,
            email=u.email,
            username=u.full_name,
            avatar_url=u.avatar,
        )
        for u in users
        if u.id != current_user.id
    ]


@router.get("/{team_id}", response_model=TeamResponseDTO)
async def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    """Get a single team with full member details."""
    team = await team_repo.get_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return await _build_team_response(team, team_repo, user_repo)


@router.patch("/{team_id}", response_model=TeamResponseDTO)
async def update_team(
    team_id: int,
    dto: TeamUpdateDTO,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    """Owner veya admin: takım adı/açıklama/renk/departman partial update."""
    use_case = UpdateTeamUseCase(team_repo)
    team = await use_case.execute(current_user, team_id, dto)
    return await _build_team_response(team, team_repo, user_repo)


@router.delete("/{team_id}", status_code=204)
async def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    """Owner-only: soft-delete a team."""
    use_case = DeleteTeamUseCase(team_repo)
    await use_case.execute(current_user, team_id)


@router.post("/{team_id}/leave", status_code=204)
async def leave_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    """Any non-owner member can leave a team."""
    use_case = LeaveTeamUseCase(team_repo)
    await use_case.execute(current_user, team_id)


@router.patch("/{team_id}/leader")
async def set_team_leader(
    team_id: int,
    dto: TeamLeaderUpdateDTO,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    """Set or clear team leader_id. Allowed for team owner or admin.

    Body: ``{"leader_id": int | null}``
    ``TeamLeaderUpdateDTO`` uses ``extra="forbid"`` to reject unknown keys.
    """
    uc = SetTeamLeaderUseCase(team_repo)
    team = await uc.execute(current_user, team_id, dto.leader_id)
    return {"id": team.id, "name": team.name, "leader_id": team.leader_id}


# ---------------------------------------------------------------
# Yeni endpoint'ler — Detay sayfası Projeler ve Aktivite sekmeleri
# ---------------------------------------------------------------

@router.get("/{team_id}/projects", response_model=List[TeamProjectDTO])
async def get_team_projects(
    team_id: int,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    """Detay → Projeler sekmesi: takıma bağlı projeler ve ilerleme."""
    use_case = GetTeamProjectsUseCase(team_repo)
    rows = await use_case.execute(current_user, team_id)
    return [TeamProjectDTO(**r) for r in rows]


@router.get("/{team_id}/activity", response_model=List[TeamActivityItemDTO])
async def get_team_activity(
    team_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    """Detay → Aktivite sekmesi: takıma ait son audit log olayları."""
    use_case = GetTeamActivityUseCase(team_repo)
    rows = await use_case.execute(current_user, team_id, limit)
    return [TeamActivityItemDTO(**r) for r in rows]
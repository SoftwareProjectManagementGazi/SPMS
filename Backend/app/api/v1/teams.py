from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.domain.entities.user import User
from app.domain.repositories.team_repository import ITeamRepository
from app.domain.repositories.user_repository import IUserRepository
from app.application.use_cases.manage_teams import (
    CreateTeamUseCase,
    AddTeamMemberUseCase,
    RemoveTeamMemberUseCase,
    ListTeamsUseCase,
)
from app.application.dtos.team_dtos import TeamCreateDTO, TeamResponseDTO, TeamMemberDTO
from app.application.dtos.auth_dtos import UserListDTO
from app.api.dependencies import get_current_user, get_user_repo, get_team_repo

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=List[TeamResponseDTO])
async def list_my_teams(
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    use_case = ListTeamsUseCase(team_repo)
    teams = await use_case.execute(current_user)
    result = []
    for team in teams:
        member_ids = await team_repo.get_members(team.id)
        result.append(
            TeamResponseDTO(
                id=team.id,
                name=team.name,
                description=team.description,
                owner_id=team.owner_id,
                members=[],  # member details loaded on-demand via search flow
            )
        )
    return result


@router.post("", response_model=TeamResponseDTO, status_code=201)
async def create_team(
    dto: TeamCreateDTO,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    use_case = CreateTeamUseCase(team_repo)
    team = await use_case.execute(current_user, dto)
    return TeamResponseDTO(
        id=team.id,
        name=team.name,
        description=team.description,
        owner_id=team.owner_id,
        members=[],
    )


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
    member_ids = await team_repo.get_members(team_id)
    members = []
    for uid in member_ids:
        u = await user_repo.get_by_id(uid)
        if u:
            members.append(UserListDTO(id=u.id, email=u.email, username=u.full_name, avatar_url=u.avatar))
    return TeamResponseDTO(
        id=team.id,
        name=team.name,
        description=team.description,
        owner_id=team.owner_id,
        members=members,
    )

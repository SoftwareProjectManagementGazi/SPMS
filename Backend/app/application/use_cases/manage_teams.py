from typing import Optional, List
from app.domain.entities.team import Team
from app.domain.entities.user import User
from app.domain.repositories.team_repository import ITeamRepository
from app.domain.repositories.user_repository import IUserRepository
from app.application.dtos.team_dtos import TeamCreateDTO, TeamResponseDTO
from fastapi import HTTPException


class CreateTeamUseCase:
    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, dto: TeamCreateDTO) -> Team:
        return await self._team_repo.create(dto.name, dto.description, current_user.id)


class AddTeamMemberUseCase:
    def __init__(self, team_repo: ITeamRepository, user_repo: IUserRepository):
        self._team_repo = team_repo
        self._user_repo = user_repo

    async def execute(self, current_user: User, team_id: int, user_id: int) -> None:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only team owner can add members")
        target = await self._user_repo.get_by_id(user_id)
        if target is None:
            raise HTTPException(status_code=404, detail="User not found")
        await self._team_repo.add_member(team_id, user_id)


class RemoveTeamMemberUseCase:
    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int, user_id: int) -> None:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only team owner can remove members")
        await self._team_repo.remove_member(team_id, user_id)


class ListTeamsUseCase:
    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User) -> List[Team]:
        return await self._team_repo.list_by_user(current_user.id)

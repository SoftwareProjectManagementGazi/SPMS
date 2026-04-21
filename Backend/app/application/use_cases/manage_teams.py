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


class SetTeamLeaderUseCase:
    """D-17: PATCH /teams/{id}/leader leader_id. Admin-only at router layer."""

    def __init__(self, team_repo):
        self.team_repo = team_repo

    async def execute(self, team_id: int, leader_id):
        team = await self.team_repo.get_by_id(team_id)
        if team is None:
            from app.domain.exceptions import DomainError
            raise DomainError(f"Team {team_id} not found")
        team.leader_id = leader_id
        return await self.team_repo.update(team)


class GetLedTeamsUseCase:
    """D-17: GET /users/me/led-teams — teams the user leads + project_ids via TeamProjects."""

    def __init__(self, team_repo, project_repo):
        self.team_repo = team_repo
        self.project_repo = project_repo

    async def execute(self, user_id: int):
        teams = await self.team_repo.get_teams_led_by(user_id)
        project_ids: set = set()
        if teams:
            team_ids = [t.id for t in teams]
            from app.infrastructure.database.models.team import TeamProjectModel
            from sqlalchemy import select
            stmt = select(TeamProjectModel.project_id).where(
                TeamProjectModel.team_id.in_(team_ids)
            )
            result = await self.team_repo.session.execute(stmt)
            project_ids = {row for row in result.scalars().all()}
        return {
            "teams": [{"id": t.id, "name": t.name, "description": t.description} for t in teams],
            "project_ids": sorted(project_ids),
        }

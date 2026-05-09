from typing import Optional, List
from app.domain.entities.team import Team
from app.domain.entities.user import User
from app.domain.repositories.team_repository import ITeamRepository
from app.domain.repositories.user_repository import IUserRepository
from app.application.dtos.team_dtos import TeamCreateDTO, TeamUpdateDTO, TeamResponseDTO
from fastapi import HTTPException


class CreateTeamUseCase:
    def __init__(self, team_repo: ITeamRepository, user_repo: Optional[IUserRepository] = None):
        self._team_repo = team_repo
        self._user_repo = user_repo

    async def execute(self, current_user: User, dto: TeamCreateDTO) -> Team:
        team = await self._team_repo.create(
            name=dto.name,
            description=dto.description,
            owner_id=current_user.id,
            color=dto.color or "#3b82f6",
            department=dto.department,
            leader_id=dto.leader_id,
        )
        # Opsiyonel: oluşturma anında gelen üyeleri ekle (owner zaten dahil)
        for uid in (dto.member_ids or []):
            if uid != current_user.id:
                await self._team_repo.add_member(team.id, uid)
        return team


class UpdateTeamUseCase:
    """PATCH /teams/{id} — Admin veya team owner partial update yapabilir."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int, dto: TeamUpdateDTO) -> Team:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")

        is_admin = current_user.role and current_user.role.name.lower() == "admin"
        if not is_admin and team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the team owner or an admin can update this team")

        if dto.name is not None:
            team.name = dto.name
        if dto.description is not None:
            team.description = dto.description
        if dto.color is not None:
            team.color = dto.color
        if dto.department is not None:
            team.department = dto.department

        return await self._team_repo.update(team)


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
    """PATCH /teams/{id}/leader — Admin or team owner can set/clear leader."""

    def __init__(self, team_repo: ITeamRepository):
        self.team_repo = team_repo

    async def execute(self, current_user: User, team_id: int, leader_id) -> Team:
        team = await self.team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")

        is_admin = current_user.role and current_user.role.name.lower() == "admin"
        if not is_admin and team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the team owner or an admin can set the leader")

        # leader_id must be a current member (or None to clear)
        if leader_id is not None:
            member_ids = await self.team_repo.get_members(team_id)
            # owner is not in members table but is still part of the team
            valid_ids = set(member_ids) | {team.owner_id}
            if leader_id not in valid_ids:
                raise HTTPException(status_code=400, detail="Leader must be a member of the team")

        team.leader_id = leader_id
        return await self.team_repo.update(team)


class DeleteTeamUseCase:
    """Owner-only: soft-delete a team."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int) -> None:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only team owner can delete this team")
        await self._team_repo.soft_delete(team_id)


class LeaveTeamUseCase:
    """Any non-owner member can leave a team."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int) -> None:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.owner_id == current_user.id:
            raise HTTPException(status_code=400, detail="Team owner cannot leave. Delete the team instead.")
        member_ids = await self._team_repo.get_members(team_id)
        if current_user.id not in member_ids:
            raise HTTPException(status_code=400, detail="You are not a member of this team")
        await self._team_repo.remove_member(team_id, current_user.id)


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


# ---------------------------------------------------------------
# Yeni use case'ler — Teams sayfası stats / projects / activity
# ---------------------------------------------------------------

class GetTeamsStatsUseCase:
    """GET /teams/stats — sayfa üst stats stripi için tek seferde toplu sayım."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User) -> dict:
        return await self._team_repo.get_stats_for_user(current_user.id)


class GetTeamProjectsUseCase:
    """GET /teams/{team_id}/projects — detay sayfası Projeler sekmesi."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int) -> list:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        return await self._team_repo.get_projects(team_id)


class GetTeamActivityUseCase:
    """GET /teams/{team_id}/activity — detay sayfası Aktivite sekmesi."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int, limit: int = 50) -> list:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        return await self._team_repo.get_activity(team_id, limit)


class AssignProjectToTeamUseCase:
    """POST /teams/{team_id}/projects — takıma proje ata (owner veya admin)."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int, project_id: int) -> None:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        is_admin = current_user.role and current_user.role.name.lower() == "admin"
        if not is_admin and team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the team owner or an admin can assign projects")
        await self._team_repo.assign_project(team_id, project_id)


class UnassignProjectFromTeamUseCase:
    """DELETE /teams/{team_id}/projects/{project_id} — takımdan proje bağlantısını kaldır."""

    def __init__(self, team_repo: ITeamRepository):
        self._team_repo = team_repo

    async def execute(self, current_user: User, team_id: int, project_id: int) -> None:
        team = await self._team_repo.get_by_id(team_id)
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")
        is_admin = current_user.role and current_user.role.name.lower() == "admin"
        if not is_admin and team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the team owner or an admin can unassign projects")
        await self._team_repo.unassign_project(team_id, project_id)
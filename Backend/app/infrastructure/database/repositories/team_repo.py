from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_
from sqlalchemy.exc import IntegrityError

from app.domain.entities.team import Team
from app.domain.repositories.team_repository import ITeamRepository
from app.infrastructure.database.models.team import TeamModel, TeamMemberModel


class SqlAlchemyTeamRepository(ITeamRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: TeamModel) -> Team:
        return Team.model_validate(model)

    def _get_base_query(self):
        """Return base select for non-deleted teams."""
        return (
            select(TeamModel)
            .where(TeamModel.is_deleted == False)
        )

    async def create(self, name: str, description: Optional[str], owner_id: int) -> Team:
        model = TeamModel(name=name, description=description, owner_id=owner_id)
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()
        # Re-fetch to ensure all columns populated
        stmt = self._get_base_query().where(TeamModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._to_entity(refreshed)

    async def get_by_id(self, team_id: int) -> Optional[Team]:
        stmt = self._get_base_query().where(TeamModel.id == team_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_user(self, user_id: int) -> List[Team]:
        """Return teams where the user is owner OR a member."""
        # Teams where user is owner
        owner_stmt = self._get_base_query().where(TeamModel.owner_id == user_id)

        # Teams where user is a member (via team_members table)
        member_stmt = (
            self._get_base_query()
            .join(TeamMemberModel, TeamMemberModel.team_id == TeamModel.id)
            .where(TeamMemberModel.user_id == user_id)
        )

        owner_result = await self.session.execute(owner_stmt)
        member_result = await self.session.execute(member_stmt)

        owner_teams = {m.id: m for m in owner_result.scalars().all()}
        member_teams = {m.id: m for m in member_result.scalars().all()}

        # Merge and deduplicate
        all_teams = {**member_teams, **owner_teams}
        return [self._to_entity(m) for m in all_teams.values()]

    async def add_member(self, team_id: int, user_id: int) -> None:
        """Add a user to team. Idempotent — silently ignores duplicate membership."""
        member = TeamMemberModel(team_id=team_id, user_id=user_id)
        self.session.add(member)
        try:
            await self.session.flush()
            await self.session.commit()
        except IntegrityError:
            # Duplicate membership — rollback and ignore
            await self.session.rollback()

    async def remove_member(self, team_id: int, user_id: int) -> None:
        stmt = delete(TeamMemberModel).where(
            TeamMemberModel.team_id == team_id,
            TeamMemberModel.user_id == user_id,
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def get_members(self, team_id: int) -> List[int]:
        """Return list of user_ids who are members of the team."""
        stmt = select(TeamMemberModel.user_id).where(TeamMemberModel.team_id == team_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def soft_delete(self, team_id: int) -> None:
        stmt = self._get_base_query().where(TeamModel.id == team_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.is_deleted = True
            model.deleted_at = datetime.utcnow()
            await self.session.commit()

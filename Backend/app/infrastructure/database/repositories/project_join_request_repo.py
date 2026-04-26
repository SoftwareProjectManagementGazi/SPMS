"""Phase 14 Plan 14-01 — SqlAlchemyProjectJoinRequestRepository.

Implements IProjectJoinRequestRepository against PostgreSQL via async SQLAlchemy.
Mirror's SqlAlchemyTeamRepository pattern (lines 12-115): _to_entity helper,
session.add → flush → commit → refresh, scalar_one_or_none for lookups.
"""
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.project_join_request import (
    JoinRequestStatus,
    ProjectJoinRequest,
)
from app.domain.repositories.project_join_request_repository import (
    IProjectJoinRequestRepository,
)
from app.infrastructure.database.models.project_join_request import (
    ProjectJoinRequestModel,
)


class SqlAlchemyProjectJoinRequestRepository(IProjectJoinRequestRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ProjectJoinRequestModel) -> ProjectJoinRequest:
        return ProjectJoinRequest.model_validate(model)

    async def create(self, request: ProjectJoinRequest) -> ProjectJoinRequest:
        model = ProjectJoinRequestModel(
            project_id=request.project_id,
            requested_by_user_id=request.requested_by_user_id,
            target_user_id=request.target_user_id,
            status=request.status,
            note=request.note,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()
        # Re-fetch so the returned entity has server-side defaults populated
        # (id, created_at, updated_at, status default).
        stmt = select(ProjectJoinRequestModel).where(
            ProjectJoinRequestModel.id == model.id
        )
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._to_entity(refreshed)

    async def get_by_id(self, request_id: int) -> Optional[ProjectJoinRequest]:
        stmt = select(ProjectJoinRequestModel).where(
            ProjectJoinRequestModel.id == request_id
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_status(
        self,
        status: JoinRequestStatus,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[ProjectJoinRequest], int]:
        # Total count for the filter (unpaginated)
        count_stmt = (
            select(sqlfunc.count(ProjectJoinRequestModel.id))
            .where(ProjectJoinRequestModel.status == status)
        )
        total = (await self.session.execute(count_stmt)).scalar() or 0

        items_stmt = (
            select(ProjectJoinRequestModel)
            .where(ProjectJoinRequestModel.status == status)
            .order_by(ProjectJoinRequestModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(items_stmt)
        rows = result.scalars().all()
        return [self._to_entity(r) for r in rows], total

    async def update_status(
        self,
        request_id: int,
        status: JoinRequestStatus,
        reviewed_by_admin_id: Optional[int] = None,
    ) -> Optional[ProjectJoinRequest]:
        stmt = select(ProjectJoinRequestModel).where(
            ProjectJoinRequestModel.id == request_id
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return None
        model.status = status
        # When transitioning to a terminal state, stamp the reviewer + reviewed_at.
        # When rolling back to "pending" (atomic-rollback path in approve use case),
        # clear reviewed_by + reviewed_at so audit history is consistent.
        if status in ("approved", "rejected", "cancelled"):
            model.reviewed_by_admin_id = reviewed_by_admin_id
            model.reviewed_at = datetime.utcnow()
        elif status == "pending":
            model.reviewed_by_admin_id = None
            model.reviewed_at = None
        await self.session.flush()
        await self.session.commit()
        # Re-fetch
        result2 = await self.session.execute(stmt)
        refreshed = result2.scalar_one()
        return self._to_entity(refreshed)

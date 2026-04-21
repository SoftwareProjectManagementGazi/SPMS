from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, insert, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.domain.entities.project import Project
from app.domain.entities.user import User
from app.domain.repositories.project_repository import IProjectRepository
from app.infrastructure.database.models.project import ProjectModel, project_members
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.audit_log import AuditLogModel
from sqlalchemy.orm import joinedload


class SqlAlchemyProjectRepository(IProjectRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ProjectModel) -> Project:
        project = Project.model_validate(model)
        # ARCH-03: populate manager display fields from eagerly loaded manager relationship
        if model.manager is not None:
            project.manager_name = model.manager.full_name
            project.manager_avatar = model.manager.avatar
        return project

    def _to_model(self, entity: Project) -> ProjectModel:
        # Exclude columns to handle them manually as relationship objects
        data = entity.model_dump(exclude={"id", "created_at", "columns", "manager_name", "manager_avatar"})
        model = ProjectModel(**data)

        if entity.columns:
            model.columns = [
                BoardColumnModel(
                    name=c.name,
                    order_index=c.order_index,
                    wip_limit=c.wip_limit
                ) for c in entity.columns
            ]

        return model

    def _get_base_query(self):
        """Return a base select with is_deleted filter and eager-loaded columns and manager."""
        return (
            select(ProjectModel)
            .where(ProjectModel.is_deleted == False)
            .options(
                joinedload(ProjectModel.columns),
                joinedload(ProjectModel.manager),  # ARCH-03: eager load manager user
            )
        )

    async def create(self, project: Project) -> Project:
        model = self._to_model(project)
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()

        # Re-fetch with eager loading to avoid MissingGreenlet error
        stmt = self._get_base_query().where(ProjectModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed_model = result.unique().scalar_one()

        return self._to_entity(refreshed_model)

    async def get_by_id(self, project_id: int) -> Optional[Project]:
        stmt = self._get_base_query().where(ProjectModel.id == project_id)
        result = await self.session.execute(stmt)
        model = result.unique().scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_id_and_user(self, project_id: int, user_id: int) -> Optional[Project]:
        stmt = (
            self._get_base_query()
            .where(
                ProjectModel.id == project_id,
                or_(
                    ProjectModel.manager_id == user_id,
                    ProjectModel.members.any(UserModel.id == user_id)
                )
            )
        )
        result = await self.session.execute(stmt)
        model = result.unique().scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self, manager_id: int) -> List[Project]:
        stmt = (
            self._get_base_query()
            .where(
                or_(
                    ProjectModel.manager_id == manager_id,
                    ProjectModel.members.any(UserModel.id == manager_id)
                )
            )
        )
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models]

    async def update(
        self,
        project: Project,
        user_id: Optional[int] = None,
        updated_keys: Optional[set] = None,
    ) -> Project:
        """Update project fields dynamically and write audit diff rows per changed field.

        Uses dynamic field mapping (ARCH-06): iterates over the non-None
        updated fields from the Project entity rather than hardcoding attribute
        assignments.  Accepts an optional user_id to record in audit rows.

        FL-06 fix (Phase 10 review): when ``updated_keys`` is provided, the
        repository trusts it as the authoritative list of fields the client
        intended to change. That lets callers distinguish "field was absent
        from the PATCH body" from "field was explicitly set to None", so
        clearing nullable columns (description, end_date) actually persists.
        Legacy callers that pass ``updated_keys=None`` keep the old behavior:
        skip the write when the incoming value is None.
        """
        stmt = select(ProjectModel).where(
            ProjectModel.id == project.id, ProjectModel.is_deleted == False
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            return project  # Entity not found — return as-is (caller handles)

        # ARCH-06: dynamic field mapping — iterate over all updatable fields.
        # `status` is required for D-25 lifecycle transitions (archive/complete/
        # hold/reactivate). It was missing, so even after the DTO started
        # accepting status the repo would silently drop it.
        updatable_fields = ["name", "description", "start_date", "end_date", "methodology", "custom_fields", "process_config", "status"]

        audit_entries = []
        for field in updatable_fields:
            # FL-06 fix: if caller supplied an authoritative key set, skip fields
            # the client didn't send. Otherwise fall back to legacy behavior
            # (iterate every updatable field).
            if updated_keys is not None and field not in updated_keys:
                continue

            new_val = getattr(project, field, None)
            old_val = getattr(model, field, None)

            # Legacy callers (updated_keys is None): keep the old None-skip so
            # partial/normalizer writes don't accidentally clear columns.
            # Explicit callers (updated_keys provided): allow None → clear the column.
            if updated_keys is None and new_val is None:
                continue

            if new_val != old_val:
                if user_id is not None:
                    audit_entries.append(
                        AuditLogModel(
                            entity_type="project",
                            entity_id=project.id,
                            field_name=field,
                            old_value=str(old_val) if old_val is not None else None,
                            new_value=str(new_val) if new_val is not None else None,
                            user_id=user_id,
                            action="updated",
                        )
                    )
                setattr(model, field, new_val)

        # Increment optimistic lock version
        model.version = (model.version or 1) + 1

        self.session.add_all(audit_entries)
        await self.session.flush()
        await self.session.commit()

        # Re-fetch to get updated columns relationship
        stmt2 = self._get_base_query().where(ProjectModel.id == project.id)
        result2 = await self.session.execute(stmt2)
        refreshed = result2.unique().scalar_one_or_none()
        return self._to_entity(refreshed) if refreshed else project

    async def delete(self, project_id: int) -> bool:
        """Soft-delete: set is_deleted=True and deleted_at; do NOT issue SQL DELETE."""
        stmt = select(ProjectModel).where(
            ProjectModel.id == project_id, ProjectModel.is_deleted == False
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.is_deleted = True
            model.deleted_at = datetime.utcnow()  # Set explicitly — NOT via onupdate
            await self.session.commit()
            return True
        return False

    async def add_member(self, project_id: int, user_id: int) -> None:
        """Add user to project. Idempotent — silently ignores duplicate membership."""
        stmt = (
            pg_insert(project_members)
            .values(project_id=project_id, user_id=user_id)
            .on_conflict_do_nothing()
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def remove_member(self, project_id: int, user_id: int) -> None:
        """Remove user from project_members table."""
        stmt = delete(project_members).where(
            project_members.c.project_id == project_id,
            project_members.c.user_id == user_id,
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def get_members(self, project_id: int) -> List[User]:
        """Return all project members as User domain entities."""
        stmt = (
            select(UserModel)
            .join(project_members, project_members.c.user_id == UserModel.id)
            .where(project_members.c.project_id == project_id)
            .options(joinedload(UserModel.role))
        )
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [User.model_validate(m) for m in models]

    async def list_by_status(self, statuses: list) -> List[Project]:
        """API-04: GET /projects?status=X filter. Accepts list for multi-status support."""
        stmt = (
            self._get_base_query()
            .where(ProjectModel.status.in_(statuses), ProjectModel.is_deleted == False)  # noqa: E712
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.unique().scalars().all()]

    async def list_by_member_and_status(
        self, user_id: int, statuses: List[str]
    ) -> List[Project]:
        """D-49: user is member of project via Team -> TeamProjects, filtered by project status."""
        from app.infrastructure.database.models.team import TeamModel, TeamMemberModel, TeamProjectModel
        from sqlalchemy import distinct as sqldistinct
        stmt = (
            self._get_base_query()
            .join(TeamProjectModel, TeamProjectModel.project_id == ProjectModel.id)
            .join(TeamModel, TeamModel.id == TeamProjectModel.team_id)
            .join(TeamMemberModel, TeamMemberModel.team_id == TeamModel.id)
            .where(
                TeamMemberModel.user_id == user_id,
                TeamModel.is_deleted == False,  # noqa: E712
                ProjectModel.is_deleted == False,  # noqa: E712
                ProjectModel.status.in_(statuses),
            )
            .distinct(ProjectModel.id)
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.unique().scalars().all()]

    async def count_by_member(self, user_id: int) -> int:
        """Distinct project count for user's memberships, any non-deleted status."""
        from app.infrastructure.database.models.team import TeamModel, TeamMemberModel, TeamProjectModel
        from sqlalchemy import func as sqlfunc, distinct as sqldistinct
        stmt = (
            select(sqlfunc.count(sqldistinct(ProjectModel.id)))
            .select_from(ProjectModel)
            .join(TeamProjectModel, TeamProjectModel.project_id == ProjectModel.id)
            .join(TeamModel, TeamModel.id == TeamProjectModel.team_id)
            .join(TeamMemberModel, TeamMemberModel.team_id == TeamModel.id)
            .where(
                TeamMemberModel.user_id == user_id,
                TeamModel.is_deleted == False,  # noqa: E712
                ProjectModel.is_deleted == False,  # noqa: E712
            )
        )
        return (await self.session.execute(stmt)).scalar() or 0

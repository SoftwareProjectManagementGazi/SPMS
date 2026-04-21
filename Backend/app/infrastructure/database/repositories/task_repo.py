from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_, text
from sqlalchemy.orm import joinedload, selectinload
from app.domain.entities.task import Task
from app.domain.repositories.task_repository import ITaskRepository
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.audit_log import AuditLogModel
# YENİ İMPORT: Nested eager loading için gerekli
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.project import ProjectModel
from app.infrastructure.database.models.board_column import BoardColumnModel


class SqlAlchemyTaskRepository(ITaskRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: TaskModel) -> Optional[Task]:
        """
        SQLAlchemy modelini Domain Entity'e MANUEL olarak çeviriyoruz.
        """
        if not model:
            return None

        # 1. Ana Task Objesini oluştur
        task_data = {
            "id": model.id,
            "title": model.title,
            "description": model.description,
            "priority": model.priority,
            "due_date": model.due_date,
            "points": model.points,
            "is_recurring": model.is_recurring,
            "recurrence_interval": model.recurrence_interval,
            "recurrence_end_date": model.recurrence_end_date,
            "recurrence_count": model.recurrence_count,
            "task_key": model.task_key,
            "series_id": model.series_id,
            "project_id": model.project_id,
            "sprint_id": model.sprint_id,
            "column_id": model.column_id,
            "phase_id": model.phase_id,
            "assignee_id": model.assignee_id,
            "reporter_id": model.reporter_id,
            "parent_task_id": model.parent_task_id,
            "created_at": model.created_at,
            "updated_at": model.updated_at,

            "assignee": model.assignee,
            "column": model.column,
            "project": model.project,
        }

        # 2. Parent (Varsa)
        if model.parent:
            task_data["parent"] = Task(
                id=model.parent.id,
                title=model.parent.title,
                priority=model.parent.priority,
                project_id=model.parent.project_id,
                subtasks=[],
                parent=None,
                column=model.parent.column,
                project=model.parent.project,
                assignee=None
            )

        # 3. Subtasks (Varsa)
        if model.subtasks:
            subtask_list = []
            for sub in model.subtasks:
                sub_entity = Task(
                    id=sub.id,
                    title=sub.title,
                    priority=sub.priority,
                    status=sub.column.name.lower().replace(" ", "-") if sub.column else "todo",
                    project_id=sub.project_id,
                    column=sub.column,
                    assignee=sub.assignee,
                    parent=None,
                    subtasks=[]
                )
                subtask_list.append(sub_entity)
            task_data["subtasks"] = subtask_list
        else:
            task_data["subtasks"] = []

        return Task(**task_data)

    def _to_model(self, entity: Task) -> TaskModel:
        data = entity.model_dump(exclude={
            "id", "created_at", "updated_at",
            "parent", "column", "project",
            "parent_task_summary", "subtasks", "assignee"
        })
        return TaskModel(**data)

    def _get_base_query(self):
        """
        Mapper'ın ihtiyaç duyduğu verileri Eager Load ile çeker.
        Soft-delete filter: only return rows where is_deleted == False.
        """
        return select(TaskModel).where(TaskModel.is_deleted == False).options(
            # 1. Temel İlişkiler
            joinedload(TaskModel.project).joinedload(ProjectModel.columns),
            joinedload(TaskModel.column),
            # Assignee ve Role
            joinedload(TaskModel.assignee).joinedload(UserModel.role),

            # 2. Parent İlişkisi
            joinedload(TaskModel.parent).options(
                joinedload(TaskModel.project),
                joinedload(TaskModel.column),
            ),

            # 3. Subtasks İlişkisi
            selectinload(TaskModel.subtasks).options(
                joinedload(TaskModel.column),
                joinedload(TaskModel.assignee).joinedload(UserModel.role),
                joinedload(TaskModel.project).joinedload(ProjectModel.columns)
            )
        )

    async def generate_task_key(self, project_id: int, project_key: str) -> str:
        result = await self.session.execute(
            text("UPDATE projects SET task_seq = task_seq + 1 WHERE id = :pid RETURNING task_seq"),
            {"pid": project_id}
        )
        seq = result.scalar_one()
        return f"{project_key}-{seq}"

    async def get_all_by_project_paginated(
        self, project_id: int, page: int = 1, page_size: int = 20
    ) -> Tuple[List[Task], int]:
        base = self._get_base_query().where(TaskModel.project_id == project_id)
        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = base.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models], total

    async def search_by_title(self, project_id: int, words: List[str]) -> List[Task]:
        conditions = [TaskModel.title.ilike(f"%{w}%") for w in words]
        stmt = (
            select(TaskModel)
            .where(
                TaskModel.project_id == project_id,
                TaskModel.is_deleted == False,
                or_(*conditions),
            )
            .limit(5)
            .options(
                joinedload(TaskModel.project),
                joinedload(TaskModel.column),
                joinedload(TaskModel.assignee).joinedload(UserModel.role),
                selectinload(TaskModel.subtasks).options(
                    joinedload(TaskModel.column),
                    joinedload(TaskModel.assignee).joinedload(UserModel.role),
                    joinedload(TaskModel.project),
                ),
            )
        )
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models]

    async def update_series(self, series_id: str, fields: Dict[str, Any]) -> None:
        from datetime import datetime as dt
        if not series_id or not fields:
            return
        stmt = (
            update(TaskModel)
            .where(
                TaskModel.series_id == series_id,
                TaskModel.is_deleted == False,
                TaskModel.due_date >= dt.utcnow(),
            )
            .values(**fields)
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def create(self, task: Task) -> Task:
        model = self._to_model(task)
        self.session.add(model)
        await self.session.flush()
        # Generate and store task_key atomically if not already set
        if not model.task_key:
            # Need to load project to get key
            proj_stmt = select(ProjectModel).where(ProjectModel.id == model.project_id)
            proj_result = await self.session.execute(proj_stmt)
            project = proj_result.scalar_one_or_none()
            project_key = project.key if project else "TASK"
            model.task_key = await self.generate_task_key(model.project_id, project_key)
        await self.session.commit()
        # ARCH-04: fetch full entity with eager loading in a single query (no separate get_by_id call)
        stmt = self._get_base_query().where(TaskModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.unique().scalar_one()
        return self._to_entity(refreshed)

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        stmt = self._get_base_query().where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        model = result.unique().scalar_one_or_none()
        return self._to_entity(model)

    async def get_all_by_project(self, project_id: int) -> List[Task]:
        stmt = self._get_base_query().where(TaskModel.project_id == project_id)
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models if m is not None]

    async def get_all_by_assignee(self, assignee_id: int) -> List[Task]:
        stmt = self._get_base_query().where(TaskModel.assignee_id == assignee_id)
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models if m is not None]

    async def update(self, task_id: int, update_data: Dict[str, Any], user_id: int = None) -> Task:
        stmt = select(TaskModel).where(TaskModel.id == task_id, TaskModel.is_deleted == False)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            raise Exception(f"Task with id {task_id} not found")

        # Compute audit diff — one AuditLogModel row per changed field
        audit_entries = []
        for key, new_val in update_data.items():
            if hasattr(model, key):
                old_val = getattr(model, key)
                if old_val != new_val:
                    audit_entries.append(
                        AuditLogModel(
                            entity_type="task",
                            entity_id=task_id,
                            field_name=key,
                            old_value=str(old_val) if old_val is not None else None,
                            new_value=str(new_val) if new_val is not None else None,
                            user_id=user_id,
                            action="updated",
                        )
                    )
                    setattr(model, key, new_val)

        # Increment optimistic lock version
        model.version = (model.version or 1) + 1

        # Persist audit entries and updated model in one commit
        self.session.add_all(audit_entries)
        await self.session.flush()
        await self.session.commit()

        return await self.get_by_id(task_id)

    async def delete(self, task_id: int) -> bool:
        """Soft-delete: set is_deleted=True and deleted_at; do NOT issue SQL DELETE."""
        stmt = select(TaskModel).where(TaskModel.id == task_id, TaskModel.is_deleted == False)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.is_deleted = True
            model.deleted_at = datetime.utcnow()  # Set explicitly — NOT via onupdate
            await self.session.commit()
            return True
        return False

    async def list_by_project_and_phase(self, project_id: int, phase_id: Optional[str]) -> List[Task]:
        """API-05: GET /tasks/project/{id}?phase_id=X filter. None phase_id returns all project tasks."""
        stmt = self._get_base_query().where(
            TaskModel.project_id == project_id,
            TaskModel.is_deleted == False,  # noqa: E712
        )
        if phase_id is not None:
            stmt = stmt.where(TaskModel.phase_id == phase_id)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.unique().scalars().all()]

    async def count_active_by_assignee(self, user_id: int) -> int:
        """Non-deleted tasks assigned to user (proxy for active tasks count)."""
        stmt = (
            select(func.count(TaskModel.id))
            .where(TaskModel.assignee_id == user_id)
            .where(TaskModel.is_deleted == False)  # noqa: E712
        )
        return (await self.session.execute(stmt)).scalar() or 0

    async def count_completed_since(self, user_id: int, since: datetime) -> int:
        """Tasks where assignee=user and updated_at >= since (proxy for completed in period)."""
        stmt = (
            select(func.count(TaskModel.id))
            .where(TaskModel.assignee_id == user_id)
            .where(TaskModel.is_deleted == False)  # noqa: E712
            .where(TaskModel.updated_at >= since)
        )
        return (await self.session.execute(stmt)).scalar() or 0

    async def unassign_incomplete_tasks(self, project_id: int, user_id: int) -> None:
        """Set assignee_id=NULL for all incomplete tasks assigned to user in this project.
        Tasks in board columns whose name contains 'done' (case-insensitive) are preserved.
        """
        # Find done column ids for this project
        done_cols_stmt = select(BoardColumnModel.id).where(
            BoardColumnModel.project_id == project_id,
            BoardColumnModel.name.ilike("%done%"),
        )
        done_cols_result = await self.session.execute(done_cols_stmt)
        done_column_ids = list(done_cols_result.scalars().all())

        # Update incomplete tasks: set assignee_id=NULL
        stmt = (
            update(TaskModel)
            .where(
                TaskModel.project_id == project_id,
                TaskModel.assignee_id == user_id,
                TaskModel.is_deleted == False,
            )
        )
        if done_column_ids:
            stmt = stmt.where(TaskModel.column_id.notin_(done_column_ids))

        stmt = stmt.values(assignee_id=None)
        await self.session.execute(stmt)
        await self.session.commit()

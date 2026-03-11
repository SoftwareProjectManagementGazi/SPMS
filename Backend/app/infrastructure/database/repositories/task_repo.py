from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.domain.entities.task import Task
from app.domain.repositories.task_repository import ITaskRepository
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.audit_log import AuditLogModel
# YENİ İMPORT: Nested eager loading için gerekli
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.project import ProjectModel


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
            "project_id": model.project_id,
            "sprint_id": model.sprint_id,
            "column_id": model.column_id,
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

    async def create(self, task: Task) -> Task:
        model = self._to_model(task)
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()
        return await self.get_by_id(model.id)

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

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload, selectinload
from app.domain.entities.task import Task
from app.domain.repositories.task_repository import ITaskRepository
from app.infrastructure.database.models.task import TaskModel
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
        """
        return select(TaskModel).options(
            # 1. Temel İlişkiler
            # GÜNCELLEME: Project'in Columns bilgisini de yüklüyoruz (Task Entity içinde Project validate edilirken gerekli)
            joinedload(TaskModel.project).joinedload(ProjectModel.columns),
            
            joinedload(TaskModel.column),
            
            # Assignee ve Role
            joinedload(TaskModel.assignee).joinedload(UserModel.role),
            
            # 2. Parent İlişkisi
            joinedload(TaskModel.parent).options(
                joinedload(TaskModel.project), # Parent'ın projesinin columnlarına gerek olmayabilir ama hata verirse buraya da eklenmeli
                joinedload(TaskModel.column),
            ),

            # 3. Subtasks İlişkisi
            selectinload(TaskModel.subtasks).options(
                joinedload(TaskModel.column),
                joinedload(TaskModel.assignee).joinedload(UserModel.role),
                # Alt görevin projesinin columnlarına da ihtiyaç olabilir
                joinedload(TaskModel.project).joinedload(ProjectModel.columns) 
            )
        )

    async def create(self, task: Task) -> Task:
        model = self._to_model(task)
        self.session.add(model)
        await self.session.flush()
        return await self.get_by_id(model.id)

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        stmt = self._get_base_query().where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        # GÜNCELLEME: .unique() eklendi
        # joinedload ile collection (örn: columns) yüklediğimizde unique() şarttır.
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

    async def update(self, task_id: int, update_data: Dict[str, Any]) -> Task:
        stmt = select(TaskModel).where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        if model:
            for key, value in update_data.items():
                if hasattr(model, key):
                    setattr(model, key, value)
            
            await self.session.flush()
            return await self.get_by_id(task_id) 
            
        raise Exception(f"Task with id {task_id} not found")

    async def delete(self, task_id: int) -> bool:
        stmt = delete(TaskModel).where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0
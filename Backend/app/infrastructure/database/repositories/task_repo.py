from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload, selectinload
# 'attributes' importuna artık gerek yok, siliyoruz.
from app.domain.entities.task import Task
from app.domain.repositories.task_repository import ITaskRepository
from app.infrastructure.database.models.task import TaskModel

class SqlAlchemyTaskRepository(ITaskRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: TaskModel) -> Optional[Task]:
        """
        SQLAlchemy modelini Domain Entity'e MANUEL olarak çeviriyoruz.
        Bu yöntem 'model_validate'in yarattığı recursion (sonsuz döngü) 
        ve lazy loading hatalarını kesin olarak çözer.
        Clean Architecture'a uygundur: Mapping logic repository içindedir.
        """
        if not model:
            return None

        # 1. Ana Task Objesini oluşturmak için verileri hazırla
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
            
            # İlişkiler (Simple Objects) 
            # joinedload ile çekildiği için güvenle atayabiliriz
            "project": model.project, 
            "column": model.column,   
            "assignee": model.assignee, 
        }

        # 2. Parent (Varsa)
        # Sadece parent'ın temel bilgilerini alıyoruz, onun subtask'lerini almıyoruz (Döngü kırma)
        if model.parent:
            task_data["parent"] = Task(
                id=model.parent.id,
                title=model.parent.title,
                priority=model.parent.priority,
                project_id=model.parent.project_id,
                # Kritik: Parent'ın subtask'lerini boş bırakıyoruz
                subtasks=[], 
                parent=None,
                column=model.parent.column,
                project=model.parent.project
            )

        # 3. Subtasks (Varsa)
        # Alt görevleri listeye ekliyoruz ama onların parent'ını boş bırakıyoruz (Döngü kırma)
        if model.subtasks:
            subtask_list = []
            for sub in model.subtasks:
                sub_entity = Task(
                    id=sub.id,
                    title=sub.title,
                    priority=sub.priority,
                    # Status hesabı (Modelde property yoksa manuel yapıyoruz)
                    status=sub.column.name.lower().replace(" ", "-") if sub.column else "todo",
                    project_id=sub.project_id,
                    column=sub.column,
                    assignee=sub.assignee,
                    # Kritik: Alt görevin parent'ını boş bırakıyoruz
                    parent=None, 
                    subtasks=[] 
                )
                subtask_list.append(sub_entity)
            task_data["subtasks"] = subtask_list
        else:
            task_data["subtasks"] = []

        # 4. Final Entity Oluşturma
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
        Mapper'ın ihtiyaç duyduğu verileri Eager Load (Peşin Yükleme) ile çeker.
        """
        return select(TaskModel).options(
            # 1. Temel İlişkiler
            joinedload(TaskModel.project),
            joinedload(TaskModel.column),
            joinedload(TaskModel.assignee),
            
            # 2. Parent İlişkisi
            # Parent'ın kendisine ihtiyacımız var (Mapper'da kullanıyoruz)
            joinedload(TaskModel.parent).options(
                joinedload(TaskModel.project),
                joinedload(TaskModel.column),
            ),

            # 3. Subtasks İlişkisi
            # Mapper'da model.subtasks üzerinde döngü kurduğumuz için
            # bu verinin MUTLAKA yüklenmiş olması gerekir. Aksi takdirde MissingGreenlet hatası alırız.
            selectinload(TaskModel.subtasks).options(
                joinedload(TaskModel.column),
                joinedload(TaskModel.assignee),
                joinedload(TaskModel.project)
            )
        )

    async def create(self, task: Task) -> Task:
        model = self._to_model(task)
        self.session.add(model)
        await self.session.flush()
        return await self.get_by_id(model.id) # type: ignore

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        stmt = self._get_base_query().where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model)

    async def get_all_by_project(self, project_id: int) -> List[Task]:
        stmt = self._get_base_query().where(TaskModel.project_id == project_id)
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models if m is not None] # None check eklendi
    
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
            # Güncel halini çekip dönüyoruz
            return await self.get_by_id(task_id) # type: ignore
            
        raise Exception(f"Task with id {task_id} not found")

    async def delete(self, task_id: int) -> bool:
        stmt = delete(TaskModel).where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0
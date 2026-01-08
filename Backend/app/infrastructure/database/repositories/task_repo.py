from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
# DÜZELTME 1: joinedload importu eklendi
from sqlalchemy.orm import joinedload
from app.domain.entities.task import Task
from app.domain.repositories.task_repository import ITaskRepository
from app.infrastructure.database.models.task import TaskModel

class SqlAlchemyTaskRepository(ITaskRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: TaskModel) -> Task:
        return Task.model_validate(model)

    def _to_model(self, entity: Task) -> TaskModel:
        # Entity'den model oluştururken relationship alanlarını hariç tutuyoruz
        # Yoksa "project" objesini veritabanına kaydetmeye çalışır ve hata verir
        data = entity.model_dump(exclude={
            "id", "created_at", "updated_at", 
            "parent", "column", "project", 
            "parent_task_summary"
        })
        return TaskModel(**data)

    # DÜZELTME 2: İlişkileri yükleyen temel sorgu
    def _get_base_query(self):
        """
        Task verisi çekerken standart olarak yüklenmesi gereken tüm ilişkileri tanımlar.
        Bu sayede MissingGreenlet hatası ve N+1 problemi engellenir.
        """
        return select(TaskModel).options(
            # 1. Görevin kendi detayları (Project ve Column olmazsa Entity hata verir)
            joinedload(TaskModel.project),
            joinedload(TaskModel.column),
            
            # 2. Parent detayları (Ghost Parent ve DTO hesaplamaları için şart)
            joinedload(TaskModel.parent).joinedload(TaskModel.project),
            joinedload(TaskModel.parent).joinedload(TaskModel.column)
        )

    async def create(self, task: Task) -> Task:
        model = self._to_model(task)
        self.session.add(model)
        await self.session.flush()
        # Oluşturduktan sonra ilişkilerle birlikte taze veriyi çekiyoruz
        return await self.get_by_id(model.id)

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        # DÜZELTME 3: _get_base_query kullanıldı
        stmt = self._get_base_query().where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all_by_project(self, project_id: int) -> List[Task]:
        # DÜZELTME 3: _get_base_query kullanıldı
        stmt = self._get_base_query().where(TaskModel.project_id == project_id)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]
    
    async def get_all_by_assignee(self, assignee_id: int) -> List[Task]:
        # DÜZELTME 3: _get_base_query kullanıldı (Hatanın çıktığı yer burasıydı)
        stmt = self._get_base_query().where(TaskModel.assignee_id == assignee_id)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def update(self, task: Task) -> Task:
        stmt = select(TaskModel).where(TaskModel.id == task.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        if model:
            # Alanları güncelle
            model.title = task.title
            model.description = task.description
            # Not: Task entity'sinde status yok, priority var. Status column ile yönetilir.
            # Eğer modelinizde status kolonu varsa:
            # model.status = task.status 
            
            model.priority = task.priority
            model.due_date = task.due_date
            model.points = task.points
            model.is_recurring = task.is_recurring
            model.assignee_id = task.assignee_id
            model.column_id = task.column_id
            model.sprint_id = task.sprint_id
            # reporter_id ve parent_task_id de eklenebilir
            if task.reporter_id:
                model.reporter_id = task.reporter_id
            if task.parent_task_id:
                model.parent_task_id = task.parent_task_id
            
            await self.session.flush()
            # Güncel veriyi ilişkilerle geri dön
            return await self.get_by_id(task.id) # type: ignore
        return task

    async def delete(self, task_id: int) -> bool:
        stmt = delete(TaskModel).where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0
    
    # Eğer interface'de tanımlıysa ekleyin, değilse silebilirsiniz
    async def get_tasks_by_user_id(self, user_id: int) -> List[Task]:
        return await self.get_all_by_assignee(user_id)
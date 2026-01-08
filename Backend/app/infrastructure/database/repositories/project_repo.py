from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_
from app.domain.entities.project import Project
from app.domain.repositories.project_repository import IProjectRepository
from app.infrastructure.database.models.project import ProjectModel
from sqlalchemy.orm import joinedload

class SqlAlchemyProjectRepository(IProjectRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ProjectModel) -> Project:
        return Project.model_validate(model)

    def _to_model(self, entity: Project) -> ProjectModel:
        data = entity.model_dump(exclude={"id", "created_at"})
        return ProjectModel(**data)

    async def create(self, project: Project) -> Project:
        model = self._to_model(project)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, project_id: int) -> Optional[Project]:
        # GÜNCELLEME: joinedload(ProjectModel.columns) EKLENDİ
        stmt = (
            select(ProjectModel)
            .options(joinedload(ProjectModel.columns)) 
            .where(ProjectModel.id == project_id)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_id_and_user(self, project_id: int, user_id: int) -> Optional[Project]:
        stmt = select(ProjectModel).where(
            ProjectModel.id == project_id,
            or_(
                ProjectModel.manager_id == user_id,
                ProjectModel.members.any(id=user_id)
            )
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self, manager_id: int) -> List[Project]:
        # Fetch projects where user is manager OR a member
        stmt = select(ProjectModel).where(
            or_(
                ProjectModel.manager_id == manager_id,
                ProjectModel.members.any(id=manager_id)
            )
        )
        result = await self.session.execute(stmt)
        models = result.scalars().unique().all() # unique() is important for joins/relationships
        return [self._to_entity(m) for m in models]

    async def update(self, project: Project) -> Project:
        # In a real scenario, we might want to fetch and update specific fields
        # For simplicity, we assume 'project' entity has the updated state
        # But since we detached, we should probably merge or get and update.
        # Let's simple fetch and update fields.
        stmt = select(ProjectModel).where(ProjectModel.id == project.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        if model:
            model.name = project.name
            model.description = project.description
            model.start_date = project.start_date
            model.end_date = project.end_date
            model.methodology = project.methodology
            # manager_id usually doesn't change, but if it does:
            # model.manager_id = project.manager_id 
            
            await self.session.flush()
            await self.session.refresh(model)
            return self._to_entity(model)
        return project # Should ideally raise not found, but repo just returns

    async def delete(self, project_id: int) -> bool:
        stmt = delete(ProjectModel).where(ProjectModel.id == project_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0

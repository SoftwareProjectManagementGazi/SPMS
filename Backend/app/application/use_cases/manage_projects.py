from typing import List
from app.domain.repositories.project_repository import IProjectRepository
from app.application.dtos.project_dtos import ProjectCreateDTO, ProjectUpdateDTO, ProjectResponseDTO
from app.domain.entities.project import Project
from app.domain.exceptions import ProjectNotFoundError

class CreateProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, dto: ProjectCreateDTO, owner_id: int) -> ProjectResponseDTO:
        new_project = Project(
            name=dto.name,
            description=dto.description,
            start_date=dto.start_date,
            end_date=dto.end_date,
            methodology=dto.methodology,
            owner_id=owner_id
        )
        created_project = await self.project_repo.create(new_project)
        return ProjectResponseDTO.model_validate(created_project)

class ListProjectsUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, owner_id: int) -> List[ProjectResponseDTO]:
        projects = await self.project_repo.get_all(owner_id)
        return [ProjectResponseDTO.model_validate(p) for p in projects]

class GetProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, owner_id: int) -> ProjectResponseDTO:
        project = await self.project_repo.get_by_id(project_id)
        # Check ownership or existence
        if not project or project.owner_id != owner_id:
             # For security, we might want to return 404 even if it exists but belongs to another
            raise ProjectNotFoundError(project_id)
        return ProjectResponseDTO.model_validate(project)

class UpdateProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, dto: ProjectUpdateDTO, owner_id: int) -> ProjectResponseDTO:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.owner_id != owner_id:
            raise ProjectNotFoundError(project_id)
        
        # Update fields
        update_data = dto.model_dump(exclude_unset=True)
        updated_project = project.model_copy(update=update_data)
        
        result = await self.project_repo.update(updated_project)
        return ProjectResponseDTO.model_validate(result)

class DeleteProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, owner_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.owner_id != owner_id:
            raise ProjectNotFoundError(project_id)
        
        await self.project_repo.delete(project_id)

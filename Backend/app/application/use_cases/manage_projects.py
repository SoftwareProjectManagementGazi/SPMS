from typing import List
from app.domain.repositories.project_repository import IProjectRepository
from app.application.dtos.project_dtos import ProjectCreateDTO, ProjectUpdateDTO, ProjectResponseDTO
from app.domain.entities.project import Project
from app.domain.entities.board_column import BoardColumn
from app.domain.exceptions import ProjectNotFoundError

class CreateProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, dto: ProjectCreateDTO, manager_id: int) -> ProjectResponseDTO:
        # Create BoardColumn entities from string list
        columns = [
            BoardColumn(name=col_name, order_index=i, wip_limit=0) 
            for i, col_name in enumerate(dto.columns)
        ]

        new_project = Project(
            key=dto.key,
            name=dto.name,
            description=dto.description,
            start_date=dto.start_date,
            end_date=dto.end_date,
            methodology=dto.methodology,
            manager_id=manager_id,
            columns=columns,
            custom_fields=dto.custom_fields
        )
        created_project = await self.project_repo.create(new_project)
        return ProjectResponseDTO.model_validate(created_project)

class ListProjectsUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, manager_id: int) -> List[ProjectResponseDTO]:
        projects = await self.project_repo.get_all(manager_id)
        return [ProjectResponseDTO.model_validate(p) for p in projects]

class GetProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, manager_id: int) -> ProjectResponseDTO:
        project = await self.project_repo.get_by_id_and_user(project_id, manager_id)
        if not project:
            raise ProjectNotFoundError(project_id)
        return ProjectResponseDTO.model_validate(project)

class UpdateProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, dto: ProjectUpdateDTO, manager_id: int) -> ProjectResponseDTO:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.manager_id != manager_id:
            raise ProjectNotFoundError(project_id)
        
        # Update fields
        update_data = dto.model_dump(exclude_unset=True)
        updated_project = project.model_copy(update=update_data)
        
        result = await self.project_repo.update(updated_project)
        return ProjectResponseDTO.model_validate(result)

class DeleteProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, manager_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.manager_id != manager_id:
            raise ProjectNotFoundError(project_id)
        
        await self.project_repo.delete(project_id)

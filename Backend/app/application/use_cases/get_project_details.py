from app.domain.repositories.project_repository import IProjectRepository
from app.application.dtos.project_dtos import ProjectResponseDTO
from app.domain.exceptions import ProjectNotFoundError

class GetProjectDetailsUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int) -> ProjectResponseDTO:
        # Not: Burada normalde "User bu projenin üyesi mi?" kontrolü yapılmalı.
        # Şimdilik direkt getiriyoruz.
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise ProjectNotFoundError(f"Project with id {project_id} not found")
        
        return ProjectResponseDTO.model_validate(project)
    
from typing import List
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.application.dtos.task_dtos import TaskCreateDTO, TaskUpdateDTO, TaskResponseDTO
from app.domain.entities.task import Task
from app.domain.exceptions import TaskNotFoundError, ProjectNotFoundError

class CreateTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, dto: TaskCreateDTO) -> TaskResponseDTO:
        # Verify project exists
        project = await self.project_repo.get_by_id(dto.project_id)
        if not project:
            raise ProjectNotFoundError(dto.project_id)

        new_task = Task(
            title=dto.title,
            description=dto.description,
            status=dto.status,
            priority=dto.priority,
            due_date=dto.due_date,
            project_id=dto.project_id,
            assignee_id=dto.assignee_id
        )
        created_task = await self.task_repo.create(new_task)
        return TaskResponseDTO.model_validate(created_task)

class ListProjectTasksUseCase:
    def __init__(self, task_repo: ITaskRepository):
        self.task_repo = task_repo

    async def execute(self, project_id: int) -> List[TaskResponseDTO]:
        tasks = await self.task_repo.get_all_by_project(project_id)
        return [TaskResponseDTO.model_validate(t) for t in tasks]

class ListMyTasksUseCase:
    def __init__(self, task_repo: ITaskRepository):
        self.task_repo = task_repo

    async def execute(self, user_id: int) -> List[TaskResponseDTO]:
        tasks = await self.task_repo.get_all_by_assignee(user_id)
        return [TaskResponseDTO.model_validate(t) for t in tasks]

class UpdateTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, task_id: int, dto: TaskUpdateDTO, user_id: int) -> TaskResponseDTO:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(task_id)
        
        # Check permissions: Project Owner or Assignee
        project = await self.project_repo.get_by_id(task.project_id)
        if not project:
             raise TaskNotFoundError(task_id) # Should be ProjectNotFound but leaking existence

        is_owner = project.owner_id == user_id
        is_assignee = task.assignee_id == user_id

        if not (is_owner or is_assignee):
            raise TaskNotFoundError(task_id) # Obfuscate existence for unauthorized

        # Update fields
        update_data = dto.model_dump(exclude_unset=True)
        updated_task = task.model_copy(update=update_data)
        
        result = await self.task_repo.update(updated_task)
        return TaskResponseDTO.model_validate(result)

class DeleteTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, task_id: int, user_id: int) -> None:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(task_id)
        
        # Check permissions: Project Owner ONLY (usually assignees can't delete, only update status)
        # OR Allow Assignee to delete? Let's restrict Delete to Project Owner for safety.
        # But for "intervene in their own tasks", update is key. Delete might be Owner only.
        # Let's check the requirement: "Users can only intervene in their own tasks".
        # I'll allow Assignee to delete for now to be flexible, or restrict to Owner. 
        # Let's restrict DELETE to Owner, UPDATE to Owner + Assignee.
        
        project = await self.project_repo.get_by_id(task.project_id)
        if not project or project.owner_id != user_id:
             raise TaskNotFoundError(task_id)
        
        await self.task_repo.delete(task_id)

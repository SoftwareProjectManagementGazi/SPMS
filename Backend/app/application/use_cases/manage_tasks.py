from typing import List, Optional
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.application.dtos.task_dtos import (
    TaskCreateDTO, 
    TaskUpdateDTO, 
    TaskResponseDTO, 
    ProjectSummaryDTO,
    ParentTaskSummaryDTO,
    SubTaskSummaryDTO,
    UserSummaryDTO 
)
from app.domain.entities.task import Task
from app.domain.exceptions import TaskNotFoundError, ProjectNotFoundError

# --- YARDIMCI MAPPER FONKSİYONU (Logic buraya taşındı) ---
def map_task_to_response_dto(task: Task) -> TaskResponseDTO:
    # 1. Status Hesaplama
    status_slug = "todo"
    if task.column:
        status_slug = task.column.name.lower().replace(" ", "-")
    
    # 2. Project Key (Key oluşturmak için gerekli)
    project_key = "TASK"
    if task.project:
        project_key = task.project.key

    # 3. Parent Summary Hazırlama
    parent_summary = None
    if task.parent:
        p_status = "todo"
        if task.parent.column:
            p_status = task.parent.column.name.lower().replace(" ", "-")
        
        # Parent'ın projesi farklı olabilir mi? Genelde hayır ama kontrol etmekte fayda var
        p_key_prefix = task.parent.project.key if task.parent.project else project_key
        
        parent_summary = ParentTaskSummaryDTO(
            id=task.parent.id,
            title=task.parent.title,
            key=f"{p_key_prefix}-{task.parent.id}",
            status=p_status,
            project_id=task.parent.project_id
        )

    # 4. Subtasks Mapping (YENİ)
    sub_task_dtos = []
    if task.subtasks:
        for sub in task.subtasks:
            s_status = "todo"
            if sub.column:
                s_status = sub.column.name.lower().replace(" ", "-")
            
            sub_task_dtos.append(SubTaskSummaryDTO(
                id=sub.id,
                title=sub.title,
                key=f"{project_key}-{sub.id}",
                status=s_status,
                priority=sub.priority
            ))

    assignee_dto = None
    if task.assignee:
        assignee_dto = UserSummaryDTO(
            id=task.assignee.id,
            email=task.assignee.email,
            # Entity'de full_name var ama DTO'da username dediysek burada çeviriyoruz
            username=task.assignee.full_name, 
            avatar_url=task.assignee.avatar
        )        

    # 5. Project Summary
    project_summary = None
    if task.project:
        project_summary = ProjectSummaryDTO.model_validate(task.project)

    # DTO Oluşturma
    return TaskResponseDTO(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=status_slug,
        due_date=task.due_date,
        points=task.points,
        is_recurring=task.is_recurring,
        project_id=task.project_id,
        project=project_summary,
        sprint_id=task.sprint_id,
        column_id=task.column_id,
        assignee_id=task.assignee_id,
        assignee=assignee_dto,
        reporter_id=task.reporter_id,
        parent_task_id=task.parent_task_id,
        parent_task_summary=parent_summary,
        sub_tasks=sub_task_dtos, # Listeyi ekledik
        created_at=task.created_at,
        updated_at=task.updated_at
    )

class CreateTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, dto: TaskCreateDTO) -> TaskResponseDTO:
        project = await self.project_repo.get_by_id(dto.project_id)
        if not project:
            raise ProjectNotFoundError(f"Project with id {dto.project_id} not found")
            
        task = Task(**dto.model_dump())
        created_task = await self.task_repo.create(task)
        
        # Oluşturulan task'ı ilişkileriyle tekrar çekmek gerekebilir veya repo create içinde handle edilmeli.
        # Clean architecture'da genelde create sonrası full objeyi dönmek için get çağrılır veya repo full obje döner.
        # Şimdilik basic mapping ile dönüyoruz:
        # Not: created_task relation'ları dolu gelmeyebilir (lazy loading). 
        # En doğrusu created_task'i tekrar get_by_id ile çekmektir.
        full_task = await self.task_repo.get_by_id(created_task.id)
        return map_task_to_response_dto(full_task)

class ListProjectTasksUseCase:
    def __init__(self, task_repo: ITaskRepository):
        self.task_repo = task_repo

    async def execute(self, project_id: int) -> List[TaskResponseDTO]:
        tasks = await self.task_repo.get_all_by_project(project_id)
        return [map_task_to_response_dto(t) for t in tasks]

class ListMyTasksUseCase:
    def __init__(self, task_repo: ITaskRepository):
        self.task_repo = task_repo

    async def execute(self, user_id: int) -> List[TaskResponseDTO]:
        tasks = await self.task_repo.get_all_by_assignee(user_id)
        return [map_task_to_response_dto(t) for t in tasks]

class GetTaskUseCase:
    def __init__(self, task_repo: ITaskRepository):
        self.task_repo = task_repo

    async def execute(self, task_id: int) -> TaskResponseDTO:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"Task with id {task_id} not found")
        
        # Yeni mapper fonksiyonunu kullanıyoruz
        return map_task_to_response_dto(task)

class UpdateTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, task_id: int, dto: TaskUpdateDTO, user_id: int) -> TaskResponseDTO:
        # Not: User ID yetki kontrolü için kullanılabilir
        existing_task = await self.task_repo.get_by_id(task_id)
        if not existing_task:
            raise TaskNotFoundError(f"Task with id {task_id} not found")

        update_data = dto.model_dump(exclude_unset=True)
        updated_task = await self.task_repo.update(task_id, update_data)
        
        # İlişkilerin güncel hali için tekrar çekiyoruz (Repository update metodu relations dönmüyorsa)
        full_task = await self.task_repo.get_by_id(task_id) 
        return map_task_to_response_dto(full_task)

class DeleteTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, task_id: int, user_id: int) -> None:
        existing_task = await self.task_repo.get_by_id(task_id)
        if not existing_task:
            raise TaskNotFoundError(f"Task with id {task_id} not found")
        
        await self.task_repo.delete(task_id)
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
    UserSummaryDTO,
    PaginatedResponse,
)
from app.domain.entities.task import Task
from app.domain.exceptions import TaskNotFoundError, ProjectNotFoundError

STOP_WORDS = {"the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "and", "or", "this", "that", "with"}


def extract_search_words(query: str) -> List[str]:
    return [w for w in query.lower().split() if w not in STOP_WORDS and len(w) > 2]

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
        parent_key = task.parent.task_key if task.parent.task_key else f"{p_key_prefix}-{task.parent.id}"

        parent_summary = ParentTaskSummaryDTO(
            id=task.parent.id,
            title=task.parent.title,
            key=parent_key,
            status=p_status,
            project_id=task.parent.project_id,
            priority=task.parent.priority  # Added priority mapping
        )

    # 4. Subtasks Mapping (YENİ)
    sub_task_dtos = []
    if task.subtasks:
        for sub in task.subtasks:
            s_status = "todo"
            if sub.column:
                s_status = sub.column.name.lower().replace(" ", "-")
            sub_key = sub.task_key if sub.task_key else f"{project_key}-{sub.id}"
            sub_task_dtos.append(SubTaskSummaryDTO(
                id=sub.id,
                title=sub.title,
                key=sub_key,
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

    # Use stored task_key, fall back to computed key
    task_key_value = task.task_key if task.task_key else f"{project_key}-{task.id}"

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
        task_key=task_key_value,
        project_id=task.project_id,
        project=project_summary,
        sprint_id=task.sprint_id,
        column_id=task.column_id,
        assignee_id=task.assignee_id,
        assignee=assignee_dto,
        reporter_id=task.reporter_id,
        parent_task_id=task.parent_task_id,
        parent_task_summary=parent_summary,
        sub_tasks=sub_task_dtos,  # Listeyi ekledik
        created_at=task.created_at,
        updated_at=task.updated_at
    )

class CreateTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, dto: TaskCreateDTO) -> TaskResponseDTO:
        import uuid
        project = await self.project_repo.get_by_id(dto.project_id)
        if not project:
            raise ProjectNotFoundError(f"Project with id {dto.project_id} not found")

        task_data = dto.model_dump()
        # If recurring, generate a series_id to link all instances
        if task_data.get("is_recurring"):
            task_data["series_id"] = str(uuid.uuid4())

        task = Task(**task_data)
        # ARCH-04: task_repo.create() now returns the full entity with eager loading — no separate get_by_id needed
        created_task = await self.task_repo.create(task)
        return map_task_to_response_dto(created_task)

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

def _check_recurrence_should_continue(task: Task) -> bool:
    from datetime import date
    if task.recurrence_end_date and date.today() >= task.recurrence_end_date:
        return False
    if task.recurrence_count is not None and task.recurrence_count <= 1:
        return False
    return True


async def _create_next_recurrence_instance(task: Task, task_repo: ITaskRepository) -> None:
    from dateutil.relativedelta import relativedelta
    from datetime import datetime
    intervals = {
        "daily": relativedelta(days=1),
        "weekly": relativedelta(weeks=1),
        "monthly": relativedelta(months=1),
    }
    delta = intervals.get(task.recurrence_interval or "weekly", relativedelta(weeks=1))
    next_due = (task.due_date or datetime.utcnow()) + delta
    next_count = (task.recurrence_count - 1) if task.recurrence_count else None
    new_task = Task(
        title=task.title,
        description=task.description,
        project_id=task.project_id,
        is_recurring=True,
        recurrence_interval=task.recurrence_interval,
        recurrence_end_date=task.recurrence_end_date,
        recurrence_count=next_count,
        due_date=next_due,
        sprint_id=None,
        assignee_id=task.assignee_id,
        series_id=task.series_id,
        reporter_id=task.reporter_id,
    )
    await task_repo.create(new_task)


class UpdateTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, task_id: int, dto: TaskUpdateDTO, user_id: int, apply_to: str = "this") -> TaskResponseDTO:
        # Not: User ID yetki kontrolü için kullanılabilir
        existing_task = await self.task_repo.get_by_id(task_id)
        if not existing_task:
            raise TaskNotFoundError(f"Task with id {task_id} not found")

        # Business Rule 1: Validate Column ID
        new_column_name = None
        if dto.column_id is not None:
            # Projeyi ve columnlarını çek
            project = await self.project_repo.get_by_id(existing_task.project_id)
            if not project:
                raise ProjectNotFoundError(f"Project {existing_task.project_id} not found")

            # Column'ın bu projeye ait olup olmadığını kontrol et
            # project.columns bir liste objesi (BoardColumn entity) döner
            valid_column_ids = [c.id for c in project.columns]
            if dto.column_id not in valid_column_ids:
                raise ValueError(f"Column {dto.column_id} does not belong to project {existing_task.project_id}")
            # Find the column name for recurring check
            for col in project.columns:
                if col.id == dto.column_id:
                    new_column_name = col.name
                    break

        update_data = dto.model_dump(exclude_unset=True)

        # Apply to all future series instances if requested
        if apply_to == "all" and existing_task.is_recurring and existing_task.series_id:
            # Update all future tasks in same series
            await self.task_repo.update_series(existing_task.series_id, update_data)

        # ARCH-05: task_repo.update() already returns the full entity with eager loading — no separate get_by_id needed
        updated_task = await self.task_repo.update(task_id, update_data, user_id=user_id)

        # Recurring next-instance creation when task is moved to a done column
        if new_column_name is not None and existing_task.is_recurring:
            status_changed_to_done = new_column_name.lower().strip() in ("done", "completed", "closed")
            if status_changed_to_done and _check_recurrence_should_continue(existing_task):
                await _create_next_recurrence_instance(existing_task, self.task_repo)

        return map_task_to_response_dto(updated_task)

class DeleteTaskUseCase:
    def __init__(self, task_repo: ITaskRepository, project_repo: IProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def execute(self, task_id: int, user_id: int) -> None:
        existing_task = await self.task_repo.get_by_id(task_id)
        if not existing_task:
            raise TaskNotFoundError(f"Task with id {task_id} not found")

        await self.task_repo.delete(task_id)


class ListProjectTasksPaginatedUseCase:
    def __init__(self, task_repo: ITaskRepository):
        self.task_repo = task_repo

    async def execute(self, project_id: int, page: int, page_size: int) -> PaginatedResponse:
        tasks, total = await self.task_repo.get_all_by_project_paginated(project_id, page, page_size)
        items = [map_task_to_response_dto(t) for t in tasks]
        return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


class SearchSimilarTasksUseCase:
    def __init__(self, task_repo: ITaskRepository):
        self.task_repo = task_repo

    async def execute(self, project_id: int, query: str) -> List[TaskResponseDTO]:
        words = extract_search_words(query)
        if not words:
            return []
        tasks = await self.task_repo.search_by_title(project_id, words)
        return [map_task_to_response_dto(t) for t in tasks]
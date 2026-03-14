from typing import Dict, List

from app.application.dtos.task_dtos import TaskDependencySummaryDTO
from app.domain.entities.user import User
from app.domain.entities.task_dependency import TaskDependency
from app.infrastructure.database.repositories.task_dependency_repo import SqlAlchemyTaskDependencyRepository
from app.domain.repositories.task_repository import ITaskRepository


def _to_summary_dto(dep: TaskDependency, depends_on_key: str = None, depends_on_title: str = None) -> TaskDependencySummaryDTO:
    return TaskDependencySummaryDTO(
        id=dep.id,
        task_id=dep.task_id,
        depends_on_id=dep.depends_on_id,
        dependency_type=dep.dependency_type,
        depends_on_key=depends_on_key,
        depends_on_title=depends_on_title,
    )


class AddDependencyUseCase:
    def __init__(self, dep_repo: SqlAlchemyTaskDependencyRepository):
        self.dep_repo = dep_repo

    async def execute(self, task_id: int, depends_on_id: int, dep_type: str, actor: User) -> TaskDependencySummaryDTO:
        dep = await self.dep_repo.add(task_id, depends_on_id, dep_type)
        return _to_summary_dto(dep)


class RemoveDependencyUseCase:
    def __init__(self, dep_repo: SqlAlchemyTaskDependencyRepository):
        self.dep_repo = dep_repo

    async def execute(self, dependency_id: int, actor: User) -> None:
        await self.dep_repo.remove(dependency_id)


class ListDependenciesUseCase:
    def __init__(self, dep_repo: SqlAlchemyTaskDependencyRepository, task_repo: ITaskRepository):
        self.dep_repo = dep_repo
        self.task_repo = task_repo

    async def execute(self, task_id: int) -> Dict[str, List[TaskDependencySummaryDTO]]:
        raw = await self.dep_repo.list_for_task(task_id)

        async def enrich(dep: TaskDependency, other_task_id: int) -> TaskDependencySummaryDTO:
            other = await self.task_repo.get_by_id(other_task_id)
            key = None
            title = None
            if other:
                key = other.task_key or f"{other.project.key if other.project else 'TASK'}-{other.id}"
                title = other.title
            return _to_summary_dto(dep, depends_on_key=key, depends_on_title=title)

        blocks = [await enrich(d, d.depends_on_id) for d in raw["blocks"]]
        blocked_by = [await enrich(d, d.task_id) for d in raw["blocked_by"]]
        return {"blocks": blocks, "blocked_by": blocked_by}

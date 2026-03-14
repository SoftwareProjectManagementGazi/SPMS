"""Project member management use cases — Clean Architecture (no SQLAlchemy imports)."""
from app.domain.entities.user import User
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.team_repository import ITeamRepository
from app.domain.exceptions import ProjectNotFoundError, UserNotFoundError


class AddProjectMemberUseCase:
    """Add a single user to the project by user_id. Idempotent (no error if already member)."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        user_repo: IUserRepository,
    ):
        self.project_repo = project_repo
        self.user_repo = user_repo

    async def execute(self, project_id: int, user_id: int, actor: User) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)

        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError(user_id)

        await self.project_repo.add_member(project_id, user_id)


class AddTeamToProjectUseCase:
    """Add all members of a team to a project at once. Idempotent per member."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        team_repo: ITeamRepository,
    ):
        self.project_repo = project_repo
        self.team_repo = team_repo

    async def execute(self, project_id: int, team_id: int, actor: User) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)

        member_ids = await self.team_repo.get_members(team_id)
        for user_id in member_ids:
            await self.project_repo.add_member(project_id, user_id)


class RemoveProjectMemberUseCase:
    """Remove user from project and unassign their incomplete/in-progress tasks.
    Done tasks (columns with 'done' in name) preserve their assignee.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        user_repo: IUserRepository,
        task_unassign_repo,  # ITaskRepository — typed loosely to avoid circular import risk
    ):
        self.project_repo = project_repo
        self.user_repo = user_repo
        self.task_unassign_repo = task_unassign_repo

    async def execute(self, project_id: int, user_id: int, actor: User) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)

        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError(user_id)

        # Unassign incomplete tasks (tasks not in 'done' columns)
        await self.task_unassign_repo.unassign_incomplete_tasks(project_id, user_id)

        # Remove from project_members table
        await self.project_repo.remove_member(project_id, user_id)

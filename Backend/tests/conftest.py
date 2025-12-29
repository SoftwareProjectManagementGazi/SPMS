import pytest
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator, Dict
from app.api.main import app
from app.api.dependencies import get_user_repo, get_project_repo, get_task_repo, get_security_service
from app.domain.entities.user import User
from app.domain.entities.project import Project, Methodology
from app.domain.entities.task import Task
from app.application.ports.security_port import ISecurityService
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.task_repository import ITaskRepository
from typing import Optional, List
from datetime import datetime

# --- Mocks for Integration Tests ---

class MockUserRepository(IUserRepository):
    def __init__(self):
        self.users = {}
        self.next_id = 1

    async def get_by_email(self, email: str) -> Optional[User]:
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    async def create(self, user: User) -> User:
        user.id = self.next_id
        if user.created_at is None:
            user.created_at = datetime.now()
        self.users[self.next_id] = user
        self.next_id += 1
        return user

    async def get_by_id(self, user_id: int) -> Optional[User]:
        return self.users.get(user_id)

class MockProjectRepository(IProjectRepository):
    def __init__(self):
        self.projects = {}
        self.next_id = 1

    async def create(self, project: Project) -> Project:
        project.id = self.next_id
        if project.created_at is None:
            project.created_at = datetime.now()
        self.projects[self.next_id] = project
        self.next_id += 1
        return project

    async def get_by_id(self, project_id: int) -> Optional[Project]:
        return self.projects.get(project_id)

    async def get_all(self, owner_id: int) -> List[Project]:
        return [p for p in self.projects.values() if p.owner_id == owner_id]

    async def update(self, project: Project) -> Project:
        self.projects[project.id] = project
        return project

    async def delete(self, project_id: int) -> bool:
        if project_id in self.projects:
            del self.projects[project_id]
            return True
        return False

class MockTaskRepository(ITaskRepository):
    def __init__(self):
        self.tasks = {}
        self.next_id = 1

    async def create(self, task: Task) -> Task:
        task.id = self.next_id
        if task.created_at is None:
            task.created_at = datetime.now()
        self.tasks[self.next_id] = task
        self.next_id += 1
        return task

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        return self.tasks.get(task_id)

    async def get_all_by_project(self, project_id: int) -> List[Task]:
        return [t for t in self.tasks.values() if t.project_id == project_id]
    
    async def get_all_by_assignee(self, assignee_id: int) -> List[Task]:
        return [t for t in self.tasks.values() if t.assignee_id == assignee_id]

    async def update(self, task: Task) -> Task:
        self.tasks[task.id] = task
        return task

    async def delete(self, task_id: int) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False

from jose import jwt
from app.infrastructure.config import settings
from datetime import datetime, timedelta

class MockSecurityService(ISecurityService):
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return plain_password == hashed_password.replace("hashed_", "")

    def get_password_hash(self, password: str) -> str:
        return f"hashed_{password}"

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        # Use the same settings as the app for successful decoding
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

# --- Fixtures ---

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(name="mock_repos")
def fixture_mock_repos():
    user_repo = MockUserRepository()
    project_repo = MockProjectRepository()
    task_repo = MockTaskRepository()
    security_service = MockSecurityService()
    return user_repo, project_repo, task_repo, security_service

@pytest.fixture(name="client")
async def fixture_client(mock_repos) -> AsyncGenerator[AsyncClient, None]:
    user_repo, project_repo, task_repo, security_service = mock_repos
    
    # Override dependencies
    app.dependency_overrides[get_user_repo] = lambda: user_repo
    app.dependency_overrides[get_project_repo] = lambda: project_repo
    app.dependency_overrides[get_task_repo] = lambda: task_repo
    app.dependency_overrides[get_security_service] = lambda: security_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    
    # Clean up
    app.dependency_overrides.clear()

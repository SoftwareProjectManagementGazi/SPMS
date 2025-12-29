import pytest
from httpx import AsyncClient
from app.domain.entities.user import User
from app.domain.entities.project import Project, Methodology
from app.domain.entities.task import Task, TaskStatus, TaskPriority
from datetime import datetime

@pytest.mark.asyncio
async def test_access_protected_route_without_token(client: AsyncClient):
    response = await client.get("/api/v1/projects/")
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}

@pytest.mark.asyncio
async def test_delete_other_user_project(client: AsyncClient, mock_repos):
    user_repo, project_repo, _, security_service = mock_repos

    # 1. Create two users
    owner = User(id=1, email="owner@example.com", password_hash="hashed_pw", full_name="Owner", is_active=True)
    attacker = User(id=2, email="attacker@example.com", password_hash="hashed_pw", full_name="Attacker", is_active=True)
    await user_repo.create(owner)
    await user_repo.create(attacker)

    # 2. Create a project for the owner
    project = Project(
        id=1,
        name="Owner Project",
        start_date=datetime.now(),
        methodology=Methodology.SCRUM,
        owner_id=owner.id
    )
    await project_repo.create(project)

    # 3. Attacker logs in
    token = security_service.create_access_token({"sub": attacker.email})
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Attacker tries to delete Owner's project
    response = await client.delete(f"/api/v1/projects/{project.id}", headers=headers)

    # 5. Assert Forbidden/Not Found
    # Implementation returns 404 if project not found OR if owner doesn't match
    assert response.status_code == 404
    
    # Verify project still exists
    saved_project = await project_repo.get_by_id(project.id)
    assert saved_project is not None

@pytest.mark.asyncio
async def test_delete_other_user_task_in_other_project(client: AsyncClient, mock_repos):
    user_repo, project_repo, task_repo, security_service = mock_repos

    # 1. Setup Users
    owner = User(id=10, email="owner2@example.com", password_hash="hashed_pw", full_name="Owner2")
    attacker = User(id=11, email="attacker2@example.com", password_hash="hashed_pw", full_name="Attacker2")
    await user_repo.create(owner)
    await user_repo.create(attacker)

    # 2. Setup Project & Task for Owner
    project = Project(id=10, name="P", start_date=datetime.now(), methodology=Methodology.KANBAN, owner_id=owner.id)
    await project_repo.create(project)
    
    task = Task(
        id=100,
        title="Secret Task",
        status=TaskStatus.TODO,
        priority=TaskPriority.HIGH,
        project_id=project.id
    )
    await task_repo.create(task)

    # 3. Attacker Login
    token = security_service.create_access_token({"sub": attacker.email})
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Attacker tries to delete task (assuming endpoint checks project ownership via task retrieval or similar logic)
    # NOTE: In our implementation, delete_task checks if task exists. 
    # But does it check if the CURRENT USER owns the project of the task?
    # Let's check `DeleteTaskUseCase` -> It calls `repo.get_by_id`.
    # It does NOT explicitly check project ownership in the Use Case I wrote earlier. 
    # This is a SECURITY HOLE I need to fix. The test should FAIL (or pass if I expect failure) 
    # and then I will fix the code.
    
    response = await client.delete(f"/api/v1/tasks/{task.id}", headers=headers)
    
    # If my code is insecure, this might be 204. If secure, 404 or 403.
    # Let's Assert 403/404 and see if it fails, then fix the code.
    assert response.status_code in [403, 404]

@pytest.mark.asyncio
async def test_access_my_tasks(client: AsyncClient, mock_repos):
    user_repo, _, task_repo, security_service = mock_repos
    
    user = User(id=20, email="me@example.com", password_hash="hashed", full_name="Me")
    await user_repo.create(user)
    
    # Create task assigned to me
    task = Task(id=200, title="My Task", project_id=999, assignee_id=user.id)
    await task_repo.create(task)
    
    token = security_service.create_access_token({"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.get("/api/v1/tasks/my-tasks", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    # Mock repo resets ID, so we check against the updated task object
    assert data[0]["id"] == task.id

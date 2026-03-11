"""
RBAC enforcement tests for task endpoints.

All tests are marked xfail — stubs for Nyquist compliance.
Implementation is pending Plan 01-03 (RBAC enforcement on task endpoints).
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.xfail(reason="RBAC not implemented yet — pending Plan 01-03")
async def test_non_member_gets_403_on_list_tasks(client: AsyncClient):
    """Authenticated user who is not a project member gets HTTP 403 on GET /api/v1/tasks/project/{project_id}."""
    # Stub — implementation in Plan 01-03
    raise NotImplementedError("RBAC enforcement not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="RBAC not implemented yet — pending Plan 01-03")
async def test_non_member_gets_403_on_get_task(client: AsyncClient):
    """Non-member gets 403 on GET /api/v1/tasks/{task_id}."""
    # Stub — implementation in Plan 01-03
    raise NotImplementedError("RBAC enforcement not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="RBAC not implemented yet — pending Plan 01-03")
async def test_non_member_gets_403_on_create_task(client: AsyncClient):
    """Non-member gets 403 on POST /api/v1/tasks/project/{project_id}."""
    # Stub — implementation in Plan 01-03
    raise NotImplementedError("RBAC enforcement not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="RBAC not implemented yet — pending Plan 01-03")
async def test_non_member_gets_403_on_update_task(client: AsyncClient):
    """Non-member gets 403 on PUT /api/v1/tasks/{task_id}."""
    # Stub — implementation in Plan 01-03
    raise NotImplementedError("RBAC enforcement not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="RBAC not implemented yet — pending Plan 01-03")
async def test_non_member_gets_403_on_delete_task(client: AsyncClient):
    """Non-member gets 403 on DELETE /api/v1/tasks/{task_id}."""
    # Stub — implementation in Plan 01-03
    raise NotImplementedError("RBAC enforcement not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="RBAC not implemented yet — pending Plan 01-03")
async def test_admin_can_access_any_project_tasks(client: AsyncClient):
    """Admin user gets 200 on GET /api/v1/tasks/project/{project_id} even when not a project member."""
    # Stub — implementation in Plan 01-03
    raise NotImplementedError("RBAC enforcement not yet implemented")

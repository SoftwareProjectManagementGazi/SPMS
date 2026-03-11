"""
Integration tests for audit log field-level change tracking.

All tests are marked xfail — stubs for Nyquist compliance.
Implementation is pending Plan 01-02 (audit log infrastructure).
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-02 — audit log not yet implemented")
async def test_update_task_writes_audit_row(client: AsyncClient, db_session: AsyncSession):
    """Updating a task's title creates one audit_log row with entity_type='task', field_name='title', old_value and new_value."""
    # Stub: will update a task title via API and check the audit_log table for a matching row
    raise NotImplementedError("Audit log for task updates not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-02 — audit log not yet implemented")
async def test_update_project_writes_audit_row(client: AsyncClient, db_session: AsyncSession):
    """Updating a project's name creates one audit_log row with entity_type='project'."""
    # Stub: will update a project name via API and check the audit_log table
    raise NotImplementedError("Audit log for project updates not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-02 — audit log not yet implemented")
async def test_audit_row_has_user_id(client: AsyncClient, db_session: AsyncSession):
    """Audit row records the user_id of the user who made the change."""
    # Stub: will verify that the audit_log row includes the correct user_id from the request token
    raise NotImplementedError("Audit log user_id tracking not yet implemented")

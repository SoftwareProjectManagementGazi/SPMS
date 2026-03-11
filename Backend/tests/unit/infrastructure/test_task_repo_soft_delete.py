"""
Unit tests for task repository soft-delete behavior.

All tests are marked xfail — stubs for Nyquist compliance.
Implementation is pending Plan 01-02 (soft-delete on task repository).
"""
import pytest


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-02 — soft-delete not yet implemented in task repo")
async def test_soft_deleted_task_not_in_list():
    """After soft-deleting a task, it does not appear in get_all_by_project()."""
    # Stub: will create a task, soft-delete it, then verify it is absent from list results
    raise NotImplementedError("Soft-delete filter behavior not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-02 — soft-delete not yet implemented in task repo")
async def test_soft_delete_sets_is_deleted_true():
    """Soft-delete sets is_deleted=True and deleted_at is not None."""
    # Stub: will soft-delete a task and verify is_deleted=True, deleted_at is set
    raise NotImplementedError("Soft-delete field update not yet implemented")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-03 — admin-only hard delete enforcement not yet designed")
async def test_hard_delete_blocked_for_non_admin():
    """Placeholder: hard delete is only allowed for admin users."""
    # Stub: placeholder for future admin-only hard delete enforcement
    raise NotImplementedError("Admin-only hard delete not yet implemented")

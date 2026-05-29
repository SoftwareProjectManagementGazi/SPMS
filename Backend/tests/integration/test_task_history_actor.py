"""Task-history actor denormalization — audit_repo.get_by_entity users JOIN.

Regression guard for the "Bilinmeyen kullanıcı" bug: the task-history endpoint
(/tasks/{id}/history → audit_repo.get_by_entity) must return each entry's actor
display name + avatar via a LEFT JOIN on users, so the frontend resolves real
names for ANY actor — not only the project manager that happens to be in the
member pool. Mirrors the JOIN get_project_activity already uses (D-47).
"""
from __future__ import annotations

import pytest

from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.repositories.audit_repo import (
    SqlAlchemyAuditRepository,
)

# Needs a live DB session (real SQL JOIN) — auto-skips when DB is unreachable.
pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_get_by_entity_includes_actor_name_and_avatar(db_session):
    user = UserModel(
        email="actor-join@testexample.com",
        password_hash="$2b$12$" + "x" * 53,
        full_name="Cem Yılmaz",
        avatar="uploads/avatars/cem.jpg",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    db_session.add(
        AuditLogModel(
            entity_type="task",
            entity_id=994242,
            field_name="description",
            old_value="<p>eski</p>",
            new_value="<p><strong>yeni</strong> açıklama</p>",
            user_id=user.id,
            action="updated",
        )
    )
    await db_session.flush()

    rows = await SqlAlchemyAuditRepository(db_session).get_by_entity("task", 994242)

    assert len(rows) == 1
    row = rows[0]
    # The JOIN populates the denormalized actor identity (the fix).
    assert row["user_name"] == "Cem Yılmaz"
    assert row["user_avatar"] == "uploads/avatars/cem.jpg"
    # Existing keys preserved (backward compat for get_my_task_activity).
    assert row["user_id"] == user.id
    assert row["field_name"] == "description"
    assert row["action"] == "updated"
    # Raw value is stored intact — HTML stripping / truncation is a frontend
    # display concern, never a storage one.
    assert row["new_value"] == "<p><strong>yeni</strong> açıklama</p>"


@pytest.mark.asyncio
async def test_get_by_entity_actor_null_for_system_action(db_session):
    """isouter=True keeps rows that have no actor (user_id NULL system action)
    — they surface with user_name/user_avatar = None rather than being dropped."""
    db_session.add(
        AuditLogModel(
            entity_type="task",
            entity_id=994243,
            field_name="status",
            old_value="todo",
            new_value="done",
            user_id=None,
            action="updated",
        )
    )
    await db_session.flush()

    rows = await SqlAlchemyAuditRepository(db_session).get_by_entity("task", 994243)

    assert len(rows) == 1
    assert rows[0]["user_id"] is None
    assert rows[0]["user_name"] is None
    assert rows[0]["user_avatar"] is None

"""Audit value capping — large free-text field values are bounded at write time.

User decision 2026-05-29 (Option C): a single-character edit to a long
description must NOT write the full before+after text into the append-only
audit_log. Values over AUDIT_VALUE_MAX_LEN are truncated with an ellipsis at
write time; short fields (status, priority, …) are stored verbatim. The history
UI already renders only a brief preview, so a bounded snapshot is enough.
"""
from __future__ import annotations

from datetime import datetime, timezone

import pytest
from sqlalchemy import select

from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.project import ProjectModel
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.repositories.task_repo import (
    SqlAlchemyTaskRepository,
    AUDIT_VALUE_MAX_LEN,
    _cap_audit_value,
)


# ---------------------------------------------------------------------------
# Pure unit tests for the cap helper (no DB).
# ---------------------------------------------------------------------------


def test_cap_audit_value_passes_short_values_through():
    assert _cap_audit_value("todo") == "todo"
    assert _cap_audit_value(5) == "5"
    assert _cap_audit_value(None) is None


def test_cap_audit_value_keeps_value_exactly_at_limit_unmarked():
    exact = "Y" * AUDIT_VALUE_MAX_LEN
    out = _cap_audit_value(exact)
    assert out == exact
    assert not out.endswith("…")  # no marker at the boundary


def test_cap_audit_value_truncates_oversized_with_ellipsis():
    out = _cap_audit_value("X" * 1000)
    assert out is not None
    assert out.endswith("…")
    assert len(out) == AUDIT_VALUE_MAX_LEN + 1  # capped body + 1 marker char
    assert out[:-1] == "X" * AUDIT_VALUE_MAX_LEN


# ---------------------------------------------------------------------------
# Integration: the cap is actually applied through the real repo.update() path.
# ---------------------------------------------------------------------------


@pytest.mark.requires_db
@pytest.mark.asyncio
async def test_update_caps_long_description_in_audit_log(db_session):
    user = UserModel(
        email="cap-test@testexample.com",
        password_hash="$2b$12$" + "x" * 53,
        full_name="Cap Tester",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    project = ProjectModel(
        key="CAPTEST",
        name="Cap Test Project",
        description="p",
        manager_id=user.id,
        methodology="KANBAN",
        start_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )
    db_session.add(project)
    await db_session.flush()

    task = TaskModel(
        title="Cap task",
        description="kısa eski açıklama",
        project_id=project.id,
        reporter_id=user.id,
    )
    db_session.add(task)
    await db_session.flush()

    repo = SqlAlchemyTaskRepository(db_session)
    long_desc = "Z" * 1000
    await repo.update(task.id, {"description": long_desc}, user_id=user.id)

    row = (
        await db_session.execute(
            select(AuditLogModel).where(
                AuditLogModel.entity_type == "task",
                AuditLogModel.entity_id == task.id,
                AuditLogModel.field_name == "description",
            )
        )
    ).scalar_one()

    # The 1000-char body is NOT stored verbatim — it is capped + marked.
    assert row.new_value.endswith("…")
    assert len(row.new_value) == AUDIT_VALUE_MAX_LEN + 1
    assert ("Z" * 1000) not in (row.new_value or "")
    # The short OLD value is preserved verbatim (cap only bites oversized values).
    assert row.old_value == "kısa eski açıklama"
    assert row.action == "updated"
    assert row.user_id == user.id

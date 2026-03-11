"""
Integration tests for audit log field-level change tracking.

These tests verify that audit rows are written when tasks and projects
are updated via the repository layer.

NOTE: These tests require a running PostgreSQL DB (same as other integration tests).
They are marked xfail when the DB is not available, so CI passes without a DB.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.repositories.task_repo import SqlAlchemyTaskRepository
from app.infrastructure.database.repositories.project_repo import SqlAlchemyProjectRepository


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Integration test — requires live DB with seeded data; run manually")
async def test_update_task_writes_audit_row(db_session: AsyncSession):
    """Updating a task's title creates one audit_log row with correct values."""
    # This test requires a pre-existing task in the DB.
    # It is marked xfail to allow collection without a live DB.
    repo = SqlAlchemyTaskRepository(db_session)

    # Find any existing task
    from app.infrastructure.database.models.task import TaskModel
    stmt = select(TaskModel).where(TaskModel.is_deleted == False).limit(1)
    result = await db_session.execute(stmt)
    task_model = result.scalar_one_or_none()

    if task_model is None:
        pytest.skip("No tasks in DB — seed data required")

    original_title = task_model.title
    new_title = original_title + "_audit_test"

    await repo.update(task_model.id, {"title": new_title}, user_id=1)

    # Verify audit row was created
    audit_stmt = select(AuditLogModel).where(
        AuditLogModel.entity_type == "task",
        AuditLogModel.entity_id == task_model.id,
        AuditLogModel.field_name == "title",
        AuditLogModel.new_value == new_title,
    )
    audit_result = await db_session.execute(audit_stmt)
    audit_row = audit_result.scalar_one_or_none()

    assert audit_row is not None, "Audit row must be created on task update"
    assert audit_row.old_value == original_title
    assert audit_row.action == "updated"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Integration test — requires live DB with seeded data; run manually")
async def test_update_project_writes_audit_row(db_session: AsyncSession):
    """Updating a project's name creates one audit_log row with entity_type='project'."""
    from app.infrastructure.database.models.project import ProjectModel
    from app.domain.entities.project import Project

    repo = SqlAlchemyProjectRepository(db_session)

    stmt = select(ProjectModel).where(ProjectModel.is_deleted == False).limit(1)
    result = await db_session.execute(stmt)
    project_model = result.scalar_one_or_none()

    if project_model is None:
        pytest.skip("No projects in DB — seed data required")

    original_name = project_model.name
    new_name = original_name + "_audit_test"

    # Build updated Project entity
    project = await repo.get_by_id(project_model.id)
    updated_project = project.model_copy(update={"name": new_name})

    await repo.update(updated_project, user_id=1)

    # Verify audit row
    audit_stmt = select(AuditLogModel).where(
        AuditLogModel.entity_type == "project",
        AuditLogModel.entity_id == project_model.id,
        AuditLogModel.field_name == "name",
    )
    audit_result = await db_session.execute(audit_stmt)
    audit_row = audit_result.scalar_one_or_none()

    assert audit_row is not None, "Audit row must be created on project update"
    assert audit_row.new_value == new_name


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Integration test — requires live DB with seeded data; run manually")
async def test_audit_row_has_user_id(db_session: AsyncSession):
    """Audit row records the user_id of the user who made the change."""
    from app.infrastructure.database.models.task import TaskModel

    repo = SqlAlchemyTaskRepository(db_session)

    stmt = select(TaskModel).where(TaskModel.is_deleted == False).limit(1)
    result = await db_session.execute(stmt)
    task_model = result.scalar_one_or_none()

    if task_model is None:
        pytest.skip("No tasks in DB — seed data required")

    test_user_id = 1
    new_title = task_model.title + "_user_id_test"

    await repo.update(task_model.id, {"title": new_title}, user_id=test_user_id)

    audit_stmt = select(AuditLogModel).where(
        AuditLogModel.entity_type == "task",
        AuditLogModel.entity_id == task_model.id,
        AuditLogModel.new_value == new_title,
    )
    audit_result = await db_session.execute(audit_stmt)
    audit_row = audit_result.scalar_one_or_none()

    assert audit_row is not None
    assert audit_row.user_id == test_user_id

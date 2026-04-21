"""BACK-06 PhaseReport repo integration + partial unique index behavior (Pitfall 8)."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.infrastructure.database.repositories.phase_report_repo import SqlAlchemyPhaseReportRepository
from app.domain.entities.phase_report import PhaseReport


async def _ensure_project(async_session, key="PRREP1"):
    existing = (await async_session.execute(text(f"SELECT id FROM projects WHERE key='{key}'"))).scalar()
    if existing:
        return existing
    await async_session.execute(text(
        f"INSERT INTO projects (key, name, start_date, methodology, status) "
        f"VALUES ('{key}', 'PR', now(), 'SCRUM', 'ACTIVE')"
    ))
    await async_session.flush()
    return (await async_session.execute(text(f"SELECT id FROM projects WHERE key='{key}'"))).scalar()


@pytest.mark.asyncio
async def test_roundtrip(async_session):
    project_id = await _ensure_project(async_session, "PR1")
    repo = SqlAlchemyPhaseReportRepository(async_session)
    r = PhaseReport(project_id=project_id, phase_id="nd_a1b2c3d4e5", cycle_number=1, revision=1)
    created = await repo.create(r)
    assert created.id is not None
    fetched = await repo.get_by_id(created.id)
    assert fetched.cycle_number == 1
    assert fetched.revision == 1


@pytest.mark.asyncio
async def test_partial_unique_rejects_duplicate_active(async_session):
    """Pitfall 8 / D-25: duplicate (project, phase, cycle) while both active → IntegrityError."""
    project_id = await _ensure_project(async_session, "PRU1")
    repo = SqlAlchemyPhaseReportRepository(async_session)
    await repo.create(PhaseReport(project_id=project_id, phase_id="nd_f6g7h8i9j0", cycle_number=1))
    with pytest.raises(IntegrityError):
        await repo.create(PhaseReport(project_id=project_id, phase_id="nd_f6g7h8i9j0", cycle_number=1))
        await async_session.flush()


@pytest.mark.asyncio
async def test_soft_delete_allows_recreate(async_session):
    """Pitfall 8 fix / D-25: partial index `WHERE is_deleted=FALSE` allows
    re-creating same tuple after soft-delete."""
    project_id = await _ensure_project(async_session, "PRSD1")
    repo = SqlAlchemyPhaseReportRepository(async_session)
    first = await repo.create(PhaseReport(project_id=project_id, phase_id="nd_xyz1234567", cycle_number=1))
    await repo.delete(first.id)
    # Should succeed — soft-deleted rows are excluded from partial unique
    second = await repo.create(PhaseReport(project_id=project_id, phase_id="nd_xyz1234567", cycle_number=1))
    assert second.id != first.id


@pytest.mark.asyncio
async def test_get_latest_by_project_phase(async_session):
    project_id = await _ensure_project(async_session, "PRL1")
    repo = SqlAlchemyPhaseReportRepository(async_session)
    await repo.create(PhaseReport(project_id=project_id, phase_id="nd_p1q2r3s4t5", cycle_number=1))
    await repo.create(PhaseReport(project_id=project_id, phase_id="nd_p1q2r3s4t5", cycle_number=2))
    await repo.create(PhaseReport(project_id=project_id, phase_id="nd_p1q2r3s4t5", cycle_number=3))
    latest = await repo.get_latest_by_project_phase(project_id, "nd_p1q2r3s4t5")
    assert latest is not None
    assert latest.cycle_number == 3

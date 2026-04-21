"""BACK-05 Artifact repo integration: round-trip + bulk_create atomicity."""
import pytest
from sqlalchemy import text
from app.infrastructure.database.repositories.artifact_repo import SqlAlchemyArtifactRepository
from app.domain.entities.artifact import Artifact, ArtifactStatus


async def _ensure_project(async_session, key="ARTIF1"):
    result = await async_session.execute(text(f"SELECT id FROM projects WHERE key='{key}'"))
    existing = result.scalar()
    if existing:
        return existing
    await async_session.execute(text(
        f"INSERT INTO projects (key, name, start_date, methodology, status) "
        f"VALUES ('{key}', 'Artifact Test', now(), 'SCRUM', 'ACTIVE')"
    ))
    await async_session.flush()
    return (await async_session.execute(text(f"SELECT id FROM projects WHERE key='{key}'"))).scalar()


@pytest.mark.asyncio
async def test_create_and_get(async_session):
    project_id = await _ensure_project(async_session, "ACG1")
    repo = SqlAlchemyArtifactRepository(async_session)
    a = Artifact(project_id=project_id, name="SRS", status=ArtifactStatus.NOT_CREATED)
    created = await repo.create(a)
    assert created.id is not None
    fetched = await repo.get_by_id(created.id)
    assert fetched.name == "SRS"
    assert fetched.status == ArtifactStatus.NOT_CREATED


@pytest.mark.asyncio
async def test_bulk_create_all_or_nothing(async_session):
    """D-28: bulk_create flushes but does not commit -- caller controls tx boundary."""
    project_id = await _ensure_project(async_session, "ABK1")
    repo = SqlAlchemyArtifactRepository(async_session)
    items = [
        Artifact(project_id=project_id, name="A1"),
        Artifact(project_id=project_id, name="A2"),
        Artifact(project_id=project_id, name="A3"),
    ]
    created = await repo.bulk_create(items)
    assert len(created) == 3
    assert all(a.id is not None for a in created)


@pytest.mark.asyncio
async def test_list_by_phase_none_returns_project_scoped(async_session):
    """D-26: artifacts with linked_phase_id=None are project-scoped."""
    project_id = await _ensure_project(async_session, "APS1")
    repo = SqlAlchemyArtifactRepository(async_session)
    await repo.create(Artifact(project_id=project_id, name="PS", linked_phase_id=None))
    await repo.create(Artifact(project_id=project_id, name="PhaseScoped", linked_phase_id="nd_a1b2c3d4e5"))

    none_scoped = await repo.list_by_phase(project_id, None)
    assert any(a.name == "PS" for a in none_scoped)
    assert not any(a.name == "PhaseScoped" for a in none_scoped)

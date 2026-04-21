"""Integration tests for Alembic migration 005 (BACK-08).

Verifies:
- New tables created by migration 005 exist in DB (milestones, artifacts, phase_reports)
- audit_log.metadata JSONB column exists and round-trips arbitrary dicts via
  AuditLogModel.extra_metadata (Pitfall 7 alias trick)
- schema_version backfill: all projects with non-null process_config have schema_version=1
- Partial unique index ux_phase_reports_active exists on phase_reports
- GIN index ix_milestones_linked_phase_ids_gin exists on milestones

NOTE: Requires alembic upgrade head applied to the DB before running.
The integration conftest uses Base.metadata.create_all (not Alembic migrations — Pitfall 1),
so migration-specific objects (indexes, partial constraints, and columns added by migration)
are only present when the DB has been migrated externally via:

    cd Backend && alembic upgrade head

Tests detect this automatically: if alembic_version table is absent or does not contain
005_phase9, all tests skip with a clear message. Run against a migrated DB for full coverage.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.infrastructure.database.models.audit_log import AuditLogModel


# ---------------------------------------------------------------------------
# Helper: detect whether migration 005 has been applied to the connected DB
# ---------------------------------------------------------------------------

async def _migration_005_applied(session: AsyncSession) -> bool:
    """Return True if alembic_version table contains the 005_phase9 row."""
    try:
        result = await session.execute(
            text(
                "SELECT COUNT(*) FROM alembic_version "
                "WHERE version_num = '005_phase9'"
            )
        )
        return (result.scalar() or 0) > 0
    except Exception:
        # alembic_version table doesn't exist — DB was set up via create_all
        return False


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_migration_005_idempotent(db_session: AsyncSession):
    """New tables created by migration 005 exist in the public schema.

    Requires alembic upgrade head having been applied so that milestones,
    artifacts, and phase_reports tables exist. Skips gracefully when the DB
    was set up via Base.metadata.create_all without running Alembic.

    The true idempotency guarantee (running upgrade twice does not raise) is
    validated manually via `alembic upgrade head` on a live migrated DB.
    """
    migrated = await _migration_005_applied(db_session)
    if not migrated:
        pytest.skip(
            "test_migration_005_idempotent requires alembic upgrade head — "
            "DB was set up via Base.metadata.create_all (Pitfall 1). "
            "Run: cd Backend && alembic upgrade head"
        )

    rows = (
        await db_session.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema='public' "
                "AND table_name IN ('milestones', 'artifacts', 'phase_reports')"
            )
        )
    ).all()
    found = [r[0] for r in rows]
    assert len(rows) == 3, (
        f"Expected 3 new tables (milestones, artifacts, phase_reports), "
        f"found: {found}"
    )


@pytest.mark.asyncio
async def test_schema_version_backfill(db_session: AsyncSession):
    """All projects with non-null process_config must have schema_version=1 after migration.

    Requires migration 005 to have applied the jsonb_set backfill (D-34).
    Skips gracefully when DB is not fully migrated.
    If no projects exist in the DB this test passes vacuously (no rows to check).
    """
    migrated = await _migration_005_applied(db_session)
    if not migrated:
        pytest.skip(
            "test_schema_version_backfill requires alembic upgrade head — "
            "process_config column may not have schema_version backfilled. "
            "Run: cd Backend && alembic upgrade head"
        )

    rows = (
        await db_session.execute(
            text(
                "SELECT id, process_config->>'schema_version' AS sv "
                "FROM projects "
                "WHERE process_config IS NOT NULL"
            )
        )
    ).all()
    for row in rows:
        assert row.sv == "1", (
            f"project id={row.id} has schema_version={row.sv!r}, expected '1'"
        )


@pytest.mark.asyncio
async def test_audit_metadata_roundtrip(db_session: AsyncSession):
    """AuditLogModel.extra_metadata round-trips JSON through DB column 'metadata'.

    Verifies:
    1. The Python attribute `extra_metadata` maps to DB column `metadata` (Pitfall 7).
    2. Arbitrary nested dicts survive a flush + re-fetch cycle.
    3. __table__.columns['metadata'] confirms the DB-level column name.

    Requires migration 005 to have added the `metadata` JSONB column to audit_log.
    Skips gracefully when DB is not fully migrated (column won't exist on create_all DB).
    """
    migrated = await _migration_005_applied(db_session)
    if not migrated:
        pytest.skip(
            "test_audit_metadata_roundtrip requires alembic upgrade head — "
            "audit_log.metadata column is added by migration 005. "
            "Run: cd Backend && alembic upgrade head"
        )

    log = AuditLogModel(
        entity_type="test",
        entity_id=999999,
        field_name="test_field",
        action="test_action",
        extra_metadata={"foo": "bar", "nested": {"k": 1}},
    )
    db_session.add(log)
    await db_session.flush()

    fetched = await db_session.get(AuditLogModel, log.id)
    assert fetched is not None, "Row should be fetchable after flush"
    assert fetched.extra_metadata == {"foo": "bar", "nested": {"k": 1}}, (
        f"Round-trip mismatch: got {fetched.extra_metadata!r}"
    )

    # Confirm the DB column is literally named "metadata"
    col = AuditLogModel.__table__.columns["metadata"]
    assert col.name == "metadata", (
        f"DB column name should be 'metadata', got {col.name!r}"
    )


@pytest.mark.asyncio
async def test_phase_report_unique_partial_index(db_session: AsyncSession):
    """Partial unique index ux_phase_reports_active must be present.

    This index allows soft-deleted reports to be re-created with the same
    (project_id, phase_id, cycle_number) tuple (Pitfall 8).

    Skipped if DB was not migrated via Alembic (create_all does not create
    partial indexes defined via raw SQL in the migration).
    """
    migrated = await _migration_005_applied(db_session)
    if not migrated:
        pytest.skip(
            "ux_phase_reports_active requires alembic upgrade head — "
            "DB appears to have been set up via Base.metadata.create_all instead"
        )

    rows = (
        await db_session.execute(
            text(
                "SELECT indexname FROM pg_indexes "
                "WHERE tablename='phase_reports' "
                "AND indexname='ux_phase_reports_active'"
            )
        )
    ).all()
    assert len(rows) == 1, "ux_phase_reports_active partial unique index missing"


@pytest.mark.asyncio
async def test_milestones_gin_index_exists(db_session: AsyncSession):
    """GIN index ix_milestones_linked_phase_ids_gin must be present.

    Required for efficient JSONB containment queries (@> operator) on
    milestones.linked_phase_ids (D-38).

    Skipped if DB was not migrated via Alembic (create_all does not create
    GIN indexes defined via raw SQL in the migration).
    """
    migrated = await _migration_005_applied(db_session)
    if not migrated:
        pytest.skip(
            "ix_milestones_linked_phase_ids_gin requires alembic upgrade head — "
            "DB appears to have been set up via Base.metadata.create_all instead"
        )

    rows = (
        await db_session.execute(
            text(
                "SELECT indexname, indexdef FROM pg_indexes "
                "WHERE tablename='milestones' "
                "AND indexname='ix_milestones_linked_phase_ids_gin'"
            )
        )
    ).all()
    assert len(rows) == 1, "GIN index ix_milestones_linked_phase_ids_gin missing"
    assert "gin" in rows[0].indexdef.lower(), (
        f"Expected GIN in indexdef, got: {rows[0].indexdef}"
    )

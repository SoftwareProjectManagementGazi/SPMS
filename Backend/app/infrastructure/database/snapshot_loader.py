"""Discrete-event simulator snapshot loader.

The simulator (app.dev.simulator) replays 90 days of activity and exports a
gzipped pg_dump --inserts file under ``Backend/fixtures/``. On a fresh DB
(empty ``audit_log``) the lifespan seed hook calls into this module to
restore that snapshot — turning a multi-minute seed into a few-second
COPY of pre-baked rows with realistic timestamps.

Idempotency:
  - Called by ``seed_data`` only when ``audit_log`` is empty AND the
    snapshot file exists. Already-seeded DBs skip the load entirely.
  - Before applying, every non-system data table is TRUNCATEd so any
    rows seeded by alembic (notably migration 012's Guest role insert)
    are cleared and the snapshot's hard-coded PKs never collide with
    them. ``alembic_version`` and ``system_config`` are preserved so we
    don't lose the migration history or admin-tuned config.

Failure modes:
  - File missing → return False, caller falls back to legacy seed.
  - Decompression error → log + return False (same fallback).
  - SQL execution error → bubble up — a partial snapshot load would be
    worse than a hard fail.
"""

from __future__ import annotations

import gzip
import logging
import re
from pathlib import Path

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.audit_log import AuditLogModel


logger = logging.getLogger(__name__)


# Path is relative to the Backend/ directory (where uvicorn runs).
_SNAPSHOT_PATH = Path(__file__).resolve().parents[3] / "fixtures" / "simulated_quarter.sql.gz"


# Mirrors app/dev/simulator/bootstrap.py — never wipe the migration ledger or
# admin-tuned runtime config when restoring a snapshot.
_KEEP_TABLES = {"alembic_version", "system_config"}


# Tables we expect the snapshot to populate. If any of these are missing
# from the live schema, the snapshot was generated against a newer/older
# schema than what alembic has applied — bail with a clear message instead
# of letting INSERTs fail mid-stream.
_REQUIRED_SNAPSHOT_TABLES = (
    "roles", "users", "projects", "board_columns",
    "tasks", "audit_log",
)


# Match `INSERT INTO public.<table> (`. We only enumerate target tables;
# parsing the full payload is overkill for our pre-flight check.
_INSERT_TARGET_RE = re.compile(
    r"INSERT\s+INTO\s+public\.([A-Za-z_][A-Za-z0-9_]*)\s*\(",
    re.IGNORECASE,
)


async def _audit_log_empty(session: AsyncSession) -> bool:
    count = await session.scalar(select(func.count()).select_from(AuditLogModel))
    return (count or 0) == 0


async def _existing_public_tables(session: AsyncSession) -> set[str]:
    res = await session.execute(
        text("SELECT tablename FROM pg_tables WHERE schemaname='public'")
    )
    return {row[0] for row in res.fetchall()}


def _snapshot_target_tables(sql: str) -> set[str]:
    """Return the distinct table names the snapshot wants to INSERT into."""
    return {m.group(1) for m in _INSERT_TARGET_RE.finditer(sql)}


async def _truncate_data_tables(session: AsyncSession) -> int:
    """CASCADE TRUNCATE every public table except the keep-list.

    Returns the number of tables wiped (for logging). Sequences are reset
    to 1 with ``RESTART IDENTITY`` so the snapshot's hard-coded PKs
    (id=1, 2, 3, …) don't collide with alembic-seeded rows (e.g. migration
    012's Guest role insert that lands at id=1 on a fresh roles table).
    """
    res = await session.execute(
        text("SELECT tablename FROM pg_tables WHERE schemaname='public'")
    )
    tables = [row[0] for row in res.fetchall() if row[0] not in _KEEP_TABLES]
    if not tables:
        return 0
    await session.execute(
        text("TRUNCATE TABLE " + ", ".join(tables) + " RESTART IDENTITY CASCADE")
    )
    await session.commit()
    return len(tables)


async def maybe_load_snapshot(session: AsyncSession) -> bool:
    """Load the simulator snapshot if conditions match.

    Returns True iff a snapshot was actually applied. ``seed_data`` should
    short-circuit the legacy seed path on True.
    """
    if not _SNAPSHOT_PATH.exists():
        logger.info(f"SNAPSHOT: no fixture at {_SNAPSHOT_PATH} — falling back to legacy seed")
        return False

    if not await _audit_log_empty(session):
        # DB already has activity — don't clobber.
        return False

    logger.info(f"SNAPSHOT: loading {_SNAPSHOT_PATH.name} ({_SNAPSHOT_PATH.stat().st_size // 1024} KB compressed)")

    try:
        with gzip.open(_SNAPSHOT_PATH, "rt", encoding="utf-8") as fh:
            raw_sql = fh.read()
    except OSError as exc:
        logger.error(f"SNAPSHOT: decompression failed — {exc}")
        return False

    # Strip psql-only meta commands so asyncpg can parse the remainder.
    # pg_dump emits a few client-only directives we must drop:
    #   - ``\restrict TOKEN`` / ``\unrestrict TOKEN`` at file boundaries
    #   - ``SELECT pg_catalog.set_config('search_path', '', false)`` —
    #     pg_dump zeroes search_path so the dump is namespace-safe, but
    #     when we replay through asyncpg the subsequent ALTER TABLE /
    #     INSERT statements (despite being schema-qualified) fail
    #     resolution because the connection lands on an empty schema set.
    skip_substr_markers = (
        "set_config('search_path'",
    )
    cleaned_lines: list[str] = []
    for line in raw_sql.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("\\"):
            continue
        if any(marker in line for marker in skip_substr_markers):
            continue
        cleaned_lines.append(line)
    sql = "\n".join(cleaned_lines)

    # Pre-flight: every table the snapshot wants to write must exist in
    # the live schema. If anything is missing the snapshot was generated
    # against a different alembic head — bail with a clear message
    # instead of dropping into the SQL load and dying mid-stream with a
    # confusing asyncpg error.
    live_tables = await _existing_public_tables(session)
    target_tables = _snapshot_target_tables(sql)
    missing_required = [
        t for t in _REQUIRED_SNAPSHOT_TABLES if t not in live_tables
    ]
    if missing_required:
        logger.error(
            f"SNAPSHOT: required tables missing from live schema "
            f"({missing_required!r}) — run `alembic upgrade head` first. "
            f"Falling back to legacy seed."
        )
        return False
    snapshot_only = sorted(target_tables - live_tables)
    if snapshot_only:
        logger.error(
            f"SNAPSHOT: targets tables that don't exist in live schema "
            f"({snapshot_only!r}) — the fixture is from a different "
            f"alembic head than the live DB. Falling back to legacy seed."
        )
        return False

    # Clear any alembic-seeded rows (migration 012 inserts Guest into a
    # fresh roles table, taking id=1 — which then collides with the
    # snapshot's INSERT roles (1, 'Admin', …)). The simulator's bootstrap
    # already does the same TRUNCATE before reseeding, so doing it here
    # keeps the two paths symmetric and the loader robust to any prior
    # alembic-side data seeds.
    wiped = await _truncate_data_tables(session)
    logger.info(f"SNAPSHOT: truncated {wiped} data tables before restore")

    # Drive the native asyncpg connection so we get the simple query
    # protocol (multi-statement, no prepared-statement cache poisoning).
    raw_conn = await session.connection()
    underlying = await raw_conn.get_raw_connection()
    asyncpg_conn = underlying.driver_connection
    # Force search_path to public before executing — overrides any leftover
    # state from previous queries in this connection.
    await asyncpg_conn.execute("SET search_path = public, pg_catalog;")
    await asyncpg_conn.execute(sql)
    await session.commit()

    count = await session.scalar(select(func.count()).select_from(AuditLogModel))
    logger.info(f"SNAPSHOT: applied — audit_log now has {count} rows")
    return True

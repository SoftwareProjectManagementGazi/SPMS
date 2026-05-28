"""Discrete-event simulator snapshot loader.

The simulator (app.dev.simulator) replays 90 days of activity and exports a
gzipped pg_dump --inserts file under ``Backend/fixtures/``. On a fresh DB
(empty ``audit_log``) the lifespan seed hook calls into this module to
restore that snapshot — turning a multi-minute seed into a few-second
COPY of pre-baked rows with realistic timestamps.

Idempotency:
  - Called by ``seed_data`` only when ``audit_log`` is empty AND the
    snapshot file exists. Already-seeded DBs skip the load entirely.
  - The snapshot is data-only and excludes ``alembic_version`` and
    ``system_config`` so it never conflicts with migration history or
    admin-tuned config.

Failure modes:
  - File missing → return False, caller falls back to legacy seed.
  - Decompression error → log + return False (same fallback).
  - SQL execution error → bubble up — a partial snapshot load would be
    worse than a hard fail.
"""

from __future__ import annotations

import gzip
import logging
import os
from pathlib import Path

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.audit_log import AuditLogModel


logger = logging.getLogger(__name__)


# Path is relative to the Backend/ directory (where uvicorn runs).
_SNAPSHOT_PATH = Path(__file__).resolve().parents[3] / "fixtures" / "simulated_quarter.sql.gz"


async def _audit_log_empty(session: AsyncSession) -> bool:
    count = await session.scalar(select(func.count()).select_from(AuditLogModel))
    return (count or 0) == 0


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

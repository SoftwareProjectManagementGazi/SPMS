"""Fail-fast check that the DB schema is at the latest alembic head.

Why
---
Lifespan boot used to silently start the app even when ``alembic upgrade
head`` had been forgotten. Endpoints that depended on the latest schema
(new columns, new tables) returned cryptic 500s long after startup with
no obvious connection to the missed migration. This module surfaces the
problem at boot time with a clear message.

Behaviour
---------
* Reads the expected head from ``alembic/versions/`` (the file with the
  highest numeric prefix — we follow a linear ``001..NNN`` chain).
* Reads ``alembic_version.version_num`` from the DB.
* In production-like environments (``settings.ENV == "production"``) a
  mismatch raises ``RuntimeError`` and aborts startup.
* In other environments (dev, test) the mismatch logs a WARN-level
  message but allows startup to continue, so test harnesses using
  ``Base.metadata.create_all`` (which never write ``alembic_version``)
  keep working without ceremony.
* If the ``alembic_version`` table doesn't exist at all, we treat that
  identically to "behind" — production aborts, dev warns.
"""
from __future__ import annotations

import logging
import re
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


logger = logging.getLogger(__name__)


_VERSIONS_DIR = Path(__file__).resolve().parents[3] / "alembic" / "versions"
_NUMERIC_PREFIX_RE = re.compile(r"^(\d+)_")


def _expected_head_revision() -> str | None:
    """Return the revision id of the file with the highest numeric prefix.

    Linear-history projects (this one) always have a single max-numbered
    file that IS the head. Returns None if the versions directory is
    missing or empty — caller treats that as "no expectation".
    """
    if not _VERSIONS_DIR.is_dir():
        return None
    candidates: list[tuple[int, Path]] = []
    for f in _VERSIONS_DIR.iterdir():
        if not f.is_file() or f.suffix != ".py":
            continue
        m = _NUMERIC_PREFIX_RE.match(f.name)
        if not m:
            continue
        candidates.append((int(m.group(1)), f))
    if not candidates:
        return None
    candidates.sort()
    latest = candidates[-1][1]
    # Extract the literal `revision = "..."` line.
    for line in latest.read_text(encoding="utf-8").splitlines():
        m = re.match(r'^\s*revision\s*=\s*[\'"]([^\'"]+)[\'"]', line)
        if m:
            return m.group(1)
    return None


async def _current_db_revision(engine: AsyncEngine) -> str | None:
    """Return ``alembic_version.version_num`` or None if the table is
    missing. The table is created by alembic itself, so its absence is
    the unmistakable signal "alembic never ran on this DB"."""
    async with engine.begin() as conn:
        res = await conn.execute(
            text("SELECT to_regclass('public.alembic_version') IS NOT NULL")
        )
        if not res.scalar():
            return None
        res = await conn.execute(
            text("SELECT version_num FROM alembic_version LIMIT 1")
        )
        row = res.fetchone()
        return row[0] if row else None


async def assert_schema_at_head(engine: AsyncEngine, *, strict: bool) -> None:
    """Verify that the DB's alembic head matches the latest revision file.

    Pass ``strict=True`` to raise on mismatch (production); otherwise the
    function only logs a warning. Either way, when both values are
    available and equal, a single INFO line records the head — that's
    the only output you'll see in the steady-state case.
    """
    expected = _expected_head_revision()
    if expected is None:
        logger.warning("ALEMBIC_CHECK: no version files found — skipping check")
        return

    current = await _current_db_revision(engine)
    if current == expected:
        logger.info(f"ALEMBIC_CHECK: DB at expected head {expected}")
        return

    if current is None:
        msg = (
            f"ALEMBIC_CHECK: alembic_version table missing — DB has not been "
            f"migrated. Run `alembic upgrade head` (latest = {expected})."
        )
    else:
        msg = (
            f"ALEMBIC_CHECK: DB is at revision {current!r} but the codebase "
            f"expects {expected!r}. Run `alembic upgrade head` before booting."
        )

    if strict:
        raise RuntimeError(msg)
    logger.warning(msg)

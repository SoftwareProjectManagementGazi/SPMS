"""Shared helper to resolve "done" column IDs for a project.

Phase 17 added ``BoardColumn.category`` as the canonical way to mark a column
as done / in-progress / todo. Pre-Phase-17 projects (and any project where
the user hasn't yet flipped categories in the workflow editor) still rely on
name matching (``ILIKE '%done%'``) for backwards compatibility.

This helper centralises the lookup so every report/chart query uses the SAME
fallback ladder:
    1. Primary: ``BoardColumn.category == 'done'``
    2. Fallback: ``ILIKE '%done%'`` against the column name

When the fallback path fires we emit a WARN log + increment a Prometheus
counter so operators can see when projects need their categories backfilled.
Once the fallback rate drops to zero we can flip a feature flag to disable
the legacy path entirely.

DIP note: this is INFRASTRUCTURE — application/domain layers MUST NOT import
from here. The single caller site is repository code.
"""
from __future__ import annotations

import logging
from typing import List, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.board_column import BoardColumnModel

logger = logging.getLogger(__name__)

# Best-effort Prometheus counter. Wrapped in try/except so the helper still
# works when prometheus_client is not installed (unit tests / FastAPI dev).
try:
    from prometheus_client import Counter  # type: ignore

    DONE_COLUMN_FALLBACK_COUNTER = Counter(
        "done_column_fallback_total",
        "Number of times the chart/report queries had to fall back to "
        "ILIKE '%done%' instead of BoardColumn.category='done'. Drops to "
        "zero once every project has its column categories backfilled.",
        labelnames=("project_id",),
    )
except Exception:  # pragma: no cover - prometheus is optional in tests
    DONE_COLUMN_FALLBACK_COUNTER = None


async def resolve_done_column_ids(
    session: AsyncSession,
    project_id: int,
) -> Tuple[List[int], bool]:
    """Return (done_column_ids, used_fallback).

    Primary lookup: ``BoardColumn.category == 'done'``. Returns immediately if
    any rows match.

    Fallback: ``LOWER(name) LIKE '%done%'``. When this path fires we log a
    WARN and bump the Prometheus counter so operators can act.
    """
    primary = select(BoardColumnModel.id).where(
        BoardColumnModel.project_id == project_id,
        BoardColumnModel.category == "done",
    )
    rows = (await session.execute(primary)).scalars().all()
    if rows:
        return list(rows), False

    # Fallback path — log + counter so the team knows when a project lacks
    # the category backfill.
    logger.warning(
        "done_column_category_fallback project_id=%s — falling back to ILIKE",
        project_id,
    )
    if DONE_COLUMN_FALLBACK_COUNTER is not None:
        try:
            DONE_COLUMN_FALLBACK_COUNTER.labels(project_id=str(project_id)).inc()
        except Exception:  # pragma: no cover
            pass

    fallback = select(BoardColumnModel.id).where(
        BoardColumnModel.project_id == project_id,
        func.lower(BoardColumnModel.name).like("%done%"),
    )
    rows = (await session.execute(fallback)).scalars().all()
    return list(rows), True

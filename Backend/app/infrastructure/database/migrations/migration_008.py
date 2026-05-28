"""Migration 008: Backfill board_columns.category / is_initial / is_terminal
/ entry_policy / exit_policy from the canonical _default_columns.py spec.

Context
-------
seed_scrum_details / seed_kanban_details / seed_waterfall_details and
_seed_project_board (extended) previously created BoardColumnModel rows
with only ``name`` + ``order_index`` set — the engine-aware fields
(``category``, ``is_initial``, ``is_terminal``, ``entry_policy``,
``exit_policy``) defaulted at the model level, so every column landed as
category="todo" with both flags False.

Effect: the rapor endpoints (CFD / lead-time / burndown) bucket every
task into ``todo`` and the ``done`` bucket reads zero — even after the
simulator drives thousands of "moved to Done" audit rows.

Strategy
--------
1. Spec-match by methodology + column name: pull the canonical spec from
   _default_columns.SCRUM/KANBAN/WATERFALL/ITERATIVE_DEFAULT_COLUMNS and
   stamp the engine fields onto every matching row.
2. Positional fallback for rows that don't match a canonical name
   (custom templates like V-Modeli or PRINCE2 may have their own
   workflow): first column → todo+is_initial; last → done+is_terminal;
   everything else → in_progress.

Idempotent: re-running matches the same rows to the same spec values, so
nothing changes on a second pass.
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from app.infrastructure.database._default_columns import (
    ITERATIVE_DEFAULT_COLUMNS,
    KANBAN_DEFAULT_COLUMNS,
    SCRUM_DEFAULT_COLUMNS,
    WATERFALL_DEFAULT_COLUMNS,
)
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.project import ProjectModel


logger = logging.getLogger(__name__)


_SPEC_BY_METHODOLOGY = {
    "SCRUM": SCRUM_DEFAULT_COLUMNS,
    "KANBAN": KANBAN_DEFAULT_COLUMNS,
    "WATERFALL": WATERFALL_DEFAULT_COLUMNS,
    "ITERATIVE": ITERATIVE_DEFAULT_COLUMNS,
}


def _positional_spec(order_index: int, total: int) -> dict:
    """Best-effort fallback for columns whose name doesn't appear in any
    canonical spec — first column is todo+initial, last is done+terminal,
    everything in between is in_progress."""
    is_first = order_index == 0
    is_last = order_index == total - 1
    if is_first:
        category = "todo"
    elif is_last:
        category = "done"
    else:
        category = "in_progress"
    return {
        "category": category,
        "is_initial": is_first,
        "is_terminal": is_last,
        "entry_policy": "any",
        "exit_policy": "terminal_lock" if is_last else "any",
    }


async def upgrade(engine: AsyncEngine) -> None:
    async with AsyncSession(engine) as session:
        result = await session.execute(
            select(ProjectModel).where(ProjectModel.is_deleted == False)  # noqa: E712
        )
        projects = result.scalars().all()
        if not projects:
            return

        updated_total = 0
        for project in projects:
            methodology = (
                project.methodology.value
                if hasattr(project.methodology, "value")
                else str(project.methodology)
            )
            spec_list = _SPEC_BY_METHODOLOGY.get(methodology, [])
            spec_by_name = {s["name"]: s for s in spec_list}

            cols_result = await session.execute(
                select(BoardColumnModel)
                .where(BoardColumnModel.project_id == project.id)
                .order_by(BoardColumnModel.order_index)
            )
            cols = list(cols_result.scalars().all())
            total = len(cols)

            for col in cols:
                spec = spec_by_name.get(col.name)
                if spec is None:
                    spec = _positional_spec(col.order_index, total)
                col.category = spec.get("category")
                col.is_initial = bool(spec.get("is_initial", False))
                col.is_terminal = bool(spec.get("is_terminal", False))
                # entry/exit policy already had a column default; only
                # overwrite if the spec carries one explicitly.
                if spec.get("entry_policy"):
                    col.entry_policy = spec["entry_policy"]
                if spec.get("exit_policy"):
                    col.exit_policy = spec["exit_policy"]
                updated_total += 1

        await session.commit()
        logger.info(
            f"MIGRATION 008: backfilled engine fields on {updated_total} board_columns rows"
        )

"""Wave 2 W2-C9 — single-source default column shapes per methodology.

This module owns the engine-aware default column lists that:

  * Alembic migration 014 backfills into existing
    ``process_templates.default_columns`` rows.
  * The seeder writes onto fresh ``ProcessTemplateModel`` inserts.
  * W2-C10's ``CreateProjectUseCase`` will read at project creation time
    to seed ``board_columns`` with full engine fields rather than the
    legacy 5-column hard-coded list in ``SeedDefaultColumnsUseCase``.

Each entry mirrors the ``BoardColumnModel`` workflow-engine fields added
in migration 013 (Wave 1 W1-C4):

  * ``category``           — ``todo`` / ``in_progress`` / ``done``
  * ``is_initial``         — board can start here (replaces order_index==min)
  * ``is_terminal``        — column is a 'done' state (replaces order_index==max)
  * ``max_duration_days``  — staleness threshold; ``None`` = unbounded
  * ``entry_policy``       — ``any`` / ``edges_only`` / ``initial_only``
  * ``exit_policy``        — ``any`` / ``edges_only`` / ``terminal_lock``

Shape per item is a plain ``dict`` (JSON-serializable) so it round-trips
unchanged through JSONB on Postgres.

Keeping the lists in one module avoids the drift that would otherwise
happen between the alembic backfill SQL and the seeder Python — both
import from here so the data is single-source.
"""
from __future__ import annotations

from typing import Any, Dict, List


# ----------------------------------------------------------------------------
# Scrum — 5 columns; classic flow with explicit Code Review lane.
# ----------------------------------------------------------------------------
SCRUM_DEFAULT_COLUMNS: List[Dict[str, Any]] = [
    {
        "name": "Backlog", "order_index": 0, "wip_limit": 0,
        "category": "todo", "is_initial": True, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "To Do", "order_index": 1, "wip_limit": 0,
        "category": "todo", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "In Progress", "order_index": 2, "wip_limit": 0,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Code Review", "order_index": 3, "wip_limit": 0,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Done", "order_index": 4, "wip_limit": 0,
        "category": "done", "is_initial": False, "is_terminal": True,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "terminal_lock",
    },
]


# ----------------------------------------------------------------------------
# Kanban — 5 columns; WIP limits on the in_progress lanes.
# ----------------------------------------------------------------------------
KANBAN_DEFAULT_COLUMNS: List[Dict[str, Any]] = [
    {
        "name": "To Do", "order_index": 0, "wip_limit": 0,
        "category": "todo", "is_initial": True, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Analiz", "order_index": 1, "wip_limit": 3,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Geliştirme", "order_index": 2, "wip_limit": 4,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Test", "order_index": 3, "wip_limit": 2,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Done", "order_index": 4, "wip_limit": 0,
        "category": "done", "is_initial": False, "is_terminal": True,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "terminal_lock",
    },
]


# ----------------------------------------------------------------------------
# Waterfall — 6 columns; sequential, edges_only entry/exit on intermediate.
# ----------------------------------------------------------------------------
WATERFALL_DEFAULT_COLUMNS: List[Dict[str, Any]] = [
    {
        "name": "Gereksinim", "order_index": 0, "wip_limit": 0,
        "category": "todo", "is_initial": True, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "edges_only",
    },
    {
        "name": "Analiz", "order_index": 1, "wip_limit": 0,
        "category": "todo", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "edges_only", "exit_policy": "edges_only",
    },
    {
        "name": "Tasarım", "order_index": 2, "wip_limit": 0,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "edges_only", "exit_policy": "edges_only",
    },
    {
        "name": "Uygulama", "order_index": 3, "wip_limit": 0,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "edges_only", "exit_policy": "edges_only",
    },
    {
        "name": "Test", "order_index": 4, "wip_limit": 0,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "edges_only", "exit_policy": "edges_only",
    },
    {
        "name": "Bakım", "order_index": 5, "wip_limit": 0,
        "category": "done", "is_initial": False, "is_terminal": True,
        "max_duration_days": None,
        "entry_policy": "edges_only", "exit_policy": "terminal_lock",
    },
]


# ----------------------------------------------------------------------------
# Iterative — 4 columns; flexible loop with feedback to Plan.
# Used by templates whose name maps to ITERATIVE methodology; not seeded by
# migration 014 (no "Iterative" built-in row), but exposed for completeness
# so W2-C10 / extended seeder can reuse the same shape.
# ----------------------------------------------------------------------------
ITERATIVE_DEFAULT_COLUMNS: List[Dict[str, Any]] = [
    {
        "name": "Plan", "order_index": 0, "wip_limit": 0,
        "category": "todo", "is_initial": True, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Develop", "order_index": 1, "wip_limit": 0,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Review", "order_index": 2, "wip_limit": 0,
        "category": "in_progress", "is_initial": False, "is_terminal": False,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "any",
    },
    {
        "name": "Deploy", "order_index": 3, "wip_limit": 0,
        "category": "done", "is_initial": False, "is_terminal": True,
        "max_duration_days": None,
        "entry_policy": "any", "exit_policy": "terminal_lock",
    },
]


# Convenience map for callers wanting to dispatch by methodology/name.
# Keys are lowercase template names — matches seeder lookup convention.
DEFAULT_COLUMNS_BY_TEMPLATE_NAME: Dict[str, List[Dict[str, Any]]] = {
    "scrum": SCRUM_DEFAULT_COLUMNS,
    "kanban": KANBAN_DEFAULT_COLUMNS,
    "waterfall": WATERFALL_DEFAULT_COLUMNS,
    "iterative": ITERATIVE_DEFAULT_COLUMNS,
}

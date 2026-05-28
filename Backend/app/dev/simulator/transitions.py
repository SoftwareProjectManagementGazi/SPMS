"""Task lifecycle state machines per methodology.

Each methodology owns a canonical column path. The simulator uses these to
decide where a freshly-created task starts and which neighbouring columns
the ``transition_task`` event can pick. ~10% of transitions inject an edge
case (rework back to a prior column, sudden abandonment, etc.) so the
audit_log includes realistic non-linear flow that CFD / lead-time charts
have to handle.
"""

from __future__ import annotations

import random
from typing import Dict, List, Optional


# Canonical paths. Names match the columns seed_X_details creates so the
# mapper can look them up by name within a project's column set.
SCRUM_PATH = ["Backlog", "To Do", "In Progress", "Code Review", "Done"]
KANBAN_PATH = ["To Do", "Analiz", "Geliştirme", "Test", "Done"]
KANBAN_PATH_ALT = ["Backlog", "Analiz", "Geliştirme", "Test", "Done"]  # extended seeder uses Backlog start
WATERFALL_PATH = ["Gereksinim", "Analiz", "Tasarım", "Uygulama", "Test", "Bakım"]
ITERATIVE_PATH = ["Planlama", "Tasarım", "Uygulama", "Test", "Done"]


_PATHS_BY_METHOD: Dict[str, List[List[str]]] = {
    "SCRUM": [SCRUM_PATH],
    "KANBAN": [KANBAN_PATH, KANBAN_PATH_ALT],
    "WATERFALL": [WATERFALL_PATH],
    "ITERATIVE": [ITERATIVE_PATH],
}


# Edge-case probability — how often a transition picks a non-canonical move
# (rework / rollback / cancellation). Kept globally tunable so the user can
# dial it up or down without touching simulator internals.
EDGE_CASE_RATE = 0.10


def find_path_for_columns(methodology: str, column_names: List[str]) -> List[str]:
    """Pick the canonical path whose elements appear in ``column_names``.

    Projects from the extended seeder (V-Modeli, PRINCE2, …) may not match
    any canonical path verbatim — in that case we return the ordered list
    of actual column names so transitions still happen left-to-right.
    """
    candidates = _PATHS_BY_METHOD.get(methodology.upper(), [])
    name_set = set(column_names)
    for path in candidates:
        if set(path).issubset(name_set):
            # Only keep columns the project actually has, preserving order.
            return [c for c in path if c in name_set]
    # Fallback: the project's columns as-is.
    return list(column_names)


def initial_column(path: List[str]) -> str:
    """First column on the path — where new tasks land."""
    return path[0] if path else ""


def is_terminal(column_name: str, path: List[str]) -> bool:
    """True if ``column_name`` is the rightmost column on ``path``."""
    return bool(path) and column_name == path[-1]


def next_step(
    current: str,
    path: List[str],
    rng: random.Random,
) -> Optional[str]:
    """Pick the next column the task should move to.

    Default path is left-to-right by one step. With probability
    ``EDGE_CASE_RATE`` we inject one of three edge cases:

    - **rework** (~50%): step backwards by one column (e.g. Code Review →
      In Progress). Reflects "QA bounced the change" or "rework needed".
    - **skip-ahead** (~30%): skip by two columns (e.g. To Do → Code
      Review). Reflects "trivial fix, no review needed".
    - **abandon** (~20%): jump straight to the terminal column without
      doing the intermediate work. Reflects "task closed / cancelled".

    Returns None when the task is already terminal — caller should pick
    a different task to act on.
    """
    if not path or current not in path:
        return path[0] if path else None
    idx = path.index(current)
    # Already at the terminal column — no forward move possible.
    if idx == len(path) - 1:
        return None

    # Edge case branch.
    if rng.random() < EDGE_CASE_RATE:
        edge = rng.random()
        if edge < 0.5 and idx > 0:
            return path[idx - 1]  # rework
        if edge < 0.8 and idx + 2 < len(path):
            return path[idx + 2]  # skip-ahead
        return path[-1]  # abandon → straight to terminal

    return path[idx + 1]


# Methodology-aware dwell time (in hours) — used by the run loop to decide
# when a task is "ripe" for transitioning. Fast methodologies (Kanban) move
# in hours; slower ones (Waterfall) dwell for days.
_DWELL_HOURS: Dict[str, tuple[int, int]] = {
    "SCRUM": (24, 96),       # 1-4 days per column on average
    "KANBAN": (8, 72),       # 0.3-3 days per column (continuous flow)
    "WATERFALL": (48, 240),  # 2-10 days per phase (heavyweight)
    "ITERATIVE": (24, 120),
}


def dwell_hours(methodology: str, rng: random.Random) -> int:
    low, high = _DWELL_HOURS.get(methodology.upper(), _DWELL_HOURS["SCRUM"])
    return rng.randint(low, high)

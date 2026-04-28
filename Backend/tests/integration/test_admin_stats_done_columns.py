"""Phase 14 Plan 14-18 (Cluster F UAT Test 31) — done-column whitelist tests.

The /admin/projects table renders a per-project progress bar derived from
project_repo.task_counts_by_project_ids — which counts a task as "done"
when its board column name (case-insensitive) matches the DONE_COLUMN_NAMES
whitelist. UAT Test 31 caught variants like "Bitti ✓", "Released",
"Yayınlandı" reporting 0% completion because their column name was outside
the original 7-name set.

Plan 14-18 expanded the whitelist + hoisted it to a module-level constant
so this test can import it directly and assert the membership contract
without a full DB seed.

If this test fails AFTER Plan 14-18 lands, it most likely means a future
contributor narrowed the whitelist (regression). The right fix is to add
the missing name back to DONE_COLUMN_NAMES rather than relax the test.

Option B (terminal-column flag column on board_columns) is documented as a
v2.1 candidate in 14-18-SUMMARY.md — when that ships this whitelist
becomes a fallback for projects predating the migration.
"""
from __future__ import annotations

import pytest

from app.infrastructure.database.repositories.project_repo import (
    DONE_COLUMN_NAMES,
)


# ---------------------------------------------------------------------------
# Membership contract — names that MUST be in the whitelist
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "name",
    [
        # Original 7-name set — backward compat.
        "done",
        "completed",
        "closed",
        "tamamlandı",
        "tamamlandi",
        "bitti",
        "bitirildi",
        # Plan 14-18 additions — UAT Test 31 variants.
        "tamam",
        "bitti ✓",
        "released",
        "shipped",
        "yayınlandı",
        "resolved",
    ],
)
def test_done_column_name_is_in_whitelist(name: str) -> None:
    """Every common terminal-state column name MUST be in DONE_COLUMN_NAMES."""
    assert name in DONE_COLUMN_NAMES, (
        f"'{name}' is missing from DONE_COLUMN_NAMES — projects whose "
        f"terminal column is named '{name}' would report 0% completion."
    )


# ---------------------------------------------------------------------------
# Negative contract — names that should NOT match (in-progress columns)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "name",
    [
        "todo",
        "yapılacak",
        "yapilacak",
        "in progress",
        "yapılıyor",
        "yapiliyor",
        "review",
        "incelemede",
        "blocked",
        "in review",
    ],
)
def test_in_progress_column_name_is_NOT_in_whitelist(name: str) -> None:
    """Mid-flow columns MUST stay outside the done-whitelist so they don't
    inflate the progress bar."""
    assert name not in DONE_COLUMN_NAMES, (
        f"'{name}' is unexpectedly in DONE_COLUMN_NAMES — would over-count "
        f"completion for any project using this as a column name."
    )


# ---------------------------------------------------------------------------
# Shape contract — defensive
# ---------------------------------------------------------------------------


def test_done_column_names_is_a_tuple_of_strings() -> None:
    """The whitelist is consumed inside an SQL .in_() clause; SQLAlchemy
    accepts any iterable but a tuple of str is the canonical shape we
    document at module level."""
    assert isinstance(DONE_COLUMN_NAMES, tuple)
    assert all(isinstance(name, str) for name in DONE_COLUMN_NAMES)


def test_done_column_names_lowercase_only() -> None:
    """The SQL clause uses lower(board_columns.name).in_(DONE_COLUMN_NAMES)
    so the whitelist itself MUST contain only lowercase strings — any
    uppercase entry would silently never match."""
    for name in DONE_COLUMN_NAMES:
        assert name == name.lower(), (
            f"DONE_COLUMN_NAMES entry '{name}' is not lowercase. The SQL "
            f"clause lower(...).in_(DONE_COLUMN_NAMES) would never match it."
        )


def test_done_column_names_no_duplicates() -> None:
    """Defensive — duplicates are harmless to the SQL but signal a likely
    typo or merge accident."""
    names_list = list(DONE_COLUMN_NAMES)
    assert len(names_list) == len(set(names_list)), (
        "DONE_COLUMN_NAMES contains duplicate entries: "
        f"{[n for n in names_list if names_list.count(n) > 1]}"
    )

"""Phase 14 Plan 14-16 Task 1 — entity_label cross-table resolver tests.

Exercises the Plan 14-16 (Cluster D, Path B) `_resolve_entity_label` helper
that replaced the hardcoded `entity_label: None` at the get_global_audit row
builder. Path is LOCKED to Path B (5-column AuditTable, IP column dropped per
user_decision_locked 2026-04-28). These tests do NOT exercise the IP column
— it is intentionally absent from the DTO + serialization contract.

Four contract guarantees:

1. test_entity_label_resolves_project_name
   extra_metadata.project_name → entity_label == "Foo".

2. test_entity_label_resolves_task_title_taking_precedence_over_id_fallback
   extra_metadata.task_title="Login crash" + entity_type/entity_id present →
   the metadata-driven value wins over the f"TASK-42" legacy fallback.

3. test_entity_label_legacy_fallback_when_no_metadata
   extra_metadata=None + entity_type='task' + entity_id=42 → "TASK-42".

4. test_entity_label_comment_excerpt_yields_yorum_prefix
   extra_metadata.comment_excerpt → entity_label starts with "yorum:".

The resolver is repo-internal (Path B does NOT modify IAuditRepository or any
of the 12 create_with_metadata call sites) — these tests exercise the helper
in pure Python without a live DB session, mirroring the Phase 12 D-09 fake-repo
pattern already used by test_audit_log_enrichment.py.
"""
from __future__ import annotations

import pytest

from app.infrastructure.database.repositories.audit_repo import (
    _resolve_entity_label,
)


# ---------------------------------------------------------------------------
# Test 1 — project_name takes precedence and resolves cleanly
# ---------------------------------------------------------------------------


def test_entity_label_resolves_project_name():
    """extra_metadata.project_name → entity_label == "Foo".

    Verifies the most common Plan 14-09 enrichment path: the project_name key
    flowing from project_repo audit writes ends up rendered in the Hedef
    column without modification.
    """
    row = {
        "entity_type": "project",
        "entity_id": 4,
        "extra_metadata": {"project_name": "Foo"},
    }
    assert _resolve_entity_label(row) == "Foo"


# ---------------------------------------------------------------------------
# Test 2 — task_title beats the entity_id legacy fallback
# ---------------------------------------------------------------------------


def test_entity_label_resolves_task_title_taking_precedence_over_id_fallback():
    """extra_metadata.task_title="Login crash" + entity_type='task'/entity_id=42
    → "Login crash" (task_title preferred over the f"TASK-42" fallback).

    Defends the priority order: metadata-driven labels always win over the
    legacy entity_type+entity_id placeholder, otherwise post-Plan-14-09 rows
    would inherit the same fallback string as legacy rows.
    """
    row = {
        "entity_type": "task",
        "entity_id": 42,
        "extra_metadata": {"task_title": "Login crash"},
    }
    assert _resolve_entity_label(row) == "Login crash"


# ---------------------------------------------------------------------------
# Test 3 — D-D6 backward compat: legacy rows with no metadata get f"TASK-42"
# ---------------------------------------------------------------------------


def test_entity_label_legacy_fallback_when_no_metadata():
    """extra_metadata=None + entity_type='task' + entity_id=42 → "TASK-42".

    Verifies D-D6 graceful fallback: pre-Plan-14-09 audit rows still get a
    non-empty Hedef cell (which is the must_haves.truths #2 contract — Hedef
    must NEVER be empty / NEVER raw entity_id rendered as a number).
    """
    row = {
        "entity_type": "task",
        "entity_id": 42,
        "extra_metadata": None,
    }
    assert _resolve_entity_label(row) == "TASK-42"


# ---------------------------------------------------------------------------
# Test 4 — comment_excerpt yields the "yorum:" prefix
# ---------------------------------------------------------------------------


def test_entity_label_comment_excerpt_yields_yorum_prefix():
    """extra_metadata.comment_excerpt → entity_label starts with "yorum:".

    Comment events have no natural entity name (the comment body itself is
    PII-bounded at 160 chars by Plan 14-09 D-D2). The "yorum:" prefix lets
    admins distinguish a comment row from a project / task row at a glance
    in the Hedef column.
    """
    row = {
        "entity_type": "comment",
        "entity_id": 7,
        "extra_metadata": {"comment_excerpt": "long comment text..."},
    }
    label = _resolve_entity_label(row)
    assert label is not None
    assert label.startswith("yorum:")
    # Sanity: the excerpt body is preserved (truncated to 60 chars in the
    # resolver — short text passes through unchanged).
    assert "long comment text" in label


# ---------------------------------------------------------------------------
# Defense — empty metadata dict still falls through to the legacy fallback
# ---------------------------------------------------------------------------


def test_entity_label_empty_metadata_falls_through_to_id_label():
    """extra_metadata={} → still falls through to the entity_type+entity_id
    fallback, NOT None. Defends against the "metadata exists but is empty"
    edge case (e.g. an audit write that supplied an empty dict literal)."""
    row = {
        "entity_type": "milestone",
        "entity_id": 9,
        "extra_metadata": {},
    }
    assert _resolve_entity_label(row) == "MILESTONE-9"


def test_entity_label_metadata_via_wire_shape_key():
    """Some callers (in-memory test fakes / projection rows already remapped
    to wire shape) expose the JSONB under the "metadata" key rather than
    "extra_metadata". The resolver checks both so the contract holds for
    every consumer.
    """
    row = {
        "entity_type": "project",
        "entity_id": 4,
        # Wire-shape key — exercises the secondary lookup branch.
        "metadata": {"project_name": "Yapay Zeka Modülü"},
    }
    assert _resolve_entity_label(row) == "Yapay Zeka Modülü"

"""BACK-03 / D-32 / D-33: process_config schema_version normalizer unit tests."""
import pytest
from app.domain.entities.project import (
    _normalize_process_config,
    CURRENT_SCHEMA_VERSION,
    _MAX_MIGRATION_ITERATIONS,
    _MIGRATIONS,
)
from app.domain.exceptions import ProcessConfigSchemaError


# ---------------------------------------------------------------------------
# C3: V2 canonical-shape tests
# ---------------------------------------------------------------------------
# CURRENT_SCHEMA_VERSION was bumped from 1 -> 2 in C1 of the workflow engine
# refactor (rename `workflow` -> `phase_workflow`; nest engine flags under
# `phase_workflow.capabilities`; seed `task_workflow` placeholder).
# The xfail tests that asserted the V1 shape have been rewritten below to
# assert V2. The V1->V2 migration step itself is still covered by
# test_v1_config_migrates_to_v2 further down in this file.


def test_legacy_v0_config_migrates_to_v2():
    """V0 legacy config (only `methodology`) walks V0 -> V1 -> V2 in one call."""
    legacy = {"methodology": "SCRUM"}
    result = _normalize_process_config(legacy)
    assert result["schema_version"] == 2
    assert result["methodology_legacy"] == "SCRUM"
    assert "methodology" not in result
    # V1 stage seeded `workflow`; V2 stage renamed to `phase_workflow`.
    assert "workflow" not in result
    assert result["phase_workflow"]["mode"] == "flexible"
    assert result["phase_workflow"]["nodes"] == []
    assert result["phase_workflow"]["edges"] == []
    assert result["phase_workflow"]["groups"] == []
    # Capabilities sub-object holds the engine flags now.
    caps = result["phase_workflow"]["capabilities"]
    assert caps["enforce_sequential_dependencies"] is False
    assert caps["enforce_wip_limits"] is False
    assert caps["restrict_expired_sprints"] is False
    assert caps["initial_node_id"] is None
    # Top-level engine flags removed.
    assert "enforce_sequential_dependencies" not in result
    assert "enforce_wip_limits" not in result
    assert "restrict_expired_sprints" not in result
    # task_workflow placeholder seeded (C2).
    assert result["task_workflow"]["edges"] == []
    assert result["task_workflow"]["groups"] == []
    assert result["task_workflow"]["capabilities"]["enforce_wip_limits"] is False
    assert result["task_workflow"]["capabilities"]["initial_node_id"] is None
    # Other defaults.
    assert result["phase_completion_criteria"] == {}
    assert result["enable_phase_assignment"] is False


def test_v2_canonical_config_is_idempotent():
    """Running normalizer on an already-V2 config returns the exact same shape."""
    v2 = {
        "schema_version": 2,
        "phase_workflow": {
            "mode": "flexible",
            "capabilities": {
                "enforce_wip_limits": False,
                "enforce_sequential_dependencies": False,
                "restrict_expired_sprints": False,
                "initial_node_id": None,
            },
            "nodes": [],
            "edges": [],
            "groups": [],
        },
        "task_workflow": {
            "capabilities": {"enforce_wip_limits": False, "initial_node_id": None},
            "edges": [],
            "groups": [],
        },
        "phase_completion_criteria": {},
        "enable_phase_assignment": True,
    }
    result = _normalize_process_config(v2)
    assert result == v2
    # Idempotency: run twice
    result2 = _normalize_process_config(result)
    assert result2 == result


def test_empty_config_fills_defaults():
    """Empty config fills V2 canonical defaults end-to-end."""
    result = _normalize_process_config({})
    assert result["schema_version"] == 2
    assert result["phase_workflow"]["mode"] == "flexible"
    assert "task_workflow" in result
    assert result["task_workflow"]["edges"] == []
    assert result["task_workflow"]["groups"] == []


def test_none_config_returns_none():
    assert _normalize_process_config(None) is None


def test_normalizer_rejects_unknown_migration_gap(monkeypatch):
    """If CURRENT_SCHEMA_VERSION is bumped but _MIGRATIONS lacks a step, raise."""
    # Simulate: pretend CURRENT is 5 but only _MIGRATIONS[0..1] exist
    import app.domain.entities.project as pmod
    monkeypatch.setattr(pmod, "CURRENT_SCHEMA_VERSION", 5)
    # _MIGRATIONS still only has 0->1 and 1->2 (no 2->3)
    with pytest.raises(ProcessConfigSchemaError):
        _normalize_process_config({"schema_version": 2})


def test_normalizer_detects_forgot_to_bump_version():
    """Pitfall 4: migration fn returned same version -> raise, don't loop forever."""
    import app.domain.entities.project as pmod
    bad_migrate = lambda c: {**c, "schema_version": 0}  # returns same version
    original = dict(pmod._MIGRATIONS)
    pmod._MIGRATIONS.clear()
    pmod._MIGRATIONS[0] = bad_migrate
    try:
        with pytest.raises(ProcessConfigSchemaError):
            _normalize_process_config({"schema_version": 0, "methodology": "SCRUM"})
    finally:
        pmod._MIGRATIONS.clear()
        pmod._MIGRATIONS.update(original)


def test_project_model_validator_normalizes_on_construct():
    """Test Pydantic integration: constructing Project triggers normalizer."""
    from datetime import datetime
    from app.domain.entities.project import Project, Methodology
    p = Project(
        key="X1",
        name="X",
        start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM,
        process_config={"methodology": "SCRUM"},  # legacy shape
    )
    # C1: V0 legacy methodology-only input chains through V0 -> V1 -> V2.
    assert p.process_config["schema_version"] == CURRENT_SCHEMA_VERSION
    assert p.process_config["methodology_legacy"] == "SCRUM"
    assert "methodology" not in p.process_config


# ---------------------------------------------------------------------------
# C1: V2 schema migration tests
# ---------------------------------------------------------------------------
# These cover the new `_migrate_v1_to_v2` step and the end-to-end V0 -> V2
# chain. See .planning/workflow-engine-design.md for the V2 shape spec.


def test_v1_config_migrates_to_v2():
    """V1 input -> V2 output: `phase_workflow` exists, `workflow` removed,
    `capabilities` sub-object present with top-level flags pulled in."""
    v1 = {
        "schema_version": 1,
        "workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []},
        "phase_completion_criteria": {},
        "enable_phase_assignment": False,
        "enforce_sequential_dependencies": True,
        "enforce_wip_limits": True,
        "restrict_expired_sprints": False,
        "backlog_definition": "cycle_null",
        "cycle_label": None,
    }
    result = _normalize_process_config(v1)
    assert result["schema_version"] == 2
    # Rename: workflow gone, phase_workflow present
    assert "workflow" not in result
    assert "phase_workflow" in result
    # Capabilities sub-object pulled from top-level flags
    caps = result["phase_workflow"]["capabilities"]
    assert caps["enforce_sequential_dependencies"] is True
    assert caps["enforce_wip_limits"] is True
    assert caps["restrict_expired_sprints"] is False
    assert caps["initial_node_id"] is None  # No nodes in the input
    # Top-level flags removed (now live under capabilities only)
    assert "enforce_sequential_dependencies" not in result
    assert "enforce_wip_limits" not in result
    assert "restrict_expired_sprints" not in result
    # Other V1 keys preserved
    assert result["phase_completion_criteria"] == {}
    assert result["backlog_definition"] == "cycle_null"


def test_v2_config_is_idempotent():
    """V2 input: second pass through the normalizer is a no-op."""
    v2 = {
        "schema_version": 2,
        "phase_workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": {
                "enforce_wip_limits": False,
                "enforce_sequential_dependencies": False,
                "restrict_expired_sprints": False,
                "initial_node_id": None,
            },
        },
        "phase_completion_criteria": {},
        "enable_phase_assignment": False,
        "backlog_definition": "cycle_null",
        "cycle_label": None,
    }
    result = _normalize_process_config(v2)
    assert result == v2
    # Run twice to confirm true idempotency
    result2 = _normalize_process_config(result)
    assert result2 == result


def test_v0_to_v2_chain():
    """Legacy V0 (`{"methodology": "SCRUM"}`) walks through V0 -> V1 -> V2."""
    legacy = {"methodology": "SCRUM"}
    result = _normalize_process_config(legacy)
    assert result["schema_version"] == 2
    assert result["methodology_legacy"] == "SCRUM"
    assert "methodology" not in result
    # V0->V1 seeded an empty workflow; V1->V2 renamed it.
    assert "workflow" not in result
    assert "phase_workflow" in result
    pw = result["phase_workflow"]
    assert pw["mode"] == "flexible"
    assert pw["nodes"] == []
    # Capabilities seeded with all-False defaults; no initial node so id is None.
    caps = pw["capabilities"]
    assert caps["initial_node_id"] is None
    assert caps["enforce_wip_limits"] is False
    assert caps["enforce_sequential_dependencies"] is False
    assert caps["restrict_expired_sprints"] is False


def test_v1_to_v2_preserves_initial_node_id():
    """If a V1 workflow has a node marked is_initial=True, the V2 migration
    must derive capabilities.initial_node_id from it."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_start00001", "name": "Start", "is_initial": True},
                {"id": "nd_end0000002", "name": "End", "is_final": True},
            ],
            "edges": [],
            "groups": [],
        },
    }
    result = _normalize_process_config(v1)
    assert result["phase_workflow"]["capabilities"]["initial_node_id"] == "nd_start00001"


def test_v1_to_v2_partial_already_v2_idempotent():
    """Defensive: a config stamped schema_version=2 but missing the
    capabilities sub-object must still validate idempotently — the entity
    normalizer treats partial-V2 inputs as final and does not re-run the
    migration step. (The capabilities default is the migration's job, not the
    normalizer's; partial-V2 rows in the wild keep whatever shape they have.)
    """
    partial_v2 = {
        "schema_version": 2,
        "phase_workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            # No `capabilities` key!
        },
    }
    result = _normalize_process_config(partial_v2)
    # The normalizer leaves it as-is because schema_version is already current.
    assert result == partial_v2
    # And re-running is a no-op.
    assert _normalize_process_config(result) == partial_v2


def test_v1_legacy_workflow_key_renamed_to_phase_workflow():
    """Senior review (2026-05-17): explicit rename verification — V1 input
    with `workflow` must produce V2 output with `phase_workflow` AND no
    `workflow` key remaining. Nodes/mode preserved verbatim."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [{"id": "n1"}],
            "edges": [],
            "groups": [],
        },
    }
    result = _normalize_process_config(v1)
    assert "workflow" not in result, "Legacy workflow key must be removed"
    assert "phase_workflow" in result, "New phase_workflow key must exist"
    assert result["phase_workflow"]["nodes"][0]["id"] == "n1", "Nodes preserved"
    assert result["phase_workflow"]["mode"] == "flexible", "Mode preserved"


# ---------------------------------------------------------------------------
# C2: task_workflow placeholder in V2 schema
# ---------------------------------------------------------------------------
# _migrate_v1_to_v2 now seeds an empty task_workflow block (capabilities +
# edges + groups). Engine consumes it in C5+. Migration must be idempotent
# and forward-compatible: any pre-existing task_workflow values are preserved.


def test_v2_includes_task_workflow_placeholder():
    result = _normalize_process_config({"methodology": "SCRUM"})
    assert result["schema_version"] == 2
    assert "task_workflow" in result
    assert result["task_workflow"]["edges"] == []
    assert result["task_workflow"]["groups"] == []
    caps = result["task_workflow"]["capabilities"]
    assert caps["enforce_wip_limits"] is False
    assert caps["initial_node_id"] is None
    # C9: the has_recurring capability must be present (the audit flagged it as the
    # un-asserted key). A minimal config enables it by default.
    assert caps["has_recurring"] is True


def test_v1_to_v2_preserves_existing_task_workflow():
    """If a future caller has pre-populated task_workflow, migration doesn't clobber it."""
    v1 = {
        "schema_version": 1,
        "workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []},
        "task_workflow": {
            "capabilities": {"enforce_wip_limits": True, "initial_node_id": "tw1"},
            "edges": [{"id": "te1", "source": "c1", "target": "c2"}],
            "groups": [],
        },
    }
    result = _normalize_process_config(v1)
    assert result["task_workflow"]["capabilities"]["enforce_wip_limits"] is True
    assert result["task_workflow"]["capabilities"]["initial_node_id"] == "tw1"
    assert result["task_workflow"]["edges"] == [{"id": "te1", "source": "c1", "target": "c2"}]


# ---------------------------------------------------------------------------
# W2-C2: per-field setdefault for phase_workflow.capabilities idempotency
# ---------------------------------------------------------------------------
# Wave 2 W2-C2 — `_migrate_v1_to_v2` previously used an outer setdefault on the
# whole `capabilities` sub-object. If a V1 row arrived with a partial dict (e.g.
# only `enforce_wip_limits` set), the outer setdefault was a no-op and the rest
# of the canonical keys were never seeded. The engine's defensive `_caps.get(...)`
# masked the missing keys at read time, but the persisted JSONB shape was
# inconsistent across migration runs. W2-C2 fixes this with per-field setdefault.


def test_v1_to_v2_partial_phase_capabilities_filled_per_field():
    """W2-C2: phase_workflow.capabilities partial input -> missing fields default-filled."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": {"enforce_wip_limits": True},  # other fields missing
        },
    }
    result = _normalize_process_config(v1)
    caps = result["phase_workflow"]["capabilities"]
    assert caps["enforce_wip_limits"] is True  # preserved
    assert caps["enforce_sequential_dependencies"] is False  # was missing, now defaulted
    assert caps["restrict_expired_sprints"] is False  # was missing, now defaulted
    assert caps["initial_node_id"] is None  # was missing, now defaulted


def test_v1_to_v2_phase_capabilities_preserves_existing_values():
    """W2-C2: per-field setdefault must NOT overwrite existing values — only fill gaps."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": {
                "enforce_wip_limits": True,
                "enforce_sequential_dependencies": True,
                "restrict_expired_sprints": True,
                "initial_node_id": "n1",
            },
        },
    }
    result = _normalize_process_config(v1)
    caps = result["phase_workflow"]["capabilities"]
    assert caps["enforce_wip_limits"] is True
    assert caps["enforce_sequential_dependencies"] is True
    assert caps["restrict_expired_sprints"] is True
    assert caps["initial_node_id"] == "n1"  # explicit value preserved, not overwritten


def test_v1_to_v2_normalizer_is_strictly_idempotent():
    """W2-C2 invariant: normalize(normalize(v)) == normalize(v) for any V1 input."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [{"id": "n1", "is_initial": True}],
            "edges": [],
            "groups": [],
        },
    }
    once = _normalize_process_config(v1)
    twice = _normalize_process_config(once)
    assert once == twice, "normalizer must be strictly idempotent"

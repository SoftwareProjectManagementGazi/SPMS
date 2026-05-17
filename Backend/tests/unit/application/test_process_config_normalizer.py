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
# C1: Legacy V1-shape tests
# ---------------------------------------------------------------------------
# CURRENT_SCHEMA_VERSION was bumped from 1 -> 2 in C1 of the workflow engine
# refactor (rename `workflow` -> `phase_workflow`; nest engine flags under
# `phase_workflow.capabilities`). The tests below assert the *V1* shape and
# therefore fail under V2 normalization — this is the deliberate, documented
# breaking change. They are marked xfail here and will be rewritten as
# V2-shape assertions in C3 (test fixture migration). See
# .planning/workflow-engine-implementation.md C1 § "Test Stratejisi".


@pytest.mark.xfail(
    reason="V1→V2 migration introduced in C1; test rewritten in C3", strict=True
)
def test_legacy_config_migrates_to_v1():
    """V0 legacy config with only `methodology` -> V1 canonical shape."""
    legacy = {"methodology": "SCRUM"}
    result = _normalize_process_config(legacy)
    assert result["schema_version"] == 1
    assert result["methodology_legacy"] == "SCRUM"
    assert "methodology" not in result
    assert result["workflow"] == {"mode": "flexible", "nodes": [], "edges": [], "groups": []}
    assert result["phase_completion_criteria"] == {}
    assert result["enable_phase_assignment"] is False
    assert result["enforce_sequential_dependencies"] is False
    assert result["enforce_wip_limits"] is False
    assert result["restrict_expired_sprints"] is False


@pytest.mark.xfail(
    reason="V1→V2 migration introduced in C1; test rewritten in C3", strict=True
)
def test_v1_config_is_idempotent():
    """Running normalizer on already-normalized config returns same shape."""
    v1 = {
        "schema_version": 1,
        "workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []},
        "phase_completion_criteria": {},
        "enable_phase_assignment": True,
        "enforce_sequential_dependencies": False,
        "enforce_wip_limits": False,
        "restrict_expired_sprints": False,
    }
    result = _normalize_process_config(v1)
    assert result == v1
    # Idempotency: run twice
    result2 = _normalize_process_config(result)
    assert result2 == result


@pytest.mark.xfail(
    reason="V1→V2 migration introduced in C1; test rewritten in C3", strict=True
)
def test_empty_config_fills_defaults():
    result = _normalize_process_config({})
    assert result["schema_version"] == 1
    assert result["workflow"]["mode"] == "flexible"


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

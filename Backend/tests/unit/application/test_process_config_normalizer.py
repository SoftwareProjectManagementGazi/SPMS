"""BACK-03 / D-32 / D-33: process_config schema_version normalizer unit tests."""
import pytest
from app.domain.entities.project import (
    _normalize_process_config,
    CURRENT_SCHEMA_VERSION,
    _MAX_MIGRATION_ITERATIONS,
    _MIGRATIONS,
)
from app.domain.exceptions import ProcessConfigSchemaError


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


def test_empty_config_fills_defaults():
    result = _normalize_process_config({})
    assert result["schema_version"] == 1
    assert result["workflow"]["mode"] == "flexible"


def test_none_config_returns_none():
    assert _normalize_process_config(None) is None


def test_normalizer_rejects_unknown_migration_gap(monkeypatch):
    """If CURRENT_SCHEMA_VERSION is bumped but _MIGRATIONS lacks a step, raise."""
    # Simulate: pretend CURRENT is 3 but only _MIGRATIONS[0] exists
    import app.domain.entities.project as pmod
    monkeypatch.setattr(pmod, "CURRENT_SCHEMA_VERSION", 3)
    # _MIGRATIONS still only has 0->1
    with pytest.raises(ProcessConfigSchemaError):
        _normalize_process_config({"schema_version": 1})


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
    assert p.process_config["schema_version"] == 1
    assert p.process_config["methodology_legacy"] == "SCRUM"
    assert "methodology" not in p.process_config

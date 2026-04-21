"""BACK-06 PhaseReport entity tests."""
import pytest
from pydantic import ValidationError
from app.domain.entities.phase_report import PhaseReport


def test_defaults():
    r = PhaseReport(project_id=1, phase_id="nd_V1StGXR8_Z")
    assert r.cycle_number == 1
    assert r.revision == 1
    assert r.completed_tasks_notes == {}
    assert r.version == 1


def test_phase_id_validation():
    with pytest.raises(ValidationError):
        PhaseReport(project_id=1, phase_id="bad")

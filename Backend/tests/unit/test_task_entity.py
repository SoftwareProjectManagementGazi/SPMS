"""BACK-02 / D-22: Task.phase_id format validator."""
import pytest
from pydantic import ValidationError
from app.domain.entities.task import Task, NODE_ID_REGEX


@pytest.mark.parametrize("valid_id", ["nd_V1StGXR8_Z", "nd_abcdefghij", "nd_ABC_DEF-01", "nd_0123456789"])
def test_phase_id_valid_format(valid_id):
    t = Task(project_id=1, title="T", phase_id=valid_id)
    assert t.phase_id == valid_id


@pytest.mark.parametrize("bad_id", ["nd_abc", "xx_V1StGXR8_Z", "nd_V1StGXR8_", "nd_V1StGXR8@Z", "", "nd_V1StGXR8_Zextra"])
def test_phase_id_rejects_bad_format(bad_id):
    with pytest.raises(ValidationError):
        Task(project_id=1, title="T", phase_id=bad_id)


def test_phase_id_null_allowed():
    t = Task(project_id=1, title="T", phase_id=None)
    assert t.phase_id is None


def test_phase_id_default_is_none():
    t = Task(project_id=1, title="T")
    assert t.phase_id is None

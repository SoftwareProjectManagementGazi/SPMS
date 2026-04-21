"""BACK-05 Artifact entity tests."""
import pytest
from pydantic import ValidationError
from app.domain.entities.artifact import Artifact, ArtifactStatus


def test_defaults():
    a = Artifact(project_id=1, name="A")
    assert a.status == ArtifactStatus.NOT_CREATED
    assert a.linked_phase_id is None
    assert a.file_id is None
    assert a.assignee_id is None


def test_linked_phase_id_nullable():
    a = Artifact(project_id=1, name="A", linked_phase_id=None)
    assert a.linked_phase_id is None


def test_linked_phase_id_format_valid():
    a = Artifact(project_id=1, name="A", linked_phase_id="nd_V1StGXR8_Z")
    assert a.linked_phase_id == "nd_V1StGXR8_Z"


@pytest.mark.parametrize("bad", ["bad", "nd_abc", "xx_V1StGXR8_Z", "nd_V1StGXR8_Zextra"])
def test_linked_phase_id_bad_format_rejected(bad):
    with pytest.raises(ValidationError):
        Artifact(project_id=1, name="A", linked_phase_id=bad)


def test_status_enum_values():
    for s in ArtifactStatus:
        a = Artifact(project_id=1, name="A", status=s)
        assert a.status == s

"""BACK-01: ProjectStatus enum and default value."""
import pytest
from datetime import datetime
from pydantic import ValidationError
from app.domain.entities.project import Project, ProjectStatus, Methodology


def test_status_default_is_active():
    p = Project(
        key="K1", name="P", start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM,
    )
    assert p.status == ProjectStatus.ACTIVE


def test_status_invalid_raises():
    with pytest.raises(ValidationError):
        Project(
            key="K1", name="P", start_date=datetime(2026, 1, 1),
            methodology=Methodology.SCRUM, status="INVALID_STATUS",
        )


def test_status_all_values_accepted():
    for s in [ProjectStatus.ACTIVE, ProjectStatus.COMPLETED, ProjectStatus.ON_HOLD, ProjectStatus.ARCHIVED]:
        p = Project(
            key="K1", name="P", start_date=datetime(2026, 1, 1),
            methodology=Methodology.SCRUM, status=s,
        )
        assert p.status == s


def test_process_template_id_optional():
    p = Project(
        key="K1", name="P", start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM, process_template_id=7,
    )
    assert p.process_template_id == 7

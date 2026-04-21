"""BACK-04 Milestone entity tests."""
import pytest
from app.domain.entities.milestone import Milestone, MilestoneStatus


def test_defaults():
    m = Milestone(project_id=1, name="M1")
    assert m.status == MilestoneStatus.PENDING
    assert m.linked_phase_ids == []
    assert m.is_deleted is False


def test_status_enum_values():
    assert MilestoneStatus.PENDING.value == "pending"
    assert MilestoneStatus.IN_PROGRESS.value == "in_progress"
    assert MilestoneStatus.COMPLETED.value == "completed"
    assert MilestoneStatus.DELAYED.value == "delayed"


def test_linked_phase_ids_dedupe_in_repo_helper():
    """D-24: dedupe happens in _to_model. Verify by calling through repo helper."""
    from app.infrastructure.database.repositories.milestone_repo import SqlAlchemyMilestoneRepository
    m = Milestone(project_id=1, name="M1", linked_phase_ids=["nd_a1b2c3d4e5", "nd_a1b2c3d4e5", "nd_f6g7h8i9j0"])
    # Use repo helper _to_model which mutates entity in place (D-24 dedupe)
    repo = SqlAlchemyMilestoneRepository(session=None)  # type: ignore — session unused in _to_model
    repo._to_model(m)
    assert m.linked_phase_ids == ["nd_a1b2c3d4e5", "nd_f6g7h8i9j0"]

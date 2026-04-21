"""Artifact entity factory. Available once plan 09-06 lands the entity."""
from typing import Any, Optional


def make_artifact(
    project_id: int = 1,
    name: Optional[str] = None,
    assignee_id: Optional[int] = None,
    linked_phase_id: Optional[str] = None,
    file_id: Optional[int] = None,
    id: Optional[int] = None,
    **extra: Any,
):
    from app.domain.entities.artifact import Artifact, ArtifactStatus  # late import until entity exists
    return Artifact(
        id=id,
        project_id=project_id,
        name=name or "Test Artifact",
        assignee_id=assignee_id,
        linked_phase_id=linked_phase_id,
        status=ArtifactStatus.NOT_CREATED,
        file_id=file_id,
        **extra,
    )

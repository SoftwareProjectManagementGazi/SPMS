"""PhaseReport entity factory. Available once plan 09-07 lands the entity."""
from typing import Any, Optional


def make_phase_report(
    project_id: int = 1,
    phase_id: str = "nd_SrcPhase001",
    cycle_number: int = 1,
    revision: int = 1,
    created_by: Optional[int] = None,
    id: Optional[int] = None,
    **extra: Any,
):
    from app.domain.entities.phase_report import PhaseReport  # late import until entity exists
    return PhaseReport(
        id=id,
        project_id=project_id,
        phase_id=phase_id,
        cycle_number=cycle_number,
        revision=revision,
        created_by=created_by,
        completed_tasks_notes={},
        **extra,
    )

"""Phase 13 D-A4: chart applicability rules per methodology (CLAUDE.md OCP).

Single source of truth for which charts are valid against which methodology.
NOT inline ``if methodology == 'KANBAN'`` checks scattered across the codebase
(Strategy Pattern per CLAUDE.md §4.1 OCP — extending support for a new
methodology only requires adding to ``ITERATION_METHODOLOGIES`` or returning
the right ``ChartApplicability`` shape from a new helper, not editing chart
endpoints).

Used by:
- ``GetProjectIterationUseCase`` to gate the iteration endpoint (raises
  ``InvalidMethodologyError`` for non-cycle methodologies).
- Frontend ``Frontend2/lib/charts/applicability.ts`` mirrors these rules so
  the FE chart cards can hide/show themselves without round-tripping.
"""
from dataclasses import dataclass


ITERATION_METHODOLOGIES = frozenset({
    "SCRUM",
    "ITERATIVE",
    "INCREMENTAL",
    "EVOLUTIONARY",
    "RAD",
})


@dataclass(frozen=True)
class ChartApplicability:
    """Per-methodology truth table for the four chart types Phase 13 ships."""

    cfd: bool
    iteration: bool
    lead_cycle: bool
    burndown: bool


def chart_applicability_for(methodology: str) -> ChartApplicability:
    """Return the chart applicability flags for a given methodology string.

    - CFD = Kanban only.
    - Iteration = SCRUM / ITERATIVE / INCREMENTAL / EVOLUTIONARY / RAD.
    - Lead/Cycle = all methodologies.
    - Burndown = SCRUM only (preserves v1.0 behavior).
    """
    return ChartApplicability(
        cfd=methodology == "KANBAN",
        iteration=methodology in ITERATION_METHODOLOGIES,
        lead_cycle=True,
        burndown=methodology == "SCRUM",
    )

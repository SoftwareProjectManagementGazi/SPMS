"""Capability + data-presence rules for chart gating.

Replaces the methodology-hardcoded ChartApplicability table from Phase 13.
Each chart's visibility is now a pure function of project state + workflow
capabilities, NEVER the methodology enum (CLAUDE.md §4.1 OCP).

Adding a new chart = add 1 lambda to ``CHART_CAPABILITY_RULES``. No edits to
existing rules, no new methodology branches anywhere in the codebase.

Used by:
- ``GetChartCapabilitiesUseCase`` (computes per-chart gates for one project).
- Tests assert each rule independently to keep regressions surgical.

The Frontend2 ``hooks/use-chart-capabilities`` hook reads the same JSON shape
through the new ``/projects/{id}/chart-capabilities`` endpoint, so the FE and
BE share a single source of truth (no client-side mirror of these rules).
"""
from dataclasses import dataclass
from typing import Callable, Dict

from app.domain.entities.project import Project


@dataclass(frozen=True)
class CapabilityInputs:
    """Aggregated project-state inputs for chart capability resolution.

    Built by ``IProjectRepository.get_capability_inputs`` via a SINGLE SQL
    aggregation (no N+1). The fields here are the ONLY shape rules can read;
    adding a new field requires updating the repository query in lockstep.
    """

    sprint_count: int
    closed_sprint_count: int
    phase_node_count: int
    column_count: int
    member_count: int
    has_all_categories: bool  # {todo, in_progress, done} all present in columns


CapabilityRule = Callable[[Project, CapabilityInputs], bool]


CHART_CAPABILITY_RULES: Dict[str, CapabilityRule] = {
    # Time-boxed iteration metric: needs at least one sprint to draw.
    "burndown":       lambda _p, i: i.sprint_count > 0,
    # Cross-sprint comparison: same gate, different surface.
    "iteration":      lambda _p, i: i.sprint_count > 0,
    # Cumulative Flow Diagram: needs the three column categories so each
    # task in any column rolls up cleanly into todo/in_progress/done bands.
    "cfd":            lambda _p, i: i.has_all_categories,
    # Lead/Cycle time histogram works for any project with completed tasks;
    # empty-data state is handled FE-side via the chart's empty fallback.
    "lead_cycle":     lambda _p, _i: True,
    # Phase Progress (Strategy D differentiator): needs phase_workflow nodes.
    "phase_progress": lambda _p, i: i.phase_node_count > 0,
    # Team Load surface: needs at least one member.
    "team_load":      lambda _p, i: i.member_count > 0,
    # Summary StatCards: always shown (zeros are valid).
    "summary":        lambda _p, _i: True,
}


def chart_capabilities(project: Project, inputs: CapabilityInputs) -> Dict[str, bool]:
    """Return the gating boolean for every chart in the registry.

    Pure function. Callers (use case → router → FE) get a flat dict that maps
    chart name → bool, suitable for direct JSON serialization.
    """
    return {name: rule(project, inputs) for name, rule in CHART_CAPABILITY_RULES.items()}

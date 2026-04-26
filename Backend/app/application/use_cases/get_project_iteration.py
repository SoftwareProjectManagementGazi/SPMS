"""Phase 13 D-X3 — Iteration Comparison use case.

Single Responsibility (CLAUDE.md §4.1 S): pull the last N sprints and map
into ``IterationResponseDTO``.

Strategy Pattern (CLAUDE.md §4.1 OCP, D-A4): methodology gate is delegated to
``app.domain.services.chart_applicability`` — adding a new cycle methodology
is a one-line edit there, not in this use case.

DIP: only domain repository interfaces imported.
"""
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.services.chart_applicability import chart_applicability_for
from app.domain.exceptions import InvalidMethodologyError
from app.application.dtos.chart_dtos import IterationResponseDTO, IterationSprintDTO


_VALID_COUNTS = (3, 4, 6)
_REQUIRED_METHODOLOGIES = "SCRUM|ITERATIVE|INCREMENTAL|EVOLUTIONARY|RAD"


def _methodology_value(methodology) -> str:
    """Domain ``Methodology`` is a str-Enum; ``getattr(.value)`` is safe for both
    str-enum and plain string inputs (e.g. legacy fakes / test stubs).
    """
    return getattr(methodology, "value", methodology) or ""


class GetProjectIterationUseCase:
    """D-X3 Iteration use case — last N sprints with planned/completed/carried."""

    def __init__(self, audit_repo: IAuditRepository, project_repo: IProjectRepository):
        self.audit_repo = audit_repo
        self.project_repo = project_repo

    async def execute(self, project_id: int, count: int) -> IterationResponseDTO:
        """Return ``IterationResponseDTO`` for the requested project + sprint count.

        Raises:
        - ``ValueError`` if ``count`` not in {3, 4, 6} → router maps to 422 INVALID_COUNT.
        - ``InvalidMethodologyError`` if the project methodology is not in the cycle
          set → router maps to 422 INVALID_METHODOLOGY (Phase 9 error taxonomy).
        """
        if count not in _VALID_COUNTS:
            raise ValueError(
                f"count must be one of {sorted(_VALID_COUNTS)}, got {count}"
            )

        project = await self.project_repo.get_by_id(project_id)
        # If the project does not exist the use case bubbles back as None →
        # router-level Depends(get_project_member) already returns 403/404
        # before this point, but keep a defensive guard for direct callers.
        methodology_str = _methodology_value(getattr(project, "methodology", "")) if project else ""

        applicability = chart_applicability_for(methodology_str)
        if not applicability.iteration:
            raise InvalidMethodologyError(
                methodology=methodology_str,
                required=_REQUIRED_METHODOLOGIES,
            )

        sprints = await self.audit_repo.get_iteration_data(
            project_id=project_id, count=count,
        )
        return IterationResponseDTO(
            sprints=[IterationSprintDTO(**s) for s in sprints],
        )

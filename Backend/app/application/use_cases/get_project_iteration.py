"""Phase 13 D-X3 — Iteration Comparison use case (Reports migration v2).

Single Responsibility (CLAUDE.md §4.1 S): pull the last N sprints and map
into ``IterationResponseDTO``.

Strategy D refactor: the methodology gate is GONE. Whether a project sees an
iteration chart is purely a function of having sprint records, which is
gated on the FE via ``chart_capabilities``. Backend simply returns whatever
sprints exist — empty list when none — letting the FE render the empty
state or capability AlertBanner appropriately.

DIP: only domain repository interfaces imported.
"""
from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.chart_dtos import IterationResponseDTO, IterationSprintDTO


_VALID_COUNTS = (3, 4, 6)


class GetProjectIterationUseCase:
    """D-X3 Iteration use case — last N sprints with planned/completed/carried."""

    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(self, project_id: int, count: int) -> IterationResponseDTO:
        """Return ``IterationResponseDTO`` for the requested project + sprint count.

        Raises:
        - ``ValueError`` if ``count`` not in {3, 4, 6} → router maps to 422 INVALID_COUNT.

        When the project has no sprints the response is ``IterationResponseDTO(sprints=[])``;
        the FE chart card renders its empty state. No methodology check happens here —
        capability gating is the FE's responsibility (Strategy D).
        """
        if count not in _VALID_COUNTS:
            raise ValueError(
                f"count must be one of {sorted(_VALID_COUNTS)}, got {count}"
            )

        sprints = await self.audit_repo.get_iteration_data(
            project_id=project_id, count=count,
        )
        return IterationResponseDTO(
            sprints=[IterationSprintDTO(**s) for s in sprints],
        )

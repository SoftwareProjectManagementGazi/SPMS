"""Phase 13 D-X1 — CFD use case.

Single Responsibility (CLAUDE.md §4.1 S): aggregate snapshot data into the
CFDResponseDTO with avg_wip / avg_completion_per_day summaries.

DIP (CLAUDE.md §4.1 D + §4.2): only domain repository interfaces are imported;
no SQLAlchemy / no app.infrastructure imports.
"""
from datetime import date, timedelta

from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.application.dtos.chart_dtos import CFDResponseDTO, CFDDayDTO


_VALID_RANGES = (7, 30, 90)


class GetProjectCFDUseCase:
    """D-X1 CFD use case — daily snapshot list + WIP/throughput summary."""

    def __init__(self, audit_repo: IAuditRepository, task_repo: ITaskRepository):
        self.audit_repo = audit_repo
        # task_repo injected per DIP/two-repo pattern (RESEARCH.md §Code Examples)
        # though the chart math currently aggregates audit_log rows only.
        self.task_repo = task_repo

    async def execute(self, project_id: int, range_days: int) -> CFDResponseDTO:
        """Return ``CFDResponseDTO`` for the requested project + range.

        Range gate: only 7/30/90 are supported (Phase 13 D-A5 chip values).
        Raises ``ValueError`` for any other value — router maps to HTTP 422
        ``INVALID_RANGE`` per Phase 9 error taxonomy.
        """
        if range_days not in _VALID_RANGES:
            raise ValueError(
                f"range_days must be one of {sorted(_VALID_RANGES)}, got {range_days}"
            )

        date_to = date.today()
        date_from = date_to - timedelta(days=range_days - 1)

        snapshots = await self.audit_repo.get_cfd_snapshots(
            project_id=project_id, date_from=date_from, date_to=date_to,
        )

        if snapshots:
            avg_wip = sum(s["progress"] + s["review"] for s in snapshots) / len(snapshots)
            avg_completion = sum(s["done"] for s in snapshots) / len(snapshots)
        else:
            avg_wip = 0.0
            avg_completion = 0.0

        return CFDResponseDTO(
            days=[CFDDayDTO(**s) for s in snapshots],
            avg_wip=round(avg_wip, 1),
            avg_completion_per_day=round(avg_completion, 1),
        )

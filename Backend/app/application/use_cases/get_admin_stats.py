"""Phase 14 Plan 14-01 — GetAdminStatsUseCase (D-A7 / D-X2 / D-X3 / D-X4).

Composite payload from 3 parallel reads:
1) audit_repo.active_users_trend(days=30) — daily active users
2) project_repo.methodology_distribution() — non-archived count per methodology
3) Per-project velocity for top-30 by recent activity (DoS cap, D-X4)

asyncio.gather drives all three in parallel — same pattern as
GetUserSummaryUseCase (Phase 9 D-48).

Scaling cliff: D-X2 active_users_trend is on-the-fly compute; ~10k events/day
is the boundary at which a daily snapshot table + cron becomes worth building
(v2.1 candidate). Comment preserved in the SQL implementation.

DIP — pure repo wrappers; no infrastructure imports.
"""
import asyncio
from typing import Any, List

from app.application.dtos.admin_stats_dtos import (
    ActiveUsersTrendPointDTO,
    AdminStatsResponseDTO,
    ProjectVelocityDTO,
)
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.project_repository import IProjectRepository


class GetAdminStatsUseCase:
    def __init__(
        self,
        audit_repo: IAuditRepository,
        project_repo: IProjectRepository,
        velocity_resolver: Any = None,
    ):
        """``velocity_resolver`` is an optional callable(project_id) -> Coro
        returning {progress: float, velocity_history: List[float]}. The router
        wires it to the Phase 13 GetProjectIterationUseCase. When None (test
        path), velocities default to empty history.
        """
        self.audit_repo = audit_repo
        self.project_repo = project_repo
        self.velocity_resolver = velocity_resolver

    async def execute(self) -> AdminStatsResponseDTO:
        trend, methodology, recent_projects = await asyncio.gather(
            self.audit_repo.active_users_trend(days=30),
            self.project_repo.methodology_distribution(),
            self.project_repo.list_recent_projects(limit=30),
        )

        velocities: List[ProjectVelocityDTO] = []
        for p in recent_projects[:30]:  # D-X4 defensive top-30 cap
            if self.velocity_resolver is not None:
                try:
                    v = await self.velocity_resolver(p.id)
                    progress = float(v.get("progress", 0.0))
                    history = list(v.get("velocity_history") or [])
                except Exception:
                    progress = 0.0
                    history = []
            else:
                progress = 0.0
                history = []
            velocities.append(
                ProjectVelocityDTO(
                    project_id=p.id,
                    key=p.key,
                    name=p.name,
                    progress=progress,
                    velocity_history=history,
                )
            )

        return AdminStatsResponseDTO(
            active_users_trend=[
                ActiveUsersTrendPointDTO.model_validate(t) for t in trend
            ],
            methodology_distribution=methodology,
            project_velocities=velocities,
        )

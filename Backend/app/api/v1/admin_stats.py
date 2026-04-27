"""Phase 14 Plan 14-01 — Admin stats router (D-A7 / D-X2 / D-X3 / D-X4).

Single endpoint GET /admin/stats returning the composite payload (active
users trend / methodology distribution / project velocities top-30).

Velocity per project reuses Phase 13 GetProjectIterationUseCase via the
velocity_resolver closure passed to GetAdminStatsUseCase.
"""
from fastapi import APIRouter, Depends

from app.api.deps.audit import get_audit_repo
from app.api.deps.auth import require_admin
from app.api.deps.project import get_project_repo
from app.application.dtos.admin_stats_dtos import AdminStatsResponseDTO
from app.application.use_cases.get_admin_stats import GetAdminStatsUseCase
from app.domain.entities.user import User

router = APIRouter()


@router.get("/admin/stats", response_model=AdminStatsResponseDTO)
async def get_admin_stats(
    admin: User = Depends(require_admin),
    audit_repo=Depends(get_audit_repo),
    project_repo=Depends(get_project_repo),
):
    """D-A7 composite stats endpoint. Single round trip; backend has no
    cache layer in v2.0 (frontend uses TanStack Query staleTime: 60s)."""
    # velocity_resolver intentionally None for v2.0 — Phase 13 iteration
    # aggregation reuse is a Plan 14-08 enhancement (UI-side of stats tab).
    # Passing None preserves the composite shape; velocity_history defaults
    # to [] per project so the chart renders empty bars rather than crashing.
    uc = GetAdminStatsUseCase(audit_repo, project_repo, velocity_resolver=None)
    return await uc.execute()

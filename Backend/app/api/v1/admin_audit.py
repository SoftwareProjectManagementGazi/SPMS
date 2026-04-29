"""Phase 14 Plan 14-01 / Phase 15 Plan 15-07 — Admin audit router.

2 endpoints (Plan 15-07 D-1.4 perm migration):
- GET /admin/audit         — paginated list (admin.audit.read)
- GET /admin/audit.json    — JSON-array export with 50k cap (admin.audit.export)

The 50k hard cap is enforced inside audit_repo.get_global_audit; this router
just surfaces the truncated flag to the frontend so it can render the
AlertBanner above the table.
"""
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.api.deps.audit import get_audit_repo
from app.api.deps.auth import require_permission
from app.application.dtos.admin_audit_dtos import AdminAuditResponseDTO
from app.application.use_cases.get_global_audit import GetGlobalAuditUseCase
from app.domain.entities.user import User

router = APIRouter()


@router.get("/admin/audit", response_model=AdminAuditResponseDTO)
async def get_admin_audit(
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    actor_id: Optional[int] = Query(default=None),
    action_prefix: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(require_permission("admin.audit.read")),
    audit_repo=Depends(get_audit_repo),
) -> AdminAuditResponseDTO:
    """D-A8 admin-wide audit retrieval. NO project-membership privacy filter
    (admin sees everything). Returns the truncated flag (Pitfall 6) so the
    frontend can render an AlertBanner above the table when actual_count > 50k."""
    uc = GetGlobalAuditUseCase(audit_repo)
    return await uc.execute(
        date_from=date_from,
        date_to=date_to,
        actor_id=actor_id,
        action_prefix=action_prefix,
        limit=limit,
        offset=offset,
    )


@router.get("/admin/audit.json")
async def export_admin_audit_json(
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    actor_id: Optional[int] = Query(default=None),
    action_prefix: Optional[str] = Query(default=None),
    admin: User = Depends(require_permission("admin.audit.export")),
    audit_repo=Depends(get_audit_repo),
) -> StreamingResponse:
    """D-B8 JSON-array export honoring current filter. 50k row hard cap
    is enforced by audit_repo.get_global_audit (D-Z2).

    Streams as application/json with Content-Disposition: attachment so
    browsers trigger a download dialog rather than rendering inline.
    """
    # Fetch up to the cap in one shot — repo applies the 50k cap internally.
    uc = GetGlobalAuditUseCase(audit_repo)
    response = await uc.execute(
        date_from=date_from, date_to=date_to,
        actor_id=actor_id, action_prefix=action_prefix,
        limit=50000, offset=0,
    )

    payload = json.dumps(
        {
            "items": [item.model_dump(mode="json") for item in response.items],
            "total": response.total,
            "truncated": response.truncated,
        },
        default=str,
        ensure_ascii=False,
    )
    filename = f"audit-{datetime.utcnow().strftime('%Y-%m-%d')}.json"
    return StreamingResponse(
        iter([payload]),
        media_type="application/json; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

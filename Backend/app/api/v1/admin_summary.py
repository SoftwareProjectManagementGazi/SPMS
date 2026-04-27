"""Phase 14 Plan 14-01 — Admin summary PDF router (D-B6).

GET /admin/summary.pdf — rate-limited 30s per user (Phase 12 D-58 reuse).
Composes a 1-page A4 portrait summary using Phase 12 fpdf2 service.

Data loader is inline so the use case stays decoupled from the SQLAlchemy
session. Builds:
- User count + delta (last 30d)
- Active project count + total
- Top 5 most-active projects (audit_log entries last 30d)
- Top 5 most-active users (audit_log entries last 30d)
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func as sqlfunc
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_admin
from app.application.use_cases.generate_admin_summary_pdf import (
    GenerateAdminSummaryPDFUseCase,
)
from app.domain.entities.user import User
from app.infrastructure.database.database import get_db_session
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.project import ProjectModel
from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


def _make_loader(session: AsyncSession):
    async def load() -> dict:
        # Total user count
        user_count = (await session.execute(
            select(sqlfunc.count(UserModel.id))
            .where(UserModel.is_deleted == False)  # noqa: E712
        )).scalar() or 0

        # New users in last 30 days
        cutoff = datetime.utcnow() - timedelta(days=30)
        new_users_30d = (await session.execute(
            select(sqlfunc.count(UserModel.id))
            .where(
                UserModel.is_deleted == False,  # noqa: E712
                UserModel.created_at >= cutoff,
            )
        )).scalar() or 0

        # Role split — distinct user counts per role
        role_split: dict = {}
        role_rows = await session.execute(
            select(RoleModel.name, sqlfunc.count(UserModel.id))
            .join(UserModel, UserModel.role_id == RoleModel.id, isouter=True)
            .where(UserModel.is_deleted == False)  # noqa: E712
            .group_by(RoleModel.name)
        )
        for name, cnt in role_rows.all():
            role_split[str(name)] = int(cnt or 0)

        # Project counts
        active_project_count = (await session.execute(
            select(sqlfunc.count(ProjectModel.id))
            .where(
                ProjectModel.is_deleted == False,  # noqa: E712
                ProjectModel.status == "ACTIVE",
            )
        )).scalar() or 0
        total_project_count = (await session.execute(
            select(sqlfunc.count(ProjectModel.id))
            .where(ProjectModel.is_deleted == False)  # noqa: E712
        )).scalar() or 0

        # Top 5 active projects by audit_log entries last 30d
        top_projects: list = []
        try:
            top_rows = await session.execute(
                select(
                    ProjectModel.id,
                    ProjectModel.key,
                    ProjectModel.name,
                    sqlfunc.count(AuditLogModel.id).label("events"),
                )
                .select_from(ProjectModel)
                .join(
                    AuditLogModel,
                    (AuditLogModel.entity_type == "project")
                    & (AuditLogModel.entity_id == ProjectModel.id)
                    & (AuditLogModel.timestamp >= cutoff),
                    isouter=True,
                )
                .group_by(ProjectModel.id, ProjectModel.key, ProjectModel.name)
                .order_by(sqlfunc.count(AuditLogModel.id).desc())
                .limit(5)
            )
            for r in top_rows.all():
                top_projects.append({
                    "key": r._mapping["key"],
                    "name": r._mapping["name"],
                    "events": int(r._mapping["events"] or 0),
                })
        except Exception:
            # Defensive fallback — older audit_log rows may have NULL entity_id;
            # PDF still renders without the section.
            top_projects = []

        # Top 5 active users by audit_log entries last 30d
        top_users: list = []
        try:
            user_rows = await session.execute(
                select(
                    UserModel.full_name,
                    sqlfunc.count(AuditLogModel.id).label("events"),
                )
                .select_from(UserModel)
                .join(
                    AuditLogModel,
                    (AuditLogModel.user_id == UserModel.id)
                    & (AuditLogModel.timestamp >= cutoff),
                    isouter=True,
                )
                .where(UserModel.is_deleted == False)  # noqa: E712
                .group_by(UserModel.id, UserModel.full_name)
                .order_by(sqlfunc.count(AuditLogModel.id).desc())
                .limit(5)
            )
            for r in user_rows.all():
                top_users.append({
                    "full_name": r._mapping["full_name"],
                    "events": int(r._mapping["events"] or 0),
                })
        except Exception:
            top_users = []

        return {
            "user_count": int(user_count),
            "new_users_30d": int(new_users_30d),
            "role_split": role_split,
            "active_project_count": int(active_project_count),
            "total_project_count": int(total_project_count),
            "top_projects": top_projects,
            "top_users": top_users,
        }
    return load


@router.get("/admin/summary.pdf")
@limiter.limit("1/30seconds")
async def generate_admin_summary_pdf(
    request: Request,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_db_session),
):
    """D-B6 — 1-page admin summary PDF, 30s per-user rate limit."""
    uc = GenerateAdminSummaryPDFUseCase(load_summary_data=_make_loader(session))
    pdf_buf = await uc.execute()
    filename = f"SPMS_Admin_Summary_{datetime.utcnow().strftime('%Y-%m-%d')}.pdf"
    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

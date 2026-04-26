"""Phase 14 Plan 14-01 — ProjectJoinRequestModel (SQLAlchemy ORM).

FK semantics:
- project_id ON DELETE CASCADE — if project is hard-deleted, the join request
  is gone; nobody is asking to join a non-existent project.
- requested_by_user_id / target_user_id / reviewed_by_admin_id ON DELETE SET NULL
  — preserve the historical record of join-request lifecycle even after a user
  is deleted (D-A1; same posture as audit_log.user_id).

Indexes:
- ix_project_join_requests_status_created on (status, created_at DESC) —
  Plan 14-02 Overview tab uses GET /admin/join-requests?status=pending
  ordered by created_at DESC; this index is the hot path.
"""
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, Index, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from typing import Optional
from datetime import datetime

from app.infrastructure.database.models.base import Base


class ProjectJoinRequestModel(Base):
    __tablename__ = "project_join_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    requested_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="pending",
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_admin_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index(
            "ix_project_join_requests_status_created",
            "status",
            text("created_at DESC"),
        ),
    )

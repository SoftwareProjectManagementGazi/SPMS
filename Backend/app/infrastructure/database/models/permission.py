"""Phase 15 RBAC-01 — PermissionModel ORM (D-3.5 VARCHAR + CHECK per Pitfall 1)."""
from typing import Optional

from sqlalchemy import CheckConstraint, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.models.base import Base


class PermissionModel(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    label_tr: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    label_en: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    scope: Mapped[str] = mapped_column(String(16), nullable=False, server_default="project")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("scope IN ('system', 'project')", name="ck_permissions_scope"),
    )

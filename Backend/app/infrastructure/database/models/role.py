from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base


class RoleModel(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String, nullable=True)
    # Phase 15 RBAC-01 (D-2.3, D-2.8) — system role flag + display tokens
    is_system_role = Column(Boolean, nullable=False, server_default="false", index=True)
    icon_key = Column(String(32), nullable=True)
    color_token = Column(String(64), nullable=True)

    users = relationship("UserModel", back_populates="role")

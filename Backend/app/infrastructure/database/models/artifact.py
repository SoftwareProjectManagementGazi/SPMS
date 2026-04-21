"""BACK-05 ArtifactModel ORM."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base


class ArtifactModel(Base):
    __tablename__ = "artifacts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    status = Column(String(20), nullable=False, server_default="not_created")
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    linked_phase_id = Column(String(20), nullable=True, index=True)  # D-26 nullable
    note = Column(Text, nullable=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # D-41
    version = Column(Integer, nullable=False, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, nullable=False, server_default="false")
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("ProjectModel", backref="artifacts")
    assignee = relationship("UserModel", foreign_keys=[assignee_id])
    file = relationship("FileModel", foreign_keys=[file_id])

"""BACK-06 PhaseReportModel ORM.

Partial unique index ux_phase_reports_active enforced at DB level via migration 005.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base


class PhaseReportModel(Base):
    __tablename__ = "phase_reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    phase_id = Column(String(20), nullable=False)
    cycle_number = Column(Integer, nullable=False, server_default="1")
    revision = Column(Integer, nullable=False, server_default="1")
    summary_task_count = Column(Integer, nullable=True)
    summary_done_count = Column(Integer, nullable=True)
    summary_moved_count = Column(Integer, nullable=True)
    summary_duration_days = Column(Integer, nullable=True)
    completed_tasks_notes = Column(JSONB, nullable=False, server_default="{}")  # D-40
    issues = Column(Text, nullable=True)
    lessons = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    version = Column(Integer, nullable=False, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, nullable=False, server_default="false")
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("ProjectModel", backref="phase_reports")
    creator = relationship("UserModel", foreign_keys=[created_by])

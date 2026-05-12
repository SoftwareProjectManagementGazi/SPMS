"""Sprint closure snapshot — immutable point-in-time stats record.

Written by CloseSprintUseCase immediately before tasks are moved.
Used by the velocity report to prevent retroactive data changes when
tasks are reassigned between sprints after closure.
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.infrastructure.database.models.base import Base


class SprintSnapshotModel(Base):
    __tablename__ = "sprint_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    sprint_id = Column(
        Integer,
        ForeignKey("sprints.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One snapshot per sprint
        index=True,
    )
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_count = Column(Integer, nullable=False, default=0)
    completed_count = Column(Integer, nullable=False, default=0)
    total_points = Column(Integer, nullable=False, default=0)
    closed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

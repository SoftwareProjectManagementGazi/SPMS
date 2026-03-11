from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base, TimestampedMixin


class SprintModel(TimestampedMixin, Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), nullable=False)
    goal = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # updated_at provided by TimestampedMixin

    project = relationship("ProjectModel", back_populates="sprints")

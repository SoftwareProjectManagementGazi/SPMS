from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SqlEnum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base
from app.domain.entities.task import TaskPriority

class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)
    column_id = Column(Integer, ForeignKey("board_columns.id", ondelete="SET NULL"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(200), nullable=False)
    description = Column(String, nullable=True)
    priority = Column(SqlEnum(TaskPriority, name="task_priority"), default=TaskPriority.MEDIUM, nullable=True)
    points = Column(Integer, nullable=True)
    
    is_recurring = Column(Boolean, default=False)
    parent_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("ProjectModel", backref="tasks")
    sprint = relationship("SprintModel", backref="tasks")
    column = relationship("BoardColumnModel", backref="tasks")
    assignee = relationship("UserModel", foreign_keys=[assignee_id], backref="assigned_tasks")
    reporter = relationship("UserModel", foreign_keys=[reporter_id], backref="reported_tasks")
    parent_task = relationship("TaskModel", remote_side=[id], backref="subtasks")

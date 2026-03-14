from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum as SqlEnum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base, TimestampedMixin
from app.domain.entities.task import TaskPriority


class TaskModel(TimestampedMixin, Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)
    column_id = Column(Integer, ForeignKey("board_columns.id", ondelete="SET NULL"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(200), nullable=False)
    description = Column(String, nullable=True)
    priority = Column(SqlEnum(TaskPriority, name="task_priority"), default=TaskPriority.MEDIUM, nullable=True)
    points = Column(Integer, nullable=True)

    is_recurring = Column(Boolean, default=False)
    parent_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)

    # DATA-03: Recurring task schema columns (schema only — no business logic)
    recurrence_interval = Column(String(20), nullable=True, comment="daily, weekly, monthly")
    recurrence_end_date = Column(Date, nullable=True)
    recurrence_count = Column(Integer, nullable=True)

    # Phase 3: task key (e.g. "MP-42") and recurring series linkage
    task_key = Column(String(20), nullable=True, index=True)
    series_id = Column(String(36), nullable=True)

    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # updated_at provided by TimestampedMixin

    project = relationship("ProjectModel", backref="tasks")
    sprint = relationship("SprintModel", backref="tasks")
    column = relationship("BoardColumnModel", backref="tasks")
    assignee = relationship("UserModel", foreign_keys=[assignee_id], backref="assigned_tasks")
    reporter = relationship("UserModel", foreign_keys=[reporter_id], backref="reported_tasks")

    # DUZELTME: Iliski adini 'parent_task' yerine 'parent' yaptik.
    # Bu sayede hem Repository sorgusu (TaskModel.parent) hem de Entity (task.parent) ile eslecek.
    parent = relationship("TaskModel", remote_side=[id], backref="subtasks")

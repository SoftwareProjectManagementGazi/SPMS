from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base
from app.domain.entities.task import TaskStatus, TaskPriority

class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(SqlEnum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    priority = Column(SqlEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("ProjectModel", backref="tasks")
    assignee = relationship("UserModel", backref="assigned_tasks")

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SqlEnum, Date, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base
from app.domain.entities.project import Methodology
# Imports for relationships (if needed for typing, but SQLAlchemy strings handle it)

# Association Table for Project-User Many-to-Many
project_members = Table(
    "project_members",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("joined_at", DateTime(timezone=True), server_default=func.now())
)

class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(10), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    methodology = Column(SqlEnum(Methodology), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    manager = relationship("UserModel", backref="managed_projects")
    sprints = relationship("SprintModel", back_populates="project", cascade="all, delete-orphan")
    columns = relationship("BoardColumnModel", back_populates="project", cascade="all, delete-orphan")
    members = relationship("UserModel", secondary=project_members, backref="projects")

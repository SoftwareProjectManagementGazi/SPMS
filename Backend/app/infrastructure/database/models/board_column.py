from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base

class BoardColumnModel(Base):
    __tablename__ = "board_columns"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(50), nullable=False)
    order_index = Column(Integer, nullable=False)
    wip_limit = Column(Integer, default=0)

    # Phase 17 — workflow engine fields (migration 013).
    # All six are nullable at the DB level so rows that predate migration 013
    # remain valid; the backfill SQL in 013 derives sane defaults from order_index.
    # New writes flowing through SQLAlchemy use the python-side defaults below.
    category = Column(String(20), nullable=True, default="todo")
    is_initial = Column(Boolean, nullable=True, default=False)
    is_terminal = Column(Boolean, nullable=True, default=False)
    max_duration_days = Column(Integer, nullable=True, default=None)
    entry_policy = Column(String(20), nullable=True, default="any")
    exit_policy = Column(String(20), nullable=True, default="any")

    project = relationship("ProjectModel", back_populates="columns")

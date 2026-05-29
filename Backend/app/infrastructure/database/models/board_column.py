from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, text
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
    # server_default mirrors migration 013 (and the sprint.py default+server_default
    # pattern) so a Base.metadata.create_all schema gets the SAME DB-level defaults
    # the migration installs — previously the model only set Python-side default=,
    # leaving create_all columns with NULL column_default (model/migration drift).
    category = Column(String(20), nullable=True, default="todo", server_default=text("'todo'"))
    is_initial = Column(Boolean, nullable=True, default=False, server_default=text("false"))
    is_terminal = Column(Boolean, nullable=True, default=False, server_default=text("false"))
    max_duration_days = Column(Integer, nullable=True, default=None)
    entry_policy = Column(String(20), nullable=True, default="any", server_default=text("'any'"))
    exit_policy = Column(String(20), nullable=True, default="any", server_default=text("'any'"))

    project = relationship("ProjectModel", back_populates="columns")

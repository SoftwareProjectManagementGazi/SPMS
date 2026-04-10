from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.infrastructure.database.models.base import Base


class ProcessTemplateModel(Base):
    __tablename__ = "process_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    is_builtin = Column(Boolean, nullable=False, default=False)
    columns = Column(JSONB, nullable=False, default=list)
    recurring_tasks = Column(JSONB, nullable=False, default=list)
    behavioral_flags = Column(JSONB, nullable=False, default=dict)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

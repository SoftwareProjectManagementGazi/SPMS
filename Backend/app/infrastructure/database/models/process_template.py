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
    # Phase 9 D-27: defaults applied on project create or template re-apply
    default_artifacts = Column(JSONB, nullable=True)  # list[{name, linked_phase_id_suggestion, description}]
    default_phase_criteria = Column(JSONB, nullable=True)  # {phase_id: {auto: {...}, manual: [...]}}
    default_workflow = Column(JSONB, nullable=True)  # {mode, nodes, edges, groups}
    # Phase 9 D-43: cycle label i18n moves to template (out of Project)
    cycle_label_tr = Column(String(50), nullable=True)
    cycle_label_en = Column(String(50), nullable=True)

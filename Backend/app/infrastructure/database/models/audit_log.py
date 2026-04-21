from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base

# NOTE: AuditLogModel intentionally does NOT use TimestampedMixin.
# It is an immutable append-only log table — no soft-delete, no version tracking.


class AuditLogModel(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    # entity_type: "task" or "project"
    entity_type = Column(String(50), nullable=False)
    # entity_id: references task or project id (no FK constraint — cross-entity)
    entity_id = Column(Integer, nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    # user_id: FK to users.id ON DELETE SET NULL (nullable — system actions may have no user)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # action: "created", "updated", "deleted"
    action = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # D-08: Rich phase transition envelope + other structured metadata.
    # Python attribute is `extra_metadata` to avoid clashing with SQLAlchemy's
    # reserved Base.metadata class attribute (Pitfall 7 from 09-RESEARCH.md).
    # DB column is literally "metadata" (per D-08 verbatim — audit_log.metadata).
    # Added by migration 005_phase9_schema.
    extra_metadata = Column("metadata", JSONB, nullable=True)

    user = relationship("UserModel", backref="audit_logs")

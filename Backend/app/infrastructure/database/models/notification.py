from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SqlEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base
from app.domain.entities.notification import NotificationType

class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SqlEnum(NotificationType, name="notification_type"), nullable=False)
    is_read = Column(Boolean, default=False)
    related_entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserModel", backref="notifications")

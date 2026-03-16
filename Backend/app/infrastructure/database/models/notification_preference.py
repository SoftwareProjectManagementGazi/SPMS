from sqlalchemy import Column, Integer, ForeignKey, Boolean, JSON
from app.infrastructure.database.models.base import Base, TimestampedMixin


class NotificationPreferenceModel(TimestampedMixin, Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    preferences = Column(JSON, server_default="{}", nullable=False)
    email_enabled = Column(Boolean, default=True, nullable=False)
    deadline_days = Column(Integer, default=1, nullable=False)

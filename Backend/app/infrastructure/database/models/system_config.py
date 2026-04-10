from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.infrastructure.database.models.base import Base


class SystemConfigModel(Base):
    __tablename__ = "system_config"

    key = Column(String(100), primary_key=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

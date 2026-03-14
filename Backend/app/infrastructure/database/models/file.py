from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base, TimestampedMixin


class FileModel(TimestampedMixin, Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    # Phase 3: file size in bytes; stored at upload time
    file_size = Column(Integer, nullable=True)
    # updated_at provided by TimestampedMixin

    task = relationship("TaskModel", backref="files")
    uploader = relationship("UserModel", backref="uploaded_files")

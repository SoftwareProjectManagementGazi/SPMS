from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base

class BoardColumnModel(Base):
    __tablename__ = "board_columns"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(50), nullable=False)
    order_index = Column(Integer, nullable=False)
    wip_limit = Column(Integer, default=0)

    project = relationship("ProjectModel", back_populates="columns")

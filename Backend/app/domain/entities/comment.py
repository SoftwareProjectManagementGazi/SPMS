from pydantic import BaseModel, ConfigDict
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.domain.entities.user import User


class Comment(BaseModel):
    id: Optional[int] = None
    task_id: int
    user_id: int
    content: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False

    # Loaded via joinedload in repo; not persisted directly
    user: Optional[object] = None

    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

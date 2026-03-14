from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class File(BaseModel):
    id: Optional[int] = None
    task_id: int
    uploader_id: Optional[int] = None
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_at: Optional[datetime] = None
    is_deleted: bool = False

    # Loaded via joinedload in repo; not persisted directly
    uploader: Optional[object] = None

    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

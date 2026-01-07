from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class File(BaseModel):
    id: Optional[int] = None
    task_id: int
    uploader_id: Optional[int] = None
    file_name: str
    file_path: str
    uploaded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

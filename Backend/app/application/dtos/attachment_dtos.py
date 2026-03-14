from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class AttachmentUploaderDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str


class AttachmentResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    uploader: Optional[AttachmentUploaderDTO] = None
    uploaded_at: datetime

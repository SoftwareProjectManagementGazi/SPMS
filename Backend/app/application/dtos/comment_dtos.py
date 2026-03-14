from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CommentAuthorDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    avatar_path: Optional[str] = None


class CommentCreateDTO(BaseModel):
    task_id: int
    content: str


class CommentUpdateDTO(BaseModel):
    content: str


class CommentResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    content: str
    author: CommentAuthorDTO
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_edited: bool = False  # True if updated_at > created_at

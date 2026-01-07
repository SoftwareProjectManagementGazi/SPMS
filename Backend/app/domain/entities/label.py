from pydantic import BaseModel, ConfigDict
from typing import Optional

class Label(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    color: str

    model_config = ConfigDict(from_attributes=True)

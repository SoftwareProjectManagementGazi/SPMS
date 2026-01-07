from pydantic import BaseModel, ConfigDict
from typing import Optional

class Role(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

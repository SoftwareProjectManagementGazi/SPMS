from pydantic import BaseModel, ConfigDict
from typing import Optional


class Role(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    is_system_role: bool = False           # Phase 15 D-2.3
    icon_key: Optional[str] = None         # Phase 15 D-2.8
    color_token: Optional[str] = None      # Phase 15 D-2.8

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict
from typing import Optional

class BoardColumn(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    name: str
    order_index: int
    wip_limit: int = 0

    model_config = ConfigDict(from_attributes=True)

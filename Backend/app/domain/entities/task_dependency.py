from pydantic import BaseModel, ConfigDict
from typing import Optional


class TaskDependency(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    task_id: int
    depends_on_id: int
    dependency_type: str = "blocks"  # "blocks" = finish-to-start

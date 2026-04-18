from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SystemConfigEntry(BaseModel):
    key: str
    value: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

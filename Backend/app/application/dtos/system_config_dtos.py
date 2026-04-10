from pydantic import BaseModel
from typing import Dict


class SystemConfigResponseDTO(BaseModel):
    config: Dict[str, str]


class SystemConfigUpdateDTO(BaseModel):
    config: Dict[str, str]

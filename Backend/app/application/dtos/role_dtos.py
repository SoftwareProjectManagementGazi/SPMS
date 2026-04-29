"""Phase 15 RBAC-05 — Role DTOs (Plan 15-05).

DIP — pure Pydantic; no infrastructure imports. Reserved-name check at use case layer
(Pydantic regex covers character set; reserved-name is business logic per D-2.6).
"""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# D-2.6 — Latin + Turkish + digits + space + _ -
ROLE_NAME_RE = r"^[A-Za-zÇĞİÖŞÜçğıöşü0-9 _-]+$"
ROLE_NAME_MIN = 1
ROLE_NAME_MAX = 50

# Case-insensitive set used by use case layer (cannot enforce via Pydantic regex alone).
# CreateRoleUseCase / UpdateRoleUseCase compare `name.strip().lower()` against this set
# and raise RoleNameInvalidError(name, "reserved") on a hit (T-15-07 spoofing mitigation).
RESERVED_ROLE_NAMES = {"admin", "project manager", "member", "guest"}


class RoleCreateDTO(BaseModel):
    name: str = Field(min_length=ROLE_NAME_MIN, max_length=ROLE_NAME_MAX, pattern=ROLE_NAME_RE)
    description: Optional[str] = Field(default=None, max_length=255)
    icon_key: Optional[str] = Field(default=None, max_length=32)        # D-2.8 lucide icon key
    color_token: Optional[str] = Field(default=None, max_length=64)     # D-2.8 oklch token

    model_config = ConfigDict(from_attributes=True)


class RoleUpdateDTO(BaseModel):
    name: Optional[str] = Field(default=None, min_length=ROLE_NAME_MIN, max_length=ROLE_NAME_MAX, pattern=ROLE_NAME_RE)
    description: Optional[str] = Field(default=None, max_length=255)
    icon_key: Optional[str] = Field(default=None, max_length=32)
    color_token: Optional[str] = Field(default=None, max_length=64)

    model_config = ConfigDict(from_attributes=True)


class RoleResponseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon_key: Optional[str] = None
    color_token: Optional[str] = None
    is_system_role: bool = False

    model_config = ConfigDict(from_attributes=True)


class RoleListResponseDTO(BaseModel):
    items: List[RoleResponseDTO]
    total: int

    model_config = ConfigDict(from_attributes=True)

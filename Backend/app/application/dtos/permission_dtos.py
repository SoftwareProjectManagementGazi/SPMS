"""Phase 15 RBAC-05 — Permission + Matrix DTOs (Plan 15-05)."""
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


PermissionScope = Literal["system", "project"]


class PermissionResponseDTO(BaseModel):
    id: int
    key: str
    label_tr: Optional[str] = None
    label_en: Optional[str] = None
    scope: PermissionScope

    model_config = ConfigDict(from_attributes=True)


class MatrixCellDTO(BaseModel):
    role_id: int
    permission_id: int
    granted: bool


class PermissionMatrixResponseDTO(BaseModel):
    """Composite shape — Plan 15-09 frontend hydrates matrix from this single response."""
    roles: List["RoleResponseDTO"]      # forward ref — see role_dtos.py
    permissions: List[PermissionResponseDTO]
    cells: List[MatrixCellDTO]

    model_config = ConfigDict(from_attributes=True)


class UpdateMatrixCellRequestDTO(BaseModel):
    role_id: int
    perm_key: str = Field(min_length=1, max_length=64)
    granted: bool

    model_config = ConfigDict(from_attributes=True)


# Resolve forward ref
from app.application.dtos.role_dtos import RoleResponseDTO  # noqa: E402
PermissionMatrixResponseDTO.model_rebuild()

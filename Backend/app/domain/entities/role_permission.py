"""Phase 15 RBAC-01 — RolePermission junction entity (D-1.8 matrix bootstrap)."""
from pydantic import BaseModel, ConfigDict


class RolePermission(BaseModel):
    role_id: int
    permission_id: int

    model_config = ConfigDict(from_attributes=True)

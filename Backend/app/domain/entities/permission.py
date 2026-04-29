"""Phase 15 RBAC-01 — Permission domain entity (D-1.2 / D-3.5).

Pydantic v2 BaseModel — pure Python, no infrastructure imports per Clean Architecture.
"""
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class Permission(BaseModel):
    id: Optional[int] = None
    key: str  # e.g., "task.create", "admin.users.invite" (D-1.2 resource.action format)
    label_tr: Optional[str] = None
    label_en: Optional[str] = None
    scope: Literal["system", "project"]  # D-3.5

    model_config = ConfigDict(from_attributes=True)

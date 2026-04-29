"""Phase 15 Plan 15-06 — Re-export RBAC admin routers.

Routers are mounted in app/api/main.py via app.include_router; this module
re-exports the modules so callers (and AC literal checks) can reference them
via the package name.
"""
from app.api.v1 import admin_permissions, admin_roles  # noqa: F401

__all__ = ["admin_permissions", "admin_roles"]

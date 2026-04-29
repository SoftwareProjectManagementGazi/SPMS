"""Phase 15 RBAC-02 — _has_permission unit tests (Plan 15-06).

Validates the Admin super-role short-circuit (D-1.5) + JWT-claim membership
lookup (D-1.10) + None defense (Pitfall 18) for the Phase 15 perm DSL primitive.

These tests do NOT touch the DB — _has_permission reads the JWT-derived
`user.permissions` field only (no DB hit per D-1.10).
"""
from app.api.deps.auth import _has_permission
from app.domain.entities.role import Role
from app.domain.entities.user import User


def _user(role_name: str | None, perms: list[str] | None = None) -> User:
    """Build a User entity skeleton sufficient for permission checks.

    Phase 15 Plan 15-04 added User.permissions: list[str] = []. This helper
    keeps the test fixtures concise.
    """
    role = Role(id=1, name=role_name) if role_name else None
    kwargs: dict = {
        "email": "u@b.com",
        "password_hash": "x",
        "full_name": "U",
        "role": role,
    }
    if perms is not None:
        kwargs["permissions"] = perms
    return User(**kwargs)


def test_admin_super_role_returns_true_for_any_key():
    """D-1.5 Admin super-role short-circuit: returns True regardless of key."""
    user = _user("Admin", perms=[])
    assert _has_permission(user, "task.create") is True
    assert _has_permission(user, "any.random.key") is True
    assert _has_permission(user, "permission.matrix.update") is True


def test_non_admin_with_matching_perm_returns_true():
    """D-1.10 claim-only lookup: Member with task.create in claim returns True."""
    user = _user("Member", perms=["task.create", "comment.create"])
    assert _has_permission(user, "task.create") is True


def test_non_admin_without_matching_perm_returns_false():
    """Member without admin.users.invite in claim returns False."""
    user = _user("Member", perms=["task.create"])
    assert _has_permission(user, "admin.users.invite") is False


def test_user_with_no_permissions_field_defaults_to_empty():
    """Pitfall 18 None defense: user with default empty permissions returns False
    for any non-Admin key. Default is `permissions: list[str] = []` per entity.
    """
    user = _user("Guest")  # no perms kwarg → defaults to []
    assert _has_permission(user, "task.create") is False
    assert _has_permission(user, "admin.access") is False


def test_admin_short_circuit_does_not_require_perms_field():
    """D-1.5 Admin name comparison is case-insensitive; Admin without explicit
    perms still bypasses the claim check via _is_admin short-circuit.
    """
    user = _user("ADMIN")  # uppercase still matches via .lower() in _is_admin
    assert _has_permission(user, "task.create") is True
    user2 = _user("admin")  # lowercase
    assert _has_permission(user2, "task.create") is True

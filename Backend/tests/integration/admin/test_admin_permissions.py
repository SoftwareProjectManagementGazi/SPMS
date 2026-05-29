"""Phase 15 RBAC-05 — Admin permissions list integration tests (Plan 15-06).

Validates GET /api/v1/admin/permissions (+ optional scope filter).

P2 test-integrity fix: expected counts/keys are now DERIVED from the canonical
source of truth (``_seed_rbac.PERMISSIONS_SEED``) instead of a magic ``38``, and
the matrix is seeded into the test's transactional ``db_session`` via the
``rbac_clean`` fixture (which first wipes ambient RBAC rows). So the assertions
hold on a clean DB and would catch a permission the endpoint drops, or one the
seed fails to persist — neither of which the old "assert len == 38 against
whatever happens to be in a shared DB" could detect.
"""
import pytest

from app.infrastructure.database._seed_rbac import PERMISSIONS_SEED

pytestmark = pytest.mark.requires_db

# Derived from the single source of truth — not hard-coded literals.
EXPECTED_KEYS = {key for key, _, _, _ in PERMISSIONS_SEED}
EXPECTED_SYSTEM = {key for key, _, _, scope in PERMISSIONS_SEED if scope == "system"}
EXPECTED_PROJECT = {key for key, _, _, scope in PERMISSIONS_SEED if scope == "project"}


@pytest.mark.asyncio
async def test_list_returns_seeded_permissions_with_scopes(rbac_clean, authenticated_client):
    """GET /admin/permissions returns exactly the canonical perm set, partitioned
    into the canonical system/project scopes."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions")
        assert resp.status_code == 200, resp.text
        body = resp.json()

    assert isinstance(body, list)
    returned = {p["key"] for p in body}
    # kills mutation: an endpoint that drops/duplicates perms, or a seed that
    # fails to persist some, diverges from the canonical key set.
    assert returned == EXPECTED_KEYS
    assert {p["key"] for p in body if p["scope"] == "system"} == EXPECTED_SYSTEM
    assert {p["key"] for p in body if p["scope"] == "project"} == EXPECTED_PROJECT
    assert {p["scope"] for p in body} == {"system", "project"}


@pytest.mark.asyncio
async def test_list_filtered_by_scope_system(rbac_clean, authenticated_client):
    """?scope=system returns exactly the canonical system-scoped perms."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions?scope=system")
        assert resp.status_code == 200, resp.text
        body = resp.json()

    # kills mutation: a broken scope filter (ignoring scope, or wrong column)
    # would return the wrong subset.
    assert {p["key"] for p in body} == EXPECTED_SYSTEM
    assert all(p["scope"] == "system" for p in body)


@pytest.mark.asyncio
async def test_list_known_perm_keys_present(rbac_clean, authenticated_client):
    """Well-known perm keys are returned (and genuinely live in the canonical seed)."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions")
        keys = {p["key"] for p in resp.json()}

    for expected in (
        "task.create",
        "admin.users.invite",
        "permission.matrix.update",
        "admin.access",
        "milestone.create",
        "phase_report.delete",
    ):
        assert expected in EXPECTED_KEYS  # guard: the probe key is really in the seed
        assert expected in keys

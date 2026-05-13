"""Phase 15 RBAC-05 — Admin permissions list integration tests (Plan 15-06).

Validates GET /api/v1/admin/permissions (with optional scope filter) against
Migration 012 seed: 38 permissions = 12 system + 26 project (PERMISSIONS_SEED
in alembic/versions/012_phase15_rbac.py — renumbered from 007 after merge
with origin/main to re-chain after friend's 007-011 series).
"""
import pytest

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_list_returns_38_with_scope(authenticated_client):
    """Migration 007 seeds 38 perms total: 12 system + 26 project."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) == 38, f"expected 38 perms; got {len(body)}"
        scopes = {p["scope"] for p in body}
        assert scopes == {"system", "project"}
        system_count = sum(1 for p in body if p["scope"] == "system")
        project_count = sum(1 for p in body if p["scope"] == "project")
        assert system_count == 12, f"expected 12 system perms; got {system_count}"
        assert project_count == 26, f"expected 26 project perms; got {project_count}"


@pytest.mark.asyncio
async def test_list_filtered_by_scope_system(authenticated_client):
    """?scope=system filters to the 12 admin.* + permission.matrix.update perms."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions?scope=system")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert all(p["scope"] == "system" for p in body)
        assert len(body) == 12


@pytest.mark.asyncio
async def test_list_known_perm_keys_present(authenticated_client):
    """Sanity-check well-known perm keys exist in the response."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions")
        keys = {p["key"] for p in resp.json()}
        assert "task.create" in keys
        assert "admin.users.invite" in keys
        assert "permission.matrix.update" in keys
        assert "admin.access" in keys
        # Phase 15 D-3.5 LIFE-related project-scope perms
        assert "milestone.create" in keys
        assert "phase_report.delete" in keys

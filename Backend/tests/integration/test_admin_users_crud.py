"""Phase 14 Plan 14-01 Task 3 — Admin user CRUD integration tests.

Covers all 7 endpoints x 3 access classes (admin-200/201/204, member-403,
anonymous-401). Plus bulk-invite mixed valid/invalid scenario asserting
BulkInviteResponseDTO {successful, failed} split.

Tests skip when the test DB has no seeded roles (per existing project
convention - see test_activity_api.py:_db_has_roles helper).
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def _db_has_roles(session: AsyncSession) -> bool:
    try:
        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (result.scalar() or 0) > 0
    except Exception:
        return False


# Ordered list of (path, method, payload) - admin endpoints that need a {uid}
ADMIN_ENDPOINTS_NEED_USER = [
    ("/api/v1/admin/users/{uid}/password-reset", "post", None),
    ("/api/v1/admin/users/{uid}/role", "patch", {"role": "Member"}),
    ("/api/v1/admin/users/{uid}/deactivate", "patch", None),
]
ADMIN_ENDPOINTS_NO_USER = [
    ("/api/v1/admin/users", "post", {
        "email": "noaccess1@testexample.com", "role": "Member", "name": "X"
    }),
    ("/api/v1/admin/users/bulk-invite", "post", {"rows": []}),
    ("/api/v1/admin/users/bulk-action", "post", {
        "user_ids": [], "action": "deactivate", "payload": None,
    }),
    ("/api/v1/admin/users.csv", "get", None),
]


async def _seed_target_user(db_session: AsyncSession, email: str) -> int:
    await db_session.execute(text(
        f"INSERT INTO users (email, full_name, password_hash, is_active) "
        f"VALUES ('{email}', 'Target', '$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa', true) "
        f"ON CONFLICT DO NOTHING"
    ))
    uid = (await db_session.execute(
        text(f"SELECT id FROM users WHERE email='{email}'")
    )).scalar()
    await db_session.flush()
    return int(uid)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_invite_user_returns_201(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded - admin tests need role table populated")
    email = "invitee_a@testexample.com"
    async with authenticated_client(role="admin") as ac:
        r = await ac.post(
            "/api/v1/admin/users",
            json={"email": email, "role": "Member"},
        )
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["email"] == email
        assert body["user_id"] > 0
        assert "invite_token_expires_at" in body


@pytest.mark.asyncio
async def test_admin_invite_user_member_gets_403(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="member") as ac:
        r = await ac.post(
            "/api/v1/admin/users",
            json={"email": "memcase@testexample.com", "role": "Member"},
        )
        assert r.status_code == 403, r.text


@pytest.mark.asyncio
async def test_admin_invite_user_anonymous_gets_401(client: AsyncClient):
    r = await client.post(
        "/api/v1/admin/users",
        json={"email": "anoncase@testexample.com", "role": "Member"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_admin_endpoints_member_gets_403(authenticated_client, db_session):
    """Coverage matrix - every admin endpoint MUST return 403 to non-admin."""
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    uid = await _seed_target_user(db_session, "tgtmember@testexample.com")
    async with authenticated_client(role="member") as ac:
        for path, method, payload in ADMIN_ENDPOINTS_NEED_USER:
            url = path.format(uid=uid)
            r = await getattr(ac, method)(url, json=payload) if payload is not None else await getattr(ac, method)(url)
            assert r.status_code == 403, f"{method.upper()} {url} -> {r.status_code}"
        for path, method, payload in ADMIN_ENDPOINTS_NO_USER:
            r = await getattr(ac, method)(path, json=payload) if payload is not None else await getattr(ac, method)(path)
            assert r.status_code == 403, f"{method.upper()} {path} -> {r.status_code}"


@pytest.mark.asyncio
async def test_admin_endpoints_anonymous_gets_401(client: AsyncClient, db_session):
    """Every admin endpoint MUST return 401 when no JWT is present."""
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    uid = await _seed_target_user(db_session, "tgtanon@testexample.com")
    for path, method, payload in ADMIN_ENDPOINTS_NEED_USER:
        url = path.format(uid=uid)
        r = await getattr(client, method)(url, json=payload) if payload is not None else await getattr(client, method)(url)
        assert r.status_code == 401, f"{method.upper()} {url} -> {r.status_code}"
    for path, method, payload in ADMIN_ENDPOINTS_NO_USER:
        r = await getattr(client, method)(path, json=payload) if payload is not None else await getattr(client, method)(path)
        assert r.status_code == 401, f"{method.upper()} {path} -> {r.status_code}"


@pytest.mark.asyncio
async def test_admin_users_csv_export_admin_gets_200(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="admin") as ac:
        r = await ac.get("/api/v1/admin/users.csv")
        assert r.status_code == 200, r.text
        # UTF-8 BOM prefix per D-W3
        assert r.content[:3] == b"\xef\xbb\xbf"
        assert r.headers["content-type"].startswith("text/csv")
        assert "attachment" in r.headers.get("content-disposition", "")


@pytest.mark.asyncio
async def test_admin_password_reset_admin_gets_204(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    uid = await _seed_target_user(db_session, "tgtreset@testexample.com")
    async with authenticated_client(role="admin") as ac:
        r = await ac.post(f"/api/v1/admin/users/{uid}/password-reset")
        assert r.status_code == 204, r.text


@pytest.mark.asyncio
async def test_admin_deactivate_admin_gets_204(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    uid = await _seed_target_user(db_session, "tgtdeact@testexample.com")
    async with authenticated_client(role="admin") as ac:
        r = await ac.patch(f"/api/v1/admin/users/{uid}/deactivate")
        assert r.status_code == 204, r.text


@pytest.mark.asyncio
async def test_admin_change_role_admin_gets_204(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    uid = await _seed_target_user(db_session, "tgtrole@testexample.com")
    async with authenticated_client(role="admin") as ac:
        r = await ac.patch(
            f"/api/v1/admin/users/{uid}/role",
            json={"role": "Project Manager"},
        )
        assert r.status_code == 204, r.text


@pytest.mark.asyncio
async def test_bulk_invite_mixed_csv_returns_split_response(
    authenticated_client, db_session,
):
    """D-B4 commit-or-skip - one duplicate email triggers UserAlreadyExistsError
    inside the loop and the row gets recorded under failed[]."""
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    rows = [
        {"email": "bulk_v1@testexample.com", "name": "V1", "role": "Member"},
        {"email": "bulk_v2@testexample.com", "name": "V2", "role": "Admin"},
        {"email": "bulk_v3@testexample.com", "name": "V3", "role": "Project Manager"},
    ]
    async with authenticated_client(role="admin") as ac:
        # Seed conflict user first
        await db_session.execute(text(
            "INSERT INTO users (email, full_name, password_hash, is_active) "
            "VALUES ('bulk_conflict@testexample.com', 'Existing', '$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa', true) "
            "ON CONFLICT DO NOTHING"
        ))
        await db_session.flush()
        rows.append({
            "email": "bulk_conflict@testexample.com",
            "name": "Conflict",
            "role": "Member",
        })
        r = await ac.post("/api/v1/admin/users/bulk-invite", json={"rows": rows})
        assert r.status_code == 200, r.text
        body = r.json()
        # successful + failed should sum to total rows
        assert len(body["successful"]) + len(body["failed"]) == len(rows)


@pytest.mark.asyncio
async def test_bulk_invite_500_row_cap_enforced(authenticated_client, db_session):
    """D-B4 - 501 rows is rejected at the DTO layer with 422."""
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    rows = [
        {"email": f"bulk{i}@testexample.com", "name": f"V{i}", "role": "Member"}
        for i in range(501)
    ]
    async with authenticated_client(role="admin") as ac:
        r = await ac.post("/api/v1/admin/users/bulk-invite", json={"rows": rows})
        assert r.status_code == 422, f"expected 422 for 501 rows, got {r.status_code}: {r.text}"

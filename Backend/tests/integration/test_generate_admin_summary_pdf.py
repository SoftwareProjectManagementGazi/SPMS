"""Phase 14 Plan 14-01 Task 3 — Admin summary PDF endpoint integration tests.

Verifies:
- D-B6: GET /admin/summary.pdf returns application/pdf with attachment header
- Body starts with %PDF magic bytes
- Access matrix: admin-200, member-403, anonymous-401

Skip when fpdf2 not installed locally.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _has_fpdf() -> bool:
    try:
        import fpdf  # noqa: F401
        return True
    except ImportError:
        return False


async def _db_has_roles(session: AsyncSession) -> bool:
    try:
        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (result.scalar() or 0) > 0
    except Exception:
        return False


@pytest.mark.asyncio
async def test_admin_summary_pdf_admin_returns_pdf(authenticated_client, db_session):
    if not _has_fpdf():
        pytest.skip("fpdf2 not installed locally")
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="admin") as ac:
        r = await ac.get("/api/v1/admin/summary.pdf")
        assert r.status_code == 200, r.text
        assert r.headers["content-type"].startswith("application/pdf")
        assert "attachment" in r.headers.get("content-disposition", "")
        # %PDF magic bytes
        assert r.content[:4] == b"%PDF", \
            f"expected %PDF magic, got {r.content[:8]!r}"


@pytest.mark.asyncio
async def test_admin_summary_pdf_member_gets_403(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="member") as ac:
        r = await ac.get("/api/v1/admin/summary.pdf")
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_summary_pdf_anonymous_gets_401(client: AsyncClient):
    r = await client.get("/api/v1/admin/summary.pdf")
    assert r.status_code == 401

"""TASK-08: Comments API — real integration tests for the /api/v1/comments router.

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes by the test audit). These drive the real endpoints against the test
DB, exercising the require_permission gate, the author/admin authorization rule,
and the soft-delete behaviour.

Setup seeds a project + task directly via the transactional ``db_session`` (the
same session the API calls run against — everything rolls back after the test).
``permitted_client`` issues a JWT carrying an explicit permissions[] claim so the
comment.* permission checks are satisfied without depending on the live role
matrix.
"""
import pytest
from sqlalchemy import text

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


async def _seed_project_and_task(db_session, key: str):
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES (:k, 'Comments Test', now(), 'KANBAN', 'ACTIVE')"
            ),
            {"k": key},
        )
        await db_session.flush()
    pid = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    await db_session.execute(
        text("INSERT INTO tasks (title, project_id, priority) VALUES ('Commentable', :p, 'MEDIUM')"),
        {"p": pid},
    )
    await db_session.flush()
    tid = (
        await db_session.execute(
            text("SELECT id FROM tasks WHERE project_id=:p ORDER BY id DESC LIMIT 1"),
            {"p": pid},
        )
    ).scalar()
    return pid, tid


@pytest.mark.asyncio
async def test_post_comment_creates_comment(permitted_client, db_session):
    _, tid = await _seed_project_and_task(db_session, "CMTP")
    async with permitted_client(perms=["comment.create"], role="admin") as client:
        r = await client.post(
            "/api/v1/comments/", json={"task_id": tid, "content": "hello"}
        )
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["content"] == "hello"
        assert body["task_id"] == tid
        # Actually persisted (visible on the list endpoint).
        r_list = await client.get(f"/api/v1/comments/task/{tid}")
        assert r_list.status_code == 200, r_list.text
        assert any(c["id"] == body["id"] for c in r_list.json())


@pytest.mark.asyncio
async def test_get_comments_by_task_returns_list(permitted_client, db_session):
    _, tid = await _seed_project_and_task(db_session, "CMTL")
    async with permitted_client(perms=["comment.create"], role="admin") as client:
        for content in ("first", "second"):
            r = await client.post(
                "/api/v1/comments/", json={"task_id": tid, "content": content}
            )
            assert r.status_code == 201, r.text
        r_list = await client.get(f"/api/v1/comments/task/{tid}")
        assert r_list.status_code == 200, r_list.text
        # kills mutation: a list endpoint ignoring task_id / returning [] fails here.
        assert [c["content"] for c in r_list.json()] == ["first", "second"]


@pytest.mark.asyncio
async def test_patch_comment_updates_comment_by_author(permitted_client, db_session):
    _, tid = await _seed_project_and_task(db_session, "CMTPA")
    async with permitted_client(perms=["comment.create", "comment.edit"], role="admin") as client:
        r = await client.post(
            "/api/v1/comments/", json={"task_id": tid, "content": "original"}
        )
        assert r.status_code == 201, r.text
        cid = r.json()["id"]
        # Same user is the author -> exercises the requester_id == user_id branch.
        r2 = await client.patch(f"/api/v1/comments/{cid}", json={"content": "edited"})
        assert r2.status_code == 200, r2.text
        assert r2.json()["content"] == "edited"
        # Persisted, not just echoed.
        r_list = await client.get(f"/api/v1/comments/task/{tid}")
        edited = next(c for c in r_list.json() if c["id"] == cid)
        assert edited["content"] == "edited"


@pytest.mark.asyncio
async def test_delete_comment_by_author_removes_comment(permitted_client, db_session):
    _, tid = await _seed_project_and_task(db_session, "CMTD")
    async with permitted_client(perms=["comment.create", "comment.delete"], role="admin") as client:
        r = await client.post(
            "/api/v1/comments/", json={"task_id": tid, "content": "delete me"}
        )
        assert r.status_code == 201, r.text
        cid = r.json()["id"]
        r_del = await client.delete(f"/api/v1/comments/{cid}")
        assert r_del.status_code == 204, r_del.text
        # kills mutation: a delete that doesn't soft-delete leaves it on the list.
        r_list = await client.get(f"/api/v1/comments/task/{tid}")
        assert all(c["id"] != cid for c in r_list.json())


@pytest.mark.asyncio
async def test_patch_comment_by_non_author_returns_403(permitted_client, db_session):
    _, tid = await _seed_project_and_task(db_session, "CMT403")
    # The author (admin) creates a comment...
    async with permitted_client(perms=["comment.create"], role="admin") as author:
        r = await author.post(
            "/api/v1/comments/", json={"task_id": tid, "content": "mine"}
        )
        assert r.status_code == 201, r.text
        cid = r.json()["id"]
    # ...a different, non-admin user (with comment.edit) must NOT be able to edit it.
    async with permitted_client(perms=["comment.edit"], role="member") as other:
        r2 = await other.patch(f"/api/v1/comments/{cid}", json={"content": "hijack"})
    # kills mutation: dropping the author/admin authorization check would 200 here.
    assert r2.status_code == 403, r2.text

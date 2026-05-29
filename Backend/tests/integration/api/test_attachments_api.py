"""TASK-09: Attachments API — real integration tests for /api/v1/attachments.

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes by the test audit). The endpoints ship in app/api/v1/attachments.py
and the logic in app/application/use_cases/manage_attachments.py — the stubs
claimed "not implemented yet" while the feature was live.

These drive the real endpoints against the test DB + real disk writes:
  POST   /api/v1/attachments/           (multipart: task_id form field + file)
  GET    /api/v1/attachments/download/{file_id}

Note the real routes differ from the stub docstrings' invented paths
(``/tasks/{id}/attachments``). The size limit lives in the use case as a class
constant; the oversized test monkeypatches it small so it exercises the real
size-check + the router's 413 mapping without a 25 MB payload.

Auth: admin bypasses the per-task project-membership check on upload
(attachments.py ``_is_admin`` short-circuit), so ``authenticated_client(role="admin")``
is sufficient. Uploaded files are cleaned off disk after each test.
"""
from pathlib import Path

import pytest
from sqlalchemy import text

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db

# tests/integration/api/<this file> -> parents[3] == Backend (matches the use
# case's own _BACKEND_DIR, where uploads are stored).
_BACKEND_DIR = Path(__file__).resolve().parents[3]


async def _seed_project_and_task(db_session, key: str):
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES (:k, 'Attachments Test', now(), 'KANBAN', 'ACTIVE')"
            ),
            {"k": key},
        )
        await db_session.flush()
    pid = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    await db_session.execute(
        text("INSERT INTO tasks (title, project_id, priority) VALUES ('Attachable', :p, 'MEDIUM')"),
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


def _cleanup(file_path: str | None) -> None:
    """Best-effort removal of the on-disk file created by an upload."""
    if not file_path:
        return
    try:
        (_BACKEND_DIR / file_path).unlink(missing_ok=True)
    except OSError:
        pass


@pytest.mark.asyncio
async def test_post_attachment_uploads_file(authenticated_client, db_session):
    """POST returns 201 with correct metadata and the file is actually persisted."""
    _, tid = await _seed_project_and_task(db_session, "ATTUP")
    content = b"attachment body bytes"
    file_path = None
    try:
        async with authenticated_client(role="admin") as client:
            r = await client.post(
                "/api/v1/attachments/",
                data={"task_id": str(tid)},
                files={"file": ("notes.txt", content, "text/plain")},
            )
            assert r.status_code == 201, r.text
            body = r.json()
            file_path = body.get("file_path")
            assert body["file_name"] == "notes.txt"
            assert body["task_id"] == tid              # kills mutation: task_id dropped/hard-coded
            assert body["file_size"] == len(content)   # kills mutation: size mis-recorded
            assert body["id"] is not None
            # Actually persisted to DB + disk: the download endpoint can fetch it.
            r_dl = await client.get(f"/api/v1/attachments/download/{body['id']}")
            assert r_dl.status_code == 200, r_dl.text
    finally:
        _cleanup(file_path)  # runs even on assertion failure — no orphaned files


@pytest.mark.asyncio
async def test_get_attachment_download_returns_file(authenticated_client, db_session):
    """GET /download/{id} returns the exact bytes with an octet-stream content type."""
    _, tid = await _seed_project_and_task(db_session, "ATTDL")
    content = b"the-real-file-bytes-\x00\x01\x02-end"
    file_path = None
    try:
        async with authenticated_client(role="admin") as client:
            r = await client.post(
                "/api/v1/attachments/",
                data={"task_id": str(tid)},
                files={"file": ("data.bin", content, "application/octet-stream")},
            )
            assert r.status_code == 201, r.text
            body = r.json()
            file_path = body.get("file_path")
            r_dl = await client.get(f"/api/v1/attachments/download/{body['id']}")
            assert r_dl.status_code == 200, r_dl.text
            # kills mutation: a download returning wrong/empty bytes fails here.
            assert r_dl.content == content
            assert r_dl.headers["content-type"] == "application/octet-stream"
    finally:
        _cleanup(file_path)  # runs even on assertion failure — no orphaned files


@pytest.mark.asyncio
async def test_post_blocked_extension_returns_400(authenticated_client, db_session):
    """An executable extension is rejected with 400 (no file written)."""
    _, tid = await _seed_project_and_task(db_session, "ATTEXE")
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            "/api/v1/attachments/",
            data={"task_id": str(tid)},
            files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
        )
    # kills mutation: dropping the BLOCKED_EXTENSIONS check would 201 here.
    assert r.status_code == 400, r.text


@pytest.mark.asyncio
async def test_post_oversized_file_returns_413(authenticated_client, db_session, monkeypatch):
    """A file over the size limit is rejected with 413 (limit patched small so the
    real size-check + the router's 413 mapping run without a 25 MB payload)."""
    from app.application.use_cases.manage_attachments import UploadAttachmentUseCase

    monkeypatch.setattr(UploadAttachmentUseCase, "MAX_SIZE_BYTES", 8)
    _, tid = await _seed_project_and_task(db_session, "ATTBIG")
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            "/api/v1/attachments/",
            data={"task_id": str(tid)},
            files={"file": ("big.txt", b"123456789", "text/plain")},  # 9 bytes > 8
        )
    # kills mutation: dropping the size check would 201 here.
    assert r.status_code == 413, r.text

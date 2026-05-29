"""TASK-03: Attachment management — real unit tests for UploadAttachmentUseCase.

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes by the test audit) with tests that drive the real use case against
an in-memory ``IAttachmentRepository``. The upload-success test redirects the
on-disk write to a temp dir via monkeypatch so it exercises the real file I/O
without polluting the repo's ``static/uploads`` tree.

Note: the former ``test_download_attachment_returns_file_bytes`` stub was
removed — there is no ``DownloadAttachmentUseCase`` in the application layer;
downloads are served directly by the attachments router (FileResponse) and are
covered at the integration layer (tests/integration/api/test_attachments_api.py).
"""
import pytest

from app.application.use_cases.manage_attachments import UploadAttachmentUseCase
from app.domain.entities.file import File


class FakeAttachmentRepository:
    """In-memory ``IAttachmentRepository`` that records created File rows."""

    def __init__(self):
        self.created: list[File] = []
        self._next_id = 1

    async def create(self, file: File) -> File:
        from datetime import datetime

        file.id = self._next_id
        self._next_id += 1
        file.uploaded_at = datetime(2026, 1, 1, 12, 0, 0)
        self.created.append(file)
        return file

    async def get_by_id(self, file_id: int):  # pragma: no cover - not used here
        return next((f for f in self.created if f.id == file_id), None)

    async def get_by_task(self, task_id: int):  # pragma: no cover - not used here
        return [f for f in self.created if f.task_id == task_id]

    async def soft_delete(self, file_id: int) -> bool:  # pragma: no cover
        return True


@pytest.mark.asyncio
async def test_upload_attachment_stores_file_and_returns_dto(monkeypatch, tmp_path):
    """A permitted upload writes the bytes to disk and returns a populated DTO."""
    # Redirect the use case's on-disk write target to a temp dir.
    monkeypatch.setattr(
        "app.application.use_cases.manage_attachments._BACKEND_DIR", tmp_path
    )
    repo = FakeAttachmentRepository()
    use_case = UploadAttachmentUseCase(repo)
    content = b"hello attachment bytes"

    dto = await use_case.execute(
        task_id=42, filename="notes.pdf", content=content, uploader_id=7
    )

    # DTO reflects the real upload
    assert dto.id is not None
    assert dto.task_id == 42
    assert dto.file_name == "notes.pdf"
    assert dto.file_size == len(content)
    # Path is RELATIVE (not absolute) and lands under the tasks upload dir.
    assert dto.file_path == f"static/uploads/tasks/{dto.file_path.split('/')[-1]}"
    assert not dto.file_path.startswith("/")
    assert dto.file_path.endswith(".pdf")
    # The bytes were actually written to disk at that relative path.
    written = tmp_path / dto.file_path
    assert written.exists()
    assert written.read_bytes() == content
    # Exactly one row persisted, with the real byte size.
    assert len(repo.created) == 1
    assert repo.created[0].file_size == len(content)


@pytest.mark.asyncio
async def test_blocked_extension_raises_validation_error(monkeypatch, tmp_path):
    """A blocked extension (.exe) is rejected before anything is persisted."""
    monkeypatch.setattr(
        "app.application.use_cases.manage_attachments._BACKEND_DIR", tmp_path
    )
    repo = FakeAttachmentRepository()
    use_case = UploadAttachmentUseCase(repo)

    with pytest.raises(ValueError):
        await use_case.execute(
            task_id=1, filename="malware.exe", content=b"MZ...", uploader_id=7
        )

    # kills mutation: emptying BLOCKED_EXTENSIONS would let this through and persist.
    assert repo.created == []
    # No file was written either.
    assert not (tmp_path / "static" / "uploads" / "tasks").exists()


@pytest.mark.asyncio
async def test_blocked_extension_is_case_insensitive(monkeypatch, tmp_path):
    """Uppercase blocked extensions (.EXE) are normalised and still rejected."""
    monkeypatch.setattr(
        "app.application.use_cases.manage_attachments._BACKEND_DIR", tmp_path
    )
    repo = FakeAttachmentRepository()
    use_case = UploadAttachmentUseCase(repo)

    with pytest.raises(ValueError):
        await use_case.execute(
            task_id=1, filename="installer.EXE", content=b"x", uploader_id=7
        )
    assert repo.created == []


@pytest.mark.asyncio
async def test_file_exceeding_25mb_raises_validation_error(monkeypatch, tmp_path):
    """A file larger than MAX_SIZE_BYTES (25 MB) is rejected before persistence."""
    monkeypatch.setattr(
        "app.application.use_cases.manage_attachments._BACKEND_DIR", tmp_path
    )
    repo = FakeAttachmentRepository()
    use_case = UploadAttachmentUseCase(repo)
    oversized = b"\0" * (UploadAttachmentUseCase.MAX_SIZE_BYTES + 1)

    with pytest.raises(ValueError):
        await use_case.execute(
            task_id=1, filename="big.pdf", content=oversized, uploader_id=7
        )

    # kills mutation: removing/raising the size cap would persist the oversized file.
    assert repo.created == []


@pytest.mark.asyncio
async def test_file_at_25mb_limit_is_accepted(monkeypatch, tmp_path):
    """A file exactly at the 25 MB cap is allowed (boundary is inclusive)."""
    monkeypatch.setattr(
        "app.application.use_cases.manage_attachments._BACKEND_DIR", tmp_path
    )
    repo = FakeAttachmentRepository()
    use_case = UploadAttachmentUseCase(repo)
    at_limit = b"\0" * UploadAttachmentUseCase.MAX_SIZE_BYTES

    dto = await use_case.execute(
        task_id=1, filename="exact.pdf", content=at_limit, uploader_id=7
    )

    assert dto.file_size == UploadAttachmentUseCase.MAX_SIZE_BYTES
    assert len(repo.created) == 1

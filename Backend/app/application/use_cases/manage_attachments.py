import uuid
from pathlib import Path
from typing import List

from fastapi import HTTPException, status

from app.domain.entities.file import File
from app.domain.repositories.attachment_repository import IAttachmentRepository
from app.domain.exceptions import AttachmentNotFoundError
from app.application.dtos.attachment_dtos import (
    AttachmentResponseDTO,
    AttachmentUploaderDTO,
)

# Absolute path to the Backend directory (one level up from this file's package root)
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent


def _is_admin(user) -> bool:
    """Return True when the user holds the admin role."""
    return (
        user.role is not None
        and user.role.name.lower() == "admin"
    )


def _map_to_response(file: File) -> AttachmentResponseDTO:
    """Map a File domain entity to AttachmentResponseDTO."""
    uploader_dto = None
    if file.uploader is not None:
        uploader_dto = AttachmentUploaderDTO(
            id=file.uploader.id,
            full_name=file.uploader.full_name,
        )
    return AttachmentResponseDTO(
        id=file.id,
        task_id=file.task_id,
        file_name=file.file_name,
        file_path=file.file_path,
        file_size=file.file_size,
        uploader=uploader_dto,
        uploaded_at=file.uploaded_at,
    )


class ListAttachmentsUseCase:
    def __init__(self, attachment_repo: IAttachmentRepository):
        self.attachment_repo = attachment_repo

    async def execute(self, task_id: int) -> List[AttachmentResponseDTO]:
        files = await self.attachment_repo.get_by_task(task_id)
        return [_map_to_response(f) for f in files]


class UploadAttachmentUseCase:
    BLOCKED_EXTENSIONS = {".exe", ".sh", ".bat", ".ps1", ".msi", ".dmg"}
    MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

    def __init__(self, attachment_repo: IAttachmentRepository):
        self.attachment_repo = attachment_repo

    async def execute(
        self,
        task_id: int,
        filename: str,
        content: bytes,
        uploader_id: int,
    ) -> AttachmentResponseDTO:
        suffix = Path(filename).suffix.lower()

        # 1. Check blocked extension
        if suffix in self.BLOCKED_EXTENSIONS:
            raise ValueError("File type not allowed")

        # 2. Check file size
        if len(content) > self.MAX_SIZE_BYTES:
            raise ValueError("File exceeds 25 MB limit")

        # 3. Generate unique stored filename
        stored_name = f"{uuid.uuid4()}{suffix}"

        # 4. Write to disk
        upload_dir = _BACKEND_DIR / "static" / "uploads" / "tasks"
        upload_dir.mkdir(parents=True, exist_ok=True)
        (upload_dir / stored_name).write_bytes(content)

        # 5. Relative path (matching Phase 2 avatar pattern)
        relative_path = f"static/uploads/tasks/{stored_name}"

        # 6. Create DB record
        file_entity = File(
            task_id=task_id,
            uploader_id=uploader_id,
            file_name=filename,
            file_path=relative_path,
            file_size=len(content),
        )
        created = await self.attachment_repo.create(file_entity)
        return _map_to_response(created)


class DeleteAttachmentUseCase:
    def __init__(self, attachment_repo: IAttachmentRepository):
        self.attachment_repo = attachment_repo

    async def execute(
        self, file_id: int, requester_id: int, requester=None
    ) -> None:
        file = await self.attachment_repo.get_by_id(file_id)
        if file is None:
            raise AttachmentNotFoundError(file_id)

        # Authorization: only uploader or admin can delete
        if requester_id != file.uploader_id:
            if requester is None or not _is_admin(requester):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not the uploader of this attachment",
                )

        await self.attachment_repo.soft_delete(file_id)

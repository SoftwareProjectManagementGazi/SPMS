from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.api.dependencies import (
    get_current_user,
    get_task_project_member,
    get_task_repo,
    get_project_repo,
    get_attachment_repo,
    _is_admin,
)
from app.domain.entities.user import User
from app.domain.repositories.attachment_repository import IAttachmentRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.exceptions import AttachmentNotFoundError
from app.application.dtos.attachment_dtos import AttachmentResponseDTO
from app.application.use_cases.manage_attachments import (
    ListAttachmentsUseCase,
    UploadAttachmentUseCase,
    DeleteAttachmentUseCase,
)

router = APIRouter()

# Backend root directory — attachments are stored relative to this
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent


@router.get("/task/{task_id}", response_model=List[AttachmentResponseDTO])
async def list_attachments(
    task_id: int,
    current_user: User = Depends(get_task_project_member),
    attachment_repo: IAttachmentRepository = Depends(get_attachment_repo),
):
    use_case = ListAttachmentsUseCase(attachment_repo)
    return await use_case.execute(task_id)


@router.post("/", response_model=AttachmentResponseDTO, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    task_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    attachment_repo: IAttachmentRepository = Depends(get_attachment_repo),
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
):
    # Enforce project membership: task_id comes from form body, not path
    task = await task_repo.get_by_id(task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(task.project_id, current_user.id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project",
            )

    content = await file.read()
    use_case = UploadAttachmentUseCase(attachment_repo)
    try:
        return await use_case.execute(
            task_id=task_id,
            filename=file.filename,
            content=content,
            uploader_id=current_user.id,
        )
    except ValueError as e:
        msg = str(e)
        if "File type not allowed" in msg:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        if "25 MB" in msg:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=msg
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


@router.get("/download/{file_id}")
async def download_attachment(
    file_id: int,
    current_user: User = Depends(get_current_user),
    attachment_repo: IAttachmentRepository = Depends(get_attachment_repo),
):
    file = await attachment_repo.get_by_id(file_id)
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attachment {file_id} not found",
        )

    # Build absolute path from stored relative path
    abs_path = _BACKEND_DIR / file.file_path
    if not abs_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )

    return FileResponse(
        path=str(abs_path),
        filename=file.file_name,
        media_type="application/octet-stream",
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    file_id: int,
    current_user: User = Depends(get_current_user),
    attachment_repo: IAttachmentRepository = Depends(get_attachment_repo),
):
    use_case = DeleteAttachmentUseCase(attachment_repo)
    try:
        await use_case.execute(file_id, current_user.id, current_user)
    except AttachmentNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

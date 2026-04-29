"""API-08 / D-36 Artifact CRUD router.

Permissions (D-36 baseline + Phase 15 D-3.5 / D-3.6 perm DSL):
  GET (list/detail) — any project member
  POST/PATCH/DELETE — Hibrit 2-tier (D-1.14):
    tier 1: require_permission("artifact.create" / "artifact.edit" / "artifact.delete")
    tier 2: inline RPTA (Admin/PM/TL — yan yana, D-3.6)
  PATCH /artifacts/{id}/mine — assignee only (status/note/file_id), no perm gate
    because the assignee writes their own work product (D-36 self-edit semantics).

  Resource-specific perms per D-3.5 — Migration 007 seeds artifact.create/edit/delete
  distinctly. The legacy umbrella alias `require_permission("lifecycle.edit")` is
  intentionally NOT used here (kept reserved for the dedicated phase_transitions router).
"""
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from app.api.deps.auth import get_current_user, _is_admin, require_permission  # Phase 15 D-3.5 / D-3.6 — artifact.* perms
from app.api.deps.artifact import get_artifact_repo
from app.api.deps.project import get_project_repo
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.manage_artifacts import (
    CreateArtifactUseCase,
    UpdateArtifactByAssigneeUseCase,
    UpdateArtifactByManagerUseCase,
    DeleteArtifactUseCase,
    ListArtifactsUseCase,
    GetArtifactUseCase,
)
from app.application.dtos.artifact_dtos import (
    ArtifactCreateDTO,
    ArtifactUpdateByAssigneeDTO,
    ArtifactUpdateByManagerDTO,
    ArtifactResponseDTO,
)
from app.domain.exceptions import ArchivedNodeReferenceError, ProjectNotFoundError, DomainError

router = APIRouter()

# ---------------------------------------------------------------------------
# Methodology-based artifact templates (D-28 seed pattern)
# ---------------------------------------------------------------------------
_ARTIFACT_TEMPLATES: dict[str, list[str]] = {
    "SCRUM": [
        "Product Backlog",
        "Sprint Backlog",
        "Increment",
        "Definition of Done",
        "Sprint Goal",
    ],
    "KANBAN": [
        "Kanban Board Tanımı",
        "İş Öğesi Tipleri",
        "Akış Politikaları",
        "SLA Tanımları",
        "Görsel Sinyaller Rehberi",
    ],
    "WATERFALL": [
        "Gereksinimler Belgesi",
        "Sistem Tasarım Belgesi",
        "Uygulama Planı",
        "Test Planı",
        "Dağıtım Kılavuzu",
        "Proje Kapanış Raporu",
    ],
}


async def _authorize_transition(user, project_id: int, project_repo, artifact_repo):
    """Inline D-15 RPTA check for artifact mutations."""
    if _is_admin(user):
        return
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(404, f"Project {project_id} not found")
    if project.manager_id == user.id:
        return
    from app.infrastructure.database.repositories.team_repo import SqlAlchemyTeamRepository
    team_repo_direct = SqlAlchemyTeamRepository(artifact_repo.session)
    if await team_repo_direct.user_leads_any_team_on_project(user.id, project_id):
        return
    raise HTTPException(403, "Phase transition authority required")


def _to_http(e: Exception) -> HTTPException:
    if isinstance(e, ArchivedNodeReferenceError):
        return HTTPException(
            400,
            detail={"error_code": "ARCHIVED_NODE_REF", "node_id": e.node_id, "reason": e.reason},
        )
    if isinstance(e, (ProjectNotFoundError, DomainError)):
        return HTTPException(404, detail=str(e))
    if isinstance(e, PermissionError):
        return HTTPException(403, detail=str(e))
    raise e


@router.get("/projects/{project_id}/artifacts", response_model=list[ArtifactResponseDTO])
async def list_artifacts(
    project_id: int,
    phase_id: Optional[str] = Query(default=None),
    _current=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
):
    uc = ListArtifactsUseCase(artifact_repo)
    return await uc.execute(project_id=project_id, phase_id=phase_id)


@router.get("/artifacts/{artifact_id}", response_model=ArtifactResponseDTO)
async def get_artifact(
    artifact_id: int,
    _current=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
):
    uc = GetArtifactUseCase(artifact_repo)
    a = await uc.execute(artifact_id)
    if a is None:
        raise HTTPException(404, "Artifact not found")
    return a


@router.post("/artifacts", response_model=ArtifactResponseDTO, status_code=201)
async def create_artifact(
    dto: ArtifactCreateDTO,
    _perm=Depends(require_permission("artifact.create")),  # Phase 15 D-3.5 tier 1 (Pitfall 13 — perm-first)
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    await _authorize_transition(user, dto.project_id, project_repo, artifact_repo)
    uc = CreateArtifactUseCase(artifact_repo, project_repo, audit_repo=audit_repo)
    try:
        return await uc.execute(dto, user.id)
    except Exception as e:
        raise _to_http(e)


class _ArtifactCreateBody(ArtifactCreateDTO):
    """Same as ArtifactCreateDTO but project_id is optional (supplied via path)."""
    project_id: Optional[int] = None  # type: ignore[assignment]


@router.post("/projects/{project_id}/artifacts", response_model=ArtifactResponseDTO, status_code=201)
async def create_artifact_for_project(
    project_id: int,
    body: _ArtifactCreateBody,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    dto = ArtifactCreateDTO(**{**body.model_dump(), "project_id": project_id})
    await _authorize_transition(user, project_id, project_repo, artifact_repo)
    uc = CreateArtifactUseCase(artifact_repo, project_repo, audit_repo=audit_repo)
    try:
        return await uc.execute(dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.patch("/artifacts/{artifact_id}/mine", response_model=ArtifactResponseDTO)
async def update_artifact_as_assignee(
    artifact_id: int,
    dto: ArtifactUpdateByAssigneeDTO,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    """D-36: assignee can update status/note/file_id on own artifact only."""
    uc = UpdateArtifactByAssigneeUseCase(artifact_repo, audit_repo=audit_repo, project_repo=project_repo)
    try:
        return await uc.execute(artifact_id, dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.patch("/artifacts/{artifact_id}", response_model=ArtifactResponseDTO)
async def update_artifact_as_manager(
    artifact_id: int,
    dto: ArtifactUpdateByManagerDTO,
    _perm=Depends(require_permission("artifact.edit")),  # Phase 15 D-3.5 tier 1
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    """D-36: Admin/PM/TL can update all fields including assignee_id."""
    existing = await artifact_repo.get_by_id(artifact_id)
    if existing is None:
        raise HTTPException(404, "Artifact not found")
    await _authorize_transition(user, existing.project_id, project_repo, artifact_repo)
    uc = UpdateArtifactByManagerUseCase(artifact_repo, project_repo, audit_repo=audit_repo)
    try:
        return await uc.execute(artifact_id, dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.delete("/artifacts/{artifact_id}", status_code=204)
async def delete_artifact(
    artifact_id: int,
    _perm=Depends(require_permission("artifact.delete")),  # Phase 15 D-3.5 tier 1
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    existing = await artifact_repo.get_by_id(artifact_id)
    if existing is None:
        raise HTTPException(404, "Artifact not found")
    await _authorize_transition(user, existing.project_id, project_repo, artifact_repo)
    uc = DeleteArtifactUseCase(artifact_repo, audit_repo=audit_repo, project_repo=project_repo)
    await uc.execute(artifact_id)
    return None


@router.post("/projects/{project_id}/artifacts/seed", response_model=list[ArtifactResponseDTO], status_code=201)
async def seed_artifacts_for_project(
    project_id: int,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
):
    """Seed methodology-specific artifact templates for a project.
    Idempotent: skips names that already exist (case-insensitive match).
    """
    await _authorize_transition(user, project_id, project_repo, artifact_repo)
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(404, f"Project {project_id} not found")

    methodology = (project.methodology.value if hasattr(project.methodology, "value") else str(project.methodology)).upper()
    templates = _ARTIFACT_TEMPLATES.get(methodology, [])
    if not templates:
        raise HTTPException(400, f"No artifact templates defined for methodology '{methodology}'")

    existing = await artifact_repo.list_by_project(project_id)
    existing_names_lower = {a.name.lower() for a in existing}

    from app.domain.entities.artifact import Artifact, ArtifactStatus
    new_artifacts = [
        Artifact(project_id=project_id, name=name, status=ArtifactStatus.NOT_CREATED)
        for name in templates
        if name.lower() not in existing_names_lower
    ]
    if not new_artifacts:
        return []

    created = await artifact_repo.bulk_create(new_artifacts)
    return [ArtifactResponseDTO.model_validate(a) for a in created]


_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
_BLOCKED_EXTENSIONS = {".exe", ".sh", ".bat", ".ps1", ".msi", ".dmg"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/artifacts/{artifact_id}/file", response_model=ArtifactResponseDTO)
async def upload_artifact_file(
    artifact_id: int,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
):
    """Upload (or replace) a single file attached to an artifact (D-41)."""
    artifact = await artifact_repo.get_by_id(artifact_id)
    if artifact is None:
        raise HTTPException(404, "Artifact not found")
    await _authorize_transition(user, artifact.project_id, project_repo, artifact_repo)

    content = await file.read()

    suffix = Path(file.filename or "file").suffix.lower()
    if suffix in _BLOCKED_EXTENSIONS:
        raise HTTPException(400, f"File type '{suffix}' is not allowed")
    if len(content) > _MAX_SIZE_BYTES:
        raise HTTPException(413, "File exceeds 10 MB limit")

    # Write to disk
    stored_name = f"{uuid.uuid4()}{suffix}"
    upload_dir = _BACKEND_DIR / "static" / "uploads" / "artifacts"
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / stored_name).write_bytes(content)
    relative_path = f"static/uploads/artifacts/{stored_name}"

    # Insert into files table (task_id=NULL — D-41 artifact file)
    from app.domain.entities.file import File as FileEntity
    from app.infrastructure.database.repositories.attachment_repo import SqlAlchemyAttachmentRepository
    file_repo = SqlAlchemyAttachmentRepository(artifact_repo.session)

    file_entity = FileEntity(
        task_id=None,
        uploader_id=user.id,
        file_name=file.filename or stored_name,
        file_path=relative_path,
        file_size=len(content),
    )
    saved_file = await file_repo.create(file_entity)

    # Update artifact's file_id
    artifact.file_id = saved_file.id
    updated = await artifact_repo.update(artifact)
    return ArtifactResponseDTO.model_validate(updated)


@router.get("/artifacts/{artifact_id}/file")
async def download_artifact_file(
    artifact_id: int,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
):
    """Download the file attached to an artifact (D-41)."""
    artifact = await artifact_repo.get_by_id(artifact_id)
    if artifact is None:
        raise HTTPException(404, "Artifact not found")
    if artifact.file_id is None:
        raise HTTPException(404, "No file attached to this artifact")

    from app.infrastructure.database.repositories.attachment_repo import SqlAlchemyAttachmentRepository
    file_repo = SqlAlchemyAttachmentRepository(artifact_repo.session)
    file = await file_repo.get_by_id(artifact.file_id)
    if file is None:
        raise HTTPException(404, "File record not found")

    # _BACKEND_DIR = Backend/ — artifacts are stored relative to this
    abs_path = _BACKEND_DIR / file.file_path
    if not abs_path.exists():
        raise HTTPException(404, "File not found on disk")

    return FileResponse(
        path=str(abs_path),
        filename=file.file_name,
        media_type="application/octet-stream",
    )

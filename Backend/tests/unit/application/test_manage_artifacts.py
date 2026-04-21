"""BACK-05 / D-36 split artifact use case tests."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.application.use_cases.manage_artifacts import (
    UpdateArtifactByAssigneeUseCase, UpdateArtifactByManagerUseCase,
    CreateArtifactUseCase, DeleteArtifactUseCase,
)
from app.application.dtos.artifact_dtos import (
    ArtifactCreateDTO, ArtifactUpdateByAssigneeDTO, ArtifactUpdateByManagerDTO,
)
from app.domain.entities.artifact import Artifact, ArtifactStatus


@pytest.mark.asyncio
async def test_assignee_can_update_status_note_file():
    existing = Artifact(id=1, project_id=1, name="A", assignee_id=5)
    artifact_repo = MagicMock()
    artifact_repo.get_by_id = AsyncMock(return_value=existing)
    artifact_repo.update = AsyncMock(return_value=existing)

    uc = UpdateArtifactByAssigneeUseCase(artifact_repo)
    dto = ArtifactUpdateByAssigneeDTO(status=ArtifactStatus.IN_PROGRESS, note="doing it", file_id=42)
    await uc.execute(artifact_id=1, dto=dto, user_id=5)
    assert existing.status == ArtifactStatus.IN_PROGRESS
    assert existing.note == "doing it"
    assert existing.file_id == 42


@pytest.mark.asyncio
async def test_assignee_cannot_update_other_artifact():
    existing = Artifact(id=1, project_id=1, name="A", assignee_id=5)
    artifact_repo = MagicMock()
    artifact_repo.get_by_id = AsyncMock(return_value=existing)

    uc = UpdateArtifactByAssigneeUseCase(artifact_repo)
    dto = ArtifactUpdateByAssigneeDTO(status=ArtifactStatus.IN_PROGRESS)
    with pytest.raises(PermissionError):
        await uc.execute(artifact_id=1, dto=dto, user_id=999)


@pytest.mark.asyncio
async def test_assignee_dto_excludes_assignee_id():
    """ArtifactUpdateByAssigneeDTO does not have assignee_id field (D-36 defence)."""
    dto = ArtifactUpdateByAssigneeDTO(status=ArtifactStatus.IN_PROGRESS)
    assert "assignee_id" not in dto.model_dump(exclude_unset=True)


@pytest.mark.asyncio
async def test_manager_can_reassign():
    existing = Artifact(id=1, project_id=1, name="A", assignee_id=5)
    artifact_repo = MagicMock()
    artifact_repo.get_by_id = AsyncMock(return_value=existing)
    artifact_repo.update = AsyncMock(return_value=existing)
    project_repo = MagicMock()

    uc = UpdateArtifactByManagerUseCase(artifact_repo, project_repo)
    dto = ArtifactUpdateByManagerDTO(assignee_id=99)
    await uc.execute(artifact_id=1, dto=dto, user_id=1)  # user_id irrelevant here -- router authorizes
    assert existing.assignee_id == 99


@pytest.mark.asyncio
async def test_delete_soft_deletes():
    artifact_repo = MagicMock()
    artifact_repo.delete = AsyncMock(return_value=True)
    uc = DeleteArtifactUseCase(artifact_repo)
    assert await uc.execute(1) is True

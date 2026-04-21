"""BACK-05 / D-28, D-30 ArtifactSeeder tests."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.application.services.artifact_seeder import ArtifactSeeder
from app.domain.entities.artifact import Artifact, ArtifactStatus


def _mk_template(default_artifacts):
    class T:
        pass
    t = T()
    t.default_artifacts = default_artifacts
    return t


@pytest.mark.asyncio
async def test_seed_creates_artifacts_from_defaults():
    template = _mk_template([
        {"name": "SRS", "linked_phase_id_suggestion": "nd_a1b2c3d4e5", "description": "Req doc"},
        {"name": "SDD", "linked_phase_id_suggestion": None, "description": None},
    ])
    artifact_repo = MagicMock()
    captured = {"list": []}

    async def bulk_create(artifacts):
        captured["list"] = list(artifacts)
        return [Artifact(id=i + 1, **a.model_dump(exclude={"id"})) for i, a in enumerate(artifacts)]

    artifact_repo.bulk_create = AsyncMock(side_effect=bulk_create)
    seeder = ArtifactSeeder(artifact_repo)
    result = await seeder.seed(project_id=10, template=template)
    assert len(result) == 2
    assert captured["list"][0].name == "SRS"
    assert captured["list"][0].linked_phase_id == "nd_a1b2c3d4e5"
    assert captured["list"][0].note == "Req doc"
    assert captured["list"][0].status == ArtifactStatus.NOT_CREATED
    assert captured["list"][1].name == "SDD"
    assert captured["list"][1].linked_phase_id is None


@pytest.mark.asyncio
async def test_seed_empty_when_template_none():
    """D-30: custom workflow (no template) -> zero artifacts."""
    artifact_repo = MagicMock()
    artifact_repo.bulk_create = AsyncMock()
    seeder = ArtifactSeeder(artifact_repo)
    result = await seeder.seed(project_id=1, template=None)
    assert result == []
    artifact_repo.bulk_create.assert_not_awaited()


@pytest.mark.asyncio
async def test_seed_empty_when_default_artifacts_empty():
    """D-30 variant: template exists but default_artifacts is []."""
    template = _mk_template([])
    artifact_repo = MagicMock()
    artifact_repo.bulk_create = AsyncMock()
    seeder = ArtifactSeeder(artifact_repo)
    result = await seeder.seed(project_id=1, template=template)
    assert result == []
    artifact_repo.bulk_create.assert_not_awaited()


@pytest.mark.asyncio
async def test_seed_propagates_repo_failure():
    """D-28: if bulk_create fails, caller's transaction must be able to roll back.
    Here we verify the exception propagates -- the transaction context is the caller's job."""
    template = _mk_template([{"name": "X", "linked_phase_id_suggestion": None, "description": None}])
    artifact_repo = MagicMock()
    artifact_repo.bulk_create = AsyncMock(side_effect=RuntimeError("DB write failed"))
    seeder = ArtifactSeeder(artifact_repo)
    with pytest.raises(RuntimeError):
        await seeder.seed(project_id=1, template=template)

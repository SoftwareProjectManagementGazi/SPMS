"""BACK-05 SqlAlchemyArtifactRepository — mirrors milestone_repo pattern."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.artifact import Artifact
from app.domain.repositories.artifact_repository import IArtifactRepository
from app.infrastructure.database.models.artifact import ArtifactModel


class SqlAlchemyArtifactRepository(IArtifactRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ArtifactModel) -> Artifact:
        return Artifact.model_validate(model)

    def _to_model(self, entity: Artifact) -> ArtifactModel:
        data = entity.model_dump(exclude={"id", "created_at", "updated_at"})
        # Convert enum to str for DB column
        if hasattr(data.get("status"), "value"):
            data["status"] = data["status"].value
        return ArtifactModel(**data)

    def _base_query(self):
        return select(ArtifactModel).where(ArtifactModel.is_deleted == False)  # noqa: E712

    async def create(self, artifact: Artifact) -> Artifact:
        model = self._to_model(artifact)
        self.session.add(model)
        await self.session.flush()
        refreshed = await self.get_by_id(model.id)
        if refreshed is None:
            raise RuntimeError(f"Artifact {model.id} disappeared after flush")
        return refreshed

    async def bulk_create(self, artifacts: List[Artifact]) -> List[Artifact]:
        """D-28: bulk insert used by ArtifactSeeder in same Project-create tx.
        Does NOT flush per-row to enable transaction rollback on first failure."""
        models = [self._to_model(a) for a in artifacts]
        self.session.add_all(models)
        await self.session.flush()
        return [self._to_entity(m) for m in models]

    async def get_by_id(self, artifact_id: int) -> Optional[Artifact]:
        stmt = self._base_query().where(ArtifactModel.id == artifact_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_project(self, project_id: int) -> List[Artifact]:
        stmt = self._base_query().where(ArtifactModel.project_id == project_id)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_phase(self, project_id: int, phase_id: Optional[str]) -> List[Artifact]:
        """phase_id=None returns project-scoped (no linked_phase) artifacts."""
        stmt = self._base_query().where(ArtifactModel.project_id == project_id)
        if phase_id is None:
            stmt = stmt.where(ArtifactModel.linked_phase_id.is_(None))
        else:
            stmt = stmt.where(ArtifactModel.linked_phase_id == phase_id)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def update(self, artifact: Artifact) -> Artifact:
        stmt = self._base_query().where(ArtifactModel.id == artifact.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise ValueError(f"Artifact {artifact.id} not found for update")
        model.name = artifact.name
        model.status = artifact.status.value if hasattr(artifact.status, "value") else artifact.status
        model.assignee_id = artifact.assignee_id
        model.linked_phase_id = artifact.linked_phase_id
        model.note = artifact.note
        model.file_id = artifact.file_id
        model.updated_at = datetime.utcnow()
        await self.session.flush()
        return self._to_entity(model)

    async def delete(self, artifact_id: int) -> bool:
        stmt = self._base_query().where(ArtifactModel.id == artifact_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return False
        model.is_deleted = True
        model.deleted_at = datetime.utcnow()
        await self.session.flush()
        return True

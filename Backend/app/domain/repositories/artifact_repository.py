"""BACK-05 IArtifactRepository."""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.artifact import Artifact


class IArtifactRepository(ABC):
    @abstractmethod
    async def create(self, artifact: Artifact) -> Artifact: ...

    @abstractmethod
    async def bulk_create(self, artifacts: List[Artifact]) -> List[Artifact]:
        """Used by ArtifactSeeder for atomic bulk insert inside Project create tx."""
        ...

    @abstractmethod
    async def get_by_id(self, artifact_id: int) -> Optional[Artifact]: ...

    @abstractmethod
    async def list_by_project(self, project_id: int) -> List[Artifact]: ...

    @abstractmethod
    async def list_by_phase(self, project_id: int, phase_id: Optional[str]) -> List[Artifact]: ...

    @abstractmethod
    async def update(self, artifact: Artifact) -> Artifact: ...

    @abstractmethod
    async def delete(self, artifact_id: int) -> bool:
        """Soft-delete."""
        ...

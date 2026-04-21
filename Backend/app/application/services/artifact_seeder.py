"""BACK-05 / D-28, D-30: ArtifactSeeder service.

Seeds default artifacts from ProcessTemplate.default_artifacts JSON column
when a project is created. Runs inside the same transaction as Project create,
so any failure rolls back both.

Empty/missing template -> zero artifacts (D-30 custom workflow).
Empty default_artifacts -> zero artifacts (template with no defaults).
"""
from typing import List, Optional
from app.domain.entities.artifact import Artifact, ArtifactStatus
from app.domain.repositories.artifact_repository import IArtifactRepository


class ArtifactSeeder:
    def __init__(self, artifact_repo: IArtifactRepository):
        self.artifact_repo = artifact_repo

    async def seed(self, project_id: int, template) -> List[Artifact]:
        """Create Artifact records based on template.default_artifacts.

        Args:
            project_id: newly created project id.
            template: ProcessTemplate entity OR None (D-30 custom workflow).

        Returns:
            List of created Artifact entities. Empty if no template or no defaults.
        """
        if template is None:
            return []
        defaults = getattr(template, "default_artifacts", None) or []
        if not defaults:
            return []
        artifacts = [
            Artifact(
                project_id=project_id,
                name=entry.get("name", f"Artifact {i + 1}"),
                status=ArtifactStatus.NOT_CREATED,
                linked_phase_id=entry.get("linked_phase_id_suggestion"),  # may be None
                note=entry.get("description"),
                # assignee_id, file_id left None -- user assigns manually after create
            )
            for i, entry in enumerate(defaults)
        ]
        return await self.artifact_repo.bulk_create(artifacts)

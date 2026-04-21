"""Batch migration helper for process_config schema_version.

Normally, Project._normalize_process_config runs lazily on read via
@model_validator(mode='before'). This module provides an eager, one-shot
migration for admin scripts when the schema_version is bumped and lazy
migration is too slow (e.g., millions of projects).
"""
from app.domain.entities.project import _normalize_process_config
from app.domain.repositories.project_repository import IProjectRepository


async def migrate_all_projects_to_current_schema(project_repo: IProjectRepository) -> int:
    """Walk every project, normalize its process_config, and write back.

    Returns the number of projects whose config was modified.
    Intended as a one-shot admin script, not a request-time operation.
    """
    projects = await project_repo.get_all()
    count = 0
    for p in projects:
        if p.process_config is None:
            continue
        original = p.process_config
        normalized = _normalize_process_config(original)
        if normalized != original:
            p.process_config = normalized
            await project_repo.update(p)
            count += 1
    return count

"""Phase 14 Plan 14-01 — ListPendingJoinRequestsUseCase (D-A1).

Thin wrapper around repo.list_by_status("pending", limit, offset). Returns
items as raw entities — the router maps to JoinRequestListDTO and enriches
with project/user nested objects (PATTERNS.md inline submodels) when
shipping the HTTP response.

DIP enforced — ZERO sqlalchemy / app.infrastructure imports.
"""
from typing import List, Tuple

from app.domain.entities.project_join_request import ProjectJoinRequest
from app.domain.repositories.project_join_request_repository import (
    IProjectJoinRequestRepository,
)


class ListPendingJoinRequestsUseCase:
    """Read-only list of pending join requests, ordered by created_at DESC."""

    def __init__(self, repo: IProjectJoinRequestRepository):
        self.repo = repo

    async def execute(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[ProjectJoinRequest], int]:
        return await self.repo.list_by_status("pending", limit=limit, offset=offset)

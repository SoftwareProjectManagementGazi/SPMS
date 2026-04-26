"""Phase 14 Plan 14-01 — IProjectJoinRequestRepository ABC (D-A1).

DIP — pure Python; the domain has zero ORM or persistence-layer imports.
Use cases inject this interface; SqlAlchemyProjectJoinRequestRepository
implements it under app/infra (Phase 14 Plan 14-01 Task 2 step 4).
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

from app.domain.entities.project_join_request import (
    ProjectJoinRequest,
    JoinRequestStatus,
)


class IProjectJoinRequestRepository(ABC):
    @abstractmethod
    async def create(self, request: ProjectJoinRequest) -> ProjectJoinRequest:
        """Persist a new join request. Returns the entity with id + timestamps populated."""
        ...

    @abstractmethod
    async def get_by_id(self, request_id: int) -> Optional[ProjectJoinRequest]:
        """Lookup by primary key. Returns None when not found."""
        ...

    @abstractmethod
    async def list_by_status(
        self,
        status: JoinRequestStatus,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[ProjectJoinRequest], int]:
        """Paginated read filtered by status. Returns (items, total).

        total is the unpaginated count for the same filter so callers can
        render Sayfa N / M pagination correctly.
        """
        ...

    @abstractmethod
    async def update_status(
        self,
        request_id: int,
        status: JoinRequestStatus,
        reviewed_by_admin_id: Optional[int] = None,
    ) -> Optional[ProjectJoinRequest]:
        """Mutate the request's status (and optionally the admin reviewer id).

        When status flips to a terminal state ("approved" / "rejected" /
        "cancelled"), the impl should also stamp reviewed_at = now(). Returns
        the updated entity, or None if request_id is unknown.
        """
        ...

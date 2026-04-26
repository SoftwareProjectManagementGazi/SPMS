"""Phase 14 Plan 14-01 Task 2 — CreateJoinRequestUseCase tests (in-memory fakes).

Pattern: Phase 12 D-09 in-memory fakes. Verifies the use case persists a
join request AND emits an audit_log row enriched with project key + name +
target_user_id (D-A8 audit-log enrichment scope; D-D2 user-lifecycle metadata).

DIP enforced — these tests instantiate the use case with fakes that satisfy
the repository ABCs; NO database is involved.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple

import pytest
from datetime import datetime

from app.application.use_cases.create_join_request import (
    CreateJoinRequestUseCase,
)
from app.domain.entities.project_join_request import (
    JoinRequestStatus,
    ProjectJoinRequest,
)


class FakeProjectJoinRequestRepo:
    """In-memory IProjectJoinRequestRepository impl — captures last create call."""

    def __init__(self) -> None:
        self.items: List[ProjectJoinRequest] = []
        self._next_id = 1

    async def create(self, request: ProjectJoinRequest) -> ProjectJoinRequest:
        new = request.model_copy(
            update={"id": self._next_id, "created_at": datetime.utcnow()}
        )
        self._next_id += 1
        self.items.append(new)
        return new

    async def get_by_id(self, request_id: int) -> Optional[ProjectJoinRequest]:
        return next((r for r in self.items if r.id == request_id), None)

    async def list_by_status(
        self, status: JoinRequestStatus, limit: int = 50, offset: int = 0
    ) -> Tuple[List[ProjectJoinRequest], int]:
        rows = [r for r in self.items if r.status == status]
        return rows[offset : offset + limit], len(rows)

    async def update_status(
        self,
        request_id: int,
        status: JoinRequestStatus,
        reviewed_by_admin_id: Optional[int] = None,
    ) -> Optional[ProjectJoinRequest]:
        for i, r in enumerate(self.items):
            if r.id == request_id:
                self.items[i] = r.model_copy(
                    update={
                        "status": status,
                        "reviewed_by_admin_id": reviewed_by_admin_id,
                        "reviewed_at": datetime.utcnow()
                        if status in ("approved", "rejected", "cancelled")
                        else None,
                    }
                )
                return self.items[i]
        return None


class FakeAuditRepo:
    """Captures the last create_with_metadata call for assertions."""

    def __init__(self) -> None:
        self.last_call: Optional[Dict[str, Any]] = None
        self.calls: List[Dict[str, Any]] = []

    async def create_with_metadata(
        self,
        entity_type: str,
        entity_id: int,
        action: str,
        user_id: Optional[int],
        metadata: dict,
        field_name: str = "transition",
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
    ):
        record = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "user_id": user_id,
            "metadata": metadata,
            "field_name": field_name,
            "old_value": old_value,
            "new_value": new_value,
        }
        self.last_call = record
        self.calls.append(record)
        return None


class FakeProjectInfo:
    """Tiny stand-in for the project entity — only key + name + id are read."""

    def __init__(self, id: int, key: str, name: str) -> None:
        self.id = id
        self.key = key
        self.name = name


class FakeProjectRepo:
    def __init__(self, projects: Dict[int, FakeProjectInfo]) -> None:
        self._projects = projects

    async def get_by_id(self, project_id: int) -> Optional[FakeProjectInfo]:
        return self._projects.get(project_id)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_persists_request_and_emits_enriched_audit():
    """Happy path — entity persisted with status=pending, audit row enriched
    with project key + name + target_user_id (D-A8 enrichment)."""
    repo = FakeProjectJoinRequestRepo()
    audit = FakeAuditRepo()
    project_repo = FakeProjectRepo(
        {5: FakeProjectInfo(id=5, key="TEST", name="Test Project")}
    )
    uc = CreateJoinRequestUseCase(repo, audit, project_repo)

    created = await uc.execute(
        project_id=5,
        requested_by_user_id=10,
        target_user_id=20,
        note="Wants to contribute",
    )

    assert created.id == 1
    assert created.status == "pending"
    assert created.note == "Wants to contribute"
    # Audit emission shape
    assert audit.last_call is not None
    assert audit.last_call["entity_type"] == "project_join_request"
    assert audit.last_call["entity_id"] == 1
    assert audit.last_call["action"] == "created"
    assert audit.last_call["user_id"] == 10
    md = audit.last_call["metadata"]
    assert md["project_id"] == 5
    assert md["project_key"] == "TEST"
    assert md["project_name"] == "Test Project"
    assert md["target_user_id"] == 20
    assert md["requested_by_user_id"] == 10


@pytest.mark.asyncio
async def test_create_handles_missing_project_gracefully():
    """If project lookup returns None (deleted between create + audit), audit
    metadata still ships with project_key=None / project_name=None."""
    repo = FakeProjectJoinRequestRepo()
    audit = FakeAuditRepo()
    project_repo = FakeProjectRepo({})  # No projects
    uc = CreateJoinRequestUseCase(repo, audit, project_repo)

    created = await uc.execute(
        project_id=999, requested_by_user_id=1, target_user_id=2
    )
    assert created.id == 1
    md = audit.last_call["metadata"]
    assert md["project_id"] == 999
    assert md["project_key"] is None
    assert md["project_name"] is None

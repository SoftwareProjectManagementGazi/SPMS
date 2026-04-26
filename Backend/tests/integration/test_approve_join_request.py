"""Phase 14 Plan 14-01 Task 2 — ApproveJoinRequestUseCase tests (in-memory fakes).

Verifies:
1) Happy path — status flips, team_repo.add_member called, audit emitted
2) Atomic intent — when team_repo.add_member raises non-IntegrityError, the
   status flip is rolled back to "pending" (D-A1 atomic rollback semantic)
3) JoinRequestNotFoundError when request_id is unknown
4) JoinRequestInvalidStateError when request is already approved/rejected

DIP enforced — fakes only; NO database.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import pytest

from app.application.use_cases.approve_join_request import (
    ApproveJoinRequestUseCase,
)
from app.domain.entities.project_join_request import (
    JoinRequestStatus,
    ProjectJoinRequest,
)
from app.domain.exceptions import (
    JoinRequestInvalidStateError,
    JoinRequestNotFoundError,
)


class FakeProjectJoinRequestRepo:
    def __init__(self) -> None:
        self.items: List[ProjectJoinRequest] = []
        self._next_id = 1

    def seed(self, **kwargs) -> ProjectJoinRequest:
        rec = ProjectJoinRequest(
            id=self._next_id,
            project_id=kwargs.get("project_id", 5),
            requested_by_user_id=kwargs.get("requested_by_user_id", 10),
            target_user_id=kwargs.get("target_user_id", 20),
            status=kwargs.get("status", "pending"),
            note=kwargs.get("note"),
            created_at=datetime.utcnow(),
        )
        self._next_id += 1
        self.items.append(rec)
        return rec

    async def create(self, request: ProjectJoinRequest) -> ProjectJoinRequest:
        return self.seed(**request.model_dump(exclude={"id"}))

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
        rec = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "user_id": user_id,
            "metadata": metadata,
        }
        self.last_call = rec
        self.calls.append(rec)
        return None


class FakeTeam:
    def __init__(self, id: int) -> None:
        self.id = id


class FakeTeamRepo:
    """Fakes get_team_for_project + add_member. add_member can be configured
    to raise (atomic-rollback test)."""

    def __init__(self, team_for_project: Optional[FakeTeam] = None,
                 raise_on_add: Optional[Exception] = None) -> None:
        self._team = team_for_project
        self._raise_on_add = raise_on_add
        self.add_member_calls: List[Tuple[int, int]] = []

    async def get_team_for_project(self, project_id: int) -> Optional[FakeTeam]:
        return self._team

    async def add_member(self, team_id: int, user_id: int) -> None:
        if self._raise_on_add is not None:
            raise self._raise_on_add
        self.add_member_calls.append((team_id, user_id))


class FakeProjectInfo:
    def __init__(self, id: int, key: str, name: str) -> None:
        self.id = id
        self.key = key
        self.name = name


class FakeProjectRepo:
    def __init__(self, projects: Dict[int, FakeProjectInfo]) -> None:
        self._p = projects

    async def get_by_id(self, project_id: int) -> Optional[FakeProjectInfo]:
        return self._p.get(project_id)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_approve_happy_path_calls_add_member_and_emits_audit():
    """When the request exists in pending state and team add succeeds, the
    use case flips status to approved, calls team_repo.add_member, and emits
    a project_join_request.approved audit row with enriched metadata."""
    repo = FakeProjectJoinRequestRepo()
    pending = repo.seed(project_id=5, target_user_id=20, status="pending")

    audit = FakeAuditRepo()
    team_repo = FakeTeamRepo(team_for_project=FakeTeam(id=99))
    project_repo = FakeProjectRepo(
        {5: FakeProjectInfo(id=5, key="TEST", name="Test Project")}
    )

    uc = ApproveJoinRequestUseCase(repo, audit, team_repo, project_repo)
    updated = await uc.execute(request_id=pending.id, approving_admin_id=42)

    assert updated.status == "approved"
    assert updated.reviewed_by_admin_id == 42
    # team_repo received the add_member call
    assert team_repo.add_member_calls == [(99, 20)]
    # Audit emission
    assert audit.last_call is not None
    assert audit.last_call["action"] == "approved"
    assert audit.last_call["user_id"] == 42
    md = audit.last_call["metadata"]
    assert md["project_key"] == "TEST"
    assert md["project_name"] == "Test Project"
    assert md["target_user_id"] == 20
    assert md["requested_by_admin_id"] == 42


@pytest.mark.asyncio
async def test_approve_rolls_back_on_team_repo_failure():
    """ATOMIC INTENT (D-A1): if team_repo.add_member raises a non-Integrity
    exception, the status update MUST roll back to 'pending' so admin can retry."""
    repo = FakeProjectJoinRequestRepo()
    pending = repo.seed(project_id=5, target_user_id=20, status="pending")

    audit = FakeAuditRepo()
    boom = RuntimeError("DB exploded")
    team_repo = FakeTeamRepo(team_for_project=FakeTeam(id=99), raise_on_add=boom)
    project_repo = FakeProjectRepo(
        {5: FakeProjectInfo(id=5, key="TEST", name="Test Project")}
    )

    uc = ApproveJoinRequestUseCase(repo, audit, team_repo, project_repo)
    with pytest.raises(RuntimeError):
        await uc.execute(request_id=pending.id, approving_admin_id=42)

    # Atomic rollback: status flipped back to "pending" + reviewer cleared
    rolled = await repo.get_by_id(pending.id)
    assert rolled.status == "pending"
    assert rolled.reviewed_by_admin_id is None
    # Audit row was NOT emitted (we re-raised before line 4)
    assert audit.last_call is None


@pytest.mark.asyncio
async def test_approve_raises_not_found_for_unknown_request_id():
    repo = FakeProjectJoinRequestRepo()
    audit = FakeAuditRepo()
    team_repo = FakeTeamRepo()
    project_repo = FakeProjectRepo({})
    uc = ApproveJoinRequestUseCase(repo, audit, team_repo, project_repo)

    with pytest.raises(JoinRequestNotFoundError):
        await uc.execute(request_id=999, approving_admin_id=42)


@pytest.mark.asyncio
async def test_approve_raises_invalid_state_when_already_approved():
    repo = FakeProjectJoinRequestRepo()
    seeded = repo.seed(project_id=5, target_user_id=20, status="approved")

    audit = FakeAuditRepo()
    team_repo = FakeTeamRepo(team_for_project=FakeTeam(id=99))
    project_repo = FakeProjectRepo(
        {5: FakeProjectInfo(id=5, key="TEST", name="Test")}
    )
    uc = ApproveJoinRequestUseCase(repo, audit, team_repo, project_repo)

    with pytest.raises(JoinRequestInvalidStateError):
        await uc.execute(request_id=seeded.id, approving_admin_id=42)


@pytest.mark.asyncio
async def test_approve_skips_team_add_when_no_team_exists_for_project():
    """If the project has no associated team (get_team_for_project returns
    None), the use case still flips status + emits audit but does not call
    add_member. Defensive against project-team association drift."""
    repo = FakeProjectJoinRequestRepo()
    pending = repo.seed(project_id=5, target_user_id=20, status="pending")
    audit = FakeAuditRepo()
    team_repo = FakeTeamRepo(team_for_project=None)
    project_repo = FakeProjectRepo(
        {5: FakeProjectInfo(id=5, key="X", name="X")}
    )
    uc = ApproveJoinRequestUseCase(repo, audit, team_repo, project_repo)

    updated = await uc.execute(request_id=pending.id, approving_admin_id=7)

    assert updated.status == "approved"
    assert team_repo.add_member_calls == []
    assert audit.last_call is not None
    assert audit.last_call["action"] == "approved"

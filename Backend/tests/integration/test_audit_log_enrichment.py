"""Phase 14 Plan 14-09 — backend audit_log enrichment contract tests.

Three contract guarantees are exercised here in pure-Python in-memory mode
(Phase 12 D-09 fake-repo pattern). No live DB session is required:

1. test_post_phase14_enrichment_writes_complete_metadata
   Verifies that the post-Plan-14-09 comment use case writes the full D-D2
   metadata envelope: task_id / task_key / task_title / comment_id /
   comment_excerpt — with snake_case keys (Pitfall 2).

2. test_comment_excerpt_pii_guardrail
   D-D2 PII guardrail — comment body 200 chars + email gets truncated to
   ≤161 chars (160 + ellipsis); email past the cut-off is NOT in the excerpt.
   Failure here means future code regressed the cap and PII may leak
   admin-side.

3. test_pre_phase14_rows_graceful_fallback
   D-D6 backward compat — old audit_log rows (extra_metadata=None) coexist
   with enriched rows in the same get_global_audit response. The use case
   must NOT crash and must return both shapes so the frontend mapper
   (Plan 14-10) can degrade gracefully on the legacy rows.
"""
from __future__ import annotations
from typing import List, Optional, Tuple, Any
import pytest

from app.application.use_cases.manage_comments import (
    CreateCommentUseCase,
    COMMENT_EXCERPT_MAX_CHARS,
)
from app.application.dtos.comment_dtos import CommentCreateDTO
from app.application.use_cases.get_global_audit import GetGlobalAuditUseCase
from app.domain.entities.comment import Comment


# ---------------------------------------------------------------------------
# In-memory fakes
# ---------------------------------------------------------------------------


class FakeAuditRepo:
    """Captures every create_with_metadata call so tests can assert payloads.

    Also mirrors get_global_audit so the backward-compat test can exercise
    the use case without a DB. Methods not exercised by these tests are left
    as no-ops.
    """

    def __init__(self):
        self.entries: List[dict] = []
        self.last_call: Optional[dict] = None
        self._global_seed: List[dict] = []

    async def create_with_metadata(
        self,
        entity_type: str,
        entity_id: int,
        action: str,
        user_id: Optional[int],
        metadata: dict,
        field_name: str = "transition",
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ) -> Any:
        call = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "user_id": user_id,
            "metadata": metadata,
            "field_name": field_name,
            "old_value": old_value,
            "new_value": new_value,
        }
        self.last_call = call
        self.entries.append(call)
        return None

    def seed_global_audit(self, items: List[dict]) -> None:
        """Inject a synthetic mix of pre/post-Phase-14 rows for the
        backward-compat test."""
        self._global_seed = list(items)

    async def get_global_audit(
        self,
        date_from=None,
        date_to=None,
        actor_id: Optional[int] = None,
        action_prefix: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[dict], int, bool]:
        items = list(self._global_seed)
        total = len(items)
        return items[offset : offset + limit], total, False


class FakeCommentRepo:
    """Persists incrementing-id comments in memory so the test can read back
    the assigned id from create()."""

    def __init__(self):
        self._next_id = 1
        self._items: dict = {}

    async def create(self, comment: Comment) -> Comment:
        comment.id = self._next_id
        self._next_id += 1
        self._items[comment.id] = comment
        # Mimic _map_to_response shape — repo normally hydrates user; we use a
        # tiny stand-in so the response DTO mapping still works.
        comment.user = type(
            "U", (),
            {"id": comment.user_id, "full_name": "Tester", "avatar": None},
        )()
        # Mock created_at / updated_at so the DTO mapper doesn't NPE.
        from datetime import datetime
        comment.created_at = datetime.utcnow()
        comment.updated_at = comment.created_at
        return comment

    async def get_by_id(self, comment_id: int) -> Optional[Comment]:
        return self._items.get(comment_id)

    async def get_by_task(self, task_id: int):
        return [c for c in self._items.values() if c.task_id == task_id]

    async def update(self, comment_id: int, content: str):
        c = self._items.get(comment_id)
        if c is None:
            return None
        c.content = content
        return c

    async def soft_delete(self, comment_id: int) -> bool:
        return self._items.pop(comment_id, None) is not None


class FakeTaskRepo:
    """Returns a stub Task so the use case can read task_key / title.

    Mirrors the ITaskRepository.get_by_id signature. We only implement the
    method exercised by the comment audit metadata builder.
    """

    def __init__(self, task_key: str = "TEST-1", title: str = "Test task"):
        self.task_key = task_key
        self.title = title

    async def get_by_id(self, task_id: int):
        return type("Task", (), {
            "id": task_id,
            "task_key": self.task_key,
            "title": self.title,
        })()


# ---------------------------------------------------------------------------
# Test 1: post-Plan-14-09 enrichment writes the full D-D2 metadata envelope
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_post_phase14_enrichment_writes_complete_metadata():
    """CreateCommentUseCase emits an audit row with task_id, task_key,
    task_title, comment_id, and comment_excerpt — all snake_case (Pitfall 2)."""
    audit = FakeAuditRepo()
    comment_repo = FakeCommentRepo()
    task_repo = FakeTaskRepo(task_key="SPMS-42", title="Wire frontend mapper")
    uc = CreateCommentUseCase(comment_repo, audit_repo=audit, task_repo=task_repo)

    dto = CommentCreateDTO(task_id=42, content="Hello world")
    await uc.execute(dto, author_id=7)

    assert audit.last_call is not None, "Audit row must be written"
    md = audit.last_call["metadata"]
    # D-D2 required fields (snake_case)
    assert md["task_id"] == 42
    assert md["task_key"] == "SPMS-42"
    assert md["task_title"] == "Wire frontend mapper"
    assert md["comment_id"] == 1
    assert md["comment_excerpt"] == "Hello world"
    # Action + entity_type are unchanged — mapper extension (Plan 14-10) hangs
    # the new render branch off these (entity_type='comment').
    assert audit.last_call["entity_type"] == "comment"
    assert audit.last_call["action"] == "created"
    assert audit.last_call["user_id"] == 7


# ---------------------------------------------------------------------------
# Test 2: D-D2 PII guardrail — 160-char excerpt cap + email exclusion
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_comment_excerpt_pii_guardrail():
    """A long body containing an email past the 160-char mark must NEVER
    leak into the audit row. Excerpt length is bounded by 160 + ellipsis."""
    audit = FakeAuditRepo()
    comment_repo = FakeCommentRepo()
    task_repo = FakeTaskRepo()
    uc = CreateCommentUseCase(comment_repo, audit_repo=audit, task_repo=task_repo)

    # Push the email past the cap so truncation removes it.
    body = "x" * 200 + "  [email protected]"
    dto = CommentCreateDTO(task_id=1, content=body)
    await uc.execute(dto, author_id=1)

    excerpt = audit.last_call["metadata"]["comment_excerpt"]
    assert excerpt is not None
    # 160-char hard cap — extra char allowed for the ellipsis sentinel.
    assert len(excerpt) <= COMMENT_EXCERPT_MAX_CHARS + 1
    # PII guardrail — email must NOT be in the truncated preview.
    assert "[email protected]" not in excerpt
    # Sanity — the cap applied (longer body, ellipsis appended).
    assert excerpt.endswith("…")


# ---------------------------------------------------------------------------
# Test 3: D-D6 backward compat — pre-Phase-14 rows coexist with enriched ones
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pre_phase14_rows_graceful_fallback():
    """Old audit rows (extra_metadata=None) and post-enrichment rows must
    flow through GetGlobalAuditUseCase without error. Plan 14-10 frontend
    formatter handles the missing-keys case with `??` fallbacks.
    """
    audit = FakeAuditRepo()

    # Mix one pre-Phase-14 row (no metadata) with one enriched row.
    # The shape mirrors what audit_repo.get_global_audit returns for each row
    # (see SqlAlchemyAuditRepository.get_global_audit projection block).
    pre_phase14_row = {
        "id": 1,
        "action": "updated",
        "entity_type": "task",
        "entity_id": 100,
        "entity_label": None,
        "field_name": "column_id",
        "old_value": "1",
        "new_value": "2",
        "user_id": 5,
        "user_name": "Old Reporter",
        "user_avatar": None,
        "timestamp": None,
        # CRITICAL: legacy rows have NO metadata payload — D-D6.
        "metadata": None,
    }
    post_phase14_row = {
        "id": 2,
        "action": "updated",
        "entity_type": "task",
        "entity_id": 200,
        "entity_label": None,
        "field_name": "column_id",
        "old_value": "1",
        "new_value": "2",
        "user_id": 5,
        "user_name": "New Reporter",
        "user_avatar": None,
        "timestamp": None,
        # Plan 14-09 enrichment payload.
        "metadata": {
            "task_id": 200,
            "task_key": "SPMS-200",
            "task_title": "New thing",
            "project_id": 9,
            "project_key": "SPMS",
            "project_name": "SPMS",
            "field_name": "column_id",
            "old_value_label": "TODO",
            "new_value_label": "IN_PROGRESS",
        },
    }
    audit.seed_global_audit([pre_phase14_row, post_phase14_row])

    uc = GetGlobalAuditUseCase(audit)
    response = await uc.execute(limit=50, offset=0)

    # Both rows survive the use case — no crash on the None metadata legacy row.
    assert response.total == 2
    assert len(response.items) == 2
    ids = sorted(item.id for item in response.items)
    assert ids == [1, 2]

    # The legacy row's metadata is exposed as None (frontend Plan 14-10
    # mapper renders a graceful fallback Detay cell).
    legacy = next(it for it in response.items if it.id == 1)
    assert legacy.metadata is None
    # The enriched row preserves the snake_case keys for the mapper.
    enriched = next(it for it in response.items if it.id == 2)
    assert enriched.metadata is not None
    assert enriched.metadata.get("task_key") == "SPMS-200"
    assert enriched.metadata.get("old_value_label") == "TODO"
    assert enriched.metadata.get("new_value_label") == "IN_PROGRESS"

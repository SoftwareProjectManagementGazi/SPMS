"""Phase 17 C4 — unit tests for board column use cases with workflow-engine fields.

Migration 013 added six new fields to ``board_columns``:
``category``, ``is_initial``, ``is_terminal``, ``max_duration_days``,
``entry_policy``, ``exit_policy``. These tests verify the application layer
threads them correctly through ``SeedDefaultColumnsUseCase``,
``CreateColumnUseCase``, and ``UpdateColumnUseCase`` — without touching the DB.

A tiny in-memory ``IBoardColumnRepository`` keeps the tests pure-Python and
fast (per CLAUDE.md L principle: any repo implementation must be substitutable).
"""
from __future__ import annotations

from typing import List, Optional

import pytest

from app.application.dtos.board_column_dtos import (
    CreateColumnDTO,
    UpdateColumnDTO,
)
from app.application.use_cases.manage_board_columns import (
    CreateColumnUseCase,
    SeedDefaultColumnsUseCase,
    UpdateColumnUseCase,
)
from app.domain.entities.board_column import BoardColumn
from app.domain.repositories.board_column_repository import IBoardColumnRepository


# --------------------------------------------------------------------------- #
# Fake in-memory repository — Liskov-substitutable per IBoardColumnRepository.
# --------------------------------------------------------------------------- #


class _InMemoryColumnRepo(IBoardColumnRepository):
    def __init__(self) -> None:
        self._rows: dict[int, BoardColumn] = {}
        self._next_id = 1

    async def get_by_project(self, project_id: int) -> List[BoardColumn]:
        return sorted(
            (c for c in self._rows.values() if c.project_id == project_id),
            key=lambda c: c.order_index,
        )

    async def get_by_id(self, column_id: int) -> Optional[BoardColumn]:
        return self._rows.get(column_id)

    async def create(self, column: BoardColumn) -> BoardColumn:
        cid = self._next_id
        self._next_id += 1
        # Re-build entity with the assigned id so the returned object is
        # immutable-ish (entities use Pydantic, model_copy keeps semantics).
        stored = column.model_copy(update={"id": cid})
        self._rows[cid] = stored
        return stored

    async def update(self, column: BoardColumn) -> BoardColumn:
        assert column.id is not None
        if column.id not in self._rows:
            raise ValueError(f"BoardColumn {column.id} not found")
        self._rows[column.id] = column
        return column

    async def delete(self, column_id: int) -> None:
        self._rows.pop(column_id, None)

    async def count_tasks(self, column_id: int) -> int:
        return 0


# --------------------------------------------------------------------------- #
# 1. SeedDefaultColumnsUseCase wires the workflow-engine flags into seeded rows.
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_seed_default_columns_sets_is_initial_on_first_and_is_terminal_on_last():
    """Backlog must be flagged as the workflow start; Done as the terminal state.

    This replaces the legacy ``order_index == min/max`` heuristic with explicit
    flags the engine (C5+) will read directly.
    """
    repo = _InMemoryColumnRepo()
    use_case = SeedDefaultColumnsUseCase(repo)

    result = await use_case.execute(project_id=42)

    # Five default columns in canonical order.
    assert [c.name for c in result] == ["Backlog", "Todo", "In Progress", "In Review", "Done"]

    backlog, todo, in_prog, in_review, done = result

    # Initial / terminal flags only set on the edges.
    assert backlog.is_initial is True
    assert backlog.is_terminal is False
    assert done.is_initial is False
    assert done.is_terminal is True

    # Middle columns are neither initial nor terminal.
    for mid in (todo, in_prog, in_review):
        assert mid.is_initial is False
        assert mid.is_terminal is False

    # Category coverage: todo (todo/backlog) → in_progress (work) → done.
    assert backlog.category == "todo"
    assert todo.category == "todo"
    assert in_prog.category == "in_progress"
    assert in_review.category == "in_progress"
    assert done.category == "done"


# --------------------------------------------------------------------------- #
# 2. CreateColumnUseCase honors the new fields when supplied.
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_create_column_with_category_field_persists_through_use_case():
    """Posting ``category='in_progress'`` lands in the stored entity."""
    repo = _InMemoryColumnRepo()
    use_case = CreateColumnUseCase(repo)

    dto = CreateColumnDTO(
        name="Code Review",
        order_index=2,
        category="in_progress",
        is_initial=False,
        is_terminal=False,
        max_duration_days=7,
        entry_policy="edges_only",
        exit_policy="any",
    )

    created = await use_case.execute(project_id=1, dto=dto)

    # All workflow fields land on the DTO returned to the caller.
    assert created.category == "in_progress"
    assert created.max_duration_days == 7
    assert created.entry_policy == "edges_only"
    assert created.exit_policy == "any"

    # And they actually persisted into the repo (not just echoed in the DTO).
    stored = await repo.get_by_id(created.id)
    assert stored is not None
    assert stored.category == "in_progress"
    assert stored.max_duration_days == 7
    assert stored.entry_policy == "edges_only"


@pytest.mark.asyncio
async def test_create_column_without_workflow_fields_keeps_safe_defaults():
    """When the FE sends a legacy CreateColumnDTO (pre-C4), seed-style defaults apply."""
    repo = _InMemoryColumnRepo()
    use_case = CreateColumnUseCase(repo)

    dto = CreateColumnDTO(name="Custom", order_index=0)
    created = await use_case.execute(project_id=9, dto=dto)

    assert created.category == "todo"
    assert created.is_initial is False
    assert created.is_terminal is False
    assert created.max_duration_days is None
    assert created.entry_policy == "any"
    assert created.exit_policy == "any"


# --------------------------------------------------------------------------- #
# 3. UpdateColumnUseCase patches max_duration_days without touching other fields.
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_patch_column_max_duration_days_leaves_other_fields_unchanged():
    """PATCH semantics: None means 'leave unchanged' — the rest must round-trip."""
    repo = _InMemoryColumnRepo()
    # Seed a column with custom flags so we can verify they survive the PATCH.
    seeded = await repo.create(
        BoardColumn(
            project_id=1,
            name="Doing",
            order_index=1,
            wip_limit=3,
            category="in_progress",
            is_initial=False,
            is_terminal=False,
            entry_policy="edges_only",
            exit_policy="any",
        )
    )

    patch = UpdateColumnDTO(max_duration_days=14)
    updated = await UpdateColumnUseCase(repo).execute(seeded.id, patch)

    # Patched field reflects the new value.
    assert updated.max_duration_days == 14

    # Everything else stays put.
    assert updated.name == "Doing"
    assert updated.wip_limit == 3
    assert updated.category == "in_progress"
    assert updated.entry_policy == "edges_only"
    assert updated.exit_policy == "any"

    # Persisted, not just echoed.
    fresh = await repo.get_by_id(seeded.id)
    assert fresh is not None
    assert fresh.max_duration_days == 14
    assert fresh.category == "in_progress"


@pytest.mark.asyncio
async def test_patch_column_category_only_updates_category():
    """Smaller PATCH — flip a column's category and confirm no collateral damage."""
    repo = _InMemoryColumnRepo()
    seeded = await repo.create(
        BoardColumn(
            project_id=1,
            name="Triage",
            order_index=0,
            category="todo",
            is_initial=True,
            is_terminal=False,
        )
    )

    updated = await UpdateColumnUseCase(repo).execute(
        seeded.id, UpdateColumnDTO(category="in_progress")
    )

    assert updated.category == "in_progress"
    # is_initial must NOT be reset to False on a category-only patch.
    assert updated.is_initial is True

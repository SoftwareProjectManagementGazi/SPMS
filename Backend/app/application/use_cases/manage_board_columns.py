"""Board column management use cases — Clean Architecture (no SQLAlchemy imports)."""
from typing import Any, Dict, List, Optional

from app.domain.entities.board_column import BoardColumn
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.application.dtos.board_column_dtos import (
    BoardColumnDTO,
    CreateColumnDTO,
    UpdateColumnDTO,
)


# --------------------------------------------------------------------------- #
# Wave 2 W2-C10 — template column normalization helper.
#
# Two shapes flow through the seed path:
#
#   * **Engine-aware (canonical, W2-C9):** keys ``order_index`` + all engine
#     fields (``category``, ``is_initial``, ``is_terminal``,
#     ``max_duration_days``, ``entry_policy``, ``exit_policy``). Source:
#     ``ProcessTemplate.default_columns`` for the three built-in templates
#     (Scrum / Kanban / Waterfall).
#
#   * **Legacy (Wave 1):** keys ``name`` + ``order`` (+ optional ``wip_limit``).
#     Source: ``ProcessTemplate.columns`` JSONB for extended templates
#     (V-Model, Spiral, RAD, etc.) that have not been migrated to the
#     engine-aware shape yet.
#
# This helper folds both into the canonical engine shape so downstream code
# only ever deals with one dict layout. Missing engine fields fall back to
# safe defaults (todo / "any" / False); ``is_initial`` / ``is_terminal``
# are NOT auto-computed here — that's the caller's responsibility (the
# seed loop sets the first/last column flags when the legacy shape is
# detected via the absence of ANY ``is_initial``/``is_terminal`` flag in
# the whole list).
# --------------------------------------------------------------------------- #


def _normalize_template_column_shape(col: Dict[str, Any]) -> Dict[str, Any]:
    """Map both engine (W2-C9 canonical) and legacy (Wave 1) column shapes
    into the canonical dict layout that the seed loop expects.

    Legacy shape: ``{"name", "order", "wip_limit"?}`` — engine fields default.
    Engine shape: ``{"name", "order_index", "category", "is_initial",
                    "is_terminal", "max_duration_days", "entry_policy",
                    "exit_policy", "wip_limit"?}`` — fully populated.
    """
    return {
        "name": col["name"],
        # Engine canonical key wins; legacy "order" only used if order_index missing.
        "order_index": col.get("order_index", col.get("order", 0)),
        "wip_limit": col.get("wip_limit", 0),
        "category": col.get("category", "todo"),
        "is_initial": bool(col.get("is_initial", False)),
        "is_terminal": bool(col.get("is_terminal", False)),
        "max_duration_days": col.get("max_duration_days"),
        "entry_policy": col.get("entry_policy", "any"),
        "exit_policy": col.get("exit_policy", "any"),
    }


def _to_dto(column: BoardColumn, task_count: int = 0) -> BoardColumnDTO:
    return BoardColumnDTO(
        id=column.id,
        project_id=column.project_id,
        name=column.name,
        order_index=column.order_index,
        wip_limit=column.wip_limit,
        task_count=task_count,
        # Phase 17 — workflow engine fields. Entity carries defaults so a row
        # that predates migration 013 (where DB columns are NULL) still
        # serializes cleanly into the DTO via Pydantic from_attributes coercion.
        category=column.category,
        is_initial=column.is_initial,
        is_terminal=column.is_terminal,
        max_duration_days=column.max_duration_days,
        entry_policy=column.entry_policy,
        exit_policy=column.exit_policy,
    )


class ListColumnsUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, project_id: int) -> List[BoardColumnDTO]:
        columns = await self.column_repo.get_by_project(project_id)
        result = []
        for col in columns:
            count = await self.column_repo.count_tasks(col.id)
            result.append(_to_dto(col, count))
        return result


class CreateColumnUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, project_id: int, dto: CreateColumnDTO) -> BoardColumnDTO:
        # Assign order_index: use provided value or append at end (max + 1)
        existing = await self.column_repo.get_by_project(project_id)
        if existing:
            max_index = max(c.order_index for c in existing)
            order_index = dto.order_index if dto.order_index is not None else max_index + 1
        else:
            order_index = dto.order_index if dto.order_index is not None else 0

        # Phase 17 — fold optional workflow-engine fields into the entity. We
        # rely on Pydantic's Literal validation in BoardColumn to reject bad
        # values, but only pass through what the caller actually supplied so
        # the entity defaults (todo / False / "any") still drive omitted ones.
        kwargs = {
            "project_id": project_id,
            "name": dto.name,
            "order_index": order_index,
            "wip_limit": 0,
        }
        if dto.category is not None:
            kwargs["category"] = dto.category
        if dto.is_initial is not None:
            kwargs["is_initial"] = dto.is_initial
        if dto.is_terminal is not None:
            kwargs["is_terminal"] = dto.is_terminal
        if dto.max_duration_days is not None:
            kwargs["max_duration_days"] = dto.max_duration_days
        if dto.entry_policy is not None:
            kwargs["entry_policy"] = dto.entry_policy
        if dto.exit_policy is not None:
            kwargs["exit_policy"] = dto.exit_policy

        column = BoardColumn(**kwargs)
        created = await self.column_repo.create(column)
        task_count = await self.column_repo.count_tasks(created.id)
        return _to_dto(created, task_count)


class UpdateColumnUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, column_id: int, dto: UpdateColumnDTO) -> BoardColumnDTO:
        existing = await self.column_repo.get_by_id(column_id)
        if existing is None:
            from app.domain.exceptions import ProjectNotFoundError
            raise ValueError(f"Column {column_id} not found")

        # Patch only provided fields — None means "leave unchanged" per UpdateColumnDTO.
        # Phase 11 Plan 04: wip_limit now flows through so the Settings > Kolonlar
        # sub-tab can edit WIP caps inline (D-12 — non-Waterfall methodologies).
        # Phase 17 — same patch semantics for the new workflow-engine fields.
        updated_column = BoardColumn(
            id=existing.id,
            project_id=existing.project_id,
            name=dto.name if dto.name is not None else existing.name,
            order_index=dto.order_index if dto.order_index is not None else existing.order_index,
            wip_limit=dto.wip_limit if dto.wip_limit is not None else existing.wip_limit,
            category=dto.category if dto.category is not None else existing.category,
            is_initial=dto.is_initial if dto.is_initial is not None else existing.is_initial,
            is_terminal=dto.is_terminal if dto.is_terminal is not None else existing.is_terminal,
            max_duration_days=(
                dto.max_duration_days if dto.max_duration_days is not None else existing.max_duration_days
            ),
            entry_policy=dto.entry_policy if dto.entry_policy is not None else existing.entry_policy,
            exit_policy=dto.exit_policy if dto.exit_policy is not None else existing.exit_policy,
        )
        saved = await self.column_repo.update(updated_column)
        task_count = await self.column_repo.count_tasks(saved.id)
        return _to_dto(saved, task_count)


class DeleteColumnUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(
        self,
        column_id: int,
        move_to_column_id: Optional[int] = None,
        move_to_backlog: bool = False,
    ) -> None:
        """Delete a column after relocating its tasks.

        Tasks go either to a target column, or — Jira'nın "unmapped status"
        karşılığı — to the backlog: column_id AND sprint_id are cleared so the
        task leaves the board entirely and surfaces in backlog/list views.
        """
        from sqlalchemy import update
        from app.infrastructure.database.models.task import TaskModel
        from app.infrastructure.database.repositories.board_column_repo import SqlAlchemyBoardColumnRepository

        # Verify the column exists
        existing = await self.column_repo.get_by_id(column_id)
        if existing is None:
            raise ValueError(f"Column {column_id} not found")

        if not move_to_backlog:
            if move_to_column_id is None:
                raise ValueError(
                    "Either move_to_column_id or move_to_backlog must be provided"
                )
            target = await self.column_repo.get_by_id(move_to_column_id)
            if target is None:
                raise ValueError(f"Target column {move_to_column_id} not found")

        if isinstance(self.column_repo, SqlAlchemyBoardColumnRepository):
            values = (
                {"column_id": None, "sprint_id": None}
                if move_to_backlog
                else {"column_id": move_to_column_id}
            )
            stmt = (
                update(TaskModel)
                .where(
                    TaskModel.column_id == column_id,
                    TaskModel.is_deleted == False,
                )
                .values(**values)
            )
            await self.column_repo.session.execute(stmt)
            await self.column_repo.session.commit()

        # Delete the column (hard delete)
        await self.column_repo.delete(column_id)


class SeedDefaultColumnsUseCase:
    # Phase 17 — seeded defaults now carry workflow-engine flags. The engine (C5+)
    # uses is_initial / is_terminal directly, so seeded projects are wired right
    # out of the box without relying on the order_index-positional heuristic that
    # 013's backfill query uses for legacy data.
    #
    # Wave 2 W2-C10 — these remain the hard-coded fallback used only when:
    #   (a) ``CreateProjectUseCase`` finds no template for the methodology, OR
    #   (b) a downstream caller seeds an orphan project with no template_columns.
    # Production paths route templates through ``execute(template_columns=...)``
    # instead, which threads ``ProcessTemplate.default_columns`` (Scrum/Kanban/
    # Waterfall) or the legacy ``columns`` field (extended templates) through
    # ``_normalize_template_column_shape``.
    DEFAULT_COLUMNS = [
        {"name": "Backlog",     "category": "todo",        "is_initial": True,  "is_terminal": False},
        {"name": "Todo",        "category": "todo",        "is_initial": False, "is_terminal": False},
        {"name": "In Progress", "category": "in_progress", "is_initial": False, "is_terminal": False},
        {"name": "In Review",   "category": "in_progress", "is_initial": False, "is_terminal": False},
        {"name": "Done",        "category": "done",        "is_initial": False, "is_terminal": True},
    ]

    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(
        self,
        project_id: int,
        template_columns: Optional[List[Dict[str, Any]]] = None,
    ) -> List[BoardColumnDTO]:
        """Seed default columns for a project.

        Wave 2 W2-C10 — ``template_columns`` is an optional list of column dicts
        in either the engine-aware (W2-C9) shape or the legacy (Wave 1) shape.
        Both are folded through ``_normalize_template_column_shape``.

        When ``template_columns`` is ``None`` the hard-coded 5-column fallback
        (``DEFAULT_COLUMNS``) is used — preserving the pre-W2-C10 behavior for
        callers that have no template (orphan projects, legacy code paths).

        Behavior for legacy shape: if NONE of the supplied template_columns
        carry an explicit ``is_initial``/``is_terminal`` flag we infer them
        positionally (first column = initial, last = terminal). This keeps
        the extended templates (V-Model, Spiral, RAD, …) workflow-engine-ready
        out of the box without requiring an alembic backfill of their
        ``columns`` JSONB.
        """
        if template_columns is not None:
            specs = [_normalize_template_column_shape(c) for c in template_columns]

            # If the legacy shape supplied nothing about initial/terminal,
            # infer positionally so the engine still has a start + end state.
            # (Engine-aware shape already populates these flags explicitly.)
            has_any_initial = any(s["is_initial"] for s in specs)
            has_any_terminal = any(s["is_terminal"] for s in specs)
            if specs and not has_any_initial:
                # Order by the normalized order_index so we mark the visually-first column.
                first_idx = min(range(len(specs)), key=lambda i: specs[i]["order_index"])
                specs[first_idx]["is_initial"] = True
            if specs and not has_any_terminal:
                last_idx = max(range(len(specs)), key=lambda i: specs[i]["order_index"])
                specs[last_idx]["is_terminal"] = True
        else:
            # Hard-coded fallback — preserves pre-W2-C10 behavior.
            specs = [
                {
                    "name": s["name"],
                    "order_index": i,
                    "wip_limit": 0,
                    "category": s["category"],
                    "is_initial": s["is_initial"],
                    "is_terminal": s["is_terminal"],
                    "max_duration_days": None,
                    "entry_policy": "any",
                    "exit_policy": "any",
                }
                for i, s in enumerate(self.DEFAULT_COLUMNS)
            ]

        columns = []
        for spec in specs:
            column = BoardColumn(
                project_id=project_id,
                name=spec["name"],
                order_index=spec["order_index"],
                wip_limit=spec.get("wip_limit", 0),
                category=spec["category"],
                is_initial=spec["is_initial"],
                is_terminal=spec["is_terminal"],
                max_duration_days=spec.get("max_duration_days"),
                entry_policy=spec.get("entry_policy", "any"),
                exit_policy=spec.get("exit_policy", "any"),
            )
            created = await self.column_repo.create(column)
            columns.append(_to_dto(created, 0))
        return columns

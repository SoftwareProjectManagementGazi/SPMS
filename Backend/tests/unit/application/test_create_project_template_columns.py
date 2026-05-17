"""Wave 2 W2-C10 — CreateProjectUseCase template-driven column resolution.

These tests verify the four-path fallback chain that ``CreateProjectUseCase``
walks when seeding initial board columns for a new project:

  1. ``dto.columns`` (user-customized) — preserves V1 behavior.
  2. ``template.default_columns`` (W2-C9 engine-aware) — built-in templates.
  3. ``template.columns``         (Wave 1 legacy)     — extended templates.
  4. ``SeedDefaultColumnsUseCase.DEFAULT_COLUMNS``    — no-template fallback.

The tests substitute lightweight in-memory fakes for the project / template
repositories so the use case can be exercised without a database. This is
Liskov-substitutable per CLAUDE.md L principle — production paths route
through the same ABCs.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import pytest

from app.application.dtos.project_dtos import ProjectCreateDTO
from app.application.use_cases.manage_projects import CreateProjectUseCase
from app.domain.entities.project import Methodology, Project
from app.domain.entities.process_template import ProcessTemplate


# --------------------------------------------------------------------------- #
# Lightweight fakes — minimum surface required by CreateProjectUseCase.
# --------------------------------------------------------------------------- #


class _InMemoryProjectRepo:
    """Captures the Project sent to ``create()`` so tests can introspect columns."""

    def __init__(self) -> None:
        self.created_project: Optional[Project] = None
        self._next_id = 1

    async def create(self, project: Project) -> Project:
        # Echo back with an assigned id + column ids so the use case can
        # complete (it reads created_project.id + columns[0].id downstream).
        # created_at is populated so ProjectResponseDTO.model_validate
        # downstream (use case return) does not trip on the not-None contract.
        column_id = 100
        echoed_columns = []
        for col in project.columns:
            col_copy = col.model_copy(update={"id": column_id, "project_id": self._next_id})
            echoed_columns.append(col_copy)
            column_id += 1
        echoed = project.model_copy(
            update={
                "id": self._next_id,
                "columns": echoed_columns,
                "created_at": datetime(2026, 1, 1),
            }
        )
        self._next_id += 1
        self.created_project = echoed
        return echoed


class _FakeTemplateRepo:
    """Returns a single template by name; mimics IProcessTemplateRepository.get_by_name."""

    def __init__(self, template: Optional[ProcessTemplate]) -> None:
        self._template = template

    async def get_by_name(self, name: str) -> Optional[ProcessTemplate]:
        return self._template


def _make_dto(columns: Optional[List[str]] = None) -> ProjectCreateDTO:
    return ProjectCreateDTO(
        key="TST",
        name="Test Project",
        start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM,
        columns=columns or [],
    )


# --------------------------------------------------------------------------- #
# Path 2 — template.default_columns (W2-C9 engine-aware shape) — canonical.
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_create_project_uses_template_default_columns_when_present():
    """W2-C10 happy path: built-in Scrum template default_columns flow through.

    Verifies the engine fields (category, is_initial, is_terminal, policies)
    survive the use case and land on the BoardColumn entity passed to repo.create.
    """
    scrum_default = [
        {
            "name": "Backlog", "order_index": 0, "wip_limit": 0,
            "category": "todo", "is_initial": True, "is_terminal": False,
            "max_duration_days": None,
            "entry_policy": "any", "exit_policy": "any",
        },
        {
            "name": "In Progress", "order_index": 1, "wip_limit": 0,
            "category": "in_progress", "is_initial": False, "is_terminal": False,
            "entry_policy": "any", "exit_policy": "any",
        },
        {
            "name": "Done", "order_index": 2, "wip_limit": 0,
            "category": "done", "is_initial": False, "is_terminal": True,
            "entry_policy": "any", "exit_policy": "terminal_lock",
        },
    ]
    template = ProcessTemplate(
        name="Scrum",
        columns=[],  # legacy field empty — Path 3 NOT taken
        default_columns=scrum_default,
        behavioral_flags={"sprint_required": True},
    )
    project_repo = _InMemoryProjectRepo()
    template_repo = _FakeTemplateRepo(template)
    use_case = CreateProjectUseCase(project_repo, template_repo=template_repo)

    await use_case.execute(_make_dto(), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert [c.name for c in created.columns] == ["Backlog", "In Progress", "Done"]
    assert created.columns[0].is_initial is True
    assert created.columns[0].category == "todo"
    assert created.columns[1].category == "in_progress"
    assert created.columns[-1].is_terminal is True
    assert created.columns[-1].exit_policy == "terminal_lock"


# --------------------------------------------------------------------------- #
# Path 3 — template.columns (Wave 1 legacy shape) — extended templates.
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_create_project_falls_back_to_legacy_columns_when_default_columns_null():
    """W2-C10 Path 3: extended template with ``default_columns=None`` falls back
    to the legacy ``columns`` JSONB.

    Engine fields default to safe values (category=todo, policies=any).
    is_initial / is_terminal are inferred positionally so the engine still
    has a start + end state without requiring a template migration.
    """
    template = ProcessTemplate(
        name="Scrum",
        columns=[
            {"name": "Plan", "order": 0},
            {"name": "Develop", "order": 1, "wip_limit": 3},
            {"name": "Review", "order": 2},
            {"name": "Deploy", "order": 3},
        ],
        default_columns=None,  # Path 2 skipped; Path 3 taken
    )
    project_repo = _InMemoryProjectRepo()
    template_repo = _FakeTemplateRepo(template)
    use_case = CreateProjectUseCase(project_repo, template_repo=template_repo)

    await use_case.execute(_make_dto(), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert len(created.columns) == 4
    assert [c.name for c in created.columns] == ["Plan", "Develop", "Review", "Deploy"]

    # Positional inference for the legacy shape.
    assert created.columns[0].is_initial is True
    assert created.columns[0].is_terminal is False
    assert created.columns[-1].is_initial is False
    assert created.columns[-1].is_terminal is True

    # wip_limit preserved from legacy shape (Develop = 3).
    assert created.columns[1].wip_limit == 3

    # Engine fields default to safe values when missing in the legacy shape.
    assert created.columns[0].category == "todo"
    assert created.columns[0].entry_policy == "any"


# --------------------------------------------------------------------------- #
# Path 1 — dto.columns (user-customized) — V1 behavior preserved.
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_create_project_uses_dto_columns_when_provided():
    """W2-C10 Path 1: user-supplied DTO columns always win, even if a template
    has rich default_columns. Preserves V1 behavior — the user gets exactly
    what they asked for.
    """
    template = ProcessTemplate(
        name="Scrum",
        default_columns=[
            {"name": "Backlog", "order_index": 0, "category": "todo", "is_initial": True},
            {"name": "Done", "order_index": 1, "category": "done", "is_terminal": True},
        ],
    )
    dto = _make_dto(columns=["Custom1", "Custom2"])
    project_repo = _InMemoryProjectRepo()
    use_case = CreateProjectUseCase(project_repo, template_repo=_FakeTemplateRepo(template))

    await use_case.execute(dto, manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert [c.name for c in created.columns] == ["Custom1", "Custom2"]
    # Engine fields default — the user only supplied names.
    assert created.columns[0].is_initial is False
    assert created.columns[0].category == "todo"


# --------------------------------------------------------------------------- #
# Path 4 — no template, no DTO columns — hard-coded fallback.
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_create_project_falls_back_to_hardcoded_when_no_template():
    """W2-C10 Path 4: no template found, no DTO columns → 5-column hard-coded
    fallback (``SeedDefaultColumnsUseCase.DEFAULT_COLUMNS``).
    """
    project_repo = _InMemoryProjectRepo()
    # Template repo returns None — no template for this methodology.
    template_repo = _FakeTemplateRepo(None)
    use_case = CreateProjectUseCase(project_repo, template_repo=template_repo)

    await use_case.execute(_make_dto(), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert [c.name for c in created.columns] == [
        "Backlog", "Todo", "In Progress", "In Review", "Done"
    ]
    assert created.columns[0].is_initial is True
    assert created.columns[-1].is_terminal is True


@pytest.mark.asyncio
async def test_create_project_uses_hardcoded_when_no_template_repo_wired():
    """W2-C10 Path 4 variant: even without a template_repo wired, the project
    still gets the default 5-column board (legacy CreateProjectUseCase
    constructor compat — template_repo defaults to None).
    """
    project_repo = _InMemoryProjectRepo()
    use_case = CreateProjectUseCase(project_repo, template_repo=None)

    await use_case.execute(_make_dto(), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert len(created.columns) == 5
    assert created.columns[0].name == "Backlog"
    assert created.columns[-1].name == "Done"


# --------------------------------------------------------------------------- #
# Methodology-specific column counts (sanity vs the canonical seed lists).
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_create_project_with_scrum_template_yields_5_columns():
    """Sanity: the production Scrum default_columns produce a 5-column board
    (Backlog → To Do → In Progress → Code Review → Done).
    """
    from app.infrastructure.database._default_columns import SCRUM_DEFAULT_COLUMNS

    template = ProcessTemplate(name="Scrum", default_columns=SCRUM_DEFAULT_COLUMNS)
    project_repo = _InMemoryProjectRepo()
    use_case = CreateProjectUseCase(project_repo, template_repo=_FakeTemplateRepo(template))

    await use_case.execute(_make_dto(), manager_id=1)

    assert project_repo.created_project is not None
    assert len(project_repo.created_project.columns) == 5
    assert project_repo.created_project.columns[0].is_initial is True
    assert project_repo.created_project.columns[-1].is_terminal is True


@pytest.mark.asyncio
async def test_create_project_with_kanban_template_yields_5_columns_with_wip():
    """Sanity: Kanban default_columns produce 5 columns with non-zero WIP limits
    on the in_progress lanes (Analiz=3, Geliştirme=4, Test=2).
    """
    from app.infrastructure.database._default_columns import KANBAN_DEFAULT_COLUMNS

    template = ProcessTemplate(name="Kanban", default_columns=KANBAN_DEFAULT_COLUMNS)
    project_repo = _InMemoryProjectRepo()
    dto = ProjectCreateDTO(
        key="KBN",
        name="Test Kanban",
        start_date=datetime(2026, 1, 1),
        methodology=Methodology.KANBAN,
    )
    use_case = CreateProjectUseCase(project_repo, template_repo=_FakeTemplateRepo(template))

    await use_case.execute(dto, manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert len(created.columns) == 5
    # Find the WIP-limited columns by name (order-independent).
    by_name = {c.name: c for c in created.columns}
    assert by_name["Analiz"].wip_limit == 3
    assert by_name["Geliştirme"].wip_limit == 4
    assert by_name["Test"].wip_limit == 2


@pytest.mark.asyncio
async def test_create_project_with_waterfall_template_yields_6_columns_edges_only():
    """Sanity: Waterfall default_columns produce 6 sequential columns where
    intermediate columns enforce ``edges_only`` entry/exit policies.
    """
    from app.infrastructure.database._default_columns import WATERFALL_DEFAULT_COLUMNS

    template = ProcessTemplate(name="Waterfall", default_columns=WATERFALL_DEFAULT_COLUMNS)
    project_repo = _InMemoryProjectRepo()
    dto = ProjectCreateDTO(
        key="WTF",
        name="Test Waterfall",
        start_date=datetime(2026, 1, 1),
        methodology=Methodology.WATERFALL,
    )
    use_case = CreateProjectUseCase(project_repo, template_repo=_FakeTemplateRepo(template))

    await use_case.execute(dto, manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert len(created.columns) == 6
    # First column = initial, last = terminal.
    assert created.columns[0].is_initial is True
    assert created.columns[-1].is_terminal is True
    # Intermediate columns must enforce edges_only entry policy.
    for mid in created.columns[1:-1]:
        assert mid.entry_policy == "edges_only"

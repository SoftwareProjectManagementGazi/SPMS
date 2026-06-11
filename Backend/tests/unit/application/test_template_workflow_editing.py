"""Template workflow editing: default_workflow persistence + validation on
the template use cases, and copy-on-use at project create (deep copy — later
template edits never reach existing projects)."""
from __future__ import annotations

import copy
from datetime import datetime
from typing import Any, Dict, List, Optional

import pytest
from pydantic import ValidationError

from app.application.dtos.process_template_dtos import (
    ProcessTemplateCreateDTO,
    ProcessTemplateUpdateDTO,
)
from app.application.dtos.project_dtos import ProjectCreateDTO
from app.application.use_cases.manage_process_templates import (
    CreateProcessTemplateUseCase,
    UpdateProcessTemplateUseCase,
)
from app.application.use_cases.manage_projects import CreateProjectUseCase
from app.domain.entities.process_template import ProcessTemplate
from app.domain.entities.project import Methodology, Project


# --------------------------------------------------------------------------- #
# Shared fixtures
# --------------------------------------------------------------------------- #

# Minimal graph that passes WorkflowConfig validation.
VALID_WORKFLOW: Dict[str, Any] = {
    "mode": "flexible",
    "nodes": [
        {
            "id": "nd_aaaaaaaaaa", "name": "Başlangıç",
            "x": 60.0, "y": 120.0, "color": "status-todo",
            "is_initial": True,
        },
        {
            "id": "nd_bbbbbbbbbb", "name": "Bitiş",
            "x": 280.0, "y": 120.0, "color": "status-done",
            "is_final": True,
        },
    ],
    "edges": [
        {
            "id": "ed_template01",
            "source": "nd_aaaaaaaaaa",
            "target": "nd_bbbbbbbbbb",
            "type": "flow",
        }
    ],
    "groups": [],
}


class _InMemoryTemplateRepo:
    """Captures create()/update() args; serves get_by_id()/get_by_name()."""

    def __init__(self, template: Optional[ProcessTemplate] = None) -> None:
        self._template = template
        self.created: Optional[ProcessTemplate] = None
        self.updated: Optional[ProcessTemplate] = None

    async def get_by_id(self, template_id: int) -> Optional[ProcessTemplate]:
        return self._template

    async def get_by_name(self, name: str) -> Optional[ProcessTemplate]:
        return self._template

    async def create(self, template: ProcessTemplate) -> ProcessTemplate:
        self.created = template
        return template.model_copy(
            update={"id": 42, "created_at": datetime(2026, 1, 1)}
        )

    async def update(self, template: ProcessTemplate) -> ProcessTemplate:
        self.updated = template
        return template


class _InMemoryProjectRepo:
    """Echoes the created Project back with ids so the use case completes."""

    def __init__(self) -> None:
        self.created_project: Optional[Project] = None

    async def create(self, project: Project) -> Project:
        echoed_columns = [
            col.model_copy(update={"id": 100 + i, "project_id": 1})
            for i, col in enumerate(project.columns)
        ]
        echoed = project.model_copy(
            update={
                "id": 1,
                "columns": echoed_columns,
                "created_at": datetime(2026, 1, 1),
            }
        )
        self.created_project = echoed
        return echoed


def _custom_template(**overrides: Any) -> ProcessTemplate:
    base: Dict[str, Any] = dict(
        id=7,
        name="Özel Şablon",
        is_builtin=False,
        columns=[],
        recurring_tasks=[],
        behavioral_flags={},
        description="kullanıcı şablonu",
        default_workflow=copy.deepcopy(VALID_WORKFLOW),
    )
    base.update(overrides)
    return ProcessTemplate(**base)


def _project_dto(process_config: Optional[Dict[str, Any]] = None) -> ProjectCreateDTO:
    return ProjectCreateDTO(
        key="TWF",
        name="Template Workflow Project",
        start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM,
        process_config=process_config,
    )


# --------------------------------------------------------------------------- #
# 1. UpdateProcessTemplateUseCase — persistence + validation
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_update_template_persists_default_workflow():
    repo = _InMemoryTemplateRepo(_custom_template(default_workflow=None))
    uc = UpdateProcessTemplateUseCase(repo)

    new_wf = copy.deepcopy(VALID_WORKFLOW)
    new_wf["nodes"][0]["name"] = "Yeni Faz"
    result = await uc.execute(7, ProcessTemplateUpdateDTO(default_workflow=new_wf))

    assert repo.updated is not None
    assert repo.updated.default_workflow == new_wf
    # Response DTO must surface the saved graph back to the FE editor.
    assert result.default_workflow == new_wf
    # Untouched fields survive the model_copy merge.
    assert repo.updated.name == "Özel Şablon"
    assert repo.updated.description == "kullanıcı şablonu"


@pytest.mark.asyncio
async def test_update_template_rejects_invalid_node_id():
    repo = _InMemoryTemplateRepo(_custom_template())
    uc = UpdateProcessTemplateUseCase(repo)

    bad = copy.deepcopy(VALID_WORKFLOW)
    bad["nodes"][0]["id"] = "plan"  # fails the nd_* id format
    bad["edges"] = []

    with pytest.raises(ValidationError):
        await uc.execute(7, ProcessTemplateUpdateDTO(default_workflow=bad))
    assert repo.updated is None  # nothing persisted


@pytest.mark.asyncio
async def test_update_template_rejects_workflow_without_initial_node():
    repo = _InMemoryTemplateRepo(_custom_template())
    uc = UpdateProcessTemplateUseCase(repo)

    bad = copy.deepcopy(VALID_WORKFLOW)
    bad["nodes"][0]["is_initial"] = False  # no initial node left

    with pytest.raises(ValidationError):
        await uc.execute(7, ProcessTemplateUpdateDTO(default_workflow=bad))
    assert repo.updated is None


@pytest.mark.asyncio
async def test_update_template_rejects_edge_to_unknown_node():
    repo = _InMemoryTemplateRepo(_custom_template())
    uc = UpdateProcessTemplateUseCase(repo)

    bad = copy.deepcopy(VALID_WORKFLOW)
    bad["edges"][0]["target"] = "nd_zzzzzzzzzz"  # unknown node

    with pytest.raises(ValidationError):
        await uc.execute(7, ProcessTemplateUpdateDTO(default_workflow=bad))


@pytest.mark.asyncio
async def test_update_builtin_template_is_allowed():
    """Built-ins are editable from the admin editor (only delete is blocked)."""
    repo = _InMemoryTemplateRepo(_custom_template(is_builtin=True))
    uc = UpdateProcessTemplateUseCase(repo)

    new_wf = copy.deepcopy(VALID_WORKFLOW)
    new_wf["nodes"][0]["name"] = "Revize Faz"
    result = await uc.execute(
        7, ProcessTemplateUpdateDTO(default_workflow=new_wf)
    )

    assert repo.updated is not None
    assert repo.updated.default_workflow == new_wf
    assert result.is_builtin is True


@pytest.mark.asyncio
async def test_update_without_workflow_field_leaves_existing_graph():
    """A name-only PATCH must not clear the stored default_workflow."""
    repo = _InMemoryTemplateRepo(_custom_template())
    uc = UpdateProcessTemplateUseCase(repo)

    await uc.execute(7, ProcessTemplateUpdateDTO(name="Yeni Ad"))

    assert repo.updated is not None
    assert repo.updated.name == "Yeni Ad"
    assert repo.updated.default_workflow == VALID_WORKFLOW


# --------------------------------------------------------------------------- #
# 2. CreateProcessTemplateUseCase — clone fidelity
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_create_template_carries_default_workflow_and_fidelity_fields():
    repo = _InMemoryTemplateRepo()
    uc = CreateProcessTemplateUseCase(repo)

    dto = ProcessTemplateCreateDTO(
        name="Scrum (Kopya)",
        columns=[{"name": "Todo"}],
        behavioral_flags={"sprint_required": True},
        default_workflow=copy.deepcopy(VALID_WORKFLOW),
        default_columns=[{"name": "Backlog", "order_index": 0}],
        default_phase_criteria={"nd_aaaaaaaaaa": {"manual": []}},
        default_artifacts=[{"name": "Vizyon Belgesi"}],
        cycle_label_tr="Sprint",
        cycle_label_en="Sprint",
    )
    result = await uc.execute(dto)

    assert repo.created is not None
    assert repo.created.default_workflow == VALID_WORKFLOW
    assert repo.created.default_columns == [{"name": "Backlog", "order_index": 0}]
    assert repo.created.default_phase_criteria == {"nd_aaaaaaaaaa": {"manual": []}}
    assert repo.created.default_artifacts == [{"name": "Vizyon Belgesi"}]
    assert repo.created.cycle_label_tr == "Sprint"
    assert result.default_workflow == VALID_WORKFLOW
    assert repo.created.is_builtin is False


@pytest.mark.asyncio
async def test_create_template_rejects_invalid_default_workflow():
    repo = _InMemoryTemplateRepo()
    uc = CreateProcessTemplateUseCase(repo)

    bad = copy.deepcopy(VALID_WORKFLOW)
    bad["mode"] = "yolo-mode"  # not in the Literal set

    with pytest.raises(ValidationError):
        await uc.execute(ProcessTemplateCreateDTO(name="Bozuk", default_workflow=bad))
    assert repo.created is None


# --------------------------------------------------------------------------- #
# 3. CreateProjectUseCase — copy-on-use semantics
# --------------------------------------------------------------------------- #

# The create wizard's placeholder payload.
WIZARD_EMPTY_CONFIG: Dict[str, Any] = {
    "schema_version": 2,
    "phase_workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []},
    "task_workflow": {
        "capabilities": {
            "enforce_wip_limits": False,
            "initial_node_id": None,
            "has_recurring": True,
        },
        "edges": [],
        "groups": [],
    },
}


@pytest.mark.asyncio
async def test_new_project_copies_template_default_workflow_over_empty_placeholder():
    template = _custom_template()
    project_repo = _InMemoryProjectRepo()
    uc = CreateProjectUseCase(project_repo, template_repo=_InMemoryTemplateRepo(template))

    await uc.execute(_project_dto(copy.deepcopy(WIZARD_EMPTY_CONFIG)), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    pw = created.process_config["phase_workflow"]
    assert [n["id"] for n in pw["nodes"]] == ["nd_aaaaaaaaaa", "nd_bbbbbbbbbb"]
    assert len(pw["edges"]) == 1
    # task_workflow placeholder untouched by the copy.
    assert created.process_config["task_workflow"]["edges"] == []


@pytest.mark.asyncio
async def test_new_project_workflow_is_isolated_from_later_template_edits():
    """Editing the template after project creation must not reach the project."""
    template = _custom_template()
    project_repo = _InMemoryProjectRepo()
    uc = CreateProjectUseCase(project_repo, template_repo=_InMemoryTemplateRepo(template))

    await uc.execute(_project_dto(copy.deepcopy(WIZARD_EMPTY_CONFIG)), manager_id=1)
    created = project_repo.created_project
    assert created is not None

    # Simulate the admin editing the template AFTER the project exists.
    template.default_workflow["nodes"][0]["name"] = "HACKED"
    template.default_workflow["nodes"].append(
        {"id": "nd_cccccccccc", "name": "Yeni", "x": 0, "y": 0, "color": "status-todo"}
    )

    pw = created.process_config["phase_workflow"]
    assert pw["nodes"][0]["name"] == "Başlangıç"
    assert len(pw["nodes"]) == 2
    assert pw is not template.default_workflow


@pytest.mark.asyncio
async def test_new_project_keeps_client_sent_real_workflow():
    """A non-empty client workflow wins over the template default."""
    template = _custom_template()
    client_wf = {
        "mode": "continuous",
        "nodes": [
            {
                "id": "nd_dddddddddd", "name": "Tek Faz",
                "x": 10.0, "y": 10.0, "color": "status-progress",
                "is_initial": True, "is_final": True,
            }
        ],
        "edges": [],
        "groups": [],
    }
    cfg = copy.deepcopy(WIZARD_EMPTY_CONFIG)
    cfg["phase_workflow"] = client_wf

    project_repo = _InMemoryProjectRepo()
    uc = CreateProjectUseCase(project_repo, template_repo=_InMemoryTemplateRepo(template))
    await uc.execute(_project_dto(cfg), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    pw = created.process_config["phase_workflow"]
    assert [n["id"] for n in pw["nodes"]] == ["nd_dddddddddd"]
    assert pw["mode"] == "continuous"


@pytest.mark.asyncio
async def test_new_project_without_template_workflow_keeps_placeholder():
    """Template without a workflow leaves the empty placeholder intact."""
    template = _custom_template(default_workflow=None)
    project_repo = _InMemoryProjectRepo()
    uc = CreateProjectUseCase(project_repo, template_repo=_InMemoryTemplateRepo(template))

    await uc.execute(_project_dto(copy.deepcopy(WIZARD_EMPTY_CONFIG)), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    assert created.process_config["phase_workflow"]["nodes"] == []


@pytest.mark.asyncio
async def test_new_project_without_any_process_config_still_copies_template_workflow():
    """Clients omitting process_config entirely also inherit the graph."""
    template = _custom_template()
    project_repo = _InMemoryProjectRepo()
    uc = CreateProjectUseCase(project_repo, template_repo=_InMemoryTemplateRepo(template))

    await uc.execute(_project_dto(None), manager_id=1)

    created = project_repo.created_project
    assert created is not None
    pw = created.process_config["phase_workflow"]
    assert [n["id"] for n in pw["nodes"]] == ["nd_aaaaaaaaaa", "nd_bbbbbbbbbb"]

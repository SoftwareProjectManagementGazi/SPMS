"""Unit tests for AI workflow validators (Wave 1, Commit 1).

Plan ref: .planning/ai-workflow-generator-plan.md §4.1.3 + §9 Testing.
"""

import pytest

from app.domain.entities.ai_workflow_suggestion import (
    SuggestedColumn,
    SuggestedEdge,
    SuggestedNode,
    TaskStatusSuggestion,
    WorkflowSuggestion,
)
from app.domain.services.ai_workflow_validator import (
    validate_lifecycle_suggestion,
    validate_task_status_suggestion,
)


# ---------------------------------------------------------------------------
# Lifecycle tests
# ---------------------------------------------------------------------------


def _make_valid_lifecycle() -> WorkflowSuggestion:
    """Minimal valid lifecycle: 3 nodes, 2 flow edges, no rule violations."""
    return WorkflowSuggestion(
        methodology_label="Waterfall",
        nodes=[
            SuggestedNode(id="n1", label="Plan", description="Plan.", color="status-todo"),
            SuggestedNode(id="n2", label="Build", description="Build.", color="status-progress"),
            SuggestedNode(id="n3", label="Ship", description="Ship.", color="status-done"),
        ],
        edges=[
            SuggestedEdge(source_id="n1", target_id="n2", edge_type="flow"),
            SuggestedEdge(source_id="n2", target_id="n3", edge_type="flow"),
        ],
        rationale="Test rationale.",
    )


def test_lifecycle_valid_workflow_returns_empty_list():
    suggestion = _make_valid_lifecycle()
    assert validate_lifecycle_suggestion(suggestion) == []


def test_lifecycle_too_few_nodes():
    suggestion = WorkflowSuggestion(
        methodology_label="Scrum",
        nodes=[
            SuggestedNode(id="n1", label="Solo", description="Only one", color="status-todo"),
        ],
        edges=[],
        rationale="bad",
    )
    errors = validate_lifecycle_suggestion(suggestion)
    assert any("En az 3 faz" in e for e in errors)


def test_lifecycle_too_many_nodes():
    nodes = [
        SuggestedNode(id=f"n{i}", label=f"L{i}", description="d", color="status-todo")
        for i in range(14)
    ]
    edges = [
        SuggestedEdge(source_id=f"n{i}", target_id=f"n{i+1}", edge_type="flow")
        for i in range(13)
    ]
    suggestion = WorkflowSuggestion(
        methodology_label="Scrum", nodes=nodes, edges=edges, rationale="too many"
    )
    errors = validate_lifecycle_suggestion(suggestion)
    assert any("En fazla 13 faz" in e for e in errors)


def test_lifecycle_duplicate_node_ids():
    suggestion = WorkflowSuggestion(
        methodology_label="Scrum",
        nodes=[
            SuggestedNode(id="n1", label="A", description="d", color="status-todo"),
            SuggestedNode(id="n1", label="B", description="d", color="status-progress"),
            SuggestedNode(id="n2", label="C", description="d", color="status-done"),
        ],
        edges=[SuggestedEdge(source_id="n1", target_id="n2", edge_type="flow")],
        rationale="dup",
    )
    errors = validate_lifecycle_suggestion(suggestion)
    assert any("Tekrarlanan node id" in e for e in errors)


def test_lifecycle_edge_references_unknown_node():
    suggestion = _make_valid_lifecycle()
    suggestion.edges.append(
        SuggestedEdge(source_id="GHOST", target_id="n1", edge_type="flow")
    )
    errors = validate_lifecycle_suggestion(suggestion)
    assert any("bilinmeyen source_id" in e for e in errors)


def test_lifecycle_self_loop_rejected():
    suggestion = _make_valid_lifecycle()
    suggestion.edges.append(
        SuggestedEdge(source_id="n2", target_id="n2", edge_type="feedback")
    )
    errors = validate_lifecycle_suggestion(suggestion)
    assert any("self-loop" in e for e in errors)


def test_lifecycle_no_initial_node():
    # Every node has incoming flow edge → no initial
    suggestion = WorkflowSuggestion(
        methodology_label="Scrum",
        nodes=[
            SuggestedNode(id="n1", label="A", description="d", color="status-todo"),
            SuggestedNode(id="n2", label="B", description="d", color="status-progress"),
            SuggestedNode(id="n3", label="C", description="d", color="status-done"),
        ],
        edges=[
            SuggestedEdge(source_id="n1", target_id="n2", edge_type="flow"),
            SuggestedEdge(source_id="n2", target_id="n3", edge_type="flow"),
            SuggestedEdge(source_id="n3", target_id="n1", edge_type="flow"),  # cycle
        ],
        rationale="cyclic",
    )
    errors = validate_lifecycle_suggestion(suggestion)
    assert any("Başlangıç node'u yok" in e for e in errors)


def test_lifecycle_isolated_node():
    suggestion = WorkflowSuggestion(
        methodology_label="Scrum",
        nodes=[
            SuggestedNode(id="n1", label="A", description="d", color="status-todo"),
            SuggestedNode(id="n2", label="B", description="d", color="status-progress"),
            SuggestedNode(id="n3", label="C", description="d", color="status-done"),
            SuggestedNode(id="n4", label="ISOLATED", description="d", color="status-blocked"),
        ],
        edges=[
            SuggestedEdge(source_id="n1", target_id="n2", edge_type="flow"),
            SuggestedEdge(source_id="n2", target_id="n3", edge_type="flow"),
        ],
        rationale="isolated",
    )
    errors = validate_lifecycle_suggestion(suggestion)
    assert any("İzole node" in e and "n4" in e for e in errors)


# ---------------------------------------------------------------------------
# Task Status tests
# ---------------------------------------------------------------------------


def _make_valid_task_status() -> TaskStatusSuggestion:
    """Minimal valid task status: 3 main columns + 1 special."""
    return TaskStatusSuggestion(
        methodology_label="Scrum",
        columns=[
            SuggestedColumn(
                id="c1", label="Yapılacak", description="Backlog",
                color="status-todo", is_initial=True,
            ),
            SuggestedColumn(
                id="c2", label="Devam Ediyor", description="In progress",
                color="status-progress", wip_limit=3,
            ),
            SuggestedColumn(
                id="c3", label="Bitti", description="Done",
                color="status-done", is_final=True,
            ),
            SuggestedColumn(
                id="cs1", label="Blocked", description="Engelli",
                color="status-blocked", is_special=True,
            ),
        ],
        rationale="Standart 3-sütun + Blocked",
    )


def test_task_status_valid_returns_empty():
    assert validate_task_status_suggestion(_make_valid_task_status()) == []


def test_task_status_too_few_main_columns():
    suggestion = TaskStatusSuggestion(
        methodology_label="Kanban",
        columns=[
            SuggestedColumn(
                id="c1", label="Solo", description="d",
                color="status-todo", is_initial=True, is_final=True,
            ),
        ],
        rationale="bad",
    )
    errors = validate_task_status_suggestion(suggestion)
    assert any("En az 3 ana akış sütunu" in e for e in errors)


def test_task_status_no_initial_column():
    suggestion = _make_valid_task_status()
    suggestion.columns[0].is_initial = False
    errors = validate_task_status_suggestion(suggestion)
    assert any("başlangıç ana sütun" in e for e in errors)


def test_task_status_multiple_initial_columns():
    suggestion = _make_valid_task_status()
    suggestion.columns[1].is_initial = True  # now 2 initial
    errors = validate_task_status_suggestion(suggestion)
    assert any("Tam olarak 1 başlangıç" in e for e in errors)


def test_task_status_no_final_column():
    suggestion = _make_valid_task_status()
    suggestion.columns[2].is_final = False
    errors = validate_task_status_suggestion(suggestion)
    assert any("bitiş ana sütunu" in e for e in errors)


def test_task_status_invalid_wip_limit():
    suggestion = _make_valid_task_status()
    suggestion.columns[1].wip_limit = 0  # invalid
    errors = validate_task_status_suggestion(suggestion)
    assert any("WIP limit" in e for e in errors)


def test_task_status_special_columns_not_counted_in_main():
    """is_special=True columns should not pollute the main count."""
    suggestion = TaskStatusSuggestion(
        methodology_label="Scrum",
        columns=[
            SuggestedColumn(
                id="c1", label="A", description="d",
                color="status-todo", is_initial=True,
            ),
            SuggestedColumn(
                id="c2", label="B", description="d",
                color="status-progress",
            ),
            SuggestedColumn(
                id="c3", label="C", description="d",
                color="status-done", is_final=True,
            ),
            # 5 special columns — should NOT trigger "too many"
            SuggestedColumn(
                id="s1", label="Blocked", description="d",
                color="status-blocked", is_special=True,
            ),
            SuggestedColumn(
                id="s2", label="OnHold", description="d",
                color="status-blocked", is_special=True,
            ),
            SuggestedColumn(
                id="s3", label="Cancelled", description="d",
                color="status-blocked", is_special=True,
            ),
            SuggestedColumn(
                id="s4", label="Rejected", description="d",
                color="status-blocked", is_special=True,
            ),
            SuggestedColumn(
                id="s5", label="Reopened", description="d",
                color="status-blocked", is_special=True,
            ),
            # 3 MORE special (8 total special, 11 columns total) so the TOTAL exceeds
            # _TASK_STATUS_MAX_COLUMNS=10 while the main count (3) stays under it.
            # Only correct special-exclusion (n_main=3) keeps this valid.
            SuggestedColumn(id="s6", label="Deferred", description="d", color="status-blocked", is_special=True),
            SuggestedColumn(id="s7", label="Archived", description="d", color="status-blocked", is_special=True),
            SuggestedColumn(id="s8", label="Paused", description="d", color="status-blocked", is_special=True),
        ],
        rationale="3 main + 8 special (11 total > 10 cap; exclusion must apply)",
    )
    # kills mutation: counting special columns toward the main count makes n_main=11
    # > 10 and emits a "too many main columns" error — so this would no longer be [].
    assert validate_task_status_suggestion(suggestion) == []

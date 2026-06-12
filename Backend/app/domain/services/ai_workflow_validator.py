"""AI Workflow Validator — pure domain rules.

Mirrors Frontend2/lib/lifecycle/workflow-validators.ts so the same rules
guard both user-edited and AI-generated workflows (CLAUDE.md §4.1 L:
substitutable implementations).

Plan reference: .planning/ai-workflow-generator-plan.md §4.1.3

Zero framework dependencies — unit-testable in pytest without httpx/SQL.
"""

from app.domain.entities.ai_workflow_suggestion import (
    WorkflowSuggestion,
    TaskStatusSuggestion,
)


# Tunables — keep small + auditable
_LIFECYCLE_MIN_NODES = 3
_LIFECYCLE_MAX_NODES = 13  # kanonik spiral 13 node (3 tur + teslimat)
_TASK_STATUS_MIN_COLUMNS = 3
_TASK_STATUS_MAX_COLUMNS = 10


def validate_lifecycle_suggestion(suggestion: WorkflowSuggestion) -> list[str]:
    """Validate a lifecycle suggestion against domain rules.

    Returns a list of error strings (empty list = valid).
    Caller decides whether to retry, surface, or reject.
    """
    errors: list[str] = []

    # --- Node count bounds
    n = len(suggestion.nodes)
    if n < _LIFECYCLE_MIN_NODES:
        errors.append(f"En az {_LIFECYCLE_MIN_NODES} faz olmalı (mevcut: {n})")
    if n > _LIFECYCLE_MAX_NODES:
        errors.append(f"En fazla {_LIFECYCLE_MAX_NODES} faz olabilir (mevcut: {n})")

    # --- Unique node IDs
    node_ids = [node.id for node in suggestion.nodes]
    if len(node_ids) != len(set(node_ids)):
        duplicates = [nid for nid in set(node_ids) if node_ids.count(nid) > 1]
        errors.append(f"Tekrarlanan node id'leri: {', '.join(duplicates)}")

    # --- All edge endpoints reference existing nodes
    node_id_set = set(node_ids)
    for i, edge in enumerate(suggestion.edges):
        if edge.source_id not in node_id_set:
            errors.append(f"Edge #{i}: bilinmeyen source_id '{edge.source_id}'")
        if edge.target_id not in node_id_set:
            errors.append(f"Edge #{i}: bilinmeyen target_id '{edge.target_id}'")
        if edge.source_id == edge.target_id:
            errors.append(f"Edge #{i}: self-loop (kendine bağlanan node) yasak")

    # --- At least one initial node (no incoming "flow" edges)
    targets_of_flow = {
        e.target_id for e in suggestion.edges if e.edge_type == "flow"
    }
    initials = [nid for nid in node_ids if nid not in targets_of_flow]
    if not initials:
        errors.append("Başlangıç node'u yok (her node'un gelen flow edge'i var)")

    # --- No isolated nodes (every node touches at least one edge)
    referenced = {e.source_id for e in suggestion.edges} | {
        e.target_id for e in suggestion.edges
    }
    isolated = [nid for nid in node_ids if nid not in referenced]
    if isolated and n > 1:  # single-node workflows trivially OK
        errors.append(f"İzole node'lar: {', '.join(isolated)}")

    return errors


def validate_task_status_suggestion(suggestion: TaskStatusSuggestion) -> list[str]:
    """Validate a task-status suggestion against domain rules.

    Returns a list of error strings (empty list = valid).
    """
    errors: list[str] = []

    # --- Column count bounds
    cols = suggestion.columns
    # Exclude "special" columns (Blocked/Cancelled/etc) from main-flow count
    main_cols = [c for c in cols if not c.is_special]
    n_main = len(main_cols)
    if n_main < _TASK_STATUS_MIN_COLUMNS:
        errors.append(
            f"En az {_TASK_STATUS_MIN_COLUMNS} ana akış sütunu olmalı "
            f"(mevcut: {n_main})"
        )
    if n_main > _TASK_STATUS_MAX_COLUMNS:
        errors.append(
            f"En fazla {_TASK_STATUS_MAX_COLUMNS} ana akış sütunu olabilir "
            f"(mevcut: {n_main})"
        )

    # --- Unique column IDs
    col_ids = [c.id for c in cols]
    if len(col_ids) != len(set(col_ids)):
        duplicates = [cid for cid in set(col_ids) if col_ids.count(cid) > 1]
        errors.append(f"Tekrarlanan column id'leri: {', '.join(duplicates)}")

    # --- Exactly one initial main column
    initial_main = [c for c in main_cols if c.is_initial]
    if len(initial_main) != 1:
        errors.append(
            f"Tam olarak 1 başlangıç ana sütun olmalı (mevcut: {len(initial_main)})"
        )

    # --- At least one final main column
    final_main = [c for c in main_cols if c.is_final]
    if not final_main:
        errors.append("En az 1 bitiş ana sütunu olmalı (is_final=True)")

    # --- WIP limits make sense (positive integers when set)
    for c in cols:
        if c.wip_limit is not None and c.wip_limit < 1:
            errors.append(
                f"Sütun '{c.label}' için geçersiz WIP limit: {c.wip_limit}"
            )

    return errors

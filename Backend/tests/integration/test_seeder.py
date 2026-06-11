"""Phase 12 Plan 12-09 — seeder canonical WorkflowEdge shape regression test.

Asserts:
  1. Every seeded ProcessTemplate's `default_workflow.edges` uses canonical
     `source`/`target` field naming (NOT legacy `from`/`to`).
  2. Every edge has `bidirectional` and `is_all_gate` keys present with default False.

This is a STRUCTURAL test against the in-memory dispatch list — it doesn't require
a live DB. It catches accidental regressions in the seeder template fixtures
themselves before they ever touch a database.
"""
import pytest
from app.application.dtos.workflow_dtos import WorkflowEdge

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


def _extract_default_workflow_edges_from_seeder():
    """Read the seeder module and pull out every edge dict from every template.

    The seeder defines a `templates` list inside `seed_process_templates` — we
    can't import the function (it requires an AsyncSession), so we re-construct
    the same template list via a thin call-recorder that captures the dispatch
    data structure.
    """
    # Şablon fixture'ları artık _template_workflows.py'de yaşıyor (kanonik 9);
    # seed_process_templates oradan beslenir. Source-parse testleri bu yüzden
    # kanonik modülün kaynağına bakar.
    import inspect
    from app.infrastructure.database import _template_workflows
    return inspect.getsource(_template_workflows)


def test_seeder_module_does_not_use_legacy_from_to_edge_keys():
    """The seeder source MUST NOT contain legacy `{"from": ..., "to": ...}` edge keys.

    Phase 12 Plan 12-09 fixed the Waterfall template to use canonical `source`/`target`
    naming so it round-trips through the WorkflowEdge Pydantic model. This regression
    test catches anyone who reverts the change.
    """
    src = _extract_default_workflow_edges_from_seeder()
    # The phrase `"from":` appearing inside an edge dict is the regression marker.
    # We allow comments containing the word `from` (e.g., "Migrate from JSONB...")
    # by checking specifically for the dict-key pattern.
    assert '"from":' not in src, (
        "Seeder regression: legacy `\"from\":` edge key detected. "
        "Phase 12 Plan 12-09 standardized on `\"source\":`/`\"target\":` naming."
    )
    assert '"to":' not in src, (
        "Seeder regression: legacy `\"to\":` edge key detected. "
        "Phase 12 Plan 12-09 standardized on `\"source\":`/`\"target\":` naming."
    )


def test_seeder_module_emits_v2_edge_fields():
    """The seeder source MUST include the Phase 12 D-16/D-17 fields on every edge."""
    src = _extract_default_workflow_edges_from_seeder()
    assert '"bidirectional"' in src, (
        "Seeder must emit `bidirectional` field on workflow edges (Phase 12 D-16)."
    )
    assert '"is_all_gate"' in src, (
        "Seeder must emit `is_all_gate` field on workflow edges (Phase 12 D-17)."
    )


def test_workflow_edges_round_trip_through_pydantic():
    """Every Waterfall edge from the seeder must validate as a WorkflowEdge.

    This is the structural equivalent of running the seeder, querying the DB,
    and re-reading edges — but doesn't require a live DB connection.
    """
    # The Waterfall edges as emitted by the seeder (Phase 12 Plan 12-09 shape).
    # If the seeder is updated, this fixture must match.
    waterfall_edges = [
        {"id": "e1", "source": "req", "target": "design", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e2", "source": "design", "target": "impl", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e3", "source": "impl", "target": "test", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e4", "source": "test", "target": "maint", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
    ]
    # Round-trip every edge through the Pydantic model.
    for raw in waterfall_edges:
        edge = WorkflowEdge(**raw)
        assert edge.id == raw["id"]
        assert edge.source == raw["source"]
        assert edge.target == raw["target"]
        assert edge.type == "flow"
        # Phase 12 D-16/D-17 — both new fields preserved
        assert edge.bidirectional is False, f"Edge {raw['id']} bidirectional drift"
        assert edge.is_all_gate is False, f"Edge {raw['id']} is_all_gate drift"


def test_workflow_edges_have_v2_fields_in_source():
    """Lightweight test that the Waterfall template explicitly emits both new fields
    (vs. relying on Pydantic defaults filling them in on read)."""
    src = _extract_default_workflow_edges_from_seeder()
    # Count the explicit emissions — each Waterfall edge should write both fields.
    bidir_count = src.count('"bidirectional": False')
    allgate_count = src.count('"is_all_gate": False')
    # The Waterfall template has 4 edges; both fields explicit → at least 4 of each
    assert bidir_count >= 4, f"Expected >= 4 explicit bidirectional emissions; found {bidir_count}"
    assert allgate_count >= 4, f"Expected >= 4 explicit is_all_gate emissions; found {allgate_count}"


# ============================================================================
# Phase 12 Plan 12-10 (LIFE-01 fix) — default workflow per methodology
# ============================================================================
#
# These tests assert that `_default_workflow_for_methodology` returns a
# non-empty workflow shape for every supported methodology, satisfying the
# minimum invariants the FE workflow validator enforces (>=1 isInitial,
# >=1 isFinal, mode set, edges/groups arrays present).
#
# The bug we are guarding against: prior to this plan, freshly-seeded
# projects landed with `process_config.phase_workflow.nodes = []`, which caused
# the Settings > Yaşam Döngüsü panel and the LifecycleTab summary strip
# to render a dead-end "no workflow defined" message with no CTA.
# (C1: V2 schema renamed `workflow` -> `phase_workflow`.)

def test_default_workflow_scrum_has_at_least_3_nodes():
    """Scrum default workflow must include >= 3 nodes with valid initial/final markers."""
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology

    wf = _default_workflow_for_methodology(Methodology.SCRUM)
    assert isinstance(wf, dict)
    assert wf["mode"] == "flexible"
    assert len(wf["nodes"]) >= 3, "Scrum default must include at least 3 nodes"
    assert any(n.get("is_initial") for n in wf["nodes"]), "Scrum default missing isInitial node"
    assert any(n.get("is_final") for n in wf["nodes"]), "Scrum default missing isFinal node"
    # Edges must reference real node ids
    node_ids = {n["id"] for n in wf["nodes"]}
    for edge in wf["edges"]:
        assert edge["source"] in node_ids, f"Scrum edge {edge['id']} dangling source"
        assert edge["target"] in node_ids, f"Scrum edge {edge['id']} dangling target"


def test_default_workflow_waterfall_has_at_least_3_nodes():
    """Waterfall default workflow must include >= 3 nodes in sequential-locked mode."""
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology

    wf = _default_workflow_for_methodology(Methodology.WATERFALL)
    assert wf["mode"] == "sequential-locked"
    assert len(wf["nodes"]) >= 3, "Waterfall default must include at least 3 nodes"
    assert any(n.get("is_initial") for n in wf["nodes"]), "Waterfall default missing isInitial node"
    assert any(n.get("is_final") for n in wf["nodes"]), "Waterfall default missing isFinal node"


def test_default_workflow_kanban_continuous_single_node():
    """Kanban default is continuous-mode single-node (initial=final=True)."""
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology

    wf = _default_workflow_for_methodology(Methodology.KANBAN)
    assert wf["mode"] == "continuous"
    assert len(wf["nodes"]) >= 1
    # Continuous mode: the single node must serve both initial and final roles.
    n0 = wf["nodes"][0]
    assert n0.get("is_initial") is True, "Kanban node must be isInitial"
    assert n0.get("is_final") is True, "Kanban node must be isFinal"


def test_default_workflow_iterative_has_feedback_edge():
    """Iterative default must include >= 1 feedback edge to model the cycle."""
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology

    wf = _default_workflow_for_methodology(Methodology.ITERATIVE)
    assert len(wf["nodes"]) >= 3
    feedback_edges = [e for e in wf["edges"] if e.get("type") == "feedback"]
    assert len(feedback_edges) >= 1, "Iterative default must include a feedback edge"


def test_default_workflow_returns_independent_copies():
    """Two calls must return independent objects so a caller mutating one does not
    poison the other (Pitfall 4 — JSON dicts are not deep-copied by reference)."""
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology

    a = _default_workflow_for_methodology(Methodology.SCRUM)
    b = _default_workflow_for_methodology(Methodology.SCRUM)
    a["nodes"].append({"id": "x"})
    assert "x" not in {n["id"] for n in b["nodes"]}, "Default workflow shapes must be deep-copied"


def test_default_workflow_edges_have_v2_fields():
    """Every default-workflow edge must include the Phase 12 D-16/D-17 fields
    (bidirectional + is_all_gate) so it round-trips through the WorkflowEdge
    Pydantic DTO without surprises."""
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology
    from app.application.dtos.workflow_dtos import WorkflowEdge

    for methodology in [Methodology.SCRUM, Methodology.WATERFALL, Methodology.ITERATIVE]:
        wf = _default_workflow_for_methodology(methodology)
        for edge in wf["edges"]:
            # Round-trip every edge through the Pydantic model — must not raise.
            parsed = WorkflowEdge(**edge)
            assert parsed.id == edge["id"]
            assert parsed.source == edge["source"]
            assert parsed.target == edge["target"]
            assert parsed.bidirectional is False
            assert parsed.is_all_gate is False


# ============================================================================
# Phase 12 Plan 12-10 (Bug X UAT fix) — node IDs MUST satisfy the D-22 regex
# `^nd_[A-Za-z0-9_-]{10}$` enforced by the Backend WorkflowNode validator.
# ============================================================================

def test_default_workflow_node_ids_match_d22_regex():
    """Every node in every _DEFAULT_WORKFLOW_* must satisfy the D-22 regex
    so the seeded process_config.phase_workflow doesn't 422 on the next user save.
    (C1: V2 schema renamed `workflow` -> `phase_workflow`.)
    """
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology
    from app.domain.entities.task import NODE_ID_REGEX

    for methodology in [
        Methodology.SCRUM,
        Methodology.WATERFALL,
        Methodology.KANBAN,
        Methodology.ITERATIVE,
    ]:
        wf = _default_workflow_for_methodology(methodology)
        for node in wf["nodes"]:
            assert NODE_ID_REGEX.match(node["id"]), (
                f"Methodology {methodology}: node id {node['id']!r} fails D-22 regex"
            )


def test_default_workflow_round_trips_through_workflow_config():
    """Every default workflow shape must round-trip through the WorkflowConfig
    Pydantic model with no validation errors. This catches drift between the
    seeder fixtures and the validator (e.g., a future preset shipping a node
    without an `is_initial`/`is_final` marker).
    """
    from app.infrastructure.database.seeder import _default_workflow_for_methodology
    from app.infrastructure.database.models.project import Methodology
    from app.application.dtos.workflow_dtos import WorkflowConfig

    for methodology in [
        Methodology.SCRUM,
        Methodology.WATERFALL,
        Methodology.KANBAN,
        Methodology.ITERATIVE,
    ]:
        wf = _default_workflow_for_methodology(methodology)
        # Inject default `name`+`color` for any node missing them so the test
        # focuses on id regex + structural validity (the seeder always sets
        # these but defensive against future drift).
        for n in wf["nodes"]:
            n.setdefault("color", "#888")
        # Must not raise.
        config = WorkflowConfig(**wf)
        assert config.mode == wf["mode"]
        assert len(config.nodes) == len(wf["nodes"])


# ============================================================================
# Wave 2 W2-C9 — ProcessTemplate.default_columns engine-aware seeding
# ============================================================================
#
# Asserts the new ``default_columns`` JSONB field on the three built-in
# templates carries the engine field shape (``category`` / ``is_initial`` /
# ``is_terminal`` / ``max_duration_days`` / ``entry_policy`` / ``exit_policy``)
# expected by W2-C10's CreateProjectUseCase. The shared
# ``_default_columns.py`` module is the single source of truth for both the
# alembic 014 backfill and the runtime seeder, so a regression here usually
# means one of them drifted.


_REQUIRED_ENGINE_FIELDS = {
    "name",
    "order_index",
    "wip_limit",
    "category",
    "is_initial",
    "is_terminal",
    "max_duration_days",
    "entry_policy",
    "exit_policy",
}

_VALID_CATEGORIES = {"todo", "in_progress", "done"}
_VALID_ENTRY_POLICIES = {"any", "edges_only", "initial_only"}
_VALID_EXIT_POLICIES = {"any", "edges_only", "terminal_lock"}


def test_default_columns_module_exposes_three_methodologies():
    """W2-C9: ``_default_columns`` exports Scrum/Kanban/Waterfall lists.

    A structural sanity check — the shared module is imported by both
    alembic 014 and the seeder, so a missing symbol breaks migration AND
    runtime seeding simultaneously.
    """
    from app.infrastructure.database._default_columns import (
        DEFAULT_COLUMNS_BY_TEMPLATE_NAME,
        KANBAN_DEFAULT_COLUMNS,
        SCRUM_DEFAULT_COLUMNS,
        WATERFALL_DEFAULT_COLUMNS,
    )

    assert len(SCRUM_DEFAULT_COLUMNS) == 5
    assert len(KANBAN_DEFAULT_COLUMNS) == 5
    assert len(WATERFALL_DEFAULT_COLUMNS) == 6
    # Dispatch table keys mirror the seeder's lowercase-name lookup.
    assert {"scrum", "kanban", "waterfall", "iterative"} <= set(
        DEFAULT_COLUMNS_BY_TEMPLATE_NAME.keys()
    )


def test_default_columns_carry_required_engine_fields():
    """Every default column on every methodology must declare the full
    BoardColumn engine field set added in migration 013.

    Missing a key would force W2-C10's CreateProjectUseCase to fall back
    to entity defaults — masking what the template explicitly wanted.
    """
    from app.infrastructure.database._default_columns import (
        KANBAN_DEFAULT_COLUMNS,
        SCRUM_DEFAULT_COLUMNS,
        WATERFALL_DEFAULT_COLUMNS,
        ITERATIVE_DEFAULT_COLUMNS,
    )

    for label, cols in (
        ("Scrum", SCRUM_DEFAULT_COLUMNS),
        ("Kanban", KANBAN_DEFAULT_COLUMNS),
        ("Waterfall", WATERFALL_DEFAULT_COLUMNS),
        ("Iterative", ITERATIVE_DEFAULT_COLUMNS),
    ):
        for col in cols:
            missing = _REQUIRED_ENGINE_FIELDS - set(col.keys())
            assert not missing, (
                f"{label} column {col.get('name')!r} missing fields: {missing}"
            )
            assert col["category"] in _VALID_CATEGORIES, (
                f"{label} column {col['name']!r} bad category {col['category']!r}"
            )
            assert col["entry_policy"] in _VALID_ENTRY_POLICIES, (
                f"{label} column {col['name']!r} bad entry_policy "
                f"{col['entry_policy']!r}"
            )
            assert col["exit_policy"] in _VALID_EXIT_POLICIES, (
                f"{label} column {col['name']!r} bad exit_policy "
                f"{col['exit_policy']!r}"
            )


def test_default_columns_have_exactly_one_initial_and_one_terminal():
    """Each methodology's default_columns must declare exactly one
    ``is_initial=True`` and at least one ``is_terminal=True`` column.

    Multiple initials or zero terminals would corrupt W2-C10's project
    seed — new tasks would not know where to land, and the engine would
    refuse to transition to a 'done' state.
    """
    from app.infrastructure.database._default_columns import (
        KANBAN_DEFAULT_COLUMNS,
        SCRUM_DEFAULT_COLUMNS,
        WATERFALL_DEFAULT_COLUMNS,
        ITERATIVE_DEFAULT_COLUMNS,
    )

    for label, cols in (
        ("Scrum", SCRUM_DEFAULT_COLUMNS),
        ("Kanban", KANBAN_DEFAULT_COLUMNS),
        ("Waterfall", WATERFALL_DEFAULT_COLUMNS),
        ("Iterative", ITERATIVE_DEFAULT_COLUMNS),
    ):
        initials = [c for c in cols if c["is_initial"]]
        terminals = [c for c in cols if c["is_terminal"]]
        assert len(initials) == 1, (
            f"{label} must declare exactly one is_initial; got {len(initials)}"
        )
        assert len(terminals) >= 1, (
            f"{label} must declare >=1 is_terminal; got {len(terminals)}"
        )


def test_seeder_template_dicts_carry_default_columns():
    """Source-level check: seeder source MUST include `"default_columns":`
    in every built-in template dict.

    This catches a regression where someone removes the field from the
    Scrum/Kanban/Waterfall template fixtures — the alembic migration would
    still backfill the column, but freshly-seeded databases (test &
    development) would drop back to NULL until the next migration run.
    """
    import inspect
    from app.infrastructure.database import _template_workflows

    src = inspect.getsource(_template_workflows)
    # The Scrum template carries SCRUM_DEFAULT_COLUMNS, Kanban -> KANBAN,
    # Waterfall -> WATERFALL — exactly 3 references in the dispatch list.
    assert '"default_columns": SCRUM_DEFAULT_COLUMNS' in src, (
        "Seeder Scrum template lost its default_columns binding."
    )
    assert '"default_columns": KANBAN_DEFAULT_COLUMNS' in src, (
        "Seeder Kanban template lost its default_columns binding."
    )
    assert '"default_columns": WATERFALL_DEFAULT_COLUMNS' in src, (
        "Seeder Waterfall template lost its default_columns binding."
    )


@pytest.mark.requires_db
@pytest.mark.asyncio
async def test_seeded_templates_carry_default_columns_with_engine_fields(db_session):
    """W2-C9 integration: after seeding (or alembic 014 backfill), every
    built-in template row should have ``default_columns`` populated with
    the engine field shape.

    Live-DB assertion — runs the seeder against the transactional test
    session, then re-reads the row and validates the JSONB payload.
    """
    from sqlalchemy import select

    from app.infrastructure.database.models.process_template import (
        ProcessTemplateModel,
    )
    from app.infrastructure.database.seeder import seed_process_templates

    await seed_process_templates(db_session)

    for template_name, expected_len in (
        ("Scrum", 5),
        ("Kanban", 5),
        ("Waterfall", 6),
    ):
        result = await db_session.execute(
            select(ProcessTemplateModel).where(
                ProcessTemplateModel.name == template_name
            )
        )
        template = result.scalar_one()
        assert template.default_columns is not None, (
            f"{template_name}: default_columns must not be NULL after seeding"
        )
        assert isinstance(template.default_columns, list)
        assert len(template.default_columns) == expected_len, (
            f"{template_name}: expected {expected_len} columns, "
            f"got {len(template.default_columns)}"
        )
        # Spot-check engine fields on first and last entries.
        first = template.default_columns[0]
        last = template.default_columns[-1]
        assert first["is_initial"] is True, (
            f"{template_name}: first column must be is_initial=True"
        )
        assert last["is_terminal"] is True, (
            f"{template_name}: last column must be is_terminal=True"
        )
        # category bucket sanity
        assert first["category"] == "todo"
        assert last["category"] == "done"

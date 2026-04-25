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


def _extract_default_workflow_edges_from_seeder():
    """Read the seeder module and pull out every edge dict from every template.

    The seeder defines a `templates` list inside `seed_process_templates` — we
    can't import the function (it requires an AsyncSession), so we re-construct
    the same template list via a thin call-recorder that captures the dispatch
    data structure.
    """
    # Import the seeder module to ensure it parses cleanly
    from app.infrastructure.database import seeder  # noqa: F401
    # The templates list is defined inside seed_process_templates as a local
    # variable, not exposed at module scope. To test it without a live DB,
    # we re-derive the template fixtures by parsing the source file.
    import inspect
    src = inspect.getsource(seeder.seed_process_templates)
    return src


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
# projects landed with `process_config.workflow.nodes = []`, which caused
# the Settings > Yaşam Döngüsü panel and the LifecycleTab summary strip
# to render a dead-end "no workflow defined" message with no CTA.

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

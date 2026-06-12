"""Layout motoru testleri: her arketip ders kitabı şeklini üretmeli."""

import asyncio

import pytest

from app.application.dtos.ai_workflow_dto import LifecycleFormDTO
from app.domain.entities.ai_workflow_suggestion import (
    SuggestedEdge,
    SuggestedNode,
    WorkflowSuggestion,
)
from app.domain.services.workflow_layout import apply_layout
from app.infrastructure.adapters.ai import mock_workflow_adapter as mock_mod
from app.infrastructure.adapters.ai.mock_workflow_adapter import (
    MockWorkflowAdapter,
    pick_process,
)


def _chain_suggestion(n: int, archetype: str) -> WorkflowSuggestion:
    nodes = [
        SuggestedNode(id=f"n{i}", label=f"Faz {i}", description="d", color="status-todo")
        for i in range(n)
    ]
    edges = [
        SuggestedEdge(source_id=f"n{i}", target_id=f"n{i+1}", edge_type="flow")
        for i in range(n - 1)
    ]
    return WorkflowSuggestion(
        methodology_label="Test", layout_archetype=archetype,
        nodes=nodes, edges=edges, rationale="r",
    )


def test_pipeline_is_horizontal_line():
    s = _chain_suggestion(5, "PIPELINE")
    apply_layout(s)
    assert len({n.y for n in s.nodes}) == 1
    xs = [n.x for n in s.nodes]
    assert xs == sorted(xs) and len(set(xs)) == 5


def test_waterfall_is_descending_staircase():
    s = _chain_suggestion(6, "WATERFALL")
    apply_layout(s)
    xs = [n.x for n in s.nodes]
    ys = [n.y for n in s.nodes]
    assert xs == sorted(xs) and ys == sorted(ys)
    assert len(set(ys)) == 6  # her basamak farklı seviyede


def test_v_model_is_v_shaped():
    s = _chain_suggestion(9, "V_MODEL")
    apply_layout(s)
    ys = [n.y for n in s.nodes]
    apex_idx = ys.index(max(ys))
    assert apex_idx == 4  # dip ortada
    # Sol kol iner, sağ kol çıkar
    assert ys[:5] == sorted(ys[:5])
    assert ys[4:] == sorted(ys[4:], reverse=True)
    # Karşılıklı fazlar aynı yükseklikte (V simetrisi)
    assert ys[0] == ys[8] and ys[1] == ys[7] and ys[3] == ys[5]


def test_spiral_turns_grow_outward_with_exit():
    s = _chain_suggestion(9, "SPIRAL")  # 2 tur (8) + teslimat
    apply_layout(s)
    turn1 = s.nodes[0:4]
    turn2 = s.nodes[4:8]
    spread1 = max(n.x for n in turn1) - min(n.x for n in turn1)
    spread2 = max(n.x for n in turn2) - min(n.x for n in turn2)
    assert spread2 > spread1  # dış tur daha geniş
    exit_node = s.nodes[8]
    assert exit_node.x > max(n.x for n in s.nodes[:8])  # çıkış sağda


def test_cycle_entry_exit_and_loop():
    s = _chain_suggestion(7, "CYCLE")
    apply_layout(s)
    assert s.nodes[0].x == min(n.x for n in s.nodes)
    assert s.nodes[-1].x == max(n.x for n in s.nodes)
    middle_ys = {n.y for n in s.nodes[1:-1]}
    assert len(middle_ys) > 1  # döngü düz çizgi değil


def test_incremental_rows_shift_down_right():
    s = _chain_suggestion(9, "INCREMENTAL_ROWS")  # giriş + 2 artırım satırı
    apply_layout(s)
    row1 = s.nodes[1:5]
    row2 = s.nodes[5:9]
    assert {n.y for n in row1} == {80} and {n.y for n in row2} == {240}
    assert min(n.x for n in row2) > min(n.x for n in row1)


def test_parallel_branch_forks():
    nodes = [
        SuggestedNode(id=f"n{i}", label=f"F{i}", description="d", color="status-todo")
        for i in range(5)
    ]
    edges = [
        SuggestedEdge(source_id="n0", target_id="n1", edge_type="flow"),
        SuggestedEdge(source_id="n0", target_id="n2", edge_type="flow"),
        SuggestedEdge(source_id="n1", target_id="n3", edge_type="flow"),
        SuggestedEdge(source_id="n2", target_id="n3", edge_type="flow"),
        SuggestedEdge(source_id="n3", target_id="n4", edge_type="flow"),
    ]
    s = WorkflowSuggestion(
        methodology_label="RAD", layout_archetype="PARALLEL_BRANCH",
        nodes=nodes, edges=edges, rationale="r",
    )
    apply_layout(s)
    n1 = next(n for n in s.nodes if n.id == "n1")
    n2 = next(n for n in s.nodes if n.id == "n2")
    assert n1.x == n2.x and n1.y != n2.y  # paralel kollar aynı sütun, ayrı satır


@pytest.mark.parametrize("archetype", [
    "PIPELINE", "WATERFALL", "V_MODEL", "SPIRAL", "CYCLE",
    "INCREMENTAL_ROWS", "PROTOTYPE_LOOP", "PARALLEL_BRANCH", "FREEFORM",
])
@pytest.mark.parametrize("n", [4, 6, 9, 13])
def test_no_collisions_any_shape(archetype: str, n: int):
    s = _chain_suggestion(n, archetype)
    apply_layout(s)
    coords = [(node.x, node.y) for node in s.nodes]
    assert len(coords) == len(set(coords))


def test_flow_order_repairs_shuffled_emission():
    # n2 başta gelse bile akış sırası n0→n1→n2 olmalı (topo onarımı)
    nodes = [
        SuggestedNode(id="n2", label="C", description="d", color="status-done"),
        SuggestedNode(id="n0", label="A", description="d", color="status-todo"),
        SuggestedNode(id="n1", label="B", description="d", color="status-progress"),
    ]
    edges = [
        SuggestedEdge(source_id="n0", target_id="n1", edge_type="flow"),
        SuggestedEdge(source_id="n1", target_id="n2", edge_type="flow"),
    ]
    s = WorkflowSuggestion(
        methodology_label="T", layout_archetype="PIPELINE",
        nodes=nodes, edges=edges, rationale="r",
    )
    apply_layout(s)
    by_id = {n.id: n for n in s.nodes}
    assert by_id["n0"].x < by_id["n1"].x < by_id["n2"].x


# ---------------------------------------------------------------------------
# Mock decision tree — prompt'taki karar pusulasının aynası
# ---------------------------------------------------------------------------


def test_pick_process_rules():
    assert pick_process(LifecycleFormDTO(verification_rigor="critical")) == ("V-Modeli", "V_MODEL")
    assert pick_process(LifecycleFormDTO(risk_profile="high_innovative")) == ("Spiral", "SPIRAL")
    assert pick_process(LifecycleFormDTO(interrupt_level="constant"))[1] == "PIPELINE"
    assert pick_process(
        LifecycleFormDTO(req_clarity="vague", delivery_style="prototype_first")
    )[1] == "PROTOTYPE_LOOP"
    assert pick_process(
        LifecycleFormDTO(schedule_pressure="asap_mvp", customer_involvement="continuous")
    ) == ("RAD", "PARALLEL_BRANCH")
    assert pick_process(LifecycleFormDTO(delivery_style="increments"))[1] == "INCREMENTAL_ROWS"
    assert pick_process(LifecycleFormDTO(compliance_level="heavy")) == ("Waterfall", "WATERFALL")
    assert pick_process(LifecycleFormDTO(team_cadence="sprints")) == ("Scrum", "CYCLE")
    assert pick_process(LifecycleFormDTO())[1] == "CYCLE"  # boş form → dengeli default


def test_mock_stream_emits_layouted_nodes_and_done(monkeypatch):
    monkeypatch.setattr(mock_mod, "_NODE_INTERVAL_S", 0)
    monkeypatch.setattr(mock_mod, "_EDGE_INTERVAL_S", 0)
    monkeypatch.setattr(mock_mod, "_TEXT_TOKEN_S", 0)

    form = LifecycleFormDTO(verification_rigor="critical", quality_code_review=True)

    async def collect():
        adapter = MockWorkflowAdapter()
        return [ev async for ev in adapter.generate_lifecycle_stream(form, "tr")]

    events = asyncio.run(collect())
    types = [e.type for e in events]
    assert types[-1] == "done"
    done = events[-1].payload
    assert done["methodology"] == "V-Modeli"
    assert done["layout_archetype"] == "V_MODEL"

    node_events = [e.payload for e in events if e.type == "node_added"]
    assert len(node_events) >= 5
    coords = {(n["x"], n["y"]) for n in node_events}
    assert len(coords) == len(node_events)  # hepsi yerleştirilmiş, çakışma yok

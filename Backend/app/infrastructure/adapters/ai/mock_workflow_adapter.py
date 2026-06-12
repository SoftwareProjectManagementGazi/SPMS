"""Mock Workflow Adapter — deterministic stream for CI/dev/demo fallback.

Gemini ile aynı kontrat: kriterlerden süreç seçer (mini kural ağacı),
koordinatları aynı domain layout servisine bastırır, aynı SSE akışını üretir.
"""

import asyncio
from typing import AsyncIterator

from app.application.dtos.ai_workflow_dto import (
    LifecycleFormDTO,
    TaskStatusFormDTO,
    WorkflowEventDTO,
)
from app.application.ports.ai_workflow_suggestion_port import (
    IAIWorkflowSuggestionPort,
)
from app.domain.entities.ai_workflow_suggestion import (
    SuggestedEdge,
    SuggestedNode,
    WorkflowSuggestion,
)
from app.domain.services.workflow_layout import apply_layout


# Pacing — tuned so a full generation feels ~3-5 seconds (mockup §5.1).
_NODE_INTERVAL_S = 0.4
_EDGE_INTERVAL_S = 0.25
_TEXT_TOKEN_S = 0.15


def pick_process(form: LifecycleFormDTO) -> tuple[str, str]:
    """Kriterlerden (methodology_label, layout_archetype) seç — prompt'taki
    karar pusulasının deterministik aynası."""
    if form.verification_rigor == "critical":
        return "V-Modeli", "V_MODEL"
    if form.risk_profile == "high_innovative":
        return "Spiral", "SPIRAL"
    if form.interrupt_level == "constant" or form.team_cadence == "flow":
        return "Kanban", "PIPELINE"
    if form.req_clarity in ("vague", "volatile") and form.delivery_style == "prototype_first":
        return "Prototipleme", "PROTOTYPE_LOOP"
    if form.schedule_pressure == "asap_mvp" and form.customer_involvement == "continuous":
        return "RAD", "PARALLEL_BRANCH"
    if form.delivery_style == "increments":
        return "Artırımlı Model", "INCREMENTAL_ROWS"
    if form.compliance_level == "heavy" or (
        form.req_clarity == "clear_stable" and form.delivery_style == "big_bang"
    ):
        return "Waterfall", "WATERFALL"
    if form.team_cadence == "sprints" or form.req_clarity == "volatile":
        return "Scrum", "CYCLE"
    return "Yinelemeli Model", "CYCLE"


class MockWorkflowAdapter(IAIWorkflowSuggestionPort):
    """Hardcoded multi-archetype stream generator (no LLM call)."""

    # ---------------------------------------------------------------------
    # Lifecycle
    # ---------------------------------------------------------------------

    async def generate_lifecycle_stream(
        self,
        form: LifecycleFormDTO,
        language: str,
    ) -> AsyncIterator[WorkflowEventDTO]:
        label, archetype = pick_process(form)
        suggestion = self._build_lifecycle(label, archetype, form)
        apply_layout(suggestion)

        intro = f"{label} tabanlı bir yaşam döngüsü kuruyorum — kriterlerine göre seçtim."
        for chunk in _chunk_text(intro, size=10):
            yield WorkflowEventDTO(type="text_token", payload={"text": chunk})
            await asyncio.sleep(_TEXT_TOKEN_S)

        nodes = [n.model_dump() for n in suggestion.nodes]
        edges = [e.model_dump() for e in suggestion.edges]

        pending_edges = list(edges)
        emitted_ids: set[str] = set()

        for node in nodes:
            yield WorkflowEventDTO(type="node_added", payload=node)
            emitted_ids.add(node["id"])
            await asyncio.sleep(_NODE_INTERVAL_S)

            ready = [
                e for e in pending_edges
                if e["source_id"] in emitted_ids and e["target_id"] in emitted_ids
            ]
            for edge in ready:
                yield WorkflowEventDTO(type="edge_added", payload=edge)
                await asyncio.sleep(_EDGE_INTERVAL_S)
            for edge in ready:
                pending_edges.remove(edge)

        for edge in pending_edges:
            yield WorkflowEventDTO(type="edge_added", payload=edge)
            await asyncio.sleep(_EDGE_INTERVAL_S)

        yield WorkflowEventDTO(type="rationale", payload={"text": suggestion.rationale})
        await asyncio.sleep(0.1)

        yield WorkflowEventDTO(
            type="done",
            payload={
                "node_count": len(nodes),
                "edge_count": len(edges),
                "methodology": label,
                "layout_archetype": archetype,
            },
        )

    # ---------------------------------------------------------------------
    # Task Status
    # ---------------------------------------------------------------------

    async def generate_task_status_stream(
        self,
        form: TaskStatusFormDTO,
        language: str,
    ) -> AsyncIterator[WorkflowEventDTO]:
        columns, rationale, label = self._task_status_template(form)

        intro = f"{label} tarzı görev akışını kuruyorum."
        for chunk in _chunk_text(intro, size=10):
            yield WorkflowEventDTO(type="text_token", payload={"text": chunk})
            await asyncio.sleep(_TEXT_TOKEN_S)

        for col in columns:
            yield WorkflowEventDTO(type="column_added", payload=col)
            await asyncio.sleep(_NODE_INTERVAL_S)

        yield WorkflowEventDTO(type="rationale", payload={"text": rationale})
        await asyncio.sleep(0.1)

        yield WorkflowEventDTO(
            type="done",
            payload={
                "column_count": len(columns),
                "methodology": label,
            },
        )

    # ---------------------------------------------------------------------
    # Templates
    # ---------------------------------------------------------------------

    def _build_lifecycle(
        self, label: str, archetype: str, form: LifecycleFormDTO
    ) -> WorkflowSuggestion:
        nodes, edges = _ARCHETYPE_TEMPLATES[archetype]()

        if form.quality_code_review:
            ids = {n.id for n in nodes}
            if "nd_mockimpl00" in ids and "nd_mocktest00" in ids:
                edges.append(SuggestedEdge(
                    source_id="nd_mockimpl00", target_id="nd_mocktest00",
                    edge_type="verification", label="Code Review",
                ))

        rationale = (
            f"Kriterlerine göre {label} seçtim. Bu mock çıktısıdır — gerçek "
            "AI (Gemini) aynı kriterlerle bağlama özel tasarım yapar."
        )
        return WorkflowSuggestion(
            methodology_label=label,
            layout_archetype=archetype,  # type: ignore[arg-type]
            nodes=nodes, edges=edges, rationale=rationale,
        )

    def _task_status_template(self, form: TaskStatusFormDTO):
        style = form.work_style or "sprints"
        label = {"sprints": "Scrum", "flow": "Kanban", "phases": "Faz Bazlı"}[style]
        initial_label = "Sprint Backlog" if style == "sprints" else "Yapılacak"

        columns = [
            {"id": "col_mock_1", "label": initial_label, "description": "Sıraya alındı", "color": "status-todo", "wip_limit": None, "is_initial": True, "is_final": False, "is_special": False},
            {"id": "col_mock_2", "label": "Devam Ediyor", "description": "Üzerinde çalışılıyor", "color": "status-progress", "wip_limit": 3 if form.wip_limits_enabled else None, "is_initial": False, "is_final": False, "is_special": False},
            {"id": "col_mock_3", "label": "İnceleme", "description": "Code review", "color": "status-review", "wip_limit": 2 if form.wip_limits_enabled else None, "is_initial": False, "is_final": False, "is_special": False},
            {"id": "col_mock_4", "label": "Bitti", "description": "Tamamlandı", "color": "status-done", "wip_limit": None, "is_initial": False, "is_final": True, "is_special": False},
        ]

        if form.bug_extra_verification:
            columns.insert(3, {
                "id": "col_mock_bugverif", "label": "Doğrulama (Bug)",
                "description": "Bug çözüldükten sonra ek doğrulama",
                "color": "status-review", "wip_limit": 2 if form.wip_limits_enabled else None,
                "is_initial": False, "is_final": False, "is_special": False,
            })

        for i, state in enumerate(form.special_states):
            columns.append({
                "id": f"col_mock_special_{i}",
                "label": state,
                "description": f"{state} durumu",
                "color": "status-blocked",
                "wip_limit": None,
                "is_initial": False,
                "is_final": False,
                "is_special": True,
            })

        rationale = (
            f"{label} tarzında {len([c for c in columns if not c['is_special']])} ana sütun + "
            f"{len([c for c in columns if c['is_special']])} özel durum kurdum (mock)."
        )
        return columns, rationale, label


# ---------------------------------------------------------------------------
# Archetype node/edge sets — koordinatsız; layout servisi yerleştirir
# ---------------------------------------------------------------------------


def _n(nid: str, label: str, desc: str, color: str) -> SuggestedNode:
    return SuggestedNode(id=nid, label=label, description=desc, color=color)


def _chain(ids: list[str]) -> list[SuggestedEdge]:
    return [
        SuggestedEdge(source_id=a, target_id=b, edge_type="flow")
        for a, b in zip(ids, ids[1:])
    ]


def _tpl_waterfall():
    nodes = [
        _n("nd_mockreq000", "Gereksinimler", "Kapsam ve dokümantasyon", "status-todo"),
        _n("nd_mockdes000", "Tasarım", "Mimari ve UI", "status-progress"),
        _n("nd_mockimpl00", "Uygulama", "Geliştirme", "status-progress"),
        _n("nd_mocktest00", "Test", "QA ve UAT", "status-review"),
        _n("nd_mockdep000", "Yayın", "Dağıtım", "status-done"),
        _n("nd_mockmnt000", "Bakım", "Destek", "status-done"),
    ]
    return nodes, _chain([n.id for n in nodes])


def _tpl_v_model():
    nodes = [
        _n("nd_mockreq000", "Gereksinim Analizi", "SRS ve izlenebilirlik", "status-todo"),
        _n("nd_mocksys000", "Sistem Tasarımı", "Yüksek düzey mimari", "status-todo"),
        _n("nd_mockmod000", "Modül Tasarımı", "Detay tasarım", "status-progress"),
        _n("nd_mockimpl00", "Kodlama", "Geliştirme ve inceleme", "status-progress"),
        _n("nd_mockunit00", "Birim Testi", "Modül doğrulaması", "status-review"),
        _n("nd_mocktest00", "Sistem Testi", "Bütünleşik test", "status-review"),
        _n("nd_mockacc000", "Kabul Testi", "Müşteri kabulü", "status-done"),
    ]
    edges = _chain([n.id for n in nodes])
    edges += [
        SuggestedEdge(source_id="nd_mockmod000", target_id="nd_mockunit00",
                      edge_type="verification", bidirectional=True, label="Modül ↔ Birim"),
        SuggestedEdge(source_id="nd_mocksys000", target_id="nd_mocktest00",
                      edge_type="verification", bidirectional=True, label="Sistem ↔ Test"),
        SuggestedEdge(source_id="nd_mockreq000", target_id="nd_mockacc000",
                      edge_type="verification", bidirectional=True, label="Gereksinim ↔ Kabul"),
    ]
    return nodes, edges


def _tpl_spiral():
    names = [
        ("S1: Planlama", "status-todo"), ("S1: Risk Analizi", "status-progress"),
        ("S1: Prototip", "status-progress"), ("S1: Değerlendirme", "status-review"),
        ("S2: Planlama", "status-todo"), ("S2: Risk Azaltma", "status-progress"),
        ("S2: Geliştirme", "status-progress"), ("S2: Değerlendirme", "status-review"),
    ]
    nodes = [
        _n(f"nd_mocksp{i:04d}", label, "Spiral turu adımı", color)
        for i, (label, color) in enumerate(names)
    ]
    nodes.append(_n("nd_mockfnl000", "Teslimat", "Onaylı ürün canlıya alınır", "status-done"))
    edges = _chain([n.id for n in nodes])
    edges += [
        SuggestedEdge(source_id=nodes[1].id, target_id=nodes[0].id,
                      edge_type="feedback", label="Risk → Plan"),
        SuggestedEdge(source_id=nodes[5].id, target_id=nodes[4].id,
                      edge_type="feedback", label="Risk → Plan"),
    ]
    return nodes, edges


def _tpl_cycle_scrum():
    nodes = [
        _n("nd_mockbklg00", "Ürün Backlog'u", "Önceliklendirilmiş iş listesi", "status-todo"),
        _n("nd_mockplan00", "Sprint Planlama", "Sprint hedefi ve kapsam", "status-todo"),
        _n("nd_mockimpl00", "Sprint Geliştirme", "Artırım geliştirilir", "status-progress"),
        _n("nd_mocktest00", "İnceleme & Test", "Review ve doğrulama", "status-review"),
        _n("nd_mockretr00", "Retrospektif", "Süreç iyileştirme", "status-review"),
        _n("nd_mockincr00", "Artırım / Yayın", "Yayınlanabilir artırım", "status-done"),
    ]
    edges = _chain([n.id for n in nodes])
    edges.append(SuggestedEdge(source_id="nd_mockretr00", target_id="nd_mockplan00",
                               edge_type="feedback", label="Yeni sprint"))
    return nodes, edges


def _tpl_pipeline():
    nodes = [
        _n("nd_mockreq000", "Talep", "Yeni iş öğesi", "status-todo"),
        _n("nd_mockimpl00", "Geliştirme", "Akan iş", "status-progress"),
        _n("nd_mocktest00", "Doğrulama", "QA", "status-review"),
        _n("nd_mockdone00", "Teslim", "Yayına alma", "status-done"),
    ]
    return nodes, _chain([n.id for n in nodes])


def _tpl_incremental():
    nodes = [_n("nd_mockcore00", "Çekirdek Gereksinimler", "Mimari ve artırım sınırları", "status-todo")]
    for a in (1, 2):
        nodes += [
            _n(f"nd_mocka{a}des0", f"A{a}: Tasarım", f"Artırım {a} tasarımı", "status-todo"),
            _n(f"nd_mocka{a}dev0", f"A{a}: Geliştirme", f"Artırım {a} kodlaması", "status-progress"),
            _n(f"nd_mocka{a}tst0", f"A{a}: Test", f"Artırım {a} doğrulaması", "status-review"),
            _n(f"nd_mocka{a}del0", f"A{a}: Teslim", f"Artırım {a} yayını", "status-done"),
        ]
    return nodes, _chain([n.id for n in nodes])


def _tpl_prototype():
    nodes = [
        _n("nd_mockreq000", "Hızlı Gereksinim", "Bilinenler derlenir", "status-todo"),
        _n("nd_mockdes000", "Hızlı Tasarım", "Görünen yüzeyler", "status-todo"),
        _n("nd_mockimpl00", "Prototip Geliştirme", "Çalışan prototip", "status-progress"),
        _n("nd_mockeval00", "Müşteri Değerlendirmesi", "Geri bildirim toplanır", "status-review"),
        _n("nd_mockprod00", "Ürün Geliştirme", "Gerçek sistem inşası", "status-progress"),
        _n("nd_mocktest00", "Test & Teslim", "Kabul ve canlıya alma", "status-done"),
    ]
    edges = _chain([n.id for n in nodes])
    edges.append(SuggestedEdge(source_id="nd_mockeval00", target_id="nd_mockdes000",
                               edge_type="feedback", label="İyileştir"))
    return nodes, edges


def _tpl_parallel_rad():
    nodes = [
        _n("nd_mockplan00", "Gereksinim Planlaması", "Hedefler ve kısıtlar", "status-todo"),
        _n("nd_mockpra000", "Prototip Kolu A", "Paralel JAD kolu", "status-progress"),
        _n("nd_mockprb000", "Prototip Kolu B", "Paralel inşa kolu", "status-progress"),
        _n("nd_mockimpl00", "Entegrasyon", "Kollar birleşir", "status-progress"),
        _n("nd_mocktest00", "Test", "QA + UAT", "status-review"),
        _n("nd_mockdep000", "Sisteme Geçiş", "Eğitim ve canlıya geçiş", "status-done"),
    ]
    edges = [
        SuggestedEdge(source_id="nd_mockplan00", target_id="nd_mockpra000", edge_type="flow"),
        SuggestedEdge(source_id="nd_mockplan00", target_id="nd_mockprb000", edge_type="flow"),
        SuggestedEdge(source_id="nd_mockpra000", target_id="nd_mockimpl00", edge_type="flow"),
        SuggestedEdge(source_id="nd_mockprb000", target_id="nd_mockimpl00", edge_type="flow"),
        SuggestedEdge(source_id="nd_mockimpl00", target_id="nd_mocktest00", edge_type="flow"),
        SuggestedEdge(source_id="nd_mocktest00", target_id="nd_mockdep000", edge_type="flow"),
    ]
    return nodes, edges


_ARCHETYPE_TEMPLATES = {
    "WATERFALL": _tpl_waterfall,
    "V_MODEL": _tpl_v_model,
    "SPIRAL": _tpl_spiral,
    "CYCLE": _tpl_cycle_scrum,
    "PIPELINE": _tpl_pipeline,
    "INCREMENTAL_ROWS": _tpl_incremental,
    "PROTOTYPE_LOOP": _tpl_prototype,
    "PARALLEL_BRANCH": _tpl_parallel_rad,
    "FREEFORM": _tpl_pipeline,
}


def _chunk_text(text: str, size: int = 10) -> list[str]:
    """Split text into rough word-chunks so streaming feels like real LLM tokens."""
    words = text.split(" ")
    chunks: list[str] = []
    buf: list[str] = []
    for w in words:
        buf.append(w)
        if len(buf) >= size:
            chunks.append(" ".join(buf) + " ")
            buf = []
    if buf:
        chunks.append(" ".join(buf))
    return chunks

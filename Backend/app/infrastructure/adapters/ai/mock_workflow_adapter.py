"""Mock Workflow Adapter — deterministic stream for CI/dev/demo fallback.

Implements IAIWorkflowSuggestionPort without calling any external LLM. Streams
a hardcoded, methodology-aware workflow with realistic timing so the frontend
can develop against a real SSE stream without an API key.

Used in:
- CI (no API keys in repo)
- Frontend development before Wave 4 lands Gemini adapter
- Demo emergency fallback (if Gemini quota exhausted)

Plan reference: .planning/ai-workflow-generator-plan.md §4.3.4
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


# Pacing — tuned so a full generation feels ~3-5 seconds (mockup §5.1).
_NODE_INTERVAL_S = 0.4
_EDGE_INTERVAL_S = 0.25
_TEXT_TOKEN_S = 0.15


class MockWorkflowAdapter(IAIWorkflowSuggestionPort):
    """Hardcoded multi-methodology stream generator.

    Output shape: same `WorkflowEventDTO` envelope the real Gemini adapter
    emits, so downstream code (SSE writer, frontend hook) sees identical
    events regardless of provider.
    """

    # ---------------------------------------------------------------------
    # Lifecycle
    # ---------------------------------------------------------------------

    async def generate_lifecycle_stream(
        self,
        form: LifecycleFormDTO,
        language: str,
    ) -> AsyncIterator[WorkflowEventDTO]:
        nodes, edges, rationale = self._lifecycle_template(form)

        # 1) Chat narration — short methodology-aware intro
        intro = self._lifecycle_intro_text(form)
        for chunk in _chunk_text(intro, size=10):
            yield WorkflowEventDTO(type="text_token", payload={"text": chunk})
            await asyncio.sleep(_TEXT_TOKEN_S)

        # 2) Stream nodes + edges INTERLEAVED. After each node arrives, emit
        # any edges that became valid (both endpoints already on the canvas).
        # Forward-referencing edges (e.g. feedback loops Test→Tasarım) emit
        # at the tail after all nodes are placed. This matches the natural
        # "drawing" cadence users expect: build a node, connect it back,
        # build the next, connect it, etc.
        pending_edges = list(edges)
        emitted_ids: set[str] = set()

        for node in nodes:
            yield WorkflowEventDTO(type="node_added", payload=node)
            emitted_ids.add(node["id"])
            await asyncio.sleep(_NODE_INTERVAL_S)

            # Find edges whose both endpoints are now on the canvas
            ready = [
                e for e in pending_edges
                if e["source_id"] in emitted_ids and e["target_id"] in emitted_ids
            ]
            for edge in ready:
                yield WorkflowEventDTO(type="edge_added", payload=edge)
                await asyncio.sleep(_EDGE_INTERVAL_S)
            for edge in ready:
                pending_edges.remove(edge)

        # 3) Remaining forward-reference edges (feedback / verification loops)
        for edge in pending_edges:
            yield WorkflowEventDTO(type="edge_added", payload=edge)
            await asyncio.sleep(_EDGE_INTERVAL_S)

        # 4) Rationale
        yield WorkflowEventDTO(type="rationale", payload={"text": rationale})
        await asyncio.sleep(0.1)

        # 5) Done
        yield WorkflowEventDTO(
            type="done",
            payload={
                "node_count": len(nodes),
                "edge_count": len(edges),
                "methodology": form.methodology,
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
        columns, rationale = self._task_status_template(form)

        intro = self._task_status_intro_text(form)
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
                "methodology": form.methodology,
            },
        )

    # ---------------------------------------------------------------------
    # Templates (methodology-aware — minimal but useful per variant)
    # ---------------------------------------------------------------------

    def _lifecycle_intro_text(self, form: LifecycleFormDTO) -> str:
        team = form.team_size or "?"
        m = form.methodology
        if m == "ITERATIVE":
            return f"Iterative bir akış kuruyorum — {team} kişilik takım için her döngüde geri besleme döngüsü."
        if m == "WATERFALL":
            return f"Sıralı kilitli Waterfall fazlarını kuruyorum — {team} kişilik takım için."
        if m == "SCRUM":
            return f"Scrum yaşam döngüsünü kuruyorum — Sprint odaklı, retrospektif geri beslemeli."
        if m == "RAD":
            return f"RAD modeli — paralel kollarla hızlı prototip ve teslim."
        if m == "SPIRAL" if False else False:
            pass  # SPIRAL not in current methodology list; kept for clarity
        return f"{m} yaşam döngüsünü kuruyorum — {team} kişilik takım için."

    def _lifecycle_template(self, form: LifecycleFormDTO):
        """Returns (nodes, edges, rationale) tuple of dicts.

        Layout is methodology-aware:
          - WATERFALL: 6 nodes single horizontal row
          - SCRUM: 5 nodes horizontal + retrospective feedback loop
          - ITERATIVE: 5 nodes horizontal + feedback edge (Test → Tasarım)
          - INCREMENTAL: 5 nodes horizontal + increment-loop edge
          - EVOLUTIONARY: 5 nodes horizontal + prototype evolution loop
          - RAD: 6 nodes with parallel prototype branches (Y-fork)
          - KANBAN: 4 nodes continuous flow horizontal
        """
        m = form.methodology
        builder = {
            "WATERFALL": self._tpl_waterfall,
            "SCRUM": self._tpl_scrum,
            "KANBAN": self._tpl_kanban,
            "ITERATIVE": self._tpl_iterative,
            "INCREMENTAL": self._tpl_incremental,
            "EVOLUTIONARY": self._tpl_evolutionary,
            "RAD": self._tpl_rad,
        }.get(m, self._tpl_iterative)

        nodes, edges, rationale = builder()

        # Cross-methodology: code review toggle adds a verification edge between
        # implementation and test phases. Each template tags those nodes via
        # well-known ids (n_impl, n_test) so we can find them generically here.
        if form.quality_code_review:
            ids = {n["id"] for n in nodes}
            if "n_impl" in ids and "n_test" in ids:
                edges.append({
                    "source_id": "n_impl", "target_id": "n_test",
                    "edge_type": "verification", "bidirectional": False,
                    "is_all_gate": False, "label": "Code Review",
                })

        return nodes, edges, rationale

    # ---------------------------------------------------------------------
    # Per-methodology templates (positions hand-tuned, not auto-laid)
    # ---------------------------------------------------------------------

    def _tpl_waterfall(self):
        """6 nodes, single horizontal row. Classic sequential flow."""
        nodes = [
            {"id": "n_req",  "label": "Gereksinimler", "description": "Kapsam ve dokümantasyon", "color": "status-todo",     "x":  60, "y": 200},
            {"id": "n_des",  "label": "Tasarım",       "description": "Mimari ve UI",            "color": "status-progress", "x": 260, "y": 200},
            {"id": "n_impl", "label": "Uygulama",      "description": "Geliştirme",              "color": "status-progress", "x": 460, "y": 200},
            {"id": "n_test", "label": "Test",          "description": "QA ve UAT",               "color": "status-review",   "x": 660, "y": 200},
            {"id": "n_dep",  "label": "Yayın",         "description": "Dağıtım",                 "color": "status-done",     "x": 860, "y": 200},
            {"id": "n_mnt",  "label": "Bakım",         "description": "Destek",                  "color": "status-done",     "x": 1060, "y": 200},
        ]
        edges = _chain_flow_edges([n["id"] for n in nodes])
        rationale = (
            "Waterfall seçtiğin için sıralı kilitli 6 faz oluşturdum. "
            "Her faz tamamlanmadan sonraki başlamaz. Bu mock çıktısıdır — "
            "gerçek AI Wave 4'te devreye girince zenginleşecek."
        )
        return nodes, edges, rationale

    def _tpl_scrum(self):
        """5 nodes horizontal + retrospective feedback loop (Monitör → Yürütme)."""
        nodes = [
            {"id": "n_init", "label": "Başlatma", "description": "Vizyon ve hedefler",       "color": "status-todo",     "x":  60, "y": 200},
            {"id": "n_plan", "label": "Planlama", "description": "Backlog ve sprint planı",  "color": "status-todo",     "x": 260, "y": 200},
            {"id": "n_impl", "label": "Yürütme",  "description": "Sprint geliştirme",        "color": "status-progress", "x": 460, "y": 200},
            {"id": "n_test", "label": "İzleme",   "description": "Metrikler ve retro",       "color": "status-review",   "x": 660, "y": 200},
            {"id": "n_close","label": "Kapanış",  "description": "Teslim ve dersler",        "color": "status-done",     "x": 860, "y": 200},
        ]
        edges = _chain_flow_edges(["n_init", "n_plan", "n_impl", "n_test", "n_close"])
        edges.append({
            "source_id": "n_test", "target_id": "n_impl",
            "edge_type": "feedback", "bidirectional": False,
            "is_all_gate": False, "label": "Retro",
        })
        rationale = (
            "Scrum seçtiğin için Sprint döngüsünü kuran 5 faz + Retro geri besleme "
            "edge'i ekledim. Her sprint sonunda İzleme'den Yürütme'ye dönüş yapılır."
        )
        return nodes, edges, rationale

    def _tpl_kanban(self):
        """4 nodes single row. No iteration — continuous flow."""
        nodes = [
            {"id": "n_req",  "label": "Talep",       "description": "Yeni iş öğesi",      "color": "status-todo",     "x":  60, "y": 200},
            {"id": "n_impl", "label": "Geliştirme",  "description": "Akan iş",            "color": "status-progress", "x": 260, "y": 200},
            {"id": "n_test", "label": "Doğrulama",   "description": "QA",                 "color": "status-review",   "x": 460, "y": 200},
            {"id": "n_done", "label": "Teslim",      "description": "Yayına alma",        "color": "status-done",     "x": 660, "y": 200},
        ]
        edges = _chain_flow_edges([n["id"] for n in nodes])
        rationale = (
            "Kanban için sürekli akış kuran 4 faz oluşturdum. Sprint yok — "
            "iş öğeleri WIP limitleri içinde sürekli akar."
        )
        return nodes, edges, rationale

    def _tpl_iterative(self):
        """5 nodes horizontal + Test→Design feedback (per-cycle revision)."""
        nodes = [
            {"id": "n_disc", "label": "Keşif",       "description": "Gereksinim toplama",   "color": "status-todo",     "x":  60, "y": 200},
            {"id": "n_des",  "label": "Tasarım",     "description": "Mimari ve modüller",   "color": "status-progress", "x": 260, "y": 200},
            {"id": "n_impl", "label": "Geliştirme",  "description": "Kodlama ve birim test","color": "status-progress", "x": 460, "y": 200},
            {"id": "n_test", "label": "Test",        "description": "QA ve entegrasyon",    "color": "status-review",   "x": 660, "y": 200},
            {"id": "n_dep",  "label": "Yayın",       "description": "Dağıtım",              "color": "status-done",     "x": 860, "y": 200},
        ]
        edges = _chain_flow_edges([n["id"] for n in nodes])
        edges.append({
            "source_id": "n_test", "target_id": "n_des",
            "edge_type": "feedback", "bidirectional": False,
            "is_all_gate": False, "label": "Test → Tasarım",
        })
        rationale = (
            "Iterative seçtiğin için Test'ten Tasarım'a geri besleme edge'i "
            "ekledim — her döngüde tasarımı revize edebilirsin."
        )
        return nodes, edges, rationale

    def _tpl_incremental(self):
        """5 nodes + increment-loop edge (Release → Plan-next)."""
        nodes = [
            {"id": "n_plan", "label": "Planlama",    "description": "Artım kapsamı",       "color": "status-todo",     "x":  60, "y": 200},
            {"id": "n_des",  "label": "Tasarım",     "description": "Artım mimarisi",      "color": "status-progress", "x": 260, "y": 200},
            {"id": "n_impl", "label": "Geliştirme",  "description": "Artım kodlaması",     "color": "status-progress", "x": 460, "y": 200},
            {"id": "n_test", "label": "Test",        "description": "Artım QA",            "color": "status-review",   "x": 660, "y": 200},
            {"id": "n_dep",  "label": "Teslim",      "description": "Artım yayını",        "color": "status-done",     "x": 860, "y": 200},
        ]
        edges = _chain_flow_edges([n["id"] for n in nodes])
        edges.append({
            "source_id": "n_dep", "target_id": "n_plan",
            "edge_type": "feedback", "bidirectional": False,
            "is_all_gate": False, "label": "Sonraki Artım",
        })
        rationale = (
            "Incremental seçtiğin için her artımı çalışan ürün olarak teslim eden "
            "5 fazlı döngü kurdum. Teslim sonrası bir sonraki artıma dönüş."
        )
        return nodes, edges, rationale

    def _tpl_evolutionary(self):
        """5 nodes + prototype-evolution feedback loop."""
        nodes = [
            {"id": "n_proto", "label": "Prototip",    "description": "İlk çalışan prototip",  "color": "status-todo",     "x":  60, "y": 200},
            {"id": "n_eval",  "label": "Değerlendir", "description": "Geri bildirim",         "color": "status-progress", "x": 260, "y": 200},
            {"id": "n_impl",  "label": "Geliştirme",  "description": "Evrim ile büyütme",     "color": "status-progress", "x": 460, "y": 200},
            {"id": "n_test",  "label": "Test",        "description": "Kullanıcı testi",       "color": "status-review",   "x": 660, "y": 200},
            {"id": "n_dep",   "label": "Teslim",      "description": "Sürüm yayını",          "color": "status-done",     "x": 860, "y": 200},
        ]
        edges = _chain_flow_edges([n["id"] for n in nodes])
        edges.append({
            "source_id": "n_test", "target_id": "n_proto",
            "edge_type": "feedback", "bidirectional": False,
            "is_all_gate": False, "label": "Yeni Prototip",
        })
        rationale = (
            "Evolutionary seçtiğin için prototipten başlayıp her test sonrasında "
            "yeni prototipe dönen evrim döngüsü kurdum."
        )
        return nodes, edges, rationale

    def _tpl_rad(self):
        """6 nodes with parallel prototype branches (Y-fork after Plan)."""
        nodes = [
            {"id": "n_plan", "label": "Planlama",      "description": "Hızlı kapsam",    "color": "status-todo",     "x":  60, "y": 200},
            # Parallel branches A (top) + B (bottom)
            {"id": "n_p_a",  "label": "Prototip A",    "description": "Paralel kol 1",   "color": "status-progress", "x": 260, "y": 100},
            {"id": "n_p_b",  "label": "Prototip B",    "description": "Paralel kol 2",   "color": "status-progress", "x": 260, "y": 300},
            {"id": "n_impl", "label": "Entegrasyon",   "description": "Birleştirme",     "color": "status-progress", "x": 460, "y": 200},
            {"id": "n_test", "label": "Test",          "description": "QA + UAT",        "color": "status-review",   "x": 660, "y": 200},
            {"id": "n_dep",  "label": "Yayın",         "description": "Hızlı teslim",    "color": "status-done",     "x": 860, "y": 200},
        ]
        edges = [
            {"source_id": "n_plan", "target_id": "n_p_a", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "n_plan", "target_id": "n_p_b", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "n_p_a",  "target_id": "n_impl", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "n_p_b",  "target_id": "n_impl", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "n_impl", "target_id": "n_test", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "n_test", "target_id": "n_dep",  "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
        ]
        rationale = (
            "RAD seçtiğin için Plan sonrası 2 paralel prototip kolunu Entegrasyon'da "
            "birleştiren 6 fazlı yapı oluşturdum — paralel hızlı geliştirme."
        )
        return nodes, edges, rationale

    # ---------------------------------------------------------------------

    def _task_status_intro_text(self, form: TaskStatusFormDTO) -> str:
        m = form.methodology
        if m == "SCRUM":
            return "Scrum için Sprint Backlog başlangıç sütununu içeren akışı kuruyorum."
        if m == "KANBAN":
            return "Kanban için WIP limitli sürekli akış sütunlarını kuruyorum."
        return f"{m} için standart görev akışını kuruyorum."

    def _task_status_template(self, form: TaskStatusFormDTO):
        """Returns (columns, rationale) tuple of dicts."""
        m = form.methodology

        # Scrum gets Sprint Backlog as initial; others get Yapılacak
        initial_label = "Sprint Backlog" if m == "SCRUM" else "Yapılacak"

        columns = [
            {"id": "col_mock_1", "label": initial_label, "description": "Sıraya alındı", "color": "status-todo", "wip_limit": None, "is_initial": True, "is_final": False, "is_special": False},
            {"id": "col_mock_2", "label": "Devam Ediyor", "description": "Üzerinde çalışılıyor", "color": "status-progress", "wip_limit": 3 if form.wip_limits_enabled else None, "is_initial": False, "is_final": False, "is_special": False},
            {"id": "col_mock_3", "label": "İnceleme", "description": "Code review", "color": "status-review", "wip_limit": 2 if form.wip_limits_enabled else None, "is_initial": False, "is_final": False, "is_special": False},
            {"id": "col_mock_4", "label": "Bitti", "description": "Tamamlandı", "color": "status-done", "wip_limit": None, "is_initial": False, "is_final": True, "is_special": False},
        ]

        # D-03: Bug için ayrı doğrulama
        if form.bug_extra_verification:
            columns.insert(3, {
                "id": "col_mock_bugverif", "label": "Doğrulama (Bug)",
                "description": "Bug çözüldükten sonra ek doğrulama",
                "color": "status-review", "wip_limit": 2 if form.wip_limits_enabled else None,
                "is_initial": False, "is_final": False, "is_special": False,
            })

        # Special states from user selection
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
            f"{m} için {len([c for c in columns if not c['is_special']])} ana sütun + "
            f"{len([c for c in columns if c['is_special']])} özel durum kurdum. "
            "Bu mock çıktısı — Wave 4'te gerçek AI daha zengin öneriler verecek."
        )

        return columns, rationale


def _chain_flow_edges(node_ids: list[str]) -> list[dict]:
    """Build a sequential flow edge chain from an ordered list of node ids."""
    return [
        {
            "source_id": a, "target_id": b,
            "edge_type": "flow", "bidirectional": False,
            "is_all_gate": False, "label": None,
        }
        for a, b in zip(node_ids, node_ids[1:])
    ]


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

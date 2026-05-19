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

        # 2) Stream nodes with paced delay
        for node in nodes:
            yield WorkflowEventDTO(type="node_added", payload=node)
            await asyncio.sleep(_NODE_INTERVAL_S)

        # 3) Stream edges (after all nodes — natural rendering order)
        for edge in edges:
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
        """Returns (nodes, edges, rationale) tuple of dicts."""
        m = form.methodology

        # Common 5-phase backbone — methodology variants tweak edges/rationale
        nodes = [
            {"id": "nd_mock_n1", "label": "Keşif", "description": "Gereksinim toplama", "color": "status-todo"},
            {"id": "nd_mock_n2", "label": "Tasarım", "description": "Mimari ve modüller", "color": "status-progress"},
            {"id": "nd_mock_n3", "label": "Geliştirme", "description": "Kodlama ve birim test", "color": "status-progress"},
            {"id": "nd_mock_n4", "label": "Test", "description": "QA ve entegrasyon", "color": "status-review"},
            {"id": "nd_mock_n5", "label": "Yayın", "description": "Dağıtım ve canlıya alma", "color": "status-done"},
        ]

        edges = [
            {"source_id": "nd_mock_n1", "target_id": "nd_mock_n2", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "nd_mock_n2", "target_id": "nd_mock_n3", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "nd_mock_n3", "target_id": "nd_mock_n4", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
            {"source_id": "nd_mock_n4", "target_id": "nd_mock_n5", "edge_type": "flow", "bidirectional": False, "is_all_gate": False, "label": None},
        ]

        rationale = (
            f"{m} seçtiğin için 5 ana faz ile sade bir akış kurdum. "
            "Bu mock adaptör çıktısıdır — gerçek AI Wave 4'te devreye girince "
            "metodolojiye özel daha zengin öneriler gelecek."
        )

        # Methodology tweaks
        if m == "ITERATIVE":
            edges.append({
                "source_id": "nd_mock_n4", "target_id": "nd_mock_n2",
                "edge_type": "feedback", "bidirectional": False,
                "is_all_gate": False, "label": "Test → Tasarım",
            })
            rationale = (
                "Iterative seçtiğin için Test'ten Tasarım'a geri besleme edge'i "
                "ekledim — her döngüde tasarımı revize edebilirsin."
            )

        if form.quality_code_review:
            edges.append({
                "source_id": "nd_mock_n3", "target_id": "nd_mock_n4",
                "edge_type": "verification", "bidirectional": False,
                "is_all_gate": False, "label": "Code Review",
            })

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

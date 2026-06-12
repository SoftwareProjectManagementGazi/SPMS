"""Gemini Workflow Adapter — production AI provider.

Implements IAIWorkflowSuggestionPort using gemini-2.5-flash + Pydantic
response_schema. Model koordinat üretmez: layout_archetype seçer, geometriyi
domain workflow_layout servisi basar. Validasyon hatasında tek self-repair
turu yapılır.
"""

from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator, Literal

from pydantic import BaseModel

from app.application.dtos.ai_workflow_dto import (
    LifecycleFormDTO,
    TaskStatusFormDTO,
    WorkflowEventDTO,
)
from app.application.ports.ai_workflow_suggestion_port import (
    IAIWorkflowSuggestionPort,
)
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
from app.domain.services.workflow_layout import apply_layout
from app.infrastructure.adapters.ai.prompt_builders.lifecycle_prompt_builder import (
    build_lifecycle_prompt,
)
from app.infrastructure.adapters.ai.prompt_builders.task_status_prompt_builder import (
    build_task_status_prompt,
)

logger = logging.getLogger(__name__)


# Pacing knobs — match MockWorkflowAdapter so the UX feel is identical
_NODE_INTERVAL_S = 0.4
_EDGE_INTERVAL_S = 0.25
_TEXT_TOKEN_S = 0.06


# ---------------------------------------------------------------------------
# Gemini response schemas — minimal, NO default values (Issue #699 workaround)
# ---------------------------------------------------------------------------


_NodeColor = Literal[
    "status-todo",
    "status-progress",
    "status-review",
    "status-done",
    "status-blocked",
]

_Archetype = Literal[
    "WATERFALL", "V_MODEL", "SPIRAL", "CYCLE", "INCREMENTAL_ROWS",
    "PROTOTYPE_LOOP", "PARALLEL_BRANCH", "PIPELINE", "FREEFORM",
]


class _GeminiSuggestedNode(BaseModel):
    id: str
    label: str
    description: str
    color: _NodeColor


class _GeminiSuggestedEdge(BaseModel):
    source_id: str
    target_id: str
    edge_type: Literal["flow", "verification", "feedback"]
    bidirectional: bool
    is_all_gate: bool
    label: str | None


class _GeminiLifecycleResponse(BaseModel):
    methodology_label: str
    layout_archetype: _Archetype
    nodes: list[_GeminiSuggestedNode]
    edges: list[_GeminiSuggestedEdge]
    rationale: str


class _GeminiSuggestedColumn(BaseModel):
    id: str
    label: str
    description: str
    color: _NodeColor
    wip_limit: int | None
    is_initial: bool
    is_final: bool
    is_special: bool


class _GeminiTaskStatusResponse(BaseModel):
    methodology_label: str
    columns: list[_GeminiSuggestedColumn]
    rationale: str


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------


class GeminiWorkflowAdapter(IAIWorkflowSuggestionPort):
    """Async Gemini adapter with structured output + paced event emission."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        # Lazy SDK import keeps mock-only deployments off the heavy dependency
        from google import genai

        self._client = genai.Client(api_key=api_key)
        self._model = model

    # ---------------------------------------------------------------------
    # Lifecycle
    # ---------------------------------------------------------------------

    async def generate_lifecycle_stream(
        self,
        form: LifecycleFormDTO,
        language: str,
    ) -> AsyncIterator[WorkflowEventDTO]:
        prompt = build_lifecycle_prompt(form)

        # Cold-start UX: ilk Gemini çağrısı 5-10s sürebilir, chat boş kalmasın
        yield WorkflowEventDTO(
            type="text_token",
            payload={"text": "Bağlam analiz ediliyor, en uygun süreç tasarlanıyor... "},
        )

        suggestion: WorkflowSuggestion | None = None
        attempt_prompt = prompt
        for attempt in range(2):
            try:
                response = await self._client.aio.models.generate_content(
                    model=self._model,
                    contents=attempt_prompt,
                    config=_lifecycle_generation_config(),
                )
            except Exception as e:  # noqa: BLE001
                async for ev in _handle_gemini_error(e):
                    yield ev
                return

            gemini_result: _GeminiLifecycleResponse | None = response.parsed
            if gemini_result is None:
                finish = _extract_finish_reason(response)
                logger.error(
                    "Gemini returned no parsed lifecycle (finish=%s, attempt=%s)",
                    finish, attempt,
                )
                yield WorkflowEventDTO(
                    type="error",
                    payload={
                        "kind": "invalid",
                        "message": f"AI çıktısı parse edilemedi (finish={finish})",
                    },
                )
                return

            candidate = _to_domain_lifecycle(gemini_result)
            errors = validate_lifecycle_suggestion(candidate)
            if not errors:
                suggestion = candidate
                break

            logger.warning("Gemini lifecycle attempt %s invalid: %s", attempt, errors)
            if attempt == 0:
                # Self-repair: hataları geri besleyip tek düzeltme turu iste
                yield WorkflowEventDTO(
                    type="text_token",
                    payload={"text": "Çıktı kurallara tam oturmadı, düzeltiyorum... "},
                )
                attempt_prompt = (
                    f"{prompt}\n\nÖNCEKİ ÇIKTIN ŞU KURALLARI İHLAL ETTİ:\n- "
                    + "\n- ".join(errors)
                    + "\nAynı bağlamla, bu hataları gidererek yeni JSON üret."
                )

        if suggestion is None:
            yield WorkflowEventDTO(
                type="error",
                payload={"kind": "invalid", "message": "AI önerisi kurallarımıza uymadı"},
            )
            return

        apply_layout(suggestion)

        async for ev in _emit_lifecycle_events(suggestion):
            yield ev

    # ---------------------------------------------------------------------
    # Task status
    # ---------------------------------------------------------------------

    async def generate_task_status_stream(
        self,
        form: TaskStatusFormDTO,
        language: str,
    ) -> AsyncIterator[WorkflowEventDTO]:
        prompt = build_task_status_prompt(form)

        yield WorkflowEventDTO(
            type="text_token",
            payload={"text": "Görev akışı tasarlanıyor... "},
        )

        suggestion: TaskStatusSuggestion | None = None
        attempt_prompt = prompt
        for attempt in range(2):
            try:
                response = await self._client.aio.models.generate_content(
                    model=self._model,
                    contents=attempt_prompt,
                    config=_task_status_generation_config(),
                )
            except Exception as e:  # noqa: BLE001
                async for ev in _handle_gemini_error(e):
                    yield ev
                return

            gemini_result: _GeminiTaskStatusResponse | None = response.parsed
            if gemini_result is None:
                finish = _extract_finish_reason(response)
                logger.error(
                    "Gemini returned no parsed task_status (finish=%s, attempt=%s)",
                    finish, attempt,
                )
                yield WorkflowEventDTO(
                    type="error",
                    payload={
                        "kind": "invalid",
                        "message": f"AI çıktısı parse edilemedi (finish={finish})",
                    },
                )
                return

            candidate = _to_domain_task_status(gemini_result)
            errors = validate_task_status_suggestion(candidate)
            if not errors:
                suggestion = candidate
                break

            logger.warning("Gemini task-status attempt %s invalid: %s", attempt, errors)
            if attempt == 0:
                yield WorkflowEventDTO(
                    type="text_token",
                    payload={"text": "Çıktı kurallara tam oturmadı, düzeltiyorum... "},
                )
                attempt_prompt = (
                    f"{prompt}\n\nÖNCEKİ ÇIKTIN ŞU KURALLARI İHLAL ETTİ:\n- "
                    + "\n- ".join(errors)
                    + "\nAynı bağlamla, bu hataları gidererek yeni JSON üret."
                )

        if suggestion is None:
            yield WorkflowEventDTO(
                type="error",
                payload={"kind": "invalid", "message": "AI önerisi kurallarımıza uymadı"},
            )
            return

        async for ev in _emit_task_status_events(suggestion):
            yield ev


# ---------------------------------------------------------------------------
# Gemini → domain mapping
# ---------------------------------------------------------------------------


def _to_domain_lifecycle(g: _GeminiLifecycleResponse) -> WorkflowSuggestion:
    return WorkflowSuggestion(
        methodology_label=g.methodology_label,
        layout_archetype=g.layout_archetype,
        nodes=[
            SuggestedNode(
                id=n.id, label=n.label, description=n.description, color=n.color,
            )
            for n in g.nodes
        ],
        edges=[
            SuggestedEdge(
                source_id=e.source_id, target_id=e.target_id,
                edge_type=e.edge_type, bidirectional=e.bidirectional,
                is_all_gate=e.is_all_gate, label=e.label,
            )
            for e in g.edges
        ],
        rationale=g.rationale,
    )


def _to_domain_task_status(g: _GeminiTaskStatusResponse) -> TaskStatusSuggestion:
    return TaskStatusSuggestion(
        methodology_label=g.methodology_label,
        columns=[
            SuggestedColumn(
                id=c.id, label=c.label, description=c.description,
                color=c.color, wip_limit=c.wip_limit,
                is_initial=c.is_initial, is_final=c.is_final,
                is_special=c.is_special,
            )
            for c in g.columns
        ],
        rationale=g.rationale,
    )


# ---------------------------------------------------------------------------
# Event emission — same cadence as MockWorkflowAdapter
# ---------------------------------------------------------------------------


async def _emit_lifecycle_events(
    s: WorkflowSuggestion,
) -> AsyncIterator[WorkflowEventDTO]:
    intro = _build_intro(s.methodology_label, s.rationale)
    for chunk in _chunk_text(intro, size=8):
        yield WorkflowEventDTO(type="text_token", payload={"text": chunk})
        await asyncio.sleep(_TEXT_TOKEN_S)

    nodes_dicts = [n.model_dump() for n in s.nodes]
    edges_dicts = [e.model_dump() for e in s.edges]

    pending = list(edges_dicts)
    emitted_ids: set[str] = set()

    for node in nodes_dicts:
        yield WorkflowEventDTO(type="node_added", payload=node)
        emitted_ids.add(node["id"])
        await asyncio.sleep(_NODE_INTERVAL_S)

        ready = [
            e for e in pending
            if e["source_id"] in emitted_ids and e["target_id"] in emitted_ids
        ]
        for edge in ready:
            yield WorkflowEventDTO(type="edge_added", payload=edge)
            await asyncio.sleep(_EDGE_INTERVAL_S)
        for edge in ready:
            pending.remove(edge)

    for edge in pending:
        yield WorkflowEventDTO(type="edge_added", payload=edge)
        await asyncio.sleep(_EDGE_INTERVAL_S)

    yield WorkflowEventDTO(type="rationale", payload={"text": s.rationale})
    await asyncio.sleep(0.1)

    yield WorkflowEventDTO(
        type="done",
        payload={
            "node_count": len(s.nodes),
            "edge_count": len(s.edges),
            "methodology": s.methodology_label,
            "layout_archetype": s.layout_archetype,
        },
    )


async def _emit_task_status_events(
    s: TaskStatusSuggestion,
) -> AsyncIterator[WorkflowEventDTO]:
    intro = _build_intro(s.methodology_label, s.rationale)
    for chunk in _chunk_text(intro, size=8):
        yield WorkflowEventDTO(type="text_token", payload={"text": chunk})
        await asyncio.sleep(_TEXT_TOKEN_S)

    for col in s.columns:
        yield WorkflowEventDTO(type="column_added", payload=col.model_dump())
        await asyncio.sleep(_NODE_INTERVAL_S)

    yield WorkflowEventDTO(type="rationale", payload={"text": s.rationale})
    await asyncio.sleep(0.1)

    yield WorkflowEventDTO(
        type="done",
        payload={
            "column_count": len(s.columns),
            "methodology": s.methodology_label,
        },
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_intro(methodology_label: str, rationale: str) -> str:
    """Take the first sentence of rationale; fallback to methodology hint."""
    if rationale:
        first = rationale.split(".")[0].strip()
        if first:
            return first + "..."
    return f"{methodology_label} için bir workflow tasarlıyorum..."


def _chunk_text(text: str, size: int = 8) -> list[str]:
    """Split text into rough word-chunks for streaming feel."""
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


def _lifecycle_generation_config() -> dict:
    """Gemini config — thinking kapalı (token bütçesini JSON'a bırak)."""
    return {
        "response_mime_type": "application/json",
        "response_schema": _GeminiLifecycleResponse,
        "temperature": 0.2,
        "max_output_tokens": 8000,
        "thinking_config": {"thinking_budget": 0},
    }


def _task_status_generation_config() -> dict:
    """Same knobs as lifecycle, scoped to the task-status response schema."""
    return {
        "response_mime_type": "application/json",
        "response_schema": _GeminiTaskStatusResponse,
        "temperature": 0.2,
        "max_output_tokens": 8000,
        "thinking_config": {"thinking_budget": 0},
    }


def _extract_finish_reason(response) -> str:
    """Pull a short finish_reason string from the response for logging."""
    try:
        if response.candidates:
            fr = getattr(response.candidates[0], "finish_reason", None)
            return str(fr) if fr else "unknown"
    except Exception:  # noqa: BLE001 — diagnostic, must never raise
        pass
    return "unknown"


async def _handle_gemini_error(e: Exception) -> AsyncIterator[WorkflowEventDTO]:
    """Map Gemini SDK exceptions to our error event taxonomy.

    Rate limits surface as 429 with the gerçek retry penceresi gövdede;
    onu parse edip frontend'e geçiriyoruz.
    """
    err_repr = repr(e)
    logger.error("Gemini call failed: %s", err_repr)

    code: int | None = getattr(e, "code", None) or getattr(e, "status_code", None)
    if code is None:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower() or "rate" in msg.lower():
            code = 429
        elif "503" in msg or "unavailable" in msg.lower():
            code = 503

    if code == 429:
        reset_in = _extract_retry_seconds(e)
        is_short_wait = reset_in <= 120
        message = (
            f"AI kısa süreli yoğun — {reset_in} saniye sonra tekrar dene."
            if is_short_wait
            else "Günlük AI kullanım kotası doldu — yarın tekrar dene "
                 "(veya yeni bir API key kullan)."
        )
        yield WorkflowEventDTO(
            type="error",
            payload={
                "kind": "rate_limit",
                "reset_in_seconds": reset_in,
                "message": message,
            },
        )
    else:
        yield WorkflowEventDTO(
            type="error",
            payload={
                "kind": "service_down",
                "message": "AI servisine ulaşılamıyor",
            },
        )


def _extract_retry_seconds(e: Exception) -> int:
    """Parse Gemini's 429 error body for the real retry delay."""
    import re

    text = str(e)

    m = re.search(r"retry in ([\d.]+)s", text, flags=re.IGNORECASE)
    if m:
        try:
            return max(1, min(86400, int(float(m.group(1)) + 1)))
        except (ValueError, OverflowError):
            pass

    m = re.search(r"retryDelay['\"]?\s*:\s*['\"](\d+)s", text)
    if m:
        try:
            return max(1, min(86400, int(m.group(1))))
        except (ValueError, OverflowError):
            pass

    if "PerDay" in text or "daily" in text.lower():
        return 3600 * 4

    return 60

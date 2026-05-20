"""Gemini Workflow Adapter — production AI provider.

Implements IAIWorkflowSuggestionPort using Google's gemini-2.5-flash via
the `google-genai` async client + Pydantic response_schema for guaranteed-
JSON structured output.

Design notes:
- Uses a non-streaming Gemini call (generate_content) then re-emits the
  result as paced SSE events ourselves. Streaming partial JSON from Gemini
  is harder to parse safely and the UX cadence we want (200-400ms per
  node) is consistent with the mock adapter regardless of provider speed.
- Schema variant has NO default values per python-genai Issue #699:
  Gemini rejects Pydantic schemas with field defaults via response_schema.
  We define Gemini-only response classes here, then map to domain entities.
- Auto-layout fallback: if Gemini omits/zeros x/y for nodes, run a simple
  BFS-based grid layout based on edge direction.

Plan ref: .planning/ai-workflow-generator-plan.md §4.3.1 + §6 (Wave 4)
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
from app.infrastructure.adapters.ai.prompt_builders.lifecycle_prompt_builder import (
    build_lifecycle_prompt,
)
from app.infrastructure.adapters.ai.prompt_builders.task_status_prompt_builder import (
    build_task_status_prompt,
)

logger = logging.getLogger(__name__)


# Pacing knobs — match MockWorkflowAdapter so the UX feel is identical
# whether we're on real Gemini or mock.
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


class _GeminiSuggestedNode(BaseModel):
    id: str
    label: str
    description: str
    color: _NodeColor
    x: int
    y: int


class _GeminiSuggestedEdge(BaseModel):
    source_id: str
    target_id: str
    edge_type: Literal["flow", "verification", "feedback"]
    bidirectional: bool
    is_all_gate: bool
    label: str | None


class _GeminiLifecycleResponse(BaseModel):
    methodology: Literal[
        "SCRUM", "KANBAN", "WATERFALL", "ITERATIVE",
        "INCREMENTAL", "EVOLUTIONARY", "RAD",
    ]
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
    methodology: Literal[
        "SCRUM", "KANBAN", "WATERFALL", "ITERATIVE",
        "INCREMENTAL", "EVOLUTIONARY", "RAD",
    ]
    columns: list[_GeminiSuggestedColumn]
    rationale: str


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------


class GeminiWorkflowAdapter(IAIWorkflowSuggestionPort):
    """Async Gemini adapter with structured output + paced event emission."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        # Lazy SDK import keeps mock-only deployments (CI, demos with quota
        # concerns) from needing the heavy google-genai dependency.
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

        # Cold-start UX (Wave 5.5) — Gemini's first call after key-issue can
        # take 5-10s. Emit an early text_token so the frontend chat log starts
        # populating immediately; otherwise the user stares at an empty modal
        # and assumes the request died. The chunked text shows up as the AI
        # "preparing" before its real answer arrives.
        yield WorkflowEventDTO(
            type="text_token",
            payload={"text": f"{form.methodology} için workflow tasarlanıyor... "},
        )

        # Phase 1 — fetch + parse (single Gemini call, blocking from the
        # frontend's perspective until the first event arrives).
        try:
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
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
                "Gemini returned no parsed result for lifecycle "
                "(finish_reason=%s, text_len=%s)",
                finish,
                len(response.text) if response.text else 0,
            )
            yield WorkflowEventDTO(
                type="error",
                payload={
                    "kind": "invalid",
                    "message": f"AI çıktısı parse edilemedi (finish={finish})",
                },
            )
            return

        # Convert Gemini response → domain WorkflowSuggestion
        suggestion = _to_domain_lifecycle(gemini_result)

        # Auto-layout fallback if Gemini omitted/zeroed coordinates
        _apply_layout_fallback(suggestion)

        # Domain validation — last line of defense
        errors = validate_lifecycle_suggestion(suggestion)
        if errors:
            logger.warning(
                "Gemini lifecycle output failed domain validation: %s",
                errors,
            )
            yield WorkflowEventDTO(
                type="error",
                payload={
                    "kind": "invalid",
                    "message": "AI önerisi kurallarımıza uymadı",
                    "errors": errors,
                },
            )
            return

        # Phase 2 — emit events at the same cadence as the mock adapter so
        # the frontend "drawing" experience is consistent across providers.
        async for ev in _emit_lifecycle_events(suggestion, form.methodology):
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

        # See generate_lifecycle_stream for cold-start UX rationale.
        yield WorkflowEventDTO(
            type="text_token",
            payload={"text": f"{form.methodology} görev workflow'u tasarlanıyor... "},
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
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
                "Gemini returned no parsed result for task_status "
                "(finish_reason=%s, text_len=%s)",
                finish,
                len(response.text) if response.text else 0,
            )
            yield WorkflowEventDTO(
                type="error",
                payload={
                    "kind": "invalid",
                    "message": f"AI çıktısı parse edilemedi (finish={finish})",
                },
            )
            return

        suggestion = _to_domain_task_status(gemini_result)

        errors = validate_task_status_suggestion(suggestion)
        if errors:
            logger.warning(
                "Gemini task-status output failed domain validation: %s",
                errors,
            )
            yield WorkflowEventDTO(
                type="error",
                payload={
                    "kind": "invalid",
                    "message": "AI önerisi kurallarımıza uymadı",
                    "errors": errors,
                },
            )
            return

        async for ev in _emit_task_status_events(suggestion, form.methodology):
            yield ev


# ---------------------------------------------------------------------------
# Gemini → domain mapping
# ---------------------------------------------------------------------------


def _to_domain_lifecycle(g: _GeminiLifecycleResponse) -> WorkflowSuggestion:
    return WorkflowSuggestion(
        methodology=g.methodology,
        nodes=[
            SuggestedNode(
                id=n.id, label=n.label, description=n.description,
                color=n.color, x=n.x, y=n.y,
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
        methodology=g.methodology,
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
# Auto-layout fallback — runs only when Gemini omitted/zeroed coordinates
# ---------------------------------------------------------------------------


def _apply_layout_fallback(s: WorkflowSuggestion) -> None:
    """Assign x/y to any node whose coords are zero/missing.

    Uses simple BFS-based level layout:
      - Initial nodes (no incoming flow edge) at level 0
      - Each subsequent node placed at level = max(predecessor.level) + 1
      - x = 60 + level * 220
      - y = 200 by default; if multiple nodes share a level, stagger up/down
        by 100px so parallel branches don't overlap.

    Mutates the suggestion in place (only nodes with x==0 AND y==0 — we treat
    that as "missing" sentinel since legit nodes always have y >= 100).
    """
    # Identify nodes needing layout
    missing = [n for n in s.nodes if n.x == 0 and n.y == 0]
    if not missing:
        return

    # Build adjacency for forward (flow) edges only — feedback/verification
    # edges shouldn't influence horizontal layering.
    incoming_flow: dict[str, list[str]] = {n.id: [] for n in s.nodes}
    for e in s.edges:
        if e.edge_type == "flow" and e.target_id in incoming_flow:
            incoming_flow[e.target_id].append(e.source_id)

    # BFS levels
    level: dict[str, int] = {}
    queue: list[str] = [n.id for n in s.nodes if not incoming_flow[n.id]]
    for nid in queue:
        level[nid] = 0
    while queue:
        current = queue.pop(0)
        outgoing = [e.target_id for e in s.edges if e.edge_type == "flow" and e.source_id == current]
        for t in outgoing:
            new_level = level[current] + 1
            if t not in level or level[t] < new_level:
                level[t] = new_level
                queue.append(t)

    # Assign coords; group by level for vertical staggering
    by_level: dict[int, list[str]] = {}
    for nid, lvl in level.items():
        by_level.setdefault(lvl, []).append(nid)

    for lvl, ids in by_level.items():
        count = len(ids)
        for idx, nid in enumerate(ids):
            node = next(n for n in s.nodes if n.id == nid)
            if node.x == 0 and node.y == 0:
                node.x = 60 + lvl * 220
                # Center single-column levels at y=200; stagger multi-column
                # levels around y=200 (e.g. 2 nodes → y=100 + y=300).
                if count == 1:
                    node.y = 200
                else:
                    spread = 100 * (count - 1)
                    node.y = 200 - spread // 2 + idx * 100


# ---------------------------------------------------------------------------
# Event emission — same cadence as MockWorkflowAdapter
# ---------------------------------------------------------------------------


async def _emit_lifecycle_events(
    s: WorkflowSuggestion,
    methodology: str,
) -> AsyncIterator[WorkflowEventDTO]:
    # 1) Intro text — short, generated from rationale's first sentence or a
    #    methodology-aware fallback. Streamed token-by-token for UX.
    intro = _build_intro(methodology, s.rationale)
    for chunk in _chunk_text(intro, size=8):
        yield WorkflowEventDTO(type="text_token", payload={"text": chunk})
        await asyncio.sleep(_TEXT_TOKEN_S)

    # 2) Interleaved node + edge emission (mock adapter pattern)
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

    # Forward-reference edges (feedback loops)
    for edge in pending:
        yield WorkflowEventDTO(type="edge_added", payload=edge)
        await asyncio.sleep(_EDGE_INTERVAL_S)

    # 3) Rationale (always Gemini's own — provides trust signal to user)
    yield WorkflowEventDTO(type="rationale", payload={"text": s.rationale})
    await asyncio.sleep(0.1)

    # 4) Done summary
    yield WorkflowEventDTO(
        type="done",
        payload={
            "node_count": len(s.nodes),
            "edge_count": len(s.edges),
            "methodology": s.methodology,
        },
    )


async def _emit_task_status_events(
    s: TaskStatusSuggestion,
    methodology: str,
) -> AsyncIterator[WorkflowEventDTO]:
    intro = _build_intro(methodology, s.rationale)
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
            "methodology": s.methodology,
        },
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_intro(methodology: str, rationale: str) -> str:
    """Take the first sentence of rationale; fallback to methodology hint."""
    if rationale:
        first = rationale.split(".")[0].strip()
        if first:
            return first + "..."
    return f"{methodology} için bir workflow tasarlıyorum..."


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
    """Build Gemini config for lifecycle generation.

    Critical knobs:
    - thinking_config: {budget: 0} → DISABLE thinking. Gemini 2.5 Flash is a
      thinking model by default; thinking tokens chew through max_output_tokens
      and leave no room for the JSON, returning a partial truncated response
      that fails Pydantic parse. For structured output where the schema does
      the heavy lifting, thinking is overhead. Disable it.
    - max_output_tokens: generous so 10-node + 9-edge + rationale all fit.
    """
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

    google-genai raises `genai.errors.APIError` with `.code` for HTTP-style
    errors. Rate limits surface as 429, transient unavailability as 5xx.
    We catch broadly since the SDK's exception hierarchy is still maturing.

    Retry-Delay parsing: Gemini's 429 response embeds the actual retry window
    in the error body (either "Please retry in X.Ys" prose or a structured
    `retryDelay` field). We surface the real number to the frontend instead
    of a misleading sabit 1-hour wait.
    """
    err_repr = repr(e)
    logger.error("Gemini call failed: %s", err_repr)

    # Best-effort status code extraction
    code: int | None = getattr(e, "code", None) or getattr(e, "status_code", None)
    if code is None:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower() or "rate" in msg.lower():
            code = 429
        elif "503" in msg or "unavailable" in msg.lower():
            code = 503

    if code == 429:
        reset_in = _extract_retry_seconds(e)
        # Distinguish RPM (short wait) vs RPD (long wait) for clearer UX copy
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
    """Parse Gemini's 429 error body for the real retry delay.

    Gemini surfaces the wait time in two places:
      1. Plain prose: "Please retry in 47.82727737s."
      2. Structured RetryInfo with `retryDelay: '47s'`

    We try both and clamp to [1, 86400]. Falls back to 60s if nothing parsable
    surfaces — better default than hardcoded 1h because most Gemini 429s on
    free tier are RPM-flavored short waits, not daily-quota long waits.
    """
    import re

    text = str(e)

    # Pattern A — prose
    m = re.search(r"retry in ([\d.]+)s", text, flags=re.IGNORECASE)
    if m:
        try:
            return max(1, min(86400, int(float(m.group(1)) + 1)))  # round up
        except (ValueError, OverflowError):
            pass

    # Pattern B — RetryInfo: 'retryDelay': '47s'
    m = re.search(r"retryDelay['\"]?\s*:\s*['\"](\d+)s", text)
    if m:
        try:
            return max(1, min(86400, int(m.group(1))))
        except (ValueError, OverflowError):
            pass

    # Pattern C — daily quota messages usually omit retry; assume long wait
    if "PerDay" in text or "daily" in text.lower():
        return 3600 * 4  # 4 hours — frontend shows "saat" instead of "dakika"

    return 60  # safe RPM-flavored default

"""AI Workflow Generator — HTTP API.

Two streaming endpoints, both SSE (Server-Sent Events) via FastAPI's
StreamingResponse. Authentication required (uses existing get_current_user).
Rate limiting is added in Wave 5 (D-05) — Wave 1 ships endpoints unlimited.

Plan reference: .planning/ai-workflow-generator-plan.md §4.4.2
"""

import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.deps.ai import get_ai_workflow_port
from app.api.deps.auth import get_current_user
from app.api.middleware.ai_rate_limit import _limiter as _ai_limiter
from app.application.dtos.ai_workflow_dto import (
    LifecycleFormDTO,
    TaskStatusFormDTO,
)
from app.application.ports.ai_workflow_suggestion_port import (
    IAIWorkflowSuggestionPort,
)
from app.application.use_cases.generate_lifecycle_workflow_use_case import (
    GenerateLifecycleWorkflowUseCase,
)
from app.application.use_cases.generate_task_status_workflow_use_case import (
    GenerateTaskStatusWorkflowUseCase,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Lifecycle endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/generate-lifecycle",
    summary="Generate a project lifecycle workflow via AI",
    description=(
        "Streams a workflow generation as Server-Sent Events. Each `data:` "
        "frame is a JSON `WorkflowEventDTO` (type: text_token | node_added | "
        "edge_added | rationale | done | error). "
        "Frontend consumes via fetch+ReadableStream (EventSource doesn't "
        "support POST). Returns text/event-stream."
    ),
)
async def generate_lifecycle(
    form: LifecycleFormDTO,
    ai_port: IAIWorkflowSuggestionPort = Depends(get_ai_workflow_port),
    current_user=Depends(get_current_user),
):
    # 3-tier rate limit (D-05) — user-hour=8, user-day=25, project-day=400.
    # Inline call (not via Depends) because we need current_user resolved first.
    # Raises HTTPException 429/503 if any tier is exceeded; FastAPI returns
    # the body before any stream events fire, so the frontend never sees an
    # empty SSE stream — it sees a clean 429/503 it can map to State 6 / 5.
    _ai_limiter.check_and_increment(str(current_user.email))

    use_case = GenerateLifecycleWorkflowUseCase(ai_port)

    async def event_stream():
        try:
            async for event in use_case.execute(form, language="tr"):
                yield f"data: {event.model_dump_json()}\n\n"
        except Exception as e:  # noqa: BLE001 — final safety net
            logger.exception("AI lifecycle stream crashed: %s", e)
            err_payload = '{"type":"error","payload":{"kind":"service_down"}}'
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering if proxied
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# Task Status endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/generate-task-status",
    summary="Generate a task-status workflow via AI",
    description=(
        "Streams a kanban-style column generation as Server-Sent Events. "
        "Methodology-aware: Scrum adds Sprint Backlog, Kanban emphasizes WIP, "
        "etc. Same SSE event envelope as lifecycle."
    ),
)
async def generate_task_status(
    form: TaskStatusFormDTO,
    ai_port: IAIWorkflowSuggestionPort = Depends(get_ai_workflow_port),
    current_user=Depends(get_current_user),
):
    # See generate_lifecycle for rate-limit rationale.
    _ai_limiter.check_and_increment(str(current_user.email))

    use_case = GenerateTaskStatusWorkflowUseCase(ai_port)

    async def event_stream():
        try:
            async for event in use_case.execute(form, language="tr"):
                yield f"data: {event.model_dump_json()}\n\n"
        except Exception as e:  # noqa: BLE001
            logger.exception("AI task-status stream crashed: %s", e)
            err_payload = '{"type":"error","payload":{"kind":"service_down"}}'
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

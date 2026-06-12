"""AI Workflow Generator — DI factories.

Provider selection by env var. CLAUDE.md DIP: router gets `IAIWorkflowSuggestionPort`,
not a concrete adapter. Swap providers by changing AI_PROVIDER in .env without
touching use case or router code.

Misconfiguration (unknown provider, missing key, missing SDK) raises
HTTPException 503 — a handled response that passes through CORSMiddleware and
maps to the frontend's "service down" state. A raw RuntimeError here would
bypass CORS and reach the browser as an opaque CORS error masking a 500.

Plan reference: .planning/ai-workflow-generator-plan.md §4.4.1 + §6.4 fallback.
"""

import logging

from fastapi import HTTPException

from app.application.ports.ai_workflow_suggestion_port import (
    IAIWorkflowSuggestionPort,
)
from app.infrastructure.adapters.ai.mock_workflow_adapter import (
    MockWorkflowAdapter,
)
from app.infrastructure.config import settings


__all__ = ["get_ai_workflow_port"]

logger = logging.getLogger(__name__)

_SERVICE_UNAVAILABLE = HTTPException(
    status_code=503,
    detail="AI service is not available. Contact your administrator.",
)


def get_ai_workflow_port() -> IAIWorkflowSuggestionPort:
    """FastAPI dependency: select AI adapter based on AI_PROVIDER env var.

    Supported values:
      - "mock"    (default — no API key needed)
      - "gemini"  (real Google Gemini, requires GOOGLE_API_KEY + google-genai)
      - "ollama"  (v3.1 — offline fallback)
    """
    provider = (settings.AI_PROVIDER or "mock").lower()

    if provider == "mock":
        return MockWorkflowAdapter()

    if provider == "gemini":
        if not settings.GOOGLE_API_KEY:
            logger.error(
                "AI_PROVIDER=gemini but GOOGLE_API_KEY is empty. Set it in "
                ".env (copy from one of GOOGLE_API_KEY_DEV/STAGING/DEMO) or "
                "use AI_PROVIDER=mock."
            )
            raise _SERVICE_UNAVAILABLE

        try:
            # The google-genai SDK import happens inside the adapter's
            # __init__ (kept lazy so mock-only deployments don't need it),
            # so the ImportError surfaces at construction — guard both.
            from app.infrastructure.adapters.ai.gemini_workflow_adapter import (
                GeminiWorkflowAdapter,
            )

            return GeminiWorkflowAdapter(
                api_key=settings.GOOGLE_API_KEY,
                model=settings.GEMINI_MODEL,
            )
        except ImportError as e:
            logger.error(
                "Gemini adapter unavailable (is google-genai installed? "
                "pip install -r requirements.txt): %s", e,
            )
            raise _SERVICE_UNAVAILABLE from e

    if provider == "ollama":
        try:
            from app.infrastructure.adapters.ai.ollama_workflow_adapter import (
                OllamaWorkflowAdapter,
            )

            return OllamaWorkflowAdapter(host=settings.OLLAMA_HOST)
        except ImportError as e:
            logger.error("Ollama adapter not yet implemented (v3.1): %s", e)
            raise _SERVICE_UNAVAILABLE from e

    logger.error(
        "Unknown AI_PROVIDER: '%s'. Expected one of: mock, gemini, ollama.",
        settings.AI_PROVIDER,
    )
    raise _SERVICE_UNAVAILABLE

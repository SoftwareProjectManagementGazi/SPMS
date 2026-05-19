"""AI Workflow Generator — DI factories.

Provider selection by env var. CLAUDE.md DIP: router gets `IAIWorkflowSuggestionPort`,
not a concrete adapter. Swap providers by changing AI_PROVIDER in .env without
touching use case or router code.

Plan reference: .planning/ai-workflow-generator-plan.md §4.4.1 + §6.4 fallback.
"""

from app.application.ports.ai_workflow_suggestion_port import (
    IAIWorkflowSuggestionPort,
)
from app.infrastructure.adapters.ai.mock_workflow_adapter import (
    MockWorkflowAdapter,
)
from app.infrastructure.config import settings


__all__ = ["get_ai_workflow_port"]


def get_ai_workflow_port() -> IAIWorkflowSuggestionPort:
    """FastAPI dependency: select AI adapter based on AI_PROVIDER env var.

    Supported values:
      - "mock"    (default — Wave 1, no API key needed)
      - "gemini"  (Wave 4 — real Google Gemini, requires GOOGLE_API_KEY)
      - "ollama"  (v3.1 — offline fallback)
    """
    provider = (settings.AI_PROVIDER or "mock").lower()

    if provider == "mock":
        return MockWorkflowAdapter()

    if provider == "gemini":
        # Lazy import — google-genai is heavy and only needed when selected.
        # Will be implemented in Wave 4.
        try:
            from app.infrastructure.adapters.ai.gemini_workflow_adapter import (
                GeminiWorkflowAdapter,
            )
        except ImportError as e:
            raise RuntimeError(
                "Gemini adapter not yet implemented (Wave 4). "
                "Use AI_PROVIDER=mock for Wave 1."
            ) from e

        if not settings.GOOGLE_API_KEY:
            raise RuntimeError(
                "GOOGLE_API_KEY is empty. Set it in .env (copy from one of "
                "GOOGLE_API_KEY_DEV/STAGING/DEMO) or use AI_PROVIDER=mock."
            )

        return GeminiWorkflowAdapter(
            api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
        )

    if provider == "ollama":
        try:
            from app.infrastructure.adapters.ai.ollama_workflow_adapter import (
                OllamaWorkflowAdapter,
            )
        except ImportError as e:
            raise RuntimeError(
                "Ollama adapter not yet implemented (v3.1). "
                "Use AI_PROVIDER=mock for Wave 1."
            ) from e

        return OllamaWorkflowAdapter(host=settings.OLLAMA_HOST)

    raise ValueError(
        f"Unknown AI_PROVIDER: '{settings.AI_PROVIDER}'. "
        "Expected one of: mock, gemini, ollama."
    )

"""AI Workflow Suggestion Port — provider-agnostic interface (CLAUDE.md §4.1 DIP).

Application layer depends on THIS abstraction. Infrastructure provides
concrete implementations: GeminiWorkflowAdapter, OllamaWorkflowAdapter,
MockWorkflowAdapter. CI uses Mock; production uses Gemini; offline
fallback uses Ollama. Use cases never import provider SDKs directly.

Plan reference: .planning/ai-workflow-generator-plan.md §4.2.1
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator

from app.application.dtos.ai_workflow_dto import (
    LifecycleFormDTO,
    TaskStatusFormDTO,
    WorkflowEventDTO,
)


class IAIWorkflowSuggestionPort(ABC):
    """Streaming AI provider for workflow generation.

    Two operations, both async generators that yield discrete `WorkflowEventDTO`
    objects. The HTTP layer wraps each yielded event in an SSE frame.

    Implementations MUST yield a final `type="done"` event on success or
    `type="error"` on failure (instead of raising) so the SSE stream stays
    a single, well-formed sequence end-to-end.
    """

    @abstractmethod
    async def generate_lifecycle_stream(
        self,
        form: LifecycleFormDTO,
        language: str,
    ) -> AsyncIterator[WorkflowEventDTO]:
        """Stream events for lifecycle workflow generation."""
        ...

    @abstractmethod
    async def generate_task_status_stream(
        self,
        form: TaskStatusFormDTO,
        language: str,
    ) -> AsyncIterator[WorkflowEventDTO]:
        """Stream events for task status workflow generation."""
        ...

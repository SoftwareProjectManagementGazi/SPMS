"""Generate Lifecycle Workflow Use Case.

Pure orchestration — delegates to IAIWorkflowSuggestionPort. CLAUDE.md DIP:
zero `import google.genai`, zero `import anthropic` in this file. Port is
the only seam between use case and provider.

Plan reference: .planning/ai-workflow-generator-plan.md §4.2.3
"""

from typing import AsyncIterator

from app.application.dtos.ai_workflow_dto import (
    LifecycleFormDTO,
    WorkflowEventDTO,
)
from app.application.ports.ai_workflow_suggestion_port import (
    IAIWorkflowSuggestionPort,
)


class GenerateLifecycleWorkflowUseCase:
    """Coordinates lifecycle generation via the AI port.

    Single responsibility: receive a validated form, forward to the port,
    yield events as they arrive. No domain logic beyond pass-through; that
    lives in `ai_workflow_validator` (runs in the adapter or downstream).
    """

    def __init__(self, ai_port: IAIWorkflowSuggestionPort):
        self._ai = ai_port

    async def execute(
        self,
        form: LifecycleFormDTO,
        language: str = "tr",
    ) -> AsyncIterator[WorkflowEventDTO]:
        async for event in self._ai.generate_lifecycle_stream(form, language):
            yield event

"""Generate Task Status Workflow Use Case.

Mirrors GenerateLifecycleWorkflowUseCase but for the task-status variant
(kanban-style columns). Same DIP guarantees.

Plan reference: .planning/ai-workflow-generator-plan.md §4.2.4
"""

from typing import AsyncIterator

from app.application.dtos.ai_workflow_dto import (
    TaskStatusFormDTO,
    WorkflowEventDTO,
)
from app.application.ports.ai_workflow_suggestion_port import (
    IAIWorkflowSuggestionPort,
)


class GenerateTaskStatusWorkflowUseCase:
    """Coordinates task-status generation via the AI port."""

    def __init__(self, ai_port: IAIWorkflowSuggestionPort):
        self._ai = ai_port

    async def execute(
        self,
        form: TaskStatusFormDTO,
        language: str = "tr",
    ) -> AsyncIterator[WorkflowEventDTO]:
        async for event in self._ai.generate_task_status_stream(form, language):
            yield event

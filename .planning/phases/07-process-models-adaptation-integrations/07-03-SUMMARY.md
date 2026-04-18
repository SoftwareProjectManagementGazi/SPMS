---
phase: "07"
plan: "03"
subsystem: "process-models-adaptation-integrations"
tags: [integration-service, slack, teams, webhook, process-template-seeding, clean-architecture]
dependency_graph:
  requires: [07-01]
  provides: [integration-service-layer, template-seeding, integration-events]
  affects: [projects-api, tasks-api, process-templates]
tech_stack:
  added: [httpx (async webhook client), IIntegrationService ABC]
  patterns: [adapter-pattern, fire-and-forget, factory-registry, process_config JSONB flags]
key_files:
  created:
    - Backend/app/domain/interfaces/__init__.py
    - Backend/app/domain/interfaces/integration_service.py
    - Backend/app/infrastructure/integrations/__init__.py
    - Backend/app/infrastructure/integrations/slack_integration_service.py
    - Backend/app/infrastructure/integrations/teams_integration_service.py
    - Backend/app/infrastructure/integrations/integration_factory.py
    - Backend/app/api/v1/integrations.py
  modified:
    - Backend/app/api/main.py
    - Backend/app/application/use_cases/manage_projects.py
    - Backend/app/api/v1/projects.py
    - Backend/app/api/v1/tasks.py
decisions:
  - "Sprint archival on SCRUM departure uses is_active=False (not status string) — matched to actual Sprint entity definition"
  - "Integration events use dto.column_id (not dto.status_id) for task status change trigger — TaskUpdateDTO has column_id not status_id"
  - "_fire_integration_event uses lazy imports inside the function body to avoid circular import between tasks.py and projects.py"
  - "asyncio.create_task used for all integration event fires — non-blocking, fire-and-forget semantics"
  - "process_config.integrations.webhook_url stripped before all GET responses (EXT-04)"
metrics:
  duration_seconds: 237
  completed_date: "2026-04-10T22:19:28Z"
  tasks_completed: 2
  files_created: 7
  files_modified: 4
---

# Phase 07 Plan 03: Integration Service Layer + Template Seeding Summary

Integration service layer (IIntegrationService ABC) with Slack and Teams webhook adapters, factory registry, project-creation template seeding from process templates, mid-project methodology change handling (SCRUM sprint archival), and fire-and-forget integration events on project.created / task.status_changed / task.assigned.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Integration service layer (IIntegrationService + Slack + Teams + factory) + webhook test endpoint | dc33cd1f | domain/interfaces/integration_service.py, integrations/slack_integration_service.py, integrations/teams_integration_service.py, integrations/integration_factory.py, api/v1/integrations.py, api/main.py |
| 2 | Extend CreateProject and UpdateProject use cases + wire integration events in routers | aacd1cfb | use_cases/manage_projects.py, api/v1/projects.py, api/v1/tasks.py |

## What Was Built

**Task 1 — Integration service layer:**
- `IIntegrationService` ABC in `Backend/app/domain/interfaces/integration_service.py` with `send_event(event_type, payload) -> bool` contract
- `SlackIntegrationService`: posts `{"text": message}` to webhook URL via httpx with 5s timeout; returns False on any exception (never raises)
- `TeamsIntegrationService`: posts MessageCard JSON (`@type`, `@context`, `summary`, `text`) to webhook URL
- `integration_factory.py`: `_REGISTRY = {"slack": SlackIntegrationService, "teams": TeamsIntegrationService}` with `get_integration_service(platform, webhook_url)` factory function (adding a new integration = new class + registry entry, EXT-05)
- `POST /api/v1/integrations/test`: authenticated endpoint to test a webhook URL with a test message; returns success/failure status

**Task 2 — Template seeding + integration events:**
- `CreateProjectUseCase`: accepts `template_repo` and `task_repo`; on project creation looks up template by methodology name; if template found and no custom columns provided, seeds board columns from `template.columns`; builds `process_config` from `default_config = {methodology, sprint_duration_days:14, **behavioral_flags, integrations:{}}` merged with user-provided config; seeds `is_recurring=True` tasks from `template.recurring_tasks`
- `UpdateProjectUseCase`: accepts `sprint_repo`; when methodology changes away from SCRUM, fetches all project sprints and sets `is_active=False` for active ones via `sprint_repo.update(sprint.id, {"is_active": False})`
- `projects.py`: `_fire_integration_event` async helper checks `integrations_enabled` admin master switch, reads `process_config.integrations.{webhook_url, platform}`, calls adapter's `send_event`, catches all exceptions; `_sanitize_process_config` strips `webhook_url` from GET responses; `project.created` event fires as `asyncio.create_task` after project creation
- `tasks.py`: `task.status_changed` fires when `dto.column_id` is set; `task.assigned` fires when `dto.assignee_id` is set; both via `asyncio.create_task` (non-blocking)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sprint entity uses `is_active: bool`, not `status: str`**
- **Found during:** Task 2 — reading Sprint entity and repository
- **Issue:** Plan described `sprint.status = "closed"` and `sprint.status in ("active", "planned")`, but the actual `Sprint` domain entity has `is_active: bool` and the repository `update()` method takes `(sprint_id: int, fields: dict)` not `(sprint: Sprint)`
- **Fix:** Used `sprint.is_active` check and `sprint_repo.update(sprint.id, {"is_active": False})` pattern matching actual implementation
- **Files modified:** `Backend/app/application/use_cases/manage_projects.py`
- **Commit:** aacd1cfb

**2. [Rule 1 - Bug] TaskUpdateDTO uses `column_id`, not `status_id`**
- **Found during:** Task 2 — reading TaskUpdateDTO
- **Issue:** Plan described checking `dto.status_id` for task status change integration events, but `TaskUpdateDTO` has `column_id` (not `status_id`). The existing notification code in tasks.py already had `dto.status_id is not None` as dead code (always False)
- **Fix:** Used `dto.column_id is not None` as the trigger for `task.status_changed` integration event
- **Files modified:** `Backend/app/api/v1/tasks.py`
- **Commit:** aacd1cfb

## Requirements Addressed

- PROC-01: Project creation with methodology seeds board columns from matching template
- PROC-02: Project creation seeds recurring tasks from template
- PROC-05: process_config JSONB behavioral flags injected on project creation
- EXT-01: Integration events fire to Slack/Teams on project.created, task.status_changed, task.assigned
- EXT-02: Independent integration service layer (IIntegrationService + adapters + factory)
- EXT-03: Webhook URLs stored in process_config JSONB, never in separate table
- EXT-04: Webhook URLs stripped from all GET responses via _sanitize_process_config
- EXT-05: Adding new integration requires only a new adapter class + _REGISTRY entry

## Known Stubs

None — all integration hooks are wired. Webhooks silently no-op when process_config.integrations has no webhook_url/platform configured (expected behavior for projects without integrations configured).

## Self-Check: PASSED

All 8 key files exist on disk. Both commits (dc33cd1f, aacd1cfb) verified in git log.

---
phase: 07-process-models-adaptation-integrations
plan: "01"
subsystem: backend-domain-foundation
tags: [process-templates, system-config, methodology, migration, domain-entities, repository-interfaces, DTOs]
dependency_graph:
  requires: [06-04-SUMMARY]
  provides: [ITERATIVE-enum, process_config-column, process_templates-table, system_config-table, ProcessTemplate-entity, SystemConfigEntry-entity, IProcessTemplateRepository, ISystemConfigRepository]
  affects: [07-02-PLAN, 07-03-PLAN, 07-04-PLAN, 07-05-PLAN]
tech_stack:
  added: []
  patterns: [async-idempotent-migration, AUTOCOMMIT-enum-DDL, domain-entity-pydantic, ABC-repository-interface]
key_files:
  created:
    - Backend/app/infrastructure/database/migrations/migration_005.py
    - Backend/app/infrastructure/database/models/process_template.py
    - Backend/app/infrastructure/database/models/system_config.py
    - Backend/app/domain/entities/process_template.py
    - Backend/app/domain/entities/system_config.py
    - Backend/app/domain/repositories/process_template_repository.py
    - Backend/app/domain/repositories/system_config_repository.py
    - Backend/app/application/dtos/process_template_dtos.py
    - Backend/app/application/dtos/system_config_dtos.py
  modified:
    - Backend/app/domain/entities/project.py
    - Backend/app/infrastructure/database/models/project.py
    - Backend/app/application/dtos/project_dtos.py
    - Backend/app/api/main.py
decisions:
  - "migration_005 follows exact AUTOCOMMIT pattern from migration_004 for ALTER TYPE ADD VALUE DDL"
  - "JSONB used for process_templates.columns/recurring_tasks/behavioral_flags for native PG query support"
  - "ProjectCreateDTO.columns default changed from hardcoded English names to empty list — Plan 03 template seeding will provide columns based on selected methodology"
  - "ProcessTemplateModel has no TimestampedMixin — not a soft-delete entity; hard delete acceptable for admin-managed templates"
  - "SystemConfigModel has no TimestampedMixin — append-only key-value store, audit not required at this layer"
metrics:
  duration_seconds: 160
  completed_date: "2026-04-10"
  tasks_completed: 2
  files_created: 9
  files_modified: 4
---

# Phase 7 Plan 01: Phase 7 Schema Foundation Summary

**One-liner:** ITERATIVE enum added, process_config JSONB column and two new tables (process_templates, system_config) created via idempotent migration_005, with 4 built-in template seeds and 7 default config values, plus all domain entities, ORM models, DTOs, and repository interfaces.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Migration 005 + ORM models + domain entities + repository interfaces | 31ea600f | migration_005.py, process_template.py (model+entity+repo), system_config.py (model+entity+repo), main.py |
| 2 | Update project entity, DTOs, and ORM model for process_config | 2cab44c2 | project.py (entity+model), project_dtos.py, process_template_dtos.py, system_config_dtos.py |

## What Was Built

### Task 1: Migration 005 + Foundation Layer

**migration_005.py** — Idempotent async upgrade following the migration_004 pattern:
- Section 1 (AUTOCOMMIT): Adds `ITERATIVE` value to `methodology_type` PostgreSQL enum using `ALTER TYPE ADD VALUE IF NOT EXISTS` — required because enum DDL cannot run inside a transaction block.
- Section 2 (regular transaction): Adds `process_config JSONB` column to `projects` table; creates `process_templates` table with 4 built-in seeds (SCRUM, KANBAN, WATERFALL, ITERATIVE); creates `system_config` key-value table with 7 default entries. All DDL guarded by `information_schema` existence checks; seeds use `ON CONFLICT DO NOTHING`.

**ORM Models:**
- `ProcessTemplateModel`: maps `process_templates` table using JSONB columns for `columns`, `recurring_tasks`, `behavioral_flags`. No `TimestampedMixin` — hard delete is appropriate for admin-managed custom templates.
- `SystemConfigModel`: maps `system_config` table with `key` as primary key. No `TimestampedMixin` — key-value store, not lifecycle-tracked.

**Domain Entities:**
- `ProcessTemplate(BaseModel)`: Pydantic model with `ConfigDict(from_attributes=True)` for ORM → entity conversion.
- `SystemConfigEntry(BaseModel)`: Minimal key/value domain entity.

**Repository Interfaces:**
- `IProcessTemplateRepository`: `get_all`, `get_by_id`, `get_by_name`, `create`, `update`, `delete`.
- `ISystemConfigRepository`: `get_all`, `get_by_key`, `upsert`, `upsert_many`.

**main.py** — `upgrade_005(engine)` added to lifespan after `upgrade_004`.

### Task 2: project_dtos.py + New DTOs

- `Project` domain entity: `process_config: Optional[Dict[str, Any]] = None` added after `custom_fields`.
- `ProjectModel` ORM: `process_config = Column(JSON, nullable=True)` added after `custom_fields`.
- `ProjectCreateDTO`: `process_config` field added; `columns` default changed from `["Backlog", "Todo", "In Progress", "In Review", "Done"]` to `[]` (Plan 03 will seed columns from the selected methodology template).
- `ProjectUpdateDTO`: `process_config` field added.
- `ProjectResponseDTO`: `process_config` field added.
- `process_template_dtos.py`: `ProcessTemplateCreateDTO`, `ProcessTemplateUpdateDTO`, `ProcessTemplateResponseDTO`.
- `system_config_dtos.py`: `SystemConfigResponseDTO`, `SystemConfigUpdateDTO`.

## Seed Data

### process_templates (built-in, is_builtin=TRUE)
| name | columns | behavioral flags |
|------|---------|-----------------|
| SCRUM | Is Birikimi, Yapilacaklar, Devam Eden, Inceleme, Tamamlandi | restrict_expired_sprints: true |
| KANBAN | Yapilacaklar, Devam Eden (wip_limit:3), Test, Tamamlandi | enforce_wip_limits: true |
| WATERFALL | Gereksinimler, Tasarim, Gelistirme, Test, Dagitim | enforce_sequential_dependencies: true |
| ITERATIVE | Planlama, Analiz, Gelistirme, Degerlendirme | all flags false |

### system_config (defaults)
| key | value |
|-----|-------|
| default_sprint_duration_days | 14 |
| max_task_limit | 100 |
| default_notification_frequency | instant |
| reporting_module_enabled | true |
| integrations_enabled | true |
| primary_brand_color | (empty) |
| chart_theme | default |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all files contain complete implementations. The repository interfaces are intentionally abstract (ABC) — concrete implementations will be provided in Plan 02 (infrastructure layer).

## Self-Check: PASSED

**Files exist:**
- Backend/app/infrastructure/database/migrations/migration_005.py — FOUND
- Backend/app/domain/entities/process_template.py — FOUND
- Backend/app/domain/entities/system_config.py — FOUND
- Backend/app/infrastructure/database/models/process_template.py — FOUND
- Backend/app/infrastructure/database/models/system_config.py — FOUND
- Backend/app/domain/repositories/process_template_repository.py — FOUND
- Backend/app/domain/repositories/system_config_repository.py — FOUND
- Backend/app/application/dtos/process_template_dtos.py — FOUND
- Backend/app/application/dtos/system_config_dtos.py — FOUND

**Commits exist:**
- 31ea600f — FOUND
- 2cab44c2 — FOUND

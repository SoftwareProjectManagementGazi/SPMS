---
phase: 03-project-task-completion
plan: "02"
subsystem: backend-schema
tags: [migration, sqlalchemy, domain, dtos, repository-interfaces]
dependency_graph:
  requires: []
  provides:
    - 003_phase3 Alembic migration
    - TaskDependencyModel (SQLAlchemy)
    - TaskDependency domain entity
    - ISprintRepository, ICommentRepository, IAttachmentRepository interfaces
    - SprintCreateDTO, SprintResponseDTO
    - CommentCreateDTO, CommentResponseDTO
    - AttachmentResponseDTO
    - TaskDependencyCreateDTO, TaskDependencySummaryDTO
  affects:
    - 03-03 (sprint CRUD uses ISprintRepository + sprint_dtos)
    - 03-04 (comment/attachment use ICommentRepository, IAttachmentRepository, comment_dtos, attachment_dtos)
    - 03-05 (task dependency use case uses TaskDependency entity + task_dtos)
tech_stack:
  added: []
  patterns:
    - Idempotent Alembic migration with _table_exists/_column_exists helpers
    - Async migration helper mirror in app/infrastructure/database/migrations/
    - ABC abstract repository interface pattern
    - Pydantic BaseModel with ConfigDict(from_attributes=True) for DTOs
key_files:
  created:
    - Backend/alembic/versions/003_phase3_schema.py
    - Backend/app/infrastructure/database/migrations/003_phase3_schema.py
    - Backend/app/infrastructure/database/models/task_dependency.py
    - Backend/app/domain/entities/task_dependency.py
    - Backend/app/domain/repositories/sprint_repository.py
    - Backend/app/domain/repositories/comment_repository.py
    - Backend/app/domain/repositories/attachment_repository.py
    - Backend/app/application/dtos/sprint_dtos.py
    - Backend/app/application/dtos/comment_dtos.py
    - Backend/app/application/dtos/attachment_dtos.py
  modified:
    - Backend/app/infrastructure/database/models/task.py (task_key, series_id)
    - Backend/app/infrastructure/database/models/project.py (task_seq)
    - Backend/app/infrastructure/database/models/file.py (file_size)
    - Backend/app/application/dtos/task_dtos.py (TaskDependencyCreateDTO, TaskDependencySummaryDTO appended)
decisions:
  - "[03-02]: task_dependencies uses hard delete only (no TimestampedMixin) — dependencies have no audit value per research"
  - "[03-02]: Backfill sets task_key = project.key || '-' || task.id for all existing tasks on migration 003 upgrade"
  - "[03-02]: Dual migration file pattern maintained: alembic/versions/ for CLI, app/infrastructure/database/migrations/ for async lifespan"
  - "[03-02]: TaskDependencySummaryDTO includes optional depends_on_key/depends_on_title for display without extra queries"
metrics:
  duration_seconds: 220
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_created: 10
  files_modified: 4
---

# Phase 3 Plan 02: Database Schema and Domain Contracts Summary

**One-liner:** Idempotent Alembic migration 003 adding task_dependencies table + 4 columns, with TaskDependencyModel, three ABC repository interfaces (sprint, comment, attachment), and six DTO modules establishing Phase 3 domain contracts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Alembic migration 003 + SQLAlchemy model updates | 9583a7e | 003_phase3_schema.py (x2), task_dependency.py model, task.py, project.py, file.py |
| 2 | Domain entity, repo interfaces, and DTOs | 23a0498 | task_dependency entity, 3 repo interfaces, sprint/comment/attachment DTOs, task_dtos.py extended |

## What Was Built

**Migration 003** (`Backend/alembic/versions/003_phase3_schema.py`):
- Creates `task_dependencies` table: id, task_id (FK tasks.id CASCADE), depends_on_id (FK tasks.id CASCADE), dependency_type (String(20), default "blocks"), created_at
- UniqueConstraint("task_id", "depends_on_id", name="uq_task_dependency") — prevents duplicate dependency pairs
- Adds `task_key` (String(20)) and `series_id` (String(36)) to tasks table
- Adds `task_seq` (Integer, NOT NULL, default 0) to projects table
- Adds `file_size` (Integer, nullable) to files table
- Backfills task_key for all existing tasks as `project.key || '-' || task.id`
- Fully idempotent via _table_exists/_column_exists checks
- Mirror async version at `Backend/app/infrastructure/database/migrations/003_phase3_schema.py`

**SQLAlchemy Models** updated:
- `TaskDependencyModel` — new model with relationships back to TaskModel via foreign_keys
- `TaskModel` — task_key (indexed), series_id added after recurrence_count
- `ProjectModel` — task_seq added after custom_fields
- `FileModel` — file_size added after uploaded_at

**Domain Entity:**
- `TaskDependency` — Pydantic BaseModel, from_attributes=True, dependency_type defaults to "blocks"

**Repository Interfaces:**
- `ISprintRepository` — get_by_id, get_by_project, create, update, delete
- `ICommentRepository` — get_by_id, get_by_task, create, update, soft_delete
- `IAttachmentRepository` — get_by_id, get_by_task, create, soft_delete

**DTOs:**
- `sprint_dtos.py` — SprintCreateDTO, SprintUpdateDTO, SprintResponseDTO
- `comment_dtos.py` — CommentAuthorDTO, CommentCreateDTO, CommentUpdateDTO, CommentResponseDTO
- `attachment_dtos.py` — AttachmentUploaderDTO, AttachmentResponseDTO
- `task_dtos.py` (extended) — TaskDependencyCreateDTO, TaskDependencySummaryDTO appended

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files created:
- Backend/alembic/versions/003_phase3_schema.py — FOUND
- Backend/app/infrastructure/database/migrations/003_phase3_schema.py — FOUND
- Backend/app/infrastructure/database/models/task_dependency.py — FOUND
- Backend/app/domain/entities/task_dependency.py — FOUND
- Backend/app/domain/repositories/sprint_repository.py — FOUND
- Backend/app/domain/repositories/comment_repository.py — FOUND
- Backend/app/domain/repositories/attachment_repository.py — FOUND
- Backend/app/application/dtos/sprint_dtos.py — FOUND
- Backend/app/application/dtos/comment_dtos.py — FOUND
- Backend/app/application/dtos/attachment_dtos.py — FOUND

Commits:
- 9583a7e — FOUND
- 23a0498 — FOUND

Import verification: PASSED (all contracts importable via conda base Python)

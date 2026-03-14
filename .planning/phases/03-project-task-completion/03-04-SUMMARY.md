---
phase: 03-project-task-completion
plan: "04"
subsystem: backend-comments-attachments
tags: [fastapi, sqlalchemy, clean-architecture, file-upload, soft-delete]
dependency_graph:
  requires:
    - 03-02 (ICommentRepository, IAttachmentRepository, comment_dtos, attachment_dtos, FileModel.file_size)
  provides:
    - SqlAlchemyCommentRepository with soft-delete filter
    - ListComments, CreateComment, UpdateComment, DeleteComment use cases
    - Comment CRUD router at /api/v1/comments
    - SqlAlchemyAttachmentRepository with soft-delete filter
    - ListAttachments, UploadAttachment, DeleteAttachment use cases
    - Attachment upload/download router at /api/v1/attachments
  affects:
    - 03-06 (frontend wiring for comments and attachments)
tech_stack:
  added: []
  patterns:
    - _get_base_query() always filters is_deleted=False (per Pitfall 7 in research)
    - joinedload(CommentModel.user).joinedload(UserModel.role) for author info in single query
    - Inline project membership check for POST endpoints with task_id in body (not path)
    - UUID-named file storage at static/uploads/tasks/{uuid}.ext matching Phase 2 avatar pattern
    - ValueError -> HTTP 400/413 translation for file validation errors
key_files:
  created:
    - Backend/app/application/use_cases/manage_comments.py
    - Backend/app/infrastructure/database/repositories/comment_repo.py
    - Backend/app/api/v1/comments.py
    - Backend/app/application/use_cases/manage_attachments.py
    - Backend/app/infrastructure/database/repositories/attachment_repo.py
    - Backend/app/api/v1/attachments.py
  modified:
    - Backend/app/api/dependencies.py (get_comment_repo, get_attachment_repo added)
    - Backend/app/api/main.py (comments + attachments routers registered)
    - Backend/app/domain/exceptions.py (CommentNotFoundError, AttachmentNotFoundError)
    - Backend/app/domain/entities/comment.py (updated_at, is_deleted, user fields)
    - Backend/app/domain/entities/file.py (file_size, is_deleted, uploader fields)
decisions:
  - "[03-04]: POST /comments/ uses inline project membership check (task_id in body) rather than get_task_project_member path-param dependency — mirrors create_task pattern"
  - "[03-04]: PATCH/DELETE /comments/{id} use get_current_user only; author enforcement happens inside UpdateCommentUseCase/DeleteCommentUseCase"
  - "[03-04]: UploadAttachment raises ValueError for validation failures; router translates to HTTP 400 (blocked extension) or HTTP 413 (>25MB)"
  - "[03-04]: File paths stored as relative strings 'static/uploads/tasks/uuid.ext' matching Phase 2 avatar pattern"
metrics:
  duration_seconds: 233
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_created: 6
  files_modified: 5
---

# Phase 3 Plan 04: Comment CRUD and File Attachment Backend Summary

**One-liner:** Comment CRUD (4 endpoints, author-only patch/delete) and File Attachment backend (upload with extension/size validation, JWT-gated download) using soft-delete repositories and Clean Architecture use cases.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Comment use cases, repository, and router | e4e69b6 | manage_comments.py, comment_repo.py, comments.py, dependencies.py, exceptions.py, comment entity, file entity, attachment_repo.py |
| 2 | Attachment use cases, repository, router, and main.py registration | 87d2c15 | manage_attachments.py, attachments.py, main.py |

## What Was Built

**SqlAlchemyCommentRepository** (`Backend/app/infrastructure/database/repositories/comment_repo.py`):
- `_get_base_query()` filters `CommentModel.is_deleted == False` + joinloads user and role
- `get_by_id` / `get_by_task` / `create` / `update` / `soft_delete` — all async
- `update()` sets `updated_at = datetime.utcnow()` for is_edited detection
- Re-fetches with joined user after create/update to ensure author info available in DTO

**Comment Use Cases** (`Backend/app/application/use_cases/manage_comments.py`):
- `ListCommentsUseCase.execute(task_id)` — returns CommentResponseDTO list
- `CreateCommentUseCase.execute(dto, author_id)` — creates comment with author set to current_user
- `UpdateCommentUseCase.execute(comment_id, dto, requester_id, requester)` — raises 403 if not author/admin
- `DeleteCommentUseCase.execute(comment_id, requester_id, requester)` — soft-delete with 403 guard
- `_map_to_response()` sets `is_edited = updated_at > created_at`

**Comments Router** (`Backend/app/api/v1/comments.py`):
- `GET /api/v1/comments/task/{task_id}` — requires project membership via get_task_project_member
- `POST /api/v1/comments/` — inline membership check (task_id from body)
- `PATCH /api/v1/comments/{id}` — get_current_user only; use case enforces author check
- `DELETE /api/v1/comments/{id}` — get_current_user only; use case enforces author check

**SqlAlchemyAttachmentRepository** (`Backend/app/infrastructure/database/repositories/attachment_repo.py`):
- `_get_base_query()` filters `FileModel.is_deleted == False` + joinloads uploader
- `get_by_id` / `get_by_task` / `create` / `soft_delete` — all async

**Attachment Use Cases** (`Backend/app/application/use_cases/manage_attachments.py`):
- `ListAttachmentsUseCase.execute(task_id)` — returns AttachmentResponseDTO list
- `UploadAttachmentUseCase.execute(...)` — validates extension, size, stores file, creates DB record
  - BLOCKED_EXTENSIONS: `.exe .sh .bat .ps1 .msi .dmg` — raises ValueError → HTTP 400
  - MAX_SIZE_BYTES: 25MB — raises ValueError → HTTP 413
  - Storage path: `Backend/static/uploads/tasks/{uuid}.ext`
  - DB path stored as relative: `static/uploads/tasks/{uuid}.ext`
- `DeleteAttachmentUseCase.execute(...)` — uploader/admin only; raises 403 otherwise

**Attachments Router** (`Backend/app/api/v1/attachments.py`):
- `GET /api/v1/attachments/task/{task_id}` — requires project membership
- `POST /api/v1/attachments/` — file upload via multipart; inline membership check
- `GET /api/v1/attachments/download/{file_id}` — FileResponse behind JWT gate (get_current_user)
- `DELETE /api/v1/attachments/{file_id}` — soft-delete; use case enforces uploader check

**Domain updates:**
- `Comment` entity: added `updated_at`, `is_deleted`, `user` fields
- `File` entity: added `file_size`, `is_deleted`, `uploader` fields
- `exceptions.py`: added `CommentNotFoundError`, `AttachmentNotFoundError`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] attachment_repo.py created in Task 1 scope**
- **Found during:** Task 1
- **Issue:** dependencies.py imports both comment_repo and attachment_repo at module load; creating only comment_repo would cause ImportError during Task 1 verification
- **Fix:** Created complete attachment_repo.py alongside comment_repo.py in Task 1 commit
- **Files modified:** Backend/app/infrastructure/database/repositories/attachment_repo.py
- **Commit:** e4e69b6

**2. [Rule 1 - Bug] POST /comments/ inline membership check**
- **Found during:** Task 1
- **Issue:** Plan specified `get_task_project_member` dependency for POST, but that dependency reads task_id from URL path — POST has task_id in request body only
- **Fix:** Inline project membership check matching the established create_task pattern
- **Files modified:** Backend/app/api/v1/comments.py

## Self-Check: PASSED

Files created:
- Backend/app/application/use_cases/manage_comments.py — FOUND
- Backend/app/infrastructure/database/repositories/comment_repo.py — FOUND
- Backend/app/api/v1/comments.py — FOUND
- Backend/app/application/use_cases/manage_attachments.py — FOUND
- Backend/app/infrastructure/database/repositories/attachment_repo.py — FOUND
- Backend/app/api/v1/attachments.py — FOUND

Commits:
- e4e69b6 — FOUND
- 87d2c15 — FOUND

Import verification: PASSED (all layers importable via conda base Python)
Route registration: PASSED (8 routes registered: 4 comments + 4 attachments)

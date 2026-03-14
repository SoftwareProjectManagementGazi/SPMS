---
phase: 03-project-task-completion
plan: "06"
subsystem: ui
tags: [react, tanstack-query, axios, typescript, comments, attachments, audit-log]

# Dependency graph
requires:
  - phase: 03-04
    provides: comments and attachments API endpoints (POST/GET/PATCH/DELETE /comments/, /attachments/, GET /tasks/{id}/history)
  - phase: 03-05
    provides: task search, pagination, dependency, recurring logic
provides:
  - Frontend/services/comment-service.ts — typed CRUD for comments API
  - Frontend/services/attachment-service.ts — typed upload/list/download/delete for attachments API with blocked-extension validation
  - Frontend/components/task-detail/task-content.tsx — Comments, History, Attachments tabs wired to real APIs; (removed) badge for ex-members
affects: [03-07, any future task detail feature work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useQuery + useMutation for tab-level data fetching in task-detail components"
    - "lazy history fetch (enabled: activeTab === 'history') to avoid unnecessary audit log requests"
    - "Tailwind group/comment hover pattern for author-only edit/delete reveal"
    - "memberIdSet from projectService.getMembers() drives (removed) badge rendering"
    - "client-side blocked extension check before multipart upload attempt"

key-files:
  created:
    - Frontend/services/comment-service.ts
    - Frontend/services/attachment-service.ts
  modified:
    - Frontend/components/task-detail/task-content.tsx
    - Frontend/services/project-service.ts

key-decisions:
  - "[03-06]: getMembers() added to projectService immediately (plan 03-07 will not need to add it; 03-06 uses it first)"
  - "[03-06]: History tab uses enabled: activeTab === 'history' to lazy-load audit log only when tab is visible"
  - "[03-06]: currentUserId derived via parseInt(currentUser.id, 10) since AuthContext.user.id is string and CommentAuthor.id is number"
  - "[03-06]: Ctrl+Enter keyboard shortcut added to new comment textarea for quick submission (small UX addition, no scope creep)"
  - "[03-06]: (removed) badge checked for history actors too — consistent with comment author badge per plan spec"

patterns-established:
  - "ProjectMember interface exported from project-service.ts (id: number, full_name, avatar_path, role_name)"
  - "attachmentService.downloadUrl() returns /api/v1/attachments/download/{id} — used as anchor href with download attribute"
  - "formatRelativeTime / formatDate / formatBytes utility functions defined inline in task-content.tsx"

requirements-completed: [TASK-07, TASK-08, TASK-09]

# Metrics
duration: 15min
completed: 2026-03-14
---

# Phase 3 Plan 06: Task Content API Wiring Summary

**Comments CRUD with author-only hover controls, History tab with audit log, and file Attachments with blocked-extension validation — all wired to real APIs, mock data removed, (removed) badge for ex-project-members**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-14T15:45:00Z
- **Completed:** 2026-03-14T16:00:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `comment-service.ts` with typed list/create/update/delete calling the comments API
- Created `attachment-service.ts` with typed list/upload (blocked-ext validation)/downloadUrl/delete calling the attachments API
- Rewrote `task-content.tsx`: removed all `@/lib/mock-data` imports; Comments tab wired with full CRUD and ConfirmDialog on delete; History tab fetches audit log lazily; Attachments section wired with drag-drop upload zone and file list with download links
- Added `(removed)` badge in both Comments and History tabs for authors no longer in the project member set

## Task Commits

Each task was committed atomically:

1. **Task 1: comment-service.ts and attachment-service.ts** - `583e9a5` (feat)
2. **Task 2: Wire task-content.tsx — Comments, History, and Attachments tabs** - `bcb4bc0` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `Frontend/services/comment-service.ts` — list, create, update, delete for comment API; CommentAuthor and Comment interfaces
- `Frontend/services/attachment-service.ts` — list, upload with blocked-ext guard, downloadUrl, delete; Attachment interface
- `Frontend/components/task-detail/task-content.tsx` — full API wiring for Comments/History/Attachments tabs; (removed) badge; ConfirmDialog on delete; Work Logs empty state
- `Frontend/services/project-service.ts` — added ProjectMember interface + getMembers() method

## Decisions Made
- `getMembers()` added to `projectService` now since plan 03-06 needs it and 03-07 hasn't run yet (deviation Rule 3 — blocking dependency)
- History tab uses `enabled: activeTab === 'history'` to avoid loading audit log until user clicks the tab
- `currentUser.id` is a string in AuthContext; `CommentAuthor.id` is a number — used `parseInt(currentUser.id, 10)` for comparison

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added getMembers() to projectService ahead of plan 03-07**
- **Found during:** Task 2 (Wire task-content.tsx)
- **Issue:** Plan 03-06 references `projectService.getMembers()` but notes it will be added in plan 03-07. Since 03-07 has not run, this would be a TypeScript import error blocking compilation.
- **Fix:** Added `ProjectMember` interface and `getMembers(projectId): Promise<ProjectMember[]>` to `Frontend/services/project-service.ts`
- **Files modified:** Frontend/services/project-service.ts
- **Verification:** TypeScript reports 0 errors in project-service.ts for the new additions; existing pre-existing error on line 47 (role: "manager" string vs {name: string}) was already present before this plan
- **Committed in:** bcb4bc0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to compile without errors. plan 03-07 may extend getMembers() further or can skip adding it if already present.

## Issues Encountered
- Pre-existing TypeScript errors in `lib/mock-data.ts`, `app/page.tsx`, `task-header.tsx`, and `project-service.ts` mapper (19 total) — all out of scope, not caused by this plan's changes. Files created/modified in this plan: 0 TS errors.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plans 03-04 and 03-05 backend endpoints are now fully consumed by the frontend
- TASK-07 (history), TASK-08 (comments), TASK-09 (attachments) requirements fulfilled from user perspective
- Plan 03-07 can extend `projectService.getMembers()` or skip if the signature already matches

---
*Phase: 03-project-task-completion*
*Completed: 2026-03-14*

## Self-Check: PASSED

- FOUND: Frontend/services/comment-service.ts
- FOUND: Frontend/services/attachment-service.ts
- FOUND: Frontend/components/task-detail/task-content.tsx
- FOUND: .planning/phases/03-project-task-completion/03-06-SUMMARY.md
- FOUND commit: 583e9a5 (Task 1)
- FOUND commit: bcb4bc0 (Task 2)

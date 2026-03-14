---
phase: 03-project-task-completion
plan: "07"
subsystem: frontend-ui
tags: [frontend, project-members, task-dependencies, recurrence, sprint, react-query]
dependency_graph:
  requires: ["03-03", "03-05"]
  provides: ["sprint-service", "task-dependency-service", "members-tab", "task-sidebar-cards"]
  affects: ["task-sidebar", "project-detail-page"]
tech_stack:
  added: ["sprint-service.ts", "task-dependency-service.ts", "members-tab.tsx"]
  patterns: ["useQuery + useMutation per card", "Command popover for search-and-add", "role-gate with isManagerOrAdmin", "apply_to scope dialog for recurring tasks"]
key_files:
  created:
    - Frontend/services/sprint-service.ts
    - Frontend/services/task-dependency-service.ts
    - Frontend/components/project/members-tab.tsx
  modified:
    - Frontend/services/project-service.ts
    - Frontend/services/task-service.ts
    - Frontend/lib/types.ts
    - Frontend/components/task-detail/task-sidebar.tsx
    - Frontend/app/projects/[id]/page.tsx
    - Frontend/components/dashboard/member-view.tsx
decisions:
  - "currentUser fetched inside task-sidebar.tsx via useQuery(getCurrentUser) rather than passed as prop — avoids breaking task detail page caller"
  - "MembersTab implemented as separate file (components/project/members-tab.tsx) for reusability"
  - "sprintId/recurrenceInterval/recurrenceEndDate/recurrenceCount added to ParentTask type and task-service mapper"
  - "Sprint Select uses empty string value for backlog (null sprint_id) to satisfy SelectItem value constraints"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_modified: 8
  files_created: 3
---

# Phase 3 Plan 7: Members Tab + Task Sidebar Cards Summary

**One-liner:** Sprint dropdown, Dependencies card, Recurrence card added to task-sidebar; Members tab with add/remove member controls added to project detail page.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | sprint-service, task-dependency-service, project-service member methods | 717e8f8 | sprint-service.ts, task-dependency-service.ts, project-service.ts |
| 2 | task-sidebar.tsx new cards + projects/[id]/page.tsx Members tab | 1639591 | task-sidebar.tsx, projects/[id]/page.tsx, members-tab.tsx |

## What Was Built

### sprint-service.ts
Full CRUD service for sprints: `list(projectId)`, `create`, `update`, `delete`. Uses `/sprints?project_id=X` for listing.

### task-dependency-service.ts
Dependency API service: `list(taskId)` returns `{ blocks, blocked_by }`, `add(taskId, dependsOnId)`, `remove(taskId, dependencyId)`.

### project-service.ts extensions
Added `addMember(projectId, {user_id?, team_id?})` and `removeMember(projectId, userId)` (getMembers was already added by 03-06).

### task-sidebar.tsx (3 new cards)
- **Sprint dropdown**: Manager/Admin sees Select with all project sprints; others see read-only label. Calls `handleFieldUpdate({ sprint_id })` which routes through recurring task scope dialog if needed.
- **Dependencies card**: Blocks and Is blocked by sections, each with clickable links and X remove buttons. Command popover adds new dependency, filtered to exclude current task and already-linked tasks.
- **Recurrence card** (visible only when `task.isRecurring`): Shows interval badge, end criteria, and "Stop recurring" button. All field updates on recurring tasks trigger an All/This scope dialog before calling `updateTask` with `apply_to` param.

### members-tab.tsx
Standalone component used in projects/[id]/page.tsx Members tab. Manager/Admin sees "Add member" Command popover (filters out current members) and "Remove" buttons per row. Remove triggers ConfirmDialog. On remove success, invalidates both `project-members` and `project-tasks` queries.

### projects/[id]/page.tsx
Added Members tab trigger in TabsList and `<TabsContent value="members">` rendering MembersTab. currentUser fetched via useQuery(getCurrentUser) and passed to MembersTab.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing `role: "manager"` string in project-service.ts**
- **Found during:** Task 1 (TS verification)
- **Issue:** `placeholderLead.role` was set to string `"manager"` but `User.role` type is `{ name: string }`
- **Fix:** Changed to `role: { name: "Manager" }`
- **Files modified:** Frontend/services/project-service.ts
- **Commit:** 717e8f8

**2. [Rule 2 - Missing fields] Added sprintId/recurrence fields to ParentTask type**
- **Found during:** Task 2 design (sprint card and recurrence card require task.sprintId, task.recurrenceInterval etc.)
- **Issue:** `ParentTask` type lacked `sprintId`, `recurrenceInterval`, `recurrenceEndDate`, `recurrenceCount`; task-service mapper didn't map them
- **Fix:** Added fields to types.ts and to task-service.ts DTO + mapper
- **Files modified:** Frontend/lib/types.ts, Frontend/services/task-service.ts
- **Commit:** 717e8f8

**3. [Rule 1 - Bug] Fixed member-view.tsx ghost task missing new required fields**
- **Found during:** Task 1 (TS verification after adding fields to ParentTask)
- **Issue:** Ghost ParentTask literal in member-view.tsx missing sprintId/recurrenceInterval/recurrenceEndDate/recurrenceCount
- **Fix:** Added four null fields to ghost task object
- **Files modified:** Frontend/components/dashboard/member-view.tsx
- **Commit:** 717e8f8

**4. [Design adjustment] currentUser fetched inside task-sidebar.tsx**
- **Found during:** Task 2 — task detail page does not pass currentUser to TaskSidebar
- **Issue:** Plan specified `task-sidebar.tsx receives props: { task, currentUser, onTaskUpdate }` but actual caller passes only `{ task }`; changing caller would cascade to other potential callers
- **Fix:** Fetch currentUser internally via `useQuery(['currentUser'], authService.getCurrentUser)`. This is a no-op if the query is already cached (same key used in project page).

## Self-Check: PASSED

Files verified:
- Frontend/services/sprint-service.ts — FOUND
- Frontend/services/task-dependency-service.ts — FOUND
- Frontend/components/project/members-tab.tsx — FOUND
- Frontend/components/task-detail/task-sidebar.tsx — modified, FOUND
- Frontend/app/projects/[id]/page.tsx — modified, FOUND

Commits verified:
- 717e8f8 — FOUND (feat(03-07): add sprint-service...)
- 1639591 — FOUND (feat(03-07): add Members tab...)

TypeScript: 0 new errors introduced by plan changes (18 pre-existing errors unchanged from before plan).

# Phase 3: Project & Task Completion - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

The project and task module is fully functional — managers can assign members to projects, tasks have dependencies and recurrence, comments and file attachments work, sprints are manageable via API, and list endpoints paginate. Task keys (PROJ-42 style) are generated automatically.

Requirements in scope: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11.

</domain>

<decisions>
## Implementation Decisions

### Task Detail Page (TASK-02, TASK-07, TASK-08, TASK-09)
- Existing `/tasks/[id]` page is the home for all task detail content — dedicated page, not a drawer or modal
- Layout: main content column (description, attachments, subtasks, activity tabs) + right sidebar (status, assignee, priority, dates, dependencies, recurrence, sprint)
- Header stays minimal — delete button only; no Edit or Comment toolbar buttons
- Breadcrumb: Projects > [Project Name] > PROJ-42 (project-scoped task key in breadcrumb)
- Activity tabs: **Comments** + **History** — Work Logs tab kept with empty state (placeholder for future time-tracking)

### Comments (TASK-08)
- Wire comments tab to real API (currently uses mock data from `@/lib/mock-data`)
- Comment editing: hover to reveal inline Edit / Delete icons — action icons appear on hover only, not always visible
- Comment deletion uses the existing shadcn/ui `ConfirmDialog` (established in Phase 2)
- Only the comment author can edit/delete their own comment

### File Attachments (TASK-09)
- Upload zone already exists in `TaskContent` — wire to backend
- Display: list view — each attachment shows file type icon, filename, upload date, download button
- Max file size: **25 MB per file**
- Blocked types: `.exe`, `.sh`, `.bat`, `.ps1`, `.msi`, `.dmg` — all other types allowed
- Files stored in `Backend/static/uploads/` (existing pattern from Phase 2 avatars), served via authenticated endpoint

### Task History / Operation Logs (TASK-07)
- History tab wired to audit log table (Phase 1 built field-level audit trail)
- Display: field-level entries — each row shows Avatar + name, field changed, old value → new value, timestamp
- Example: "Ali changed Priority: MEDIUM → HIGH  2h ago"

### Task Dependencies (TASK-02)
- Dependencies live in TaskSidebar as a new card below Dates
- Two dependency types: **Blocks** / **Is blocked by** (maps to finish-to-start; start-to-start deferred to Phase 4)
- Adding a dependency: Command popover (same shadcn/ui Command component used for assignee search) — search tasks by title within the same project
- Dependency card shows linked tasks as clickable links (task key + title)

### Project Member Management (TASK-01)
- New **Members tab** added to the existing project detail page (`/projects/[id]`) alongside the Tasks tab
- Tab header: [Tasks] [Members] — matches existing tab pattern in the page
- Tab content: member list (avatar, name, role, team badge) + search-and-add input
- Add options: **[Add member]** (individual user search by name/email) + **[Add team]** (adds all members of an existing team at once, uses `team_projects` join table from Phase 2)
- New members always join as **Member** role — no role picker at add time
- Role restriction in UI: only **Manager** and **Admin** see Add / Remove controls; regular members see the list read-only
- Remove member flow: confirmation dialog warns about incomplete tasks → **unassign only incomplete/in-progress tasks**; tasks with "done" status keep their assignee for traceability
- Removed members still appear in task history and comment author fields with a **(removed)** badge — past work is always attributable

### Recurring Tasks (TASK-03, TASK-04, TASK-05)
- Recurrence configurable in **two places**: (1) Create Task form toggle, (2) task detail sidebar recurrence card — both creation and post-creation editing supported
- DB representation: **one master task** with `is_recurring=true`; next instance is generated on-demand when the previous task is marked complete (not pre-created)
- Auto-created next instance: placed in **backlog (no sprint)** — manager assigns to a sprint manually
- End criteria exposed: **Never / On date / After N occurrences** — maps to existing `recurrence_end_date` and `recurrence_count` columns
- Recurrence indicator: small **↺ icon** on task cards and list rows (low-noise)
- "All instances vs. this instance only" dialog (TASK-04): fires on **any field save** for a recurring task
  - Default selection: "This and all future tasks"
- Recurrence card in task detail sidebar includes a **"Stop recurring"** button — marks series as ended, no future instances generated; current task becomes a regular task
- Recurrence intervals: daily / weekly / monthly (maps to existing `recurrence_interval` column)

### Similar Task Warning (TASK-06)
- Warning fires: **debounced title search** — triggers ~600ms after user stops typing in the Create Task form title field
- Similarity logic: **substring/partial word match** — backend `ILIKE '%word%'` search on significant words from the new title, scoped to the same project
- Warning is **non-blocking** — inline alert below the title field; user can still submit
- Warning shows: task key + title + "View" link (opens existing task in new tab)
- Example: `⚠ Similar task found: #38 — Fix login redirect bug  [View ↗]`

### Sprint Management (TASK-10)
- Phase 3 scope: **backend endpoints only**
  - `GET /sprints?project_id=X`
  - `POST /sprints`
  - `PATCH /sprints/{id}`
  - `DELETE /sprints/{id}`
- Frontend touch: task detail sidebar gets a **sprint dropdown** to assign/change sprint — visible to Manager and Admin only; regular members see sprint as read-only label
- No sprint management UI page in Phase 3 — full sprint board and planning view is Phase 4

### Task Keys
- Auto-generated format: **project prefix + sequential number** per project (e.g. MP-42)
- Project prefix: 2-5 uppercase chars, auto-suggested from project name on creation (editable by manager)
- Project creation form adds optional **"Key prefix"** field (auto-filled, manager can override)
- Backend generates next key at task creation time; key stored on the task record

### Pagination (TASK-11)
- API response shape for paginated endpoints:
  ```json
  { "items": [...], "total": 87, "page": 1, "page_size": 20 }
  ```
- Frontend: **"Load more" button** at the bottom of lists — appends next page to the existing list without full page reload
- Button label: "Load more (N remaining)"
- Default page size: 20
- Applied to: task list endpoints and project list endpoints

### Claude's Discretion
- Exact Alembic migration structure for task key columns (`key`, `key_seq`) on projects and tasks
- File type detection method (extension check vs MIME type sniff)
- Exact debounce timing for similar-task search (target: 600ms)
- Backend logic for extracting "significant words" from task title for similarity search (stop-word filtering)
- Comment `updated_at` display (show "edited" label if updated_at differs from created_at)
- Exact empty state message for Work Logs tab

</decisions>

<specifics>
## Specific Ideas

- "All users' past actions must be traceable and visible even if they leave the project or company" — history, comments, and task assignments from removed users must always show their name with a (removed) badge, never anonymized
- Removed member unassignment: only incomplete/in-progress tasks are unassigned on removal; done tasks keep the historical assignee for auditability
- Task key follows Jira-style PROJ-42 format — manager sets the prefix at project creation, auto-suggested from project name
- Recurring task next-instance creation happens on completion (not background scheduler) — simplest approach for single-process deployment
- Sprint assignment in task sidebar is manager/admin-only — matches the sprint planning discipline of the workflow

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Frontend/app/tasks/[id]/page.tsx` — task detail page already exists; `TaskHeader`, `TaskContent`, `TaskSidebar` sub-components in `Frontend/components/task-detail/`
- `Frontend/components/task-detail/task-content.tsx` — has comments tab strip + upload zone + description editor (all using mock data); wire to real API
- `Frontend/components/task-detail/task-sidebar.tsx` — status/assignee/priority/due date already wired to real API; add Dependencies and Recurrence cards here
- `shadcn/ui Command` component — used for assignee search; reuse for dependency task search and member search
- `shadcn/ui ConfirmDialog` / `AlertDialog` — established in Phase 2; use for remove-member confirmation and comment deletion
- `Frontend/components/create-task-modal.tsx` — add recurring toggle + recurrence config panel here
- `Backend/app/domain/entities/sprint.py` + `Backend/app/infrastructure/database/models/sprint.py` — Sprint entity and model already exist
- `Backend/app/domain/entities/comment.py` + `Backend/app/infrastructure/database/models/comment.py` — Comment entity and model already exist
- `Backend/static/uploads/` — existing upload directory from Phase 2 avatar uploads; extend for task attachments
- `Backend/app/api/dependencies.py` — `get_project_member` dependency for member access control (Phase 1); extend for sprint assignment permission check
- `Backend/app/infrastructure/database/repositories/task_repo.py` — add pagination query support and ILIKE similarity search here

### Established Patterns
- FastAPI `Depends()` for auth/permission checks — sprint assignment permission check follows same pattern
- Clean Architecture layers: Domain → Application → Infrastructure → API — new use cases (AddProjectMember, RemoveProjectMember, CreateComment, UploadAttachment, etc.) go in `app/application/use_cases/`
- TanStack Query `useMutation` + `useQueryClient.invalidateQueries` — all save/update actions follow this pattern (established in task-sidebar.tsx and task-content.tsx)
- `TimestampedMixin` — apply to any new tables (task_dependencies, task_attachments)
- Soft delete (`is_deleted` flag) — apply to comments and attachments per Phase 1 DATA-04 decision

### Integration Points
- `Frontend/app/projects/[id]/page.tsx` — add Members tab to existing Tabs component
- `Frontend/components/task-detail/task-sidebar.tsx` — add Dependencies card + Recurrence card + Sprint dropdown
- `Frontend/components/create-task-modal.tsx` — add recurring toggle + key preview
- `Backend/app/api/v1/tasks.py` — add pagination params, similarity search endpoint, dependency endpoints
- New router needed: `Backend/app/api/v1/sprints.py` — sprint CRUD endpoints
- New router needed: `Backend/app/api/v1/comments.py` — comment CRUD
- New router needed: `Backend/app/api/v1/attachments.py` — file upload/download
- `Backend/app/infrastructure/database/models/project.py` — add `key_prefix` column + `task_seq` counter
- `Backend/app/infrastructure/database/models/task.py` — add `key` column (e.g. "MP-42")

</code_context>

<deferred>
## Deferred Ideas

- Sprint management UI page (sprint list, create sprint, close sprint) — Phase 4 (Views & UI)
- Start-to-start dependency type — Phase 4 (needed for Gantt view)
- Work Logs / time tracking — future phase (Work Logs tab kept as empty state placeholder)
- Thumbnail grid for image attachments — could be added in Phase 4 or later
- Background scheduler for recurring task generation (alternative to on-completion trigger) — Phase 7 or infrastructure phase

</deferred>

---

*Phase: 03-project-task-completion*
*Context gathered: 2026-03-14*

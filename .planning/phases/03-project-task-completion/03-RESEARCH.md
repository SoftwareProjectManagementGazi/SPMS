# Phase 3: Project & Task Completion - Research

**Researched:** 2026-03-14
**Domain:** FastAPI (Python) + Next.js 14 (TypeScript) — project/task feature completion
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Task Detail Page (TASK-02, TASK-07, TASK-08, TASK-09)**
- Existing `/tasks/[id]` page is the home for all task detail content — dedicated page, not a drawer or modal
- Layout: main content column (description, attachments, subtasks, activity tabs) + right sidebar (status, assignee, priority, dates, dependencies, recurrence, sprint)
- Header stays minimal — delete button only; no Edit or Comment toolbar buttons
- Breadcrumb: Projects > [Project Name] > PROJ-42 (project-scoped task key in breadcrumb)
- Activity tabs: **Comments** + **History** — Work Logs tab kept with empty state (placeholder for future time-tracking)

**Comments (TASK-08)**
- Wire comments tab to real API (currently uses mock data from `@/lib/mock-data`)
- Comment editing: hover to reveal inline Edit / Delete icons — action icons appear on hover only, not always visible
- Comment deletion uses the existing shadcn/ui `ConfirmDialog` (established in Phase 2)
- Only the comment author can edit/delete their own comment

**File Attachments (TASK-09)**
- Upload zone already exists in `TaskContent` — wire to backend
- Display: list view — each attachment shows file type icon, filename, upload date, download button
- Max file size: **25 MB per file**
- Blocked types: `.exe`, `.sh`, `.bat`, `.ps1`, `.msi`, `.dmg` — all other types allowed
- Files stored in `Backend/static/uploads/` (existing pattern from Phase 2 avatars), served via authenticated endpoint

**Task History / Operation Logs (TASK-07)**
- History tab wired to audit log table (Phase 1 built field-level audit trail)
- Display: field-level entries — each row shows Avatar + name, field changed, old value → new value, timestamp
- Example: "Ali changed Priority: MEDIUM → HIGH  2h ago"

**Task Dependencies (TASK-02)**
- Dependencies live in TaskSidebar as a new card below Dates
- Two dependency types: **Blocks** / **Is blocked by** (maps to finish-to-start; start-to-start deferred to Phase 4)
- Adding a dependency: Command popover (same shadcn/ui Command component used for assignee search) — search tasks by title within the same project
- Dependency card shows linked tasks as clickable links (task key + title)

**Project Member Management (TASK-01)**
- New **Members tab** added to the existing project detail page (`/projects/[id]`) alongside the Tasks tab
- Tab header: [Tasks] [Members] — matches existing tab pattern in the page
- Tab content: member list (avatar, name, role, team badge) + search-and-add input
- Add options: **[Add member]** (individual user search by name/email) + **[Add team]** (adds all members of an existing team at once, uses `team_projects` join table from Phase 2)
- New members always join as **Member** role — no role picker at add time
- Role restriction in UI: only **Manager** and **Admin** see Add / Remove controls; regular members see the list read-only
- Remove member flow: confirmation dialog warns about incomplete tasks → **unassign only incomplete/in-progress tasks**; tasks with "done" status keep their assignee for traceability
- Removed members still appear in task history and comment author fields with a **(removed)** badge — past work is always attributable

**Recurring Tasks (TASK-03, TASK-04, TASK-05)**
- Recurrence configurable in **two places**: (1) Create Task form toggle, (2) task detail sidebar recurrence card — both creation and post-creation editing supported
- DB representation: **one master task** with `is_recurring=true`; next instance is generated on-demand when the previous task is marked complete (not pre-created)
- Auto-created next instance: placed in **backlog (no sprint)** — manager assigns to a sprint manually
- End criteria exposed: **Never / On date / After N occurrences** — maps to existing `recurrence_end_date` and `recurrence_count` columns
- Recurrence indicator: small **↺ icon** on task cards and list rows (low-noise)
- "All instances vs. this instance only" dialog (TASK-04): fires on **any field save** for a recurring task; Default selection: "This and all future tasks"
- Recurrence card in task detail sidebar includes a **"Stop recurring"** button — marks series as ended
- Recurrence intervals: daily / weekly / monthly (maps to existing `recurrence_interval` column)

**Similar Task Warning (TASK-06)**
- Warning fires: **debounced title search** — triggers ~600ms after user stops typing in the Create Task form title field
- Similarity logic: **substring/partial word match** — backend `ILIKE '%word%'` search on significant words from the new title, scoped to the same project
- Warning is **non-blocking** — inline alert below the title field; user can still submit
- Warning shows: task key + title + "View" link (opens existing task in new tab)

**Sprint Management (TASK-10)**
- Phase 3 scope: **backend endpoints only**
  - `GET /sprints?project_id=X`, `POST /sprints`, `PATCH /sprints/{id}`, `DELETE /sprints/{id}`
- Frontend touch: task detail sidebar gets a **sprint dropdown** to assign/change sprint — visible to Manager and Admin only; regular members see sprint as read-only label
- No sprint management UI page in Phase 3

**Task Keys**
- Auto-generated format: **project prefix + sequential number** per project (e.g. MP-42)
- Project prefix: 2-5 uppercase chars, auto-suggested from project name on creation (editable by manager)
- Project creation form adds optional **"Key prefix"** field (auto-filled, manager can override)
- Backend generates next key at task creation time; key stored on the task record

**Pagination (TASK-11)**
- API response shape: `{ "items": [...], "total": 87, "page": 1, "page_size": 20 }`
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

### Deferred Ideas (OUT OF SCOPE)
- Sprint management UI page (sprint list, create sprint, close sprint) — Phase 4
- Start-to-start dependency type — Phase 4 (needed for Gantt view)
- Work Logs / time tracking — future phase (Work Logs tab kept as empty state placeholder)
- Thumbnail grid for image attachments — Phase 4 or later
- Background scheduler for recurring task generation — Phase 7 or infrastructure phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TASK-01 | Proje yöneticisi projeye ekip üyesi atayabilir ve atamayı kaldırabilir | `project_members` association table exists in ProjectModel; need new project member API endpoints + Members tab in frontend |
| TASK-02 | Görevler arası bağımlılık tanımlanabilir (finish-to-start) | No `task_dependencies` table exists yet — need new model + migration + domain entity + use cases + API endpoints; Frontend sidebar card |
| TASK-03 | Tekrarlayan görev oluşturulabilir (günlük/haftalık/aylık) | `is_recurring`, `recurrence_interval`, `recurrence_end_date`, `recurrence_count` columns already on TaskModel; need business logic wiring |
| TASK-04 | Tekrarlayan görev düzenlenirken "tümünü mü / yalnızca bu örneği mi?" onay kontrolü | Frontend dialog gating saves on `is_recurring=true` tasks; backend needs `apply_to=all/this` param support |
| TASK-05 | Tekrarlayan görev için bitiş kriteri belirlenebilir (tarih veya tekrar sayısı) | Columns exist; need form UI in create-task-modal and recurrence card in sidebar to expose them |
| TASK-06 | Benzer görev mevcut uyarısı | New backend endpoint `GET /tasks/search?project_id=X&q=words`; debounced call in create-task-modal |
| TASK-07 | Görev geçmişi ve işlem logları API üzerinden sorgulanabilir | `audit_log` table exists with full field-level trail; need endpoint `GET /tasks/{id}/history` and frontend History tab wiring |
| TASK-08 | Yorum oluşturulabilir, düzenlenebilir ve silinebilir | `CommentModel` exists with task_id/user_id/content; need comment CRUD use cases, router, and frontend wiring replacing mock data |
| TASK-09 | Dosya eklenebilir ve indirilebilir | `FileModel` exists; need upload use case, `POST /attachments/`, authenticated download endpoint, and frontend wiring of upload zone |
| TASK-10 | Sprint'ler API üzerinden listelenebilir, oluşturulabilir ve yönetilebilir | `SprintModel` exists; need new `Backend/app/api/v1/sprints.py` router + CRUD use cases + sprint dropdown in task sidebar |
| TASK-11 | Liste endpoint'leri sayfalama desteği ile döner | `task_repo.get_all_by_project` and `project_repo.get_all` return flat lists; need pagination params + paginated response wrapper |
</phase_requirements>

---

## Summary

Phase 3 completes the project and task module by wiring together infrastructure that was largely scaffolded in Phase 1 but never connected. The database models for comments (`CommentModel`), files (`FileModel`), sprints (`SprintModel`) all exist. The recurring task columns (`is_recurring`, `recurrence_interval`, `recurrence_end_date`, `recurrence_count`) are on `TaskModel`. The `project_members` association table exists on `ProjectModel`. The `audit_log` table records field-level changes. What's missing is the application layer above all of this: use cases, DTOs, API routers, and frontend wiring.

Two new database tables are required: `task_dependencies` (no model exists) and a `task_key` stored per task (no `key` column on TaskModel, despite the key being computed at runtime today). The `ProjectModel` already has a `key` column used as the project prefix — Phase 3 formalises per-task keys by adding a `task_seq` counter to projects and a `task_key` column to tasks. Three new FastAPI routers are needed: `sprints.py`, `comments.py`, and `attachments.py`. The existing `projects.py` router needs member management endpoints; `tasks.py` needs pagination, similarity search, history, and dependency endpoints.

On the frontend, `task-content.tsx` uses mock data for comments/history — these tabs must be wired to real APIs. `task-sidebar.tsx` needs three new cards (Dependencies, Recurrence, Sprint). `create-task-modal.tsx` has a non-functional recurring toggle — it needs a real recurrence config panel with end criteria and the similar-task warning. The project detail page needs a Members tab.

**Primary recommendation:** Follow the Clean Architecture layers top-to-bottom for each feature: migration first, then domain entity/repo interface, then use case, then DTO, then router, then frontend service, then component. Each of the 11 requirements maps to a distinct vertical slice; plan work in feature-slice waves rather than layer-by-layer sweeps.

---

## Standard Stack

### Core (already established — do not deviate)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | current (in use) | API framework | All existing routes use it |
| SQLAlchemy async | current (in use) | ORM + query builder | All repos use `AsyncSession` + `select()` |
| Pydantic v2 | current (in use) | DTOs, entity validation | All entities and DTOs use `BaseModel` + `ConfigDict(from_attributes=True)` |
| Alembic | current (in use) | DB migrations | Migrations 001 and 002 exist; Phase 3 adds 003 |
| TanStack Query v5 | current (in use) | Server state (frontend) | All data fetching uses `useQuery`/`useMutation` |
| shadcn/ui | current (in use) | UI components | All components use Card, Select, Command, Calendar, Badge, Avatar |
| Axios (via apiClient) | current (in use) | HTTP client | `@/lib/api-client` wraps Axios with auth interceptor |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-multipart | current (in use for avatars) | File upload parsing | Required for `UploadFile` in FastAPI; already installed |
| `pathlib.Path` + `uuid` | stdlib | File path generation | Used in Phase 2 avatar upload; same pattern for attachments |
| `useDebounce` hook | implement inline | Debounced search trigger | For similar-task warning in create-task-modal |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extension-based file blocking | MIME sniff | Extension check is simpler; MIME sniff catches renamed files but adds complexity. Use extension check as primary since blocked list is short (6 types) |
| Storing `task_seq` on ProjectModel | Separate sequence table | ProjectModel counter is simpler for single-process; sequence table needed only for concurrent writes at scale |
| `apply_to` param on task update | Separate clone endpoint | Param-based approach reuses existing `PUT /tasks/{id}`; fewer endpoints to maintain |

**Installation:** No new backend packages required. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure for New Files

```
Backend/app/
├── api/v1/
│   ├── sprints.py          # NEW: Sprint CRUD router
│   ├── comments.py         # NEW: Comment CRUD router
│   ├── attachments.py      # NEW: Attachment upload/download router
│   └── projects.py         # EXTEND: add /projects/{id}/members endpoints
│
├── application/
│   ├── dtos/
│   │   ├── sprint_dtos.py      # NEW
│   │   ├── comment_dtos.py     # NEW
│   │   └── attachment_dtos.py  # NEW
│   └── use_cases/
│       ├── manage_sprints.py       # NEW
│       ├── manage_comments.py      # NEW
│       ├── manage_attachments.py   # NEW
│       └── manage_project_members.py  # NEW
│
├── domain/
│   ├── entities/
│   │   └── task_dependency.py  # NEW
│   └── repositories/
│       ├── sprint_repository.py     # NEW interface
│       ├── comment_repository.py    # NEW interface
│       └── attachment_repository.py # NEW interface
│
└── infrastructure/database/
    ├── models/
    │   └── task_dependency.py  # NEW SQLAlchemy model
    └── repositories/
        ├── sprint_repo.py     # NEW implementation
        ├── comment_repo.py    # NEW implementation
        └── attachment_repo.py # NEW implementation

Backend/alembic/versions/
└── 003_phase3_schema.py   # NEW: task_dependencies, task_key columns, file size column

Frontend/
├── services/
│   ├── sprint-service.ts      # NEW
│   ├── comment-service.ts     # NEW
│   └── attachment-service.ts  # NEW
├── components/task-detail/
│   ├── task-sidebar.tsx        # EXTEND: dependencies card, recurrence card, sprint dropdown
│   └── task-content.tsx        # EXTEND: wire comments tab, history tab, attachment list
└── app/projects/[id]/
    └── page.tsx                # EXTEND: Members tab
```

### Pattern 1: New Router Registration (established pattern)

New routers follow the existing pattern in `main.py`:

```python
# In Backend/app/api/main.py — add alongside existing includes
from app.api.v1 import sprints, comments, attachments

app.include_router(sprints.router, prefix="/api/v1/sprints", tags=["Sprints"])
app.include_router(comments.router, prefix="/api/v1/comments", tags=["Comments"])
app.include_router(attachments.router, prefix="/api/v1/attachments", tags=["Attachments"])
```

Project member endpoints go directly on the projects router at `/api/v1/projects/{project_id}/members`.

### Pattern 2: Repository with Pagination (new pattern)

Pagination must return a structured wrapper, not a raw list. The established `_get_base_query()` pattern is extended with `limit/offset`:

```python
# In task_repo.py
async def get_all_by_project_paginated(
    self, project_id: int, page: int = 1, page_size: int = 20
) -> tuple[list[Task], int]:
    base = self._get_base_query().where(TaskModel.project_id == project_id)
    # Count
    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await self.session.execute(count_stmt)).scalar_one()
    # Page
    stmt = base.offset((page - 1) * page_size).limit(page_size)
    result = await self.session.execute(stmt)
    models = result.unique().scalars().all()
    return [self._to_entity(m) for m in models], total
```

Frontend pagination response shape (per locked decision):
```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
```

### Pattern 3: File Upload (extend avatar pattern)

Phase 2 established the file storage pattern at `Backend/static/uploads/avatars/`. Attachments go to `Backend/static/uploads/tasks/`:

```python
# In attachments.py router
@router.post("/", response_model=AttachmentResponseDTO, status_code=201)
async def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_task_project_member),  # reuse existing dependency
    attachment_repo = Depends(get_attachment_repo),
):
    # Extension check
    blocked = {".exe", ".sh", ".bat", ".ps1", ".msi", ".dmg"}
    suffix = Path(file.filename).suffix.lower()
    if suffix in blocked:
        raise HTTPException(400, "File type not allowed")
    # Size check (25 MB)
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(413, "File exceeds 25 MB limit")
    # Store
    filename = f"{uuid.uuid4()}{suffix}"
    dest = Path("static/uploads/tasks") / filename
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    ...
```

Download endpoint must be authenticated — same pattern as Phase 2 avatar serving via `/auth/avatar/{filename}` with JWT gate.

### Pattern 4: Recurring Task Next-Instance Generation

On task completion trigger (column changed to "done" status), check `is_recurring` and generate next instance:

```python
# In UpdateTaskUseCase — extend existing execute()
if new_column_is_done and existing_task.is_recurring:
    # Check end criteria
    should_create = _check_recurrence_should_continue(existing_task)
    if should_create:
        next_due = _compute_next_due(existing_task)
        next_task = Task(
            title=existing_task.title,
            description=existing_task.description,
            project_id=existing_task.project_id,
            is_recurring=True,
            recurrence_interval=existing_task.recurrence_interval,
            recurrence_end_date=existing_task.recurrence_end_date,
            recurrence_count=existing_task.recurrence_count,
            due_date=next_due,
            sprint_id=None,  # Always backlog per locked decision
            assignee_id=existing_task.assignee_id,
        )
        await task_repo.create(next_task)
```

The `apply_to` parameter on task update distinguishes "this instance only" vs "this and all future tasks". For "all future" — query tasks with same `title` + `is_recurring=True` + `due_date >= now` in the same project.

### Pattern 5: Task Dependency Model

`task_dependencies` is a simple join table with a type discriminator:

```python
class TaskDependencyModel(Base):
    __tablename__ = "task_dependencies"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    depends_on_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    dependency_type = Column(String(20), nullable=False, default="blocks")
    # dependency_type values: "blocks" (finish-to-start)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("task_id", "depends_on_id"),)
```

No `TimestampedMixin` needed — dependencies are hard-deleted when removed, not soft-deleted (they have no audit value and no content).

### Pattern 6: Similarity Search

Backend endpoint returns tasks with title matching any significant word:

```python
# GET /tasks/search?project_id=X&q=fix+login
# Stop words to filter: ["the","a","an","is","in","on","at","to","for","of","and","or"]
words = [w for w in query.lower().split() if w not in STOP_WORDS and len(w) > 2]
if not words:
    return []
conditions = [TaskModel.title.ilike(f"%{w}%") for w in words]
stmt = select(TaskModel).where(TaskModel.project_id == project_id, or_(*conditions), ...)
```

### Anti-Patterns to Avoid

- **Eager-load everything in a list query:** The existing `_get_base_query()` with full joins is suitable for single-task fetches but will cause N+1 or cartesian product issues on paginated lists. For list endpoints use `selectinload` for collections (subtasks) but keep `joinedload` only for scalar relationships.
- **Creating new project-level auth logic from scratch:** Reuse `get_project_member` and `get_task_project_member` from `dependencies.py` for all new endpoints that touch a project's resources.
- **Putting member management logic in the project router inline:** Member add/remove goes into `manage_project_members.py` use cases — the router only calls the use case.
- **Storing file size on the model at upload time vs checking at read time:** Validate and reject at upload time; do not re-check file size on every read.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload parsing | Custom multipart parser | `fastapi.UploadFile` + `python-multipart` | Already in stack; handles streaming |
| Debounce in React | `setTimeout` ref juggling | Inline `useCallback` + `useRef` for cleanup, or the established `setTimeout`/`clearTimeout` pattern | Simple enough without a library; no new deps needed |
| Pagination count query | Separate SQL count | SQLAlchemy `select(func.count()).select_from(subquery)` | One query reuses the same filter conditions |
| Task key generation | Complex slug logic | Increment `task_seq` on `ProjectModel` at task creation time inside the repo (atomic with flush) | Simpler than a separate sequence table for single-process deployment |
| Recurrence date arithmetic | Manual day/month math | Python `relativedelta` from `python-dateutil` (already installed as a transitive dep of SQLAlchemy/Pydantic) | Handles month-end edge cases correctly |

**Key insight:** Almost everything needed for Phase 3 is already scaffolded or is a trivial extension of existing patterns. The primary work is wiring, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: `task_seq` Race Condition

**What goes wrong:** Two concurrent task creations for the same project read the same `task_seq` value, generating duplicate task keys.
**Why it happens:** The `SELECT` + increment + `UPDATE` is not atomic across async requests.
**How to avoid:** Use `UPDATE projects SET task_seq = task_seq + 1 WHERE id = :id RETURNING task_seq` (a single atomic SQL statement) inside `task_repo.create()` instead of ORM read-modify-write. Or use `select ... for update` on the project row before reading.
**Warning signs:** Duplicate key constraint violations on `tasks.task_key` under concurrent load.

### Pitfall 2: `apply_to=all` Scope Over-Reach

**What goes wrong:** Applying a recurring task edit to "all future instances" updates tasks in unrelated series with the same title.
**Why it happens:** Querying by title alone is ambiguous if two different recurring tasks share a title.
**How to avoid:** Add a `series_id` UUID column to `TaskModel` at creation time for recurring tasks; link all instances of a series by this ID. "All future" query becomes `WHERE series_id = :sid AND due_date >= now()`.
**Warning signs:** Wrong tasks being edited when user picks "all instances."

### Pitfall 3: `project_members` Membership Check After Removal

**What goes wrong:** Removed member can still access project tasks because `get_by_id_and_user` checks `project_members` table — but the frontend has cached the old project data.
**Why it happens:** TanStack Query caches project data; removal doesn't automatically invalidate the right query keys.
**How to avoid:** After remove-member mutation succeeds, call `queryClient.invalidateQueries({ queryKey: ['project', projectId] })` AND `queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] })`.
**Warning signs:** Members tab still shows removed user after successful deletion without page reload.

### Pitfall 4: Soft-Delete Not Applied to Comments/Attachments

**What goes wrong:** Deleted comments or attachments reappear because the list query doesn't filter `is_deleted = False`.
**Why it happens:** `CommentModel` and `FileModel` both use `TimestampedMixin` (verified), but the repository `SELECT` queries won't automatically apply the soft-delete filter.
**How to avoid:** Every repository `SELECT` for comments and attachments must include `.where(CommentModel.is_deleted == False)`. Follow the exact pattern in `task_repo._get_base_query()`.
**Warning signs:** Deleted items reappearing after page reload.

### Pitfall 5: Missing `file_size` Column on FileModel

**What goes wrong:** The existing `FileModel` has no `file_size` column. The 25 MB limit check happens at upload, but UI cannot display file size without it.
**Why it happens:** Phase 1 scaffolded `FileModel` without a size column.
**How to avoid:** Migration 003 adds `file_size = Column(Integer, nullable=True)` to the `files` table. Store `len(content)` at upload time.
**Warning signs:** File list UI shows no size info; needs to re-read file from disk on every request to compute size.

### Pitfall 6: `task_key` Column Already In Use vs New Column

**What goes wrong:** `TaskModel` does **not** have a `task_key` column — task keys are currently computed at runtime in `map_task_to_response_dto()` using `f"{project_key}-{task.id}"`. Migration 003 adds a real `task_key` column. The mapper must be updated to use the stored key, not the computed one.
**Why it happens:** Phase 1/2 used the task `id` as a proxy for the key number.
**How to avoid:** After migration 003, `task_repo.create()` populates `task_key` atomically. `map_task_to_response_dto()` switches from computed to stored key. Old data can be backfilled with the same `{project_key}-{task.id}` formula via a migration data step.
**Warning signs:** Task keys change after migration if mapper still uses `task.id` instead of `task.task_key`.

### Pitfall 7: `CommentModel` Has No `is_deleted` Awareness on Read

**What goes wrong:** Phase 1 created `CommentModel` with `TimestampedMixin` but no repository was created for it. The new `comment_repo.py` must be written from scratch and must filter soft-deleted rows from the first line.
**Why it happens:** No comment repo exists yet — easy to forget the soft-delete filter when starting fresh.
**How to avoid:** Copy the `_get_base_query()` pattern from `task_repo.py` exactly: always add `.where(CommentModel.is_deleted == False)`.

### Pitfall 8: Pagination Breaking Existing Frontend

**What goes wrong:** Changing `GET /tasks/project/{id}` to return `{ items, total, page, page_size }` instead of a plain array breaks all existing consumers (`task-service.ts`, `create-task-modal.tsx` parent task list).
**Why it happens:** Response shape change is a breaking API change.
**How to avoid:** Add pagination as **optional query params** with a fallback: if `page` is not supplied, return the existing flat array format. Or version the endpoint. Preferred approach per locked decision: always return paginated shape; update all frontend consumers simultaneously in the same plan wave.

---

## Code Examples

### Comment CRUD — Established Pattern Reference

```python
# Backend/app/api/v1/comments.py — follows existing router pattern
@router.get("/task/{task_id}", response_model=List[CommentResponseDTO])
async def list_comments(
    task_id: int,
    comment_repo = Depends(get_comment_repo),
    current_user: User = Depends(get_task_project_member),  # reuse existing dep
):
    use_case = ListCommentsUseCase(comment_repo)
    return await use_case.execute(task_id)

@router.post("/", response_model=CommentResponseDTO, status_code=201)
async def create_comment(
    dto: CommentCreateDTO,
    comment_repo = Depends(get_comment_repo),
    current_user: User = Depends(get_task_project_member),
):
    use_case = CreateCommentUseCase(comment_repo)
    return await use_case.execute(dto, author_id=current_user.id)
```

### Frontend TanStack Query Pattern (established)

```typescript
// Follows pattern in task-sidebar.tsx
const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentService.create({ task_id: task.id, content }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['comments', task.id] })
        toast.success("Comment added")
    },
    onError: (error: any) => {
        toast.error(error.response?.data?.detail || "Failed to add comment")
    }
})
```

### shadcn/ui Command Popover for Dependency Search

```typescript
// Reuse same pattern as assignee search in task-sidebar.tsx
<Popover open={depOpen} onOpenChange={setDepOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm" className="w-full">
      <Plus className="h-4 w-4 mr-2" /> Add dependency
    </Button>
  </PopoverTrigger>
  <PopoverContent className="p-0 w-72" align="start">
    <Command>
      <CommandInput placeholder="Search tasks..." onValueChange={setDepSearch} />
      <CommandList>
        <CommandEmpty>No tasks found.</CommandEmpty>
        <CommandGroup>
          {projectTasks.filter(t => t.id !== task.id).map(t => (
            <CommandItem key={t.id} onSelect={() => handleAddDependency(t.id)}>
              <span className="font-mono text-xs mr-2">{t.key}</span>
              {t.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

### Alembic Migration 003 Template (idempotent pattern from 002)

```python
"""Phase 3 schema: task_dependencies, task_key columns, file_size column.

Revision ID: 003_phase3
Revises: 002_phase2
"""
from alembic import op
import sqlalchemy as sa

revision = "003_phase3"
down_revision = "002_phase2"

def _table_exists(table_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema='public' AND table_name=:t"), {"t": table_name})
    return result.scalar() > 0

def _column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM information_schema.columns "
                "WHERE table_name=:t AND column_name=:c"), {"t": table, "c": column})
    return result.scalar() > 0

def upgrade() -> None:
    # task_dependencies table
    if not _table_exists("task_dependencies"):
        op.create_table("task_dependencies",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("task_id", sa.Integer(), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
            sa.Column("depends_on_id", sa.Integer(), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
            sa.Column("dependency_type", sa.String(20), nullable=False, server_default="blocks"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.UniqueConstraint("task_id", "depends_on_id", name="uq_task_dependency"),
        )
    # task_key column on tasks
    if not _column_exists("tasks", "task_key"):
        op.add_column("tasks", sa.Column("task_key", sa.String(20), nullable=True))
    # task_seq counter on projects
    if not _column_exists("projects", "task_seq"):
        op.add_column("projects", sa.Column("task_seq", sa.Integer(), nullable=False, server_default="0"))
    # file_size on files
    if not _column_exists("files", "file_size"):
        op.add_column("files", sa.Column("file_size", sa.Integer(), nullable=True))
    # series_id on tasks (for recurring series linkage)
    if not _column_exists("tasks", "series_id"):
        op.add_column("tasks", sa.Column("series_id", sa.String(36), nullable=True))
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Task key computed at runtime from `{project.key}-{task.id}` | Stored `task_key` on task record; `task_seq` counter on project | Phase 3 | Keys become stable and searchable; breadcrumb shows real key |
| Comment tab uses `@/lib/mock-data` activities | Comments tab fetches from real API `GET /comments/task/{id}` | Phase 3 | Real CRUD; author enforcement |
| Upload zone in `TaskContent` is UI-only (no upload logic) | Wire to `POST /attachments/` with multipart | Phase 3 | Attachments persisted and downloadable |
| Sprint entity exists but no API endpoints | `sprints.py` router with full CRUD | Phase 3 | Sprint can be assigned from task sidebar |
| `GET /tasks/project/{id}` returns flat array | Returns `{ items, total, page, page_size }` | Phase 3 | Load-more pagination in UI |

---

## Open Questions

1. **`task_seq` atomicity on PostgreSQL**
   - What we know: SQLAlchemy async + PostgreSQL supports `RETURNING` clause via `execute(text(...))`.
   - What's unclear: Whether to use raw SQL or SQLAlchemy `update()` with `returning()` for the atomic increment.
   - Recommendation: Use `UPDATE projects SET task_seq = task_seq + 1 WHERE id = :id RETURNING task_seq` via `session.execute(text(...))` in `task_repo.create()`. This is the safest pattern for single-atomic-operation key generation.

2. **"Removed" badge for ex-members in comments/history**
   - What we know: `CommentModel.user_id` has `ON DELETE CASCADE` — deleting a user cascades. But user deletion is not exposed via any current endpoint (we soft-delete users, not hard-delete).
   - What's unclear: How to determine "removed from project" vs "removed from system" at query time.
   - Recommendation: Add a `is_project_member` check at comment/history render time by comparing against the current `project_members` list. If `user_id` is not in current members → show "(removed)" badge. This requires the comment/history endpoint to return `user_id` alongside user display info.

3. **`project_members` member role column**
   - What we know: The existing `project_members` association table has only `project_id`, `user_id`, `joined_at` — no role column.
   - What's unclear: The UI shows a "role" column in the members tab (member list shows "avatar, name, role, team badge"). Should role come from the global `user.role` or from a project-scoped role?
   - Recommendation: Use the global `user.role.name` (from the `UserModel.role` relationship) as the displayed role in the member list. This avoids adding a new column to `project_members` and is consistent with how permissions are checked elsewhere (`_is_admin(user)`).

---

## Schema Gap Summary

The following database changes are needed in Migration 003:

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| `tasks` | `task_key` | `VARCHAR(20)` nullable | e.g. "MP-42"; backfill with `{project.key}-{id}` |
| `tasks` | `series_id` | `VARCHAR(36)` nullable | UUID linking recurring instances |
| `projects` | `task_seq` | `INTEGER` NOT NULL default 0 | Per-project task key counter |
| `files` | `file_size` | `INTEGER` nullable | Bytes; stored at upload time |
| `task_dependencies` | new table | see schema above | No TimestampedMixin; hard delete |

Existing models that need **no migration** but need new repositories and use cases:
- `CommentModel` (table `comments`) — exists, no missing columns
- `FileModel` (table `files`) — exists, missing `file_size` (above)
- `SprintModel` (table `sprints`) — exists, no missing columns

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — all file reads above verified against actual source
- `Backend/app/infrastructure/database/models/` — all model schemas confirmed
- `Backend/app/api/v1/tasks.py`, `projects.py`, `dependencies.py` — existing patterns confirmed
- `Frontend/components/task-detail/task-sidebar.tsx`, `task-content.tsx` — mock data usage confirmed
- `Frontend/services/task-service.ts` — mapper and API call patterns confirmed

### Secondary (MEDIUM confidence)
- SQLAlchemy async `UPDATE ... RETURNING` pattern — standard SQLAlchemy 2.x feature; well documented
- Python `relativedelta` for recurrence date arithmetic — part of `python-dateutil`, which is a transitive dependency of Pydantic/SQLAlchemy ecosystem

### Tertiary (LOW confidence — flag for validation)
- `python-dateutil` confirmed as transitive dep: verify with `pip show python-dateutil` in Backend environment before using `relativedelta`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed by direct code inspection
- Architecture: HIGH — patterns extracted from existing working code
- Pitfalls: HIGH for items verified by code inspection; MEDIUM for concurrency pitfall (race condition) which is theoretical at current scale
- Schema gaps: HIGH — models read directly, missing columns identified precisely

**Research date:** 2026-03-14
**Valid until:** 2026-06-14 (stable stack — 90 days)

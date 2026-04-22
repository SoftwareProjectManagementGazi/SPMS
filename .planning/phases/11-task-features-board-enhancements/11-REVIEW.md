---
phase: 11-task-features-board-enhancements
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 81
files_reviewed_list:
  - Backend/app/api/dependencies.py
  - Backend/app/api/deps/label.py
  - Backend/app/api/main.py
  - Backend/app/api/v1/labels.py
  - Backend/app/application/dtos/board_column_dtos.py
  - Backend/app/application/dtos/label_dtos.py
  - Backend/app/application/use_cases/manage_board_columns.py
  - Backend/app/application/use_cases/manage_labels.py
  - Backend/app/domain/entities/label.py
  - Backend/app/domain/entities/project.py
  - Backend/app/domain/exceptions.py
  - Backend/app/domain/repositories/label_repository.py
  - Backend/app/infrastructure/database/repositories/label_repo.py
  - Frontend2/app/(shell)/dashboard/page.tsx
  - Frontend2/app/(shell)/layout.tsx
  - Frontend2/app/(shell)/my-tasks/page.tsx
  - Frontend2/app/(shell)/projects/[id]/page.tsx
  - Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx
  - Frontend2/app/(shell)/projects/page.tsx
  - Frontend2/app/globals.css
  - Frontend2/components/app-shell.tsx
  - Frontend2/components/header.tsx
  - Frontend2/components/header/create-button.tsx
  - Frontend2/components/header/search-autocomplete.tsx
  - Frontend2/components/my-tasks/my-tasks-experience.tsx
  - Frontend2/components/my-tasks/saved-views-tabs.tsx
  - Frontend2/components/my-tasks/task-filter-bar.tsx
  - Frontend2/components/my-tasks/task-group-list.tsx
  - Frontend2/components/my-tasks/task-row.tsx
  - Frontend2/components/project-detail/activity-stub-tab.tsx
  - Frontend2/components/project-detail/backlog-panel.tsx
  - Frontend2/components/project-detail/backlog-task-row.tsx
  - Frontend2/components/project-detail/backlog-toggle.tsx
  - Frontend2/components/project-detail/board-card.tsx
  - Frontend2/components/project-detail/board-column.tsx
  - Frontend2/components/project-detail/board-tab.tsx
  - Frontend2/components/project-detail/board-toolbar.tsx
  - Frontend2/components/project-detail/calendar-view.tsx
  - Frontend2/components/project-detail/lifecycle-stub-tab.tsx
  - Frontend2/components/project-detail/list-tab.tsx
  - Frontend2/components/project-detail/members-tab.tsx
  - Frontend2/components/project-detail/project-detail-context.tsx
  - Frontend2/components/project-detail/project-detail-shell.tsx
  - Frontend2/components/project-detail/settings-columns-subtab.tsx
  - Frontend2/components/project-detail/settings-general-subtab.tsx
  - Frontend2/components/project-detail/settings-tab.tsx
  - Frontend2/components/project-detail/timeline-tab.tsx
  - Frontend2/components/task-detail/activity-section.tsx
  - Frontend2/components/task-detail/attachments-section.tsx
  - Frontend2/components/task-detail/comments-section.tsx
  - Frontend2/components/task-detail/dependencies-section.tsx
  - Frontend2/components/task-detail/description-editor-rich.tsx
  - Frontend2/components/task-detail/description-editor.tsx
  - Frontend2/components/task-detail/description-toolbar.tsx
  - Frontend2/components/task-detail/history-section.tsx
  - Frontend2/components/task-detail/inline-edit.tsx
  - Frontend2/components/task-detail/parent-task-link.tsx
  - Frontend2/components/task-detail/phase-stepper.tsx
  - Frontend2/components/task-detail/properties-sidebar.tsx
  - Frontend2/components/task-detail/sub-tasks-list.tsx
  - Frontend2/components/task-detail/watcher-toggle.tsx
  - Frontend2/components/task-modal/task-create-modal.tsx
  - Frontend2/components/task-modal/task-modal-provider.tsx
  - Frontend2/context/task-modal-context.tsx
  - Frontend2/hooks/use-backlog.ts
  - Frontend2/hooks/use-labels.ts
  - Frontend2/hooks/use-my-tasks-store.ts
  - Frontend2/hooks/use-task-detail.ts
  - Frontend2/hooks/use-tasks.ts
  - Frontend2/hooks/use-watchers.ts
  - Frontend2/lib/audit-formatter.ts
  - Frontend2/lib/dnd/board-dnd.ts
  - Frontend2/lib/dnd/dnd-provider.tsx
  - Frontend2/lib/methodology-matrix.ts
  - Frontend2/lib/my-tasks/due-bucket.ts
  - Frontend2/lib/my-tasks/smart-sort.ts
  - Frontend2/services/attachment-service.ts
  - Frontend2/services/comment-service.ts
  - Frontend2/services/label-service.ts
  - Frontend2/services/project-service.ts
  - Frontend2/services/task-service.ts
findings:
  critical: 2
  warning: 9
  info: 8
  total: 19
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 81
**Status:** issues_found

## Summary

Phase 11 delivers the Backend labels vertical slice (Domain / Application / Infrastructure / API) and the full Frontend2 task-features surface (project detail 8-tab shell, board + backlog cross-container DnD, task detail sections, my-tasks experience, header shell).

**Positive findings:**
- Labels backend slice is exemplary Clean Architecture: `manage_labels.py` has zero infrastructure imports, `ILabelRepository` is a pure ABC in the Domain layer, the router correctly enforces membership via path-param `get_project_member` for GET and body-scoped `_is_admin`/`get_by_id_and_user` for POST (T-11-03-01 / T-11-03-02 IDOR mitigations in place).
- XSS surface in comments is deliberately stripped to plain text (`stripHtml`) with documented upgrade path; TipTap editor is loaded through `dynamic({ ssr: false })` + `immediatelyRender: false`, correctly handling the SSR boundary.
- localStorage reads are hydration-safe in most places: `useMyTasksStore`, `DescriptionEditor.readStoredMode`, `BacklogPanel.useBacklogOpenState` all hydrate via `useEffect` after mount.
- `board-dnd.ts` is pure/testable; the `__backlog__` sentinel correctly propagates through `handleBoardDragEnd` so cross-container drops produce `moved: true` and trigger the backlog cache invalidation in `ProjectDetailShell.handleDropped`.

**Primary concerns:**
- One CRITICAL pre-existing Clean Architecture violation surfaced in the changed files (`manage_board_columns.py`), plus one CRITICAL stored-XSS vector in the comment mention path.
- Multiple WARNING-level hydration / cleanup / stale-state bugs in the new Frontend2 code that will trigger React's hydration warnings or leak timers.

## Critical Issues

### CR-01: Clean Architecture violation — SQLAlchemy + Infrastructure imports inside Application layer

**File:** `Backend/app/application/use_cases/manage_board_columns.py:92-94`
**Issue:** `DeleteColumnUseCase.execute` runs runtime imports of `sqlalchemy.update`, `app.infrastructure.database.models.task.TaskModel`, and `app.infrastructure.database.repositories.board_column_repo.SqlAlchemyBoardColumnRepository`, then performs a raw SQL UPDATE via `self.column_repo.session.execute(stmt)` and manually commits. This directly violates CLAUDE.md §4.2 DIP: "The application folder must NEVER contain `import sqlalchemy` or `import app.infrastructure`." It also breaks LSP: the use case `isinstance()`-checks the concrete `SqlAlchemyBoardColumnRepository`, so any alternate implementation (e.g. `InMemoryBoardColumnRepository` for testing) silently skips the task-reassignment step.

**Fix:** Add a repository-level method for the bulk move operation and call it through the abstraction:

```python
# app/domain/repositories/board_column_repository.py
class IBoardColumnRepository(ABC):
    ...
    @abstractmethod
    async def reassign_tasks(self, from_column_id: int, to_column_id: int) -> int:
        """Move all non-deleted tasks from one column to another. Returns rows updated."""
        ...

# app/infrastructure/database/repositories/board_column_repo.py
class SqlAlchemyBoardColumnRepository(IBoardColumnRepository):
    async def reassign_tasks(self, from_column_id: int, to_column_id: int) -> int:
        from sqlalchemy import update
        from app.infrastructure.database.models.task import TaskModel
        stmt = (
            update(TaskModel)
            .where(TaskModel.column_id == from_column_id, TaskModel.is_deleted == False)
            .values(column_id=to_column_id)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount

# app/application/use_cases/manage_board_columns.py (Application layer — zero framework imports)
class DeleteColumnUseCase:
    async def execute(self, column_id: int, move_to_column_id: int) -> None:
        existing = await self.column_repo.get_by_id(column_id)
        if existing is None:
            raise ValueError(f"Column {column_id} not found")
        target = await self.column_repo.get_by_id(move_to_column_id)
        if target is None:
            raise ValueError(f"Target column {move_to_column_id} not found")
        await self.column_repo.reassign_tasks(column_id, move_to_column_id)
        await self.column_repo.delete(column_id)
```

### CR-02: Stored-XSS via `@mention` HTML injection in comments composer

**File:** `Frontend2/components/task-detail/comments-section.tsx:131-140`
**Issue:** `insertMention` builds a mention token via raw string concatenation:
```ts
const token = `<span class="mention" data-user-id="${m.id}">@${m.name}</span> `
```
Neither `m.name` nor `m.id` is escaped. The token is then written into `body` state and POSTed to the backend verbatim as the comment body. Phase 11's render path strips all tags via `stripHtml(c.body)`, so the XSS does not fire in THIS UI — but the unescaped HTML is persisted to the `comments.body` column. Any future renderer that opts into richer HTML (the documented DOMPurify upgrade, an email notification digest, mobile clients, a report export) will execute stored scripts. A project member named `<img src=x onerror=alert(1)>` (or one who renames themselves to that value where permitted) would inject an attribute-boundary break in the very next comment someone else composes.

This is the classic stored-XSS "poison the database, exploit later" pattern. The mitigation comment on line 10-11 calling strip-on-render "the" XSS fix is misleading — it only mitigates the read path, not the write path.

**Fix:** Escape `m.name` (and any future user-controlled values) before building the mention token, and prefer a DOM-safe attribute (e.g. textContent) over string concatenation:

```ts
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function insertMention(m: Member) {
  const caret = textareaRef.current?.selectionStart ?? body.length
  const before = body.slice(0, caret)
  const atIdx = before.lastIndexOf("@")
  if (atIdx < 0) return
  const safeId = Number.isFinite(m.id) ? String(m.id) : "0"
  const safeName = escapeHtml(m.name)
  const token = `<span class="mention" data-user-id="${safeId}">@${safeName}</span> `
  const next = before.slice(0, atIdx) + token + body.slice(caret)
  setBody(next)
  setMentionOpen(false)
}
```

Better yet, store mentions as a structured reference (e.g. `@[user:42]`) and resolve names at render time — sidesteps the HTML-in-storage problem entirely.

## Warnings

### WR-01: SSR/CSR hydration mismatch in `ProjectDetailProvider`

**File:** `Frontend2/components/project-detail/project-detail-context.tsx:66-68`
**Issue:** `densityMode` state uses a lazy initializer that reads localStorage directly: `React.useState<DensityMode>(() => loadDensity(projectId))`. During SSR `loadDensity` returns `"rich"` (the `typeof window === "undefined"` guard), but on CSR hydration it returns whatever was persisted. If the user previously chose `"compact"`, the server renders with `"rich"` and the client hydrates with `"compact"` — React will emit a hydration mismatch warning and may mis-apply event handlers. This is the exact pattern the peer hooks (`useMyTasksStore`, `DescriptionEditor`, `useBacklogOpenState`) fix by deferring to `useEffect`.

**Fix:** Hydrate in `useEffect` after mount, identical to the peer hooks:

```tsx
const [densityMode, setDensityModeState] = React.useState<DensityMode>("rich")
React.useEffect(() => {
  setDensityModeState(loadDensity(projectId))
}, [projectId])
```

### WR-02: Non-passive wheel listener on React synthetic event does not reliably `preventDefault`

**File:** `Frontend2/components/project-detail/calendar-view.tsx:132-140, 262`
**Issue:** `handleWheel` is attached via React's `onWheel`. Since Chrome 73+ and React 17+, wheel events on the document root/body are registered as passive by default, and React's synthetic event delegation also attaches listeners as passive. Calling `e.preventDefault()` inside a passive listener is a no-op that emits a console warning: `[Intervention] Unable to preventDefault inside passive event listener due to target being treated as passive.` On Ctrl+wheel the browser zoom may fight the component's intended zoom.

**Fix:** Attach a native non-passive listener via `useEffect`:

```tsx
const gridRef = React.useRef<HTMLDivElement | null>(null)
React.useEffect(() => {
  const el = gridRef.current
  if (!el) return
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    setCellHeight((prev) => {
      const next = Math.min(MAX_CELL, Math.max(MIN_CELL, prev + e.deltaY * ZOOM_STEP))
      return Math.round(next)
    })
  }
  el.addEventListener("wheel", onWheel, { passive: false })
  return () => el.removeEventListener("wheel", onWheel)
}, [])
// ...
<div ref={gridRef} data-calendar-grid /* ... */>
```

### WR-03: `onBlur` `setTimeout` in search-autocomplete leaks on rapid unmount

**File:** `Frontend2/components/header/search-autocomplete.tsx:175`
**Issue:** `onBlur={() => setTimeout(() => setOpen(false), 150)}` schedules a state update 150ms later without tracking the timer id. If the component unmounts during that window (route change while the input has focus), React logs: `Can't perform a React state update on an unmounted component`. It's also a minor memory leak.

**Fix:** Track the timer in a ref and clear on unmount:

```tsx
const blurTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
React.useEffect(() => {
  return () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
  }
}, [])
// ...
onBlur={() => {
  if (blurTimer.current) clearTimeout(blurTimer.current)
  blurTimer.current = setTimeout(() => setOpen(false), 150)
}}
```

### WR-04: `useBacklogOpenState` resize listener fires on every render of mounting component

**File:** `Frontend2/components/project-detail/backlog-panel.tsx:107-113`
**Issue:** The resize useEffect has `[]` deps — correct. But `setNarrow` is called inside `onResize()` and once on mount: on narrow viewports the initial setState happens AFTER the first paint, causing one visible "flash" where the panel renders open before collapsing. Not a memory leak, but a visible UX glitch. More importantly: `window.innerWidth` can be read on mount but it's in an effect, so there's a one-frame lag between SSR render and the narrow computation.

**Fix:** Move the initial narrow check into a `useState` lazy initializer guarded by `typeof window`, keeping the effect only for subsequent resizes:

```tsx
const [narrow, setNarrow] = React.useState<boolean>(() => {
  if (typeof window === "undefined") return false
  return window.innerWidth < 1280
})
React.useEffect(() => {
  if (typeof window === "undefined") return
  const onResize = () => setNarrow(window.innerWidth < 1280)
  window.addEventListener("resize", onResize)
  return () => window.removeEventListener("resize", onResize)
}, [])
```

(Same SSR-hydration concern as WR-01 applies; the current code's post-mount-only computation is arguably safer for hydration, so this fix is optional — pick one lane.)

### WR-05: `description-toolbar.tsx` prompts accept arbitrary URLs without scheme validation

**File:** `Frontend2/components/task-detail/description-toolbar.tsx:180-197`
**Issue:** Both the Link (`editor.chain().focus().setLink({ href: url }).run()`) and Image (`editor.chain().focus().setImage({ src: url }).run()`) handlers accept raw `window.prompt()` input and pass it straight to TipTap. StarterKit's link extension DOES sanitize a default allow-list (`http`, `https`, `mailto`, `ftp`), but the `Image` extension does NOT — a user could paste `javascript:alert(1)` as an Image URL and get stored in the description. Even though Phase 11 renders the description through TipTap's own parser (which may re-sanitize on read), never trust a client-side filter; the HTML is also exposed through PATCH /tasks/{id}.

**Fix:** Validate scheme before invoking the TipTap command:

```tsx
const ALLOWED_URL_SCHEMES = /^(https?|mailto|ftp):/i
const ALLOWED_IMAGE_SCHEMES = /^(https?|data:image\/(png|jpeg|jpg|gif|webp);base64,):/i

onClick={() => {
  const url = typeof window !== "undefined" ? window.prompt("URL:") : null
  if (!url) {
    if (url === "") editor.chain().focus().unsetLink().run()
    return
  }
  if (!ALLOWED_URL_SCHEMES.test(url)) return  // silently reject
  editor.chain().focus().setLink({ href: url }).run()
}}
```

And consider explicit DOMPurify on the HTML coming back from the server before `editor.commands.setContent()`.

### WR-06: `useEffect` infinite-loop risk disabled via `eslint-disable` in `description-editor-rich.tsx`

**File:** `Frontend2/components/task-detail/description-editor-rich.tsx:56-63`
**Issue:** The sync effect `React.useEffect(() => { ... }, [value, editor])` with `eslint-disable-next-line react-hooks/exhaustive-deps` is suspicious. `editor.commands.setContent(value || "", { emitUpdate: false })` only runs when `value !== editor.getHTML()` — OK. But if parent's `value` prop is produced from the query cache and gets a new string identity on every parent render (even when content is identical), this effect will call `setContent` repeatedly at first paint. The `value !== current` guard uses string equality, which is correct — but if the TipTap editor internally normalises whitespace/tags, `editor.getHTML()` may differ from the prop even when semantically identical, causing silent infinite re-sets. Worth verifying under load.

**Fix:** Keep the guard but also avoid the ESLint suppression:

```tsx
React.useEffect(() => {
  if (!editor) return
  const current = editor.getHTML()
  // Guard: prop-vs-editor equality AND editor not focused (avoid snatching focus mid-edit)
  if (value !== current && !editor.isFocused) {
    editor.commands.setContent(value || "", { emitUpdate: false })
  }
}, [value, editor])
```

### WR-07: `settings-general-subtab.tsx` PATCH may send `start_date: null` while Project requires a start

**File:** `Frontend2/components/project-detail/settings-general-subtab.tsx:187-197`
**Issue:** `onBlurDates` normalises empty strings to `null` and PATCHes `{ start_date: null, end_date: null }`. But `app/domain/entities/project.py:93` has `start_date: datetime` as REQUIRED. A user who clears the Start Date input will send `start_date: null` → backend rejects with 422 or (worse, if PATCH is lenient) corrupts the project record. No toast context shows the user what happened.

**Fix:** Guard against clearing required fields:

```tsx
function onBlurDates() {
  const newStart = startDate || null
  const newEnd = endDate || null
  if (!newStart) {
    showToast({
      variant: "error",
      message: lang === "tr" ? "Başlangıç tarihi zorunlu" : "Start date is required",
    })
    setStartDate(project.startDate)  // roll back local state
    return
  }
  const cur = { start: project.startDate ?? null, end: project.endDate ?? null }
  if (newStart !== cur.start || newEnd !== cur.end) {
    patchProject({ start_date: newStart, end_date: newEnd })
  }
}
```

### WR-08: React Query invalidation in `useMoveTask` does not invalidate single-task cache, causing stale data in Properties sidebar

**File:** `Frontend2/hooks/use-tasks.ts:66-87`
**Issue:** `useMoveTask.onSettled` only invalidates `["tasks", "project", projectId]`. The task detail page caches at `["tasks", taskId]` (via `useTaskDetail`). After a drag from `todo` → `progress` on the board, the Properties sidebar on the SAME task's detail page keeps showing `status: "todo"` until the next refetch — the optimistic path in `useUpdateTask` is separate. Additionally, the shell's `handleDropped` invalidates `["tasks", "backlog", project.id]` but not `["tasks", taskId]`. Users who have the Task Detail tab open in another browser tab would observe stale status.

**Fix:** Invalidate the single-task key too:

```tsx
export function useMoveTask(projectId: number) {
  // ...
  return useMutation({
    // ...
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      qc.invalidateQueries({ queryKey: ["tasks", vars.id] })
    },
  })
}
```

### WR-09: `TaskModalProvider` is exported twice from different modules — footgun for import path drift

**File:** `Frontend2/components/task-modal/task-modal-provider.tsx:16` vs `Frontend2/context/task-modal-context.tsx:25`
**Issue:** Two modules export a symbol named `TaskModalProvider`:
- `context/task-modal-context.tsx` — the actual context provider (owns state, `useMemo` value)
- `components/task-modal/task-modal-provider.tsx` — a composite that wraps the above AND renders `<TaskCreateModal />`

Importers who write `import { TaskModalProvider } from "@/context/task-modal-context"` get the context-only provider and NO modal DOM, silently breaking `openTaskModal()`. The shell currently imports from the composite correctly (`app/(shell)/layout.tsx:6`), but a future refactor or a new route group copying `layout.tsx` may grab the wrong one.

**Fix:** Rename to disambiguate:

```tsx
// context/task-modal-context.tsx
export function TaskModalContextProvider({ children }: { children: React.ReactNode }) { ... }

// components/task-modal/task-modal-provider.tsx  (keep the public name here — this is the one
// app code should import)
import { TaskModalContextProvider } from "@/context/task-modal-context"
export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <TaskModalContextProvider>
      {children}
      <TaskCreateModal />
    </TaskModalContextProvider>
  )
}
```

## Info

### IN-01: Emoji used as icons in `dashboard/page.tsx`

**File:** `Frontend2/app/(shell)/dashboard/page.tsx:141, 148, 155, 173`
**Issue:** Inline emoji (`📋`, `✓`, `🏆`, `📌`) used as StatCard icons instead of lucide-react icons used elsewhere. Inconsistent with the project's established icon convention, rendering varies by OS/font. Also CLAUDE.md prompt/convention note says "only use emojis if the user explicitly requests it" — the app uses lucide for all other surfaces.
**Fix:** Replace with lucide equivalents (e.g. `<Folder size={14}/>`, `<CheckCircle/>`, `<Trophy/>`, `<Pin/>`).

### IN-02: `stripHtml` is a naive regex, not a sanitizer

**File:** `Frontend2/components/task-detail/comments-section.tsx:36-39`
**Issue:** `s.replace(/<[^>]*>/g, "")` doesn't handle HTML comments, CDATA sections, or malformed tags like `<img src=x onerror=alert(1) `. For the CURRENT render path it's adequate because React escapes the resulting text node, but the naming oversells the guarantee. Downgraded from WARN because the actual output is text-content-inserted via React, not `dangerouslySetInnerHTML`.
**Fix:** Rename to `stripTagsNaive` or `toPlainText` to match the contract.

### IN-03: `timeline-tab.tsx` spreads large arrays into `Math.min` / `Math.max`

**File:** `Frontend2/components/project-detail/timeline-tab.tsx:78-79`
**Issue:** `Math.min(...starts)` / `Math.max(...ends)` with 100k+ tasks would hit the argument-count limit (~65535 in V8) and silently return `Infinity` / `NaN`. Not a realistic scenario for a project tracker (dozens to low thousands of tasks per project), but worth noting.
**Fix:** `starts.reduce((a, b) => Math.min(a, b), Infinity)` for correctness at any size.

### IN-04: Unused props `_hideRightRail` / `_hideQuickAdd` kept for API compatibility

**File:** `Frontend2/components/my-tasks/my-tasks-experience.tsx:49-50`
**Issue:** Two destructured props are prefixed `_` to indicate "intentionally unused" but still appear in the public interface. New callers could pass them expecting behavior. The JSDoc `Reserved for full-page right rail (deferred)` helps but could be a lint warning.
**Fix:** Remove from the interface entirely until the feature lands; or add a runtime `if (hideRightRail) console.warn(...)`.

### IN-05: `project.startDate` typed as `string` but Pydantic backend uses `datetime`

**File:** `Frontend2/services/project-service.ts:3-20` vs `Backend/app/domain/entities/project.py:93`
**Issue:** `Project.startDate` is typed as `string` client-side, `datetime` server-side. The API transport is ISO-8601, so this works, but the client mapping has no Date coercion — downstream consumers in Settings General and Timeline must parse it manually (they do). Consider a wrapper type `ISOString` or convert to Date at the service boundary.
**Fix:** Purely a type-hygiene improvement; no runtime bug.

### IN-06: `search-autocomplete.tsx` fetches all projects unconditionally on every keystroke (cached)

**File:** `Frontend2/components/header/search-autocomplete.tsx:51`
**Issue:** `const { data: allProjects = [] } = useProjects()` runs on every shell page to power client-side project search. The cache share with `AppShell` makes this free when on `/projects/{id}` (same key), but when on `/dashboard` / `/my-tasks` / etc. it doubles the project list fetch. `AppShell`'s recent fix (FL-03, shell-conditional fetch) is partially undone here.
**Fix:** Gate `useProjects()` on `debounced.trim().length >= 2` to only populate when the user starts typing.

### IN-07: `dueBucket` treats `"later"` as catch-all beyond 7 days

**File:** `Frontend2/lib/my-tasks/due-bucket.ts:32`
**Issue:** Tasks due in 10 years fall into `"later"` alongside tasks due in 8 days — not a bug per the spec, but "later" grouping becomes less useful for users with long backlogs.
**Fix:** (Suggestion only) add a `"month_plus"` bucket for due > 30 days.

### IN-08: `dashboard/page.tsx` normalises activity items but does not validate timestamp format

**File:** `Frontend2/app/(shell)/dashboard/page.tsx:49-69`
**Issue:** `timestamp: asString(item.timestamp) || asString(item.created_at)` returns `""` when backend sends a non-string timestamp, and `""` passed to `new Date("")` yields `Invalid Date` in downstream `relativeTime` calls. The activity feed currently handles this with a catch, but a stricter validator (return null and skip the entry) would be more defensible.
**Fix:** After normalisation, drop entries whose timestamp doesn't parse: `.filter(it => !Number.isNaN(new Date(it.timestamp).getTime()))`.

---

_Reviewed: 2026-04-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

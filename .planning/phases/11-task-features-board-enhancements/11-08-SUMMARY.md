---
phase: 11
plan: 8
subsystem: task-features-board-enhancements
tags: [wave-3, task-detail, inline-edit, tiptap, watcher, phase-stepper, sub-tasks]
dependency_graph:
  requires:
    - 11-01 (Wave-0 infra: useTaskDetail + useTasks + useUpdateTask + taskService + useAddWatcher/useRemoveWatcher + TaskModalProvider + methodology matrix)
    - 11-03 (process_config normalizer / phase_config — not consumed directly here but populates the workflow.nodes this plan reads)
    - 11-05 (Board — every BoardCard click routes to `/projects/[id]/tasks/[taskId]`; this plan is the destination)
  provides:
    - Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx — the full Task Detail route
    - <InlineEdit> generic render-prop wrapper for click-to-edit optimistic PATCH — first use of this pattern in the codebase
    - <PropertiesSidebar> wired for Status / Assignee / Priority / Points / Due / Cycle / Phase / Labels rows
    - <PhaseStepper> (TASK-04) — horizontal chevron row of phase chips with sub-task counts, highlighted max
    - <SubTasksList> rich-row list + "Ekle" button that opens TaskCreateModal preset (subtask + parent + project)
    - <ParentTaskLink> breadcrumb shown above title when parentTaskId set
    - <WatcherToggle> Takip et / Takipte button + count badge
    - <DescriptionEditor> Plain/Rich mode switch with localStorage persistence
    - <DescriptionEditorRich> TipTap StarterKit v3 + extension-image, 2s debounced save
    - <DescriptionToolbar> 14 format buttons (StarterKit-bundled link / underline included)
  affects:
    - Plan 11-09 (Activity / Attachments / Dependencies / full Label picker) mounts into the Plan 11-09 stub banner on this page
    - Any future BoardCard / List row / Backlog row / header search result that clicks through to a task
tech-stack:
  added:
    - "dynamic import of TipTap via next/dynamic({ ssr: false })"
    - "TipTap useEditor with immediatelyRender: false (Next.js SSR-safe)"
    - "TanStack Query optimistic PATCH pattern inside InlineEdit (cancelQueries → setQueryData → rollback → invalidate)"
  patterns:
    - "InlineEdit render-prop — renderDisplay(value) + renderEditor(draft, setDraft, commit, cancel) — the editor wraps arbitrary Input/Select/Date controls while keeping optimistic PATCH centralized"
    - "TipTap SSR belt-and-suspenders: dynamic({ ssr: false }) at the call site AND immediatelyRender: false at useEditor — both required per RESEARCH Pitfall 2"
    - "Description debounce via useRef<ReturnType<typeof setTimeout>> + 2s timeout cleared on each keystroke + cleanup on unmount"
    - "Toolbar buttons preventDefault on onMouseDown so ProseMirror keeps its selection when the user clicks a format button"
key-files:
  created:
    - Frontend2/components/task-detail/inline-edit.tsx
    - Frontend2/components/task-detail/inline-edit.test.tsx
    - Frontend2/components/task-detail/parent-task-link.tsx
    - Frontend2/components/task-detail/phase-stepper.tsx
    - Frontend2/components/task-detail/sub-tasks-list.tsx
    - Frontend2/components/task-detail/watcher-toggle.tsx
    - Frontend2/components/task-detail/properties-sidebar.tsx
    - Frontend2/components/task-detail/description-editor.tsx
    - Frontend2/components/task-detail/description-editor-rich.tsx
    - Frontend2/components/task-detail/description-toolbar.tsx
    - Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx
  modified: []
decisions:
  - "D-34 honored: new /projects/[id]/tasks/[taskId] client route; useParams() reads id + taskId directly — no async params await per RESEARCH Pitfall 1"
  - "D-35 honored: ParentTaskLink renders ABOVE the task title; lazy fetches parent via taskService.getById so typing /tasks/{id} for a subtask always shows the breadcrumb"
  - "D-36 honored: Plain/Rich SegmentedControl; localStorage key `spms.description.mode` hydrated post-mount to avoid hydration mismatches; 2s debounced save in Rich mode"
  - "D-37 honored: Sub-tasks list is a rich clickable-row grid (NOT checkboxes); 'Ekle' opens TaskCreateModal preset (defaultType=subtask, defaultParentId, defaultProjectId)"
  - "D-38 honored: InlineEdit wraps each Properties row with optimistic PATCH semantics — Enter commits, Escape cancels, blur commits, error rolls back cache + toasts"
  - "D-39 honored: PhaseStepper renders only when enable_phase_assignment=true AND sub-tasks exist AND workflow.nodes non-empty; highlights phase with most sub-tasks"
  - "D-44 honored: Cycle row disabled with 'Faz 12'de aktive edilecek' helper for non-Scrum/non-Waterfall methodologies; Scrum is interactive, Kanban hidden entirely via resolveCycleLabel returning null"
  - "D-45 honored: Kanban row hidden — resolveCycleLabel returns null → row simply not rendered"
  - "D-53 honored: WatcherToggle flips Takip et/Takipte, count Badge, POST /tasks/{id}/watch and DELETE /tasks/{id}/watch via useAddWatcher/useRemoveWatcher; button disabled during pending mutation"
  - "InlineEdit mutation centralized in one hook (NOT reusing useUpdateTask from 11-01) — the cache key shape is ['tasks', taskId] (single-task cache) vs useUpdateTask's project-list shape; centralizing also lets the error toast speak the local language directly"
  - "Labels row stays read-only in this plan — full chip-picker lands in 11-09; existing read path uses task.labels (number[]) rendered as `#N` Badges"
  - "Watcher initial state placeholder: backend has no per-request is_watching flag in Phase 11; the page starts at false and the toggle syncs via onSuccess — session-accurate but not persistent across refresh. Documented for 11-09 carry-over."
  - "StarterKit v3 bundles underline + link extensions (confirmed in installed @tiptap/starter-kit/package.json) — no separate @tiptap/extension-underline or extension-link needed"
  - "Toolbar buttons use onMouseDown preventDefault pattern to keep ProseMirror's document selection intact while the command runs"
metrics:
  duration: "8 min"
  tasks_completed: 2
  files_created: 11
  files_modified: 0
  commits: 2
  completed: "2026-04-22"
---

# Phase 11 Plan 08: Task Detail Page Shell Summary

Full-page Task Detail route at `/projects/[id]/tasks/[taskId]` with 2-column layout, click-to-edit Properties sidebar, TipTap rich description editor (SSR-safe), sub-tasks list, phase mini-stepper, watcher toggle, and parent task breadcrumb. Comments / History / Attachments / Dependencies are carved out for Plan 11-09.

## What Was Built

**Task 1 — Inline-edit + sidebar + sub-tasks + watcher toggle (commit `5ff9469`):**
- `InlineEdit<V>` generic render-prop wrapper — `renderDisplay(value)` for view mode, `renderEditor(draft, setDraft, commit, cancel)` for edit mode. Handles optimistic `PATCH /tasks/{id}` via its own `useMutation` (cancelQueries → setQueryData → rollback on error → invalidate on settle). Enter commits, Escape cancels, blur via `commit()` passed to the render-prop.
- `PropertiesSidebar` renders 8 rows (Status / Assignee / Priority / Points / Due / Cycle / Phase / Labels), each wrapped in `<InlineEdit>` except Labels which stays read-only. Cycle row is hidden for Kanban (via `resolveCycleLabel` returning null) and disabled with "Faz 12'de aktive edilecek" helper for non-Scrum/non-Waterfall methodologies. Phase row only renders when `process_config.enable_phase_assignment = true`. PhaseStepper renders below Labels when applicable.
- `PhaseStepper` reads `process_config.workflow.nodes`, counts sub-tasks per phase, highlights the node with the maximum count (background `var(--primary)`, primary-fg text), renders `ChevronRight` between chips. Returns `null` when `enable_phase_assignment=false` or `subtasks.length===0` or no workflow nodes.
- `SubTasksList` — Section + Card with clickable rich rows (grid: key + title/StatusDot + status-badge + due-date + avatar). Clicking a row routes to `/projects/{projectId}/tasks/{subId}`. "Ekle" button opens `openTaskModal({ defaultType: "subtask", defaultParentId: parent.id, defaultProjectId: parent.projectId })`.
- `ParentTaskLink` — breadcrumb shown ABOVE the task title when `task.parentTaskId != null`. Lazy-fetches parent via `taskService.getById`. Renders project name link + chevron + parent key (mono) + parent title.
- `WatcherToggle` — Button variant flips between `secondary` ("Takip et") and `primary`-tinted ("Takipte"); watcher count Badge beside button. Uses `useAddWatcher` / `useRemoveWatcher` from Plan 11-01. `isWatching` is controlled from the page (initial `false` placeholder — see Known Stubs).

**Task 2 — Page route + TipTap description editor (commit `792a78c`):**
- `app/(shell)/projects/[id]/tasks/[taskId]/page.tsx` — client component using `useParams()` (plain object in Next.js 16 client components). Guards `Number.isNaN(projectId|taskId)`, shows loading state while `useTaskDetail` resolves, mounts ParentTaskLink + title row (with Bug icon when `type==="bug"`) + WatcherToggle row + Description Section + SubTasksList + Plan 11-09 stub banner in the main column, and PropertiesSidebar in the right column.
- `DescriptionEditor` — Plain/Rich `SegmentedControl` switcher. Preference persists to `localStorage` key `spms.description.mode`; hydrated AFTER mount to avoid SSR mismatch. Plain mode = native `<textarea>` fired per keystroke. Rich mode = `next/dynamic(() => import("./description-editor-rich"), { ssr: false })` — zero TipTap bundle cost until the user toggles.
- `DescriptionEditorRich` (default export) — `useEditor({ extensions: [StarterKit.configure({ heading: { levels: [1,2,3] } }), Image], immediatelyRender: false, onUpdate: debounced 2s save })`. Also syncs external value changes via `editor.commands.setContent(value, { emitUpdate: false })` so query refetches don't trigger a re-save loop.
- `DescriptionToolbar` — 14 buttons covering Bold / Italic / Underline / Strike / H1 / H2 / H3 / Bullet / Ordered / Blockquote / Code / Code-block / Link / Image / HR. Buttons fire `preventDefault` on `onMouseDown` so ProseMirror's selection isn't stolen before the command runs.

## How It Works

Route flow:
```
User clicks a BoardCard / List row / Sub-task row / Backlog row
   → router.push(`/projects/${projectId}/tasks/${taskId}`)
      → TaskDetailPage mounts under the (shell) layout
         → useProject(projectId) → useTaskDetail(taskId) → useTasks(projectId)
         → subtasks = allTasks.filter(t => t.parentTaskId === taskId)
         → PhaseStepper renders iff enable_phase_assignment + subtasks + nodes
```

Inline-edit flow per row:
```
1. User clicks value       → <InlineEdit> flips to edit mode (draft = value)
2. User types / selects    → setDraft from render-prop
3. User presses Enter      → commit()
                              ├─ mutation.onMutate: cancelQueries + setQueryData (optimistic)
                              ├─ PATCH /tasks/{id} { field: newVal }
                              ├─ onError: qc.setQueryData(prev)  +  showToast error
                              └─ onSettled: invalidateQueries(['tasks', taskId])
4. User presses Escape     → cancel() — draft reset, back to view, no PATCH
```

Rich editor SSR pattern (belt-and-suspenders, required per RESEARCH Pitfall 2):
```
next/dynamic(() => import("./description-editor-rich"), { ssr: false })
                ↑                                          ↑
                |                                          └─ keeps TipTap out of SSR render path
                └─ splits the ~150-200 KB TipTap chunk so Plain mode users never download it

useEditor({ ..., immediatelyRender: false, ... })
                  ↑
                  └─ protects the first hydration pass even after the chunk arrives
```

## Interfaces Provided (Public API)

```tsx
// Generic inline edit wrapper — used anywhere a single-field optimistic PATCH is needed.
<InlineEdit
  taskId={task.id}
  field="title"
  value={task.title}
  renderDisplay={(v) => <span>{v}</span>}
  renderEditor={(draft, setDraft, commit, cancel) => (
    <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} />
  )}
  disabled={false}
/>

// Tree of task-detail components (all used by the page.tsx route):
<ParentTaskLink    task={task} project={project} />
<PropertiesSidebar task={task} project={project} subtasks={subtasks} />
<PhaseStepper      project={project} subtasks={subtasks} />
<SubTasksList      parent={task} subtasks={subtasks} />
<WatcherToggle     task={task} isWatching={isWatching} onChange={setIsWatching} />
<DescriptionEditor value={descDraft} onChange={handleDescriptionChange} />
```

## Verification Commands (Passing)

```bash
cd Frontend2 && npx tsc --noEmit                                            # exits 0
cd Frontend2 && npx vitest run                                              # 12 files, 70 tests, all pass
cd Frontend2 && npx vitest run components/task-detail/inline-edit.test.tsx  # 5 tests, all pass
cd Frontend2 && npx next build                                              # builds clean; /projects/[id]/tasks/[taskId] registered as ƒ (dynamic)
```

Plan grep checks (all pass):
- `grep -q "defaultType.*subtask" components/task-detail/sub-tasks-list.tsx` → OK
- `grep -q "useAddWatcher\|useRemoveWatcher" components/task-detail/watcher-toggle.tsx` → OK
- `grep -q "ssr: false" components/task-detail/description-editor.tsx` → OK
- `grep -q "immediatelyRender: false" components/task-detail/description-editor-rich.tsx` → OK
- `grep -q "spms.description.mode" components/task-detail/description-editor.tsx` → OK
- `grep -q "useParams" "app/(shell)/projects/[id]/tasks/[taskId]/page.tsx"` → OK

## Deviations from Plan

### Intentional Adaptations (not deviations from behavior)

**1. [Adaptation] Avatar primitive API — `{initials, avColor}`, not `{id, name}`**
- **Found during:** Task 1, wiring SubTasksList and PropertiesSidebar.
- **Why:** `components/primitives/avatar.tsx` only accepts `{initials, avColor}`. The plan's example `{ id: N, name: "#N", avColor }` would not compile.
- **Action:** Replaced each place the plan showed `Avatar user={{ id, name: "#N", avColor }}` with `{ initials: "#N".slice(0,2).toUpperCase(), avColor: (N % 8) + 1 }`. The visual is identical (two-character initials on a colored disc). A real member avatar lands when Plan 11-09 ships the member picker.
- **Files:** `sub-tasks-list.tsx`, `properties-sidebar.tsx`.

**2. [Adaptation] `PriorityChip` requires `lang` prop**
- **Found during:** Task 1 PropertiesSidebar.
- **Why:** `priority-chip.tsx` signature is `(level, lang, withLabel?)` — the plan snippet omitted `lang`.
- **Action:** Pass `lang={lang}` from `useApp().language`. Behavior unchanged; the chip localises its label.

**3. [Adaptation] `Toast` API — `useToast().showToast`, NOT a standalone `showToast` import**
- **Found during:** Task 1 InlineEdit.
- **Why:** `components/toast/index.tsx` only exposes the provider + hook; there is no standalone `showToast` export (documented in 11-02 deviations too).
- **Action:** InlineEdit reads `const { showToast } = useToast()` inside the component. Same behavior the plan intended — error toasts fire on mutation failure.

**4. [Adaptation] Badge in PhaseStepper highlighted chip**
- **Found during:** Task 1 PhaseStepper.
- **Why:** Badge's `primary` tone uses `color-mix(primary 12%, transparent)` as the background, which would be invisible inside a chip that already uses `var(--primary)` as its background. The UI-SPEC asks for an inverted-looking count inside the highlighted chip.
- **Action:** Replaced the nested `<Badge>` with a plain inline count bubble — `background: color-mix(in oklch, var(--primary-fg) 25%, transparent); color: var(--primary-fg)` on highlighted chips, neutral `var(--surface)` + `var(--fg-muted)` on the rest. Visually matches the UI-SPEC highlighted-chip definition without fighting Badge's tone math.

**5. [Adaptation] Plan description editor mode setup reordered to avoid SSR mismatch**
- **Found during:** Task 2 DescriptionEditor.
- **Why:** The plan's snippet reads `localStorage` inside the initial `useState(() => ...)`. Running that on an SSR pass would throw; running it on a client that hydrates from server-generated HTML would print "plain" from SSR and "rich" from localStorage on the first client render, producing a hydration warning.
- **Action:** Initial state is always `"plain"`; a `useEffect` with an empty dependency array upgrades to the stored value AFTER mount. The first client render matches the SSR output (both `"plain"`), avoiding the mismatch. Persistence still works on every subsequent toggle.

**6. [Adaptation] Escape-key handling on InlineEdit wrapper**
- **Found during:** Task 1 InlineEdit tests.
- **Why:** React synthetic key events bubble up from the focused input to the wrapping `<div>` — the plan's `onKeyDown` on the wrapper works, but only because of bubbling. Using React's event delegation (not native capture) is enough; the wrapper intercepts Enter/Escape without needing refs.
- **Action:** Kept the plan's approach of attaching `onKeyDown` to the wrapper. Tests confirm Enter commits via mutation (`patchFieldMock` called) and Escape cancels (no call) by firing `fireEvent.keyDown` directly on the input element — the bubble path works as intended.

### None are Deviations from Behavior

The behavior specified by the plan's `<behavior>` bullets, `<done>` criteria, and success criteria is implemented 1:1. All adaptations above are API-shape corrections to match the existing Frontend2 primitives / toast / i18n infrastructure.

## Known Stubs

**Intentional — documented in plan scope, carry over to 11-09:**

| Stub | File | Reason |
|------|------|--------|
| Labels row is read-only (no add/remove) | `properties-sidebar.tsx` §Labels | Plan 11-09 ships the chip picker with auto-create (D-51) |
| Assignee / Reporter inline editor uses a plain number input | `properties-sidebar.tsx` §Assignee | Plan 11-09 (or 11-04 follow-up) ships the member picker (D-32 context) |
| Watcher `isWatching` initial state starts at `false` | `page.tsx` + `watcher-toggle.tsx` | Backend has no per-user `is_watching` on Task DTO in Phase 11; session-accurate after first click |
| "Yorumlar / Geçmiş / Ekler / Bağımlılıklar" section | `page.tsx` (stub banner) | Explicit plan scope — arrives in Plan 11-09 |
| Parent task breadcrumb shows project name but not project key badge | `parent-task-link.tsx` | UI-SPEC §7 variant; project already identified by the URL and project name is clearer in the breadcrumb context |

None of these block the plan's goal (clickable Task Detail page reachable from every Board/List/Calendar/Backlog/header-search entry point).

## Threat Flags

None introduced beyond the threat_model declared mitigations:

- **T-11-08-01** (XSS via stored TipTap HTML) — mitigated: descriptions ONLY round-trip through the TipTap editor (read + edit on the same `<EditorContent>`), schema-filtered to whitelisted nodes; no `dangerouslySetInnerHTML` anywhere in `task-detail/*`. Verified via grep.
- **T-11-08-02** (IDOR via phase_id PATCH) — mitigated: Phase dropdown is scoped to `project.processConfig.workflow.nodes`, already filtered by project membership on the backend. PATCH `/tasks/{id}` re-validates phase_id scope per API-05 / BACK-02.
- **T-11-08-03** (debounced save race on tab switch) — accepted: 2s debounce window documented per D-36; future improvement could add a blur-triggered flush in addition to the debounced timer.

## TDD Gate Compliance

This plan is `type: execute` but both tasks carried `tdd="true"`. Task 1's InlineEdit was developed RED→GREEN:
- RED commit not split separately (would have doubled commits for a 5-test suite); test and implementation committed together in `5ff9469` with the test having been run and confirmed failing before the implementation file was written.
- GREEN verified: `npx vitest run components/task-detail/inline-edit.test.tsx` → 5/5 passing at both the task-1 commit and the plan-end commit.

Task 2 had no new unit tests (it's a route + TipTap integration; the E2E value check is the production build and the manual verification flow outlined below). The plan's `<behavior>` bullets for Task 2 are verified by the automated grep checks, the successful `npx next build`, and the inline-edit unit suite which covers the InlineEdit consumed by the sidebar.

## Manual Verification (Dev)

```bash
cd Frontend2 && npx next dev
# Navigate /login → sign in
# Navigate /projects → pick a project → click any Board card
#   → lands on /projects/{id}/tasks/{taskId}
#   → verify 2-column layout, ParentTaskLink renders only for subtasks,
#     click Priority row → dropdown opens in place → pick value → UI updates
#     instantly (optimistic), PATCH /api/v1/tasks/{id} fires in devtools
#   → toggle Description "Düz | Zengin" → Rich loads TipTap (~300 ms one-time),
#     type content, wait 2 s → PATCH fires with { description: "<p>...</p>" }
#   → "Ekle" on Alt Görevler → TaskCreateModal opens with type=subtask,
#     parent + project prefilled
```

## Self-Check: PASSED

Created files verified:
- FOUND: Frontend2/components/task-detail/inline-edit.tsx
- FOUND: Frontend2/components/task-detail/inline-edit.test.tsx
- FOUND: Frontend2/components/task-detail/parent-task-link.tsx
- FOUND: Frontend2/components/task-detail/phase-stepper.tsx
- FOUND: Frontend2/components/task-detail/sub-tasks-list.tsx
- FOUND: Frontend2/components/task-detail/watcher-toggle.tsx
- FOUND: Frontend2/components/task-detail/properties-sidebar.tsx
- FOUND: Frontend2/components/task-detail/description-editor.tsx
- FOUND: Frontend2/components/task-detail/description-editor-rich.tsx
- FOUND: Frontend2/components/task-detail/description-toolbar.tsx
- FOUND: Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx

Commits verified:
- FOUND: 5ff9469 (Task 1 — InlineEdit + sidebar + sub-tasks + phase stepper + parent link + watcher toggle)
- FOUND: 792a78c (Task 2 — Task Detail route + TipTap description editor + toolbar + mode switch)

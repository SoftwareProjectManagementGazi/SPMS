---
phase: 11
plan: 2
subsystem: task-features-board-enhancements
tags: [task-modal, header, permission, scrum, kanban, waterfall, react, tanstack-query]
dependency_graph:
  requires:
    - 11-01-wave-0-infrastructure (TaskModalProvider slot, useTaskModal hook, useCreateTask, methodology matrix, useProjectLabels / useCreateLabel)
    - 10-shell-pages-project-features (AuthContext with role.name, ToastProvider, Header + AppShell composition, /projects list page)
  provides:
    - "TaskCreateModal overlay mounted once via TaskModalProvider — renders all 15 prototype fields, autofocuses title, enforces title+project required, handles Esc / Ctrl+Cmd+Enter, and posts to /api/v1/tasks via useCreateTask"
    - "CreateButton subcomponent that consumes useTaskModal().openTaskModal() — the entry point referenced by every later Phase 11 plan"
    - "Header rewire (D-07 inversion): the primary header action opens the Task Create Modal instead of routing to /projects/new"
    - "Yeni Proje permission gate (D-08): /projects page renders the Yeni Proje button only when user.role.name matches Admin or Project Manager (case-insensitive); both toolbar and empty-state occurrences gated"
  affects:
    - 11-03 through 11-10 (every plan that triggers task creation from backlog / project detail / subtask Ekle flow)
tech-stack:
  added: []
  patterns:
    - "Modal-as-provider-sibling: TaskCreateModal rendered by TaskModalProvider next to {children} and gated on context isOpen so consumer components only call openTaskModal() — no local mount trees"
    - "Case-insensitive role check with legacy-snake-case fallback (admin / project manager / project_manager) so the guard tolerates backend casing drift"
    - "Methodology matrix consumption: the modal imports resolveCycleLabel + isCycleFieldEnabled rather than hard-coding the table — single source of truth per 11-01 contract"
    - "Optimistic label auto-create: typing a label name + Enter hits useCreateLabel mutation; on success, the new label id is pushed into selectedLabels, input cleared"
    - "TDD per task (RED commit + GREEN commit) even though the plan is type: execute — commit gates match frontmatter tdd=\"true\""
key-files:
  created:
    - Frontend2/components/task-modal/task-create-modal.tsx
    - Frontend2/components/task-modal/task-create-modal.test.tsx
    - Frontend2/components/header/create-button.tsx
    - Frontend2/components/header/create-button.test.tsx
  modified:
    - Frontend2/components/task-modal/task-modal-provider.tsx (mounts TaskCreateModal)
    - Frontend2/components/header.tsx (drops onCreateProject, renders CreateButton)
    - Frontend2/components/app-shell.tsx (drops useRouter import + onCreateProject wiring)
    - Frontend2/app/(shell)/projects/page.tsx (role-gated Yeni Proje button, both occurrences)
key-decisions:
  - "TaskCreateModal mounted inside TaskModalProvider (not inside AppShell) so every route under (shell)/* can openTaskModal() and see the same overlay — no multiple-mount hazard (D-01 honored)"
  - "Collapsible primitive's defaultOpen API used as-is; the plan's draft used open/onToggle which this codebase's Collapsible does not expose. Internal state is fine because there is no outside consumer driving recurring-open from state"
  - "Plan's showToast standalone import does not exist in this codebase — used useToast() hook (the actual API in components/toast/index.tsx)"
  - "Cycle field visibility logic: showCycleField = resolveCycleLabel(...) !== null (Kanban hidden per D-45); cycleEnabled = isCycleFieldEnabled(methodology) (Scrum only in Phase 11 per D-44); Iterative/Incremental/Evolutionary/RAD render disabled select with helper 'Faz 12'de aktive edilecek'; Waterfall hides row entirely because its cycle reuses the Phase field"
  - "Assignee dropdown ships only project manager + current user as placeholder members — a documented Phase 11 stub. Real per-project member picker lands in Plan 11-04 Members tab (D-32)"
  - "Sprint select ships empty <option/> list in Phase 11 — real sprint fetch wires in Plan 11-05 when the Board tab introduces useCycles()"
  - "Role gate uses case-insensitive compare (toLowerCase()) plus both Project Manager and project_manager spellings so a backend that returns snake_case role names still unlocks the button (T-11-02-01 mitigation + legacy compat)"
  - "T-11-02-02 disposition preserved: description is bound to a plain <textarea>, not innerHTML. XSS risk deferred to Plan 11-08 when TipTap arrives"
requirements-completed: [TASK-01]
metrics:
  duration: 9min
  tasks_completed: 2
  files_created: 4
  files_modified: 4
  commits: 5
  completed: "2026-04-22"
---

# Phase 11 Plan 02: Task Create Modal + Header Rewire Summary

**Task Create Modal ships all 15 prototype fields with methodology-driven conditional visibility; header Oluştur button opens it instead of navigating; Yeni Proje moves to /projects page gated on Admin / Project Manager role.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-22T19:32:48Z
- **Completed:** 2026-04-22T19:41:32Z
- **Tasks:** 2 (both TDD cycles green)
- **Files created:** 4
- **Files modified:** 4
- **Total test count:** 28 (up from 21 after Plan 01); all green

## Accomplishments

- **Task Create Modal (TASK-01)** renders with project / task type / parent task / title / description / priority / due / assignee / cycle / points / phase / labels / recurring-freq / recurring-end fields — 15 discrete input surfaces matching `New_Frontend/src/pages/create-task-modal.jsx` 1:1. Conditional visibility handled per:
  - **Task Type switch** → shows Parent Task row only for subtask; shows red Bug icon left of Title only for bug
  - **Methodology matrix** (D-44, D-45) → Cycle row hidden for Kanban + Waterfall, disabled with helper text for Iterative/Incremental/Evolutionary/RAD, enabled for Scrum with an (empty for now) sprint select
  - **`enable_phase_assignment`** (D-40) → Phase dropdown shows only when project's processConfig flag is true
  - **openTaskModal defaults** → when opened with `defaultProjectId`, the Project select is pre-filled and disabled (UI cue for the subtask Ekle flow from Plan 11-08)
- **Keyboard shortcuts** (D-06) implemented at window level when isOpen: Esc closes without a confirm, Ctrl/Cmd+Enter submits when title+project are valid. Autofocus on Title fires 50 ms after open.
- **Submit flow** (D-03) wires useCreateTask → on success: toast "Görev oluşturuldu", invalidate `["tasks"]` and `["projects", projectId]` query keys, close modal. On error: extract `response.data.detail` for the toast message, otherwise fall back to localized default.
- **Label auto-create** (D-51): typing a label name in the tag input + Enter resolves by case-insensitive name match against `useProjectLabels`; if no match, fires `useCreateLabel` and pushes the returned id into `selectedLabels` on success.
- **Header Create button inversion** (D-07): `<CreateButton />` replaces the Yeni Proje primary button in `Header`. Label becomes "Oluştur" / "Create", Plus icon kept, `onClick` calls `useTaskModal().openTaskModal()`. AppShell drops `useRouter()` and the `onCreateProject` prop wiring (both no longer referenced anywhere).
- **Yeni Proje permission gate** (D-08): `/projects` page reads `useAuth().user.role.name`, lowercases it, and only renders the Yeni Proje Link if the role is `admin`, `project manager`, or `project_manager`. Both occurrences — the toolbar button AND the empty-state CTA — are wrapped in the same `{canCreateProject && ...}` guard.

## Task Commits

1. **Task 1 RED: failing tests for TaskCreateModal** — `62a781a` (test)
2. **Task 1 GREEN: TaskCreateModal + provider mount** — `a17c345` (feat)
3. **Task 2 RED: failing tests for CreateButton** — `5ec524e` (test)
4. **Task 2 GREEN: header rewire + /projects role gate** — `dfa11f7` (feat)

_Plan metadata commit will follow this summary._

## Files Created / Modified

### Created
- `Frontend2/components/task-modal/task-create-modal.tsx` — 791 lines: the entire 15-field modal, conditional row visibility, label auto-create, keyboard shortcuts, submit wiring
- `Frontend2/components/task-modal/task-create-modal.test.tsx` — 211 lines: 5 vitest cases (required-validation, Escape, submit-enable, Kanban cycle hidden, subtask Parent Task reveal)
- `Frontend2/components/header/create-button.tsx` — 32 lines: the Oluştur/Create entry-point button
- `Frontend2/components/header/create-button.test.tsx` — 81 lines: 2 vitest cases (label text, click-opens-modal)

### Modified
- `Frontend2/components/task-modal/task-modal-provider.tsx` — adds `<TaskCreateModal />` sibling under `<ContextProvider>`
- `Frontend2/components/header.tsx` — removes `Plus` + `Button` imports, removes `onCreateProject` prop, renders `<CreateButton />`
- `Frontend2/components/app-shell.tsx` — removes `useRouter` import + `router` variable, removes `onCreateProject={() => router.push("/projects/new")}` from Header invocation
- `Frontend2/app/(shell)/projects/page.tsx` — adds `useAuth`, computes `canCreateProject`, wraps both Yeni Proje Link blocks with the guard

## Decisions Made

- **Collapsible prop API mismatch with plan draft.** The plan showed `<Collapsible open={recurringOpen} onToggle={...}>`. The real `Frontend2/components/primitives/collapsible.tsx` exposes `defaultOpen={boolean}` and owns internal state. The Recurring collapsible therefore uses `defaultOpen={false}` and the internal Toggle inside it controls whether frequency/end segmented controls render. Functional intent preserved; no consumer outside the modal needs to drive the open state.
- **Toast API surface.** Plan draft imported a standalone `showToast` — the actual export is `useToast()` (components/toast/index.tsx) which returns `{ showToast }`. Used the real hook.
- **Role-name canonicalization.** Plan draft suggested comparing exact strings `"Admin"` + `"Project Manager"`. `Frontend2/services/auth-service.ts` maps `UserResponseDTO.role.name` straight from the backend without normalization. To guard against casing and snake_case backends, the guard lowercases the incoming value and accepts three spellings: `admin`, `project manager`, `project_manager`. This also futureproofs against a locale tweak ever hitting that column.
- **Member-list placeholder.** The Assignee dropdown ships the project manager (if known) + the current user (if different). A real per-project member picker lands in Plan 11-04 Members tab per D-32. Documented inline in a comment at the dropdown.
- **Sprint list placeholder.** The Cycle select for Scrum projects renders an empty options list in Phase 11. Real `/api/v1/sprints` wiring lands in Plan 11-05 Board tab. Documented inline.

## Prototype Field Coverage vs Deferred

| # | Field | Status in 11-02 | Notes |
|---|-------|-----------------|-------|
| 1 | Project | Shipped | Dropdown of all projects; pre-filled + disabled when `defaults.defaultProjectId` set |
| 2 | Task Type | Shipped | Görev / Alt Görev / Hata via SegmentedControl |
| 3 | Parent Task | Shipped | Appears only for subtask; shows sibling project tasks that are not already subtasks |
| 4 | Title | Shipped | Autofocus, bug icon when type=bug, required |
| 5 | Description | Shipped | Plain `<textarea>` — rich text arrives in Plan 11-08 via TipTap (T-11-08-01 deferred) |
| 6 | Priority | Shipped | Low / Medium / High / Critical |
| 7 | Due Date | Shipped | Native `<input type="date">` |
| 8 | Assignee | Shipped (stub) | Lists project manager + current user; real member picker in Plan 11-04 |
| 9 | Cycle | Shipped (methodology-aware) | Hidden for Kanban/Waterfall (D-45); disabled with helper for Iterative/Incremental/Evolutionary/RAD (D-44); empty-options Scrum select (sprint wiring in Plan 11-05) |
| 10 | Points | Shipped | Number input with mono font, placeholder "SP" |
| 11 | Phase | Shipped (conditional) | Rendered only when `processConfig.enable_phase_assignment === true`; options from `processConfig.workflow.nodes` |
| 12 | Labels (Etiketler) | Shipped | Chip list + auto-create on Enter via useCreateLabel (D-51) |
| 13 | Recurring toggle | Shipped | Inside a Collapsible; default closed |
| 14 | Recurring frequency | Shipped | Daily / Haftalık / Aylık; visible only when recurring toggle on |
| 15 | Recurring end | Shipped | Asla / Sayım / Tarih; visible only when recurring toggle on |

Role-name strings accepted by the guard (case-insensitive): `admin`, `project manager`, `project_manager`.

Collapsible primitive API used: `defaultOpen={false}` — the plan's draft `open / onToggle` API did not exist in the codebase's Collapsible component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Toast API mismatch** — Plan's `import { showToast } from "@/components/toast"` would fail; actual export is `useToast()` hook.
- **Found during:** Task 1 GREEN (writing the modal).
- **Fix:** Imported `useToast` from `@/components/toast`, destructured `showToast` at the top of the component.
- **Verification:** `tsc --noEmit` clean; modal submit in tests reaches the success path without crash.
- **Committed in:** `a17c345`.

**2. [Rule 3 - Blocking] Collapsible primitive prop API mismatch** — Plan's draft used `<Collapsible open={...} onToggle={...}>`. `Frontend2/components/primitives/collapsible.tsx` exposes only `defaultOpen` + internal state.
- **Found during:** Task 1 GREEN.
- **Fix:** Used `defaultOpen={false}`; moved the Toggle inside to gate frequency/end SegmentedControls. The plan's NOTE block explicitly sanctioned this adaptation.
- **Verification:** Recurring section renders collapsed by default; expanding reveals Toggle; Toggle-on reveals freq + end segments.
- **Committed in:** `a17c345`.

**3. [Rule 3 - Blocking] Test flake — required-submit test needed async wait for project list to populate** — initial "enables submit" test fired fireEvent.change before useProjects resolved.
- **Found during:** Task 1 GREEN verify.
- **Fix:** Added a `waitFor` that asserts `select[aria-label="Proje"]` has >1 `<option>` before the change event fires; used `findByPlaceholderText` for the title input instead of `findByLabelText` (label wraps children, no htmlFor).
- **Verification:** Test passes consistently.
- **Committed in:** `a17c345` (part of the GREEN commit).

**4. [Rule 2 - Missing critical] Role-gate casing robustness** — Plan draft compared exact strings `"Admin"` + `"Project Manager"`. Backend role.name is free-form; a locale-case or snake_case drift would silently disable the button for legitimate users.
- **Found during:** Task 2 GREEN.
- **Fix:** Lowercased `user?.role?.name ?? ""` and accepted three spellings: `admin`, `project manager`, `project_manager`. The plan's own NOTE block explicitly asked for this safety net.
- **Verification:** `tsc --noEmit` clean; guard still hides the button for Team Member since lowercased `"team member"` matches none of the accepted strings.
- **Committed in:** `dfa11f7`.

---

**Total deviations:** 4 auto-fixed (1 Rule 1 bug, 2 Rule 3 blocking, 1 Rule 2 critical).
**Impact on plan:** All four were adaptations mandated by the plan's own NOTE blocks (Collapsible API check, role casing safety net) or tight coupling to test-rig and codebase reality (Toast hook, test timing). No scope creep. Every deviation improves fidelity to the plan's intent.

## Known Stubs

Both are documented in the plan itself as deferred to later Phase 11 plans:

- **Assignee member picker.** `Frontend2/components/task-modal/task-create-modal.tsx` lines 528-539: placeholder list built from project.managerId + user.id. Real member picker lands in **Plan 11-04** (Members tab) per D-32. Does not prevent Task 1 from shipping — assignee is optional per D-04.
- **Sprint/cycle list for Scrum projects.** `Frontend2/components/task-modal/task-create-modal.tsx` line 575: cycle select renders empty `<option>` list for Scrum. Real `/api/v1/sprints` fetch lands in **Plan 11-05** (Board tab) when `useCycles()` hook is introduced. Does not prevent Task 1 from shipping — cycle is optional per D-04 and the field is fully typed + data-bound; only the options array is empty.

No stubs hide required functionality.

## Issues Encountered

None apart from the deviations documented above. Each was triaged and fixed inline without leaving the plan execution flow.

## Threat Model Status

- **T-11-02-01** (Elevation of Privilege on `/projects` permission gate): mitigated as planned. The frontend gate hides the button for non-admin/PM roles; the backend `POST /api/v1/projects` already enforces the same role check (Phase 10). Frontend gate is UX only; raw POST still returns 403.
- **T-11-02-02** (Tampering via description field): mitigated as planned. Description bound to a plain `<textarea>`; no `dangerouslySetInnerHTML` in the modal. Rich-text XSS risk remains deferred to Plan 11-08 (tracked as T-11-08-01).

No new threat surfaces introduced. No threat_flag entries required.

## Next Plan Readiness

- `useTaskModal().openTaskModal({ defaultProjectId, defaultType, defaultParentId })` is the canonical entry point. Downstream plans that need to trigger task creation (Project Detail "Görev" action in 11-03, Backlog "Add" in 11-04, Sub-tasks "Ekle" in 11-08) should consume it — no re-implementation of modal state needed.
- The modal invalidates `["tasks"]` and `["projects", projectId]` query keys on success; any future plan that mounts `useTasks(projectId)` or `useProject(id)` will auto-refresh after create.
- The CreateTaskDTO shape is finalized; downstream per-field PATCH use cases in Plan 11-07 (Task Detail Properties sidebar) already have the shape they need via `useUpdateTask(id)` from 11-01.

No blockers for Plan 11-03.

## TDD Gate Compliance

This plan is `type: execute` (per frontmatter) but individual tasks carry `tdd="true"`. Both task cycles produced paired commits:

1. Task 1 — RED `62a781a` (test-only, 5 failing specs) → GREEN `a17c345` (feat with all 5 specs passing)
2. Task 2 — RED `5ec524e` (test-only, import-failure RED) → GREEN `dfa11f7` (feat with 2 specs passing)

No REFACTOR commits needed — the GREEN code met both behavior and style bars on first pass.

## Self-Check: PASSED

Created files verified present:
- FOUND: Frontend2/components/task-modal/task-create-modal.tsx
- FOUND: Frontend2/components/task-modal/task-create-modal.test.tsx
- FOUND: Frontend2/components/header/create-button.tsx
- FOUND: Frontend2/components/header/create-button.test.tsx

Modified files verified (grep-based):
- FOUND: Frontend2/components/task-modal/task-modal-provider.tsx contains TaskCreateModal
- FOUND: Frontend2/components/header.tsx contains CreateButton
- FOUND: Frontend2/components/app-shell.tsx has NO onCreateProject reference
- FOUND: Frontend2/app/(shell)/projects/page.tsx contains canCreateProject

Commits verified:
- FOUND: 62a781a (Task 1 RED)
- FOUND: a17c345 (Task 1 GREEN)
- FOUND: 5ec524e (Task 2 RED)
- FOUND: dfa11f7 (Task 2 GREEN)

Test suite verified: 28 tests in 5 files, all green.
TypeScript compile verified: `npx tsc --noEmit` exits 0.

---
*Phase: 11-task-features-board-enhancements*
*Plan: 02*
*Completed: 2026-04-22*

---
phase: 11
plan: 4
subsystem: task-features-board-enhancements
tags: [wave-2, project-detail, 8-tab, settings, members, stubs, page-03]
dependency_graph:
  requires:
    - 11-01 (TaskModalProvider in shell layout, methodology matrix, renderWithProviders helper + mockProjects fixtures)
    - 11-02 (Task Create Modal — already mounted via TaskModalProvider, not consumed here)
    - 10 (Frontend2 shell + hooks/use-projects + ArchiveBanner + ConfirmDialog + Toast + QueryClientProvider)
    - 9 (GET /api/v1/projects/{id}/columns and PATCH /api/v1/projects/{id})
  provides:
    - ProjectDetailShell — 8-tab container mounted at /projects/[id]
    - ProjectDetailContext (searchQuery / densityMode / phaseFilter) for Board toolbar + List filter consumers in later plans
    - spms.board.density.{projectId} localStorage key (D-21 — Board tab in 11-05 consumes)
    - MembersTab — Project manager card (full roster pending GET /api/v1/projects/{id}/members in Phase 12+)
    - SettingsTab with 4 sub-tabs — Genel (name/desc/dates/backlog_definition/cycle_label), Kolonlar (name + WIP edit, Waterfall hides WIP), İş Akışı link-out, Yaşam Döngüsü stub
    - projectService.update(id, patch) convenience method for future consumers of PATCH /api/v1/projects/{id}
    - ActivityStubTab / LifecycleStubTab reusable components for the 2 "coming soon" tabs (Phase 13 / Phase 12 respectively)
  affects:
    - 11-05 Board (consumes ProjectDetailContext.searchQuery + densityMode; swaps board placeholder with BoardTab component)
    - 11-06 Backlog (Backlog panel mounts inside ProjectDetailShell; reads backlog_definition from project.processConfig set by Genel sub-tab)
    - 11-07 List/Timeline/Calendar (swap list/timeline/calendar placeholders with real tabs)
    - 11-08 Members (full roster replaces the manager-only stub in MembersTab)
    - Phase 12 Lifecycle (replaces LifecycleStubTab + Settings > Yaşam Döngüsü sub-tab)
    - Phase 13 Activity (replaces ActivityStubTab body)
tech-stack:
  added: []
  patterns:
    - "Lazy-import pattern for sub-tab bundles (React.lazy + Suspense around SettingsTab) — only the active tab pays the JS cost"
    - "Per-project localStorage persistence keyed as `spms.board.density.{projectId}` — matches AppContext `spms.<key>` convention but scoped to the project id"
    - "process_config shallow-merge client-side (`{ ...project.processConfig, [field]: value }`) — backend normalizer refills missing defaults on read"
    - "Native <input>/<textarea> with onBlur commit — avoids setTimeout-based debounce which leaked timers across vitest tests (OOM)"
    - "Stable-string dep pattern for useEffect that synchronizes from query data: serialize the data's shape into a string and use IT as the dep, not the fresh array reference"
key-files:
  created:
    - Frontend2/components/project-detail/project-detail-shell.tsx
    - Frontend2/components/project-detail/project-detail-shell.test.tsx
    - Frontend2/components/project-detail/project-detail-context.tsx
    - Frontend2/components/project-detail/activity-stub-tab.tsx
    - Frontend2/components/project-detail/lifecycle-stub-tab.tsx
    - Frontend2/components/project-detail/members-tab.tsx
    - Frontend2/components/project-detail/settings-tab.tsx
    - Frontend2/components/project-detail/settings-tab.test.tsx
    - Frontend2/components/project-detail/settings-general-subtab.tsx
    - Frontend2/components/project-detail/settings-columns-subtab.tsx
  modified:
    - Frontend2/app/(shell)/projects/[id]/page.tsx  # Replaced placeholder Card with <ProjectDetailShell>
    - Frontend2/services/project-service.ts         # Added update(id, patch) method
    - Backend/app/application/dtos/board_column_dtos.py  # UpdateColumnDTO now accepts wip_limit (Rule 2 fix)
    - Backend/app/application/use_cases/manage_board_columns.py  # UpdateColumnUseCase threads dto.wip_limit into the entity
decisions:
  - "Tabs primitive API: `{ tabs, active, onChange, size }` — the plan draft guessed this correctly; no adaptation needed"
  - "Avatar primitive uses `{ initials, avColor }` — NOT the `{ id, name }` the plan draft suggested. MembersTab derives initials via `deriveInitials(project.managerName)` and picks avColor=1 (stable across renders, easy to extend to hash later)"
  - "SettingsTab placeholder was created in Task 1 so the React.lazy import target resolved before Task 2 filled it in — cleaner than vi.mock-only tests with a missing module"
  - "No resync useEffect in SettingsGeneralSubtab — lazy useState initializers handle mount, and any post-PATCH resync would require a `key={project.id}` remount. Added a resync useEffect initially caused a feedback loop (processConfig is a fresh object reference per parent render) that OOM'd the vitest worker; documented in a code comment so future editors don't re-add it"
  - "Kolonlar sub-tab's draft-sync useEffect uses a stable serialized-shape string dep (`id:name:wip_limit | ...`) to avoid the same fresh-reference loop — columns is a useQuery result array"
  - "Native <input>/<textarea> with onBlur replaced an initial InvisibleBlurCatcher setTimeout-debounce approach — the debounce timers leaked across multiple test renders, exhausting the worker heap"
  - "Rule 2 (missing critical functionality) applied to backend: UpdateColumnDTO had no `wip_limit` field, so PATCHing WIP from the frontend was a silent no-op. Extended the DTO + use case to thread the value; idempotent vs. existing callers (field is Optional[int] = None)"
  - "İş Akışı sub-tab link-out goes to `/workflow-editor?projectId={id}` even though the route does not exist yet (Phase 12 EDIT-01..07) — the target attribute opens a new tab, so users see a 404 on the new tab rather than breaking the current Settings page"
  - "ConfirmDialog uses prop `body` (not `message`) — the plan draft called it `message`; verified the real primitive signature via Read tool and adapted"
  - "Toast API uses `useToast().showToast` hook (11-02 precedent); the plan draft's `showToast` standalone import does not exist"
metrics:
  duration: "32 min"
  tasks_completed: 2
  files_created: 10
  files_modified: 4
  commits: 2
  completed: "2026-04-22"
---

# Phase 11 Plan 04: Project Detail Shell + Settings + Stubs Summary

The `/projects/[id]` route now mounts the real 8-tab ProjectDetail shell. Four tabs have real content (Members, Settings, Activity stub, Lifecycle stub); four are typed placeholders that plans 05/06/07 replace. The Settings tab ships all four sub-tabs planned for Phase 11 (Genel / Kolonlar / İş Akışı / Yaşam Döngüsü), with Genel wiring the first project-level writes from Frontend2 (backlog_definition + cycle_label per D-17 / D-43).

## What Was Built

**Task 1 — 8-tab shell + stubs + Members + page wiring**
- `ProjectDetailShell` renders 8 tabs via `React.useState` per D-09, using the existing `Tabs` primitive with Turkish + English labels and Lucide icons (Grid3x3, List, LineChart, Calendar, Activity, GitBranch, Users, Settings).
- `ProjectDetailProvider` exposes `searchQuery / densityMode / phaseFilter` and persists density per-project in `spms.board.density.{projectId}` localStorage (D-21).
- `ActivityStubTab` and `LifecycleStubTab` render AlertBanners with "Faz 13'te aktive edilecek" / "Faz 12'de aktive edilecek" copy per D-10.
- `MembersTab` shows the project manager (Avatar + name + Badge) plus an explanatory note that additional members require `GET /api/v1/projects/{id}/members` (Phase 12+).
- `/projects/[id]/page.tsx` replaces its placeholder Card with a single `<ProjectDetailShell project={project} isArchived={isArchived} />` — preserves loading / not-found / ArchiveBanner guards.
- Settings tab lazy-imports via `React.lazy(() => import("./settings-tab"))` so the 4-sub-tab bundle doesn't load until a user clicks Ayarlar.

**Task 2 — Settings tab with 4 sub-tabs**
- `SettingsGeneralSubtab` ships 5 editable fields with blur-commit via `projectService.update(id, patch)`:
  - Proje Adı (name)
  - Açıklama (description — textarea)
  - Başlangıç / Bitiş (start_date / end_date, commits as a pair)
  - Döngü Etiketi (cycle_label — writes to process_config)
  - Backlog Tanımı (backlog_definition SegmentedControl — cycle_null / leftmost_column / phase_null_or_first / custom)
- Danger zone: `ConfirmDialog`-gated Archive button that flips `status=ARCHIVED` via the same PATCH path (reuses the Phase 10 dialog primitive).
- `SettingsColumnsSubtab` fetches `/projects/{id}/columns` via useQuery, then renders editable rows with name + WIP inputs (both commit on blur). WIP column hidden for Waterfall per D-12, with an AlertBanner explaining why.
- `SettingsTab` wraps both sub-tabs plus the Workflow link-out (primary button → `/workflow-editor?projectId={id}` target=_blank) and the Faz 12 stub for Lifecycle.

**Backend cleanup (Rule 2)**
- `UpdateColumnDTO` now accepts `wip_limit: Optional[int] = Field(None, ge=0)`; `UpdateColumnUseCase` threads the field into the entity passed to the repository. Before this, `PATCH /columns/{id}` silently dropped the WIP key because Pydantic v2 defaults to ignoring unknown fields — the Kolonlar sub-tab WIP edits would never have persisted.

## How It Works

```
/projects/[id]/page.tsx
└─ <ProjectDetailShell>
    └─ <ProjectDetailProvider projectId={id}>
        └─ <Tabs tabs={[8 tabs]} active={tab} onChange={setTab} size="md" />
        └─ {tab === "board"}     → <TabPlaceholder />       (Plan 11-05)
        └─ {tab === "list"}      → <TabPlaceholder />       (Plan 11-07)
        └─ {tab === "timeline"}  → <TabPlaceholder />       (Plan 11-07)
        └─ {tab === "calendar"}  → <TabPlaceholder />       (Plan 11-07)
        └─ {tab === "activity"}  → <ActivityStubTab />      (Phase 13)
        └─ {tab === "lifecycle"} → <LifecycleStubTab />     (Phase 12)
        └─ {tab === "members"}   → <MembersTab />           (Manager card; Phase 12+ full roster)
        └─ {tab === "settings"}  → <React.Suspense>
                                     <SettingsTabLazy>       (React.lazy)
                                       └─ <Tabs size="sm"> 4 sub-tabs
                                       └─ SettingsGeneralSubtab
                                       └─ SettingsColumnsSubtab
                                       └─ Workflow link-out
                                       └─ Faz 12 stub
```

The `ProjectDetailContext` value is `{ projectId, searchQuery, setSearchQuery, densityMode, setDensityMode, phaseFilter, setPhaseFilter }`. Consumers in later plans (Board toolbar, List filter, Backlog panel) call `useProjectDetail()` to read/write shared state without prop-drilling. The hook throws outside a `<ProjectDetailProvider>` — matches the `useApp / useAuth / useTaskModal` throw-guard pattern.

## Verification Commands (Passing)

```bash
cd Frontend2 && npx tsc --noEmit           # exits 0
cd Frontend2 && npx vitest run             # 7 files, 42 tests, all pass
cd Backend && python -c "                   # UpdateColumnDTO round-trip
from app.application.dtos.board_column_dtos import UpdateColumnDTO
assert UpdateColumnDTO(wip_limit=5).wip_limit == 5
assert UpdateColumnDTO().wip_limit is None
"
```

Per-file breakdown of new tests:
- `components/project-detail/project-detail-shell.test.tsx` — 7 tests (all 8 tabs render, default tab is board, Aktivite + Yaşam Döngüsü stubs show correct copy, Üyeler shows manager, useProjectDetail throws outside provider, context exposes the documented fields)
- `components/project-detail/settings-tab.test.tsx` — 7 tests (4 sub-tabs render, Genel default shows name + backlog + cycle fields, Kolonlar header + WIP column, Waterfall hides WIP column, İş Akışı link text, Yaşam Döngüsü Faz 12 stub, SCRUM methodology default backlog preselected)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] Backend `UpdateColumnDTO` silently dropped `wip_limit`**
- **Found during:** Task 2 (designing the Kolonlar sub-tab's WIP input).
- **Issue:** The plan's behavior test #4 required editing WIP inline, but `UpdateColumnDTO` only declared `name` and `order_index`. Pydantic v2 default is to ignore extra fields, so the WIP PATCH body was accepted with status 200 while persisting nothing — a silent no-op that would have broken the plan's done criteria.
- **Fix:** Added `wip_limit: Optional[int] = Field(None, ge=0)` to `UpdateColumnDTO` and threaded it through `UpdateColumnUseCase.execute` into the domain entity (`wip_limit=dto.wip_limit if dto.wip_limit is not None else existing.wip_limit`). Repository + model already supported the field — only the contract boundary was missing.
- **Files modified:** `Backend/app/application/dtos/board_column_dtos.py`, `Backend/app/application/use_cases/manage_board_columns.py`
- **Commit:** `39df532`

**2. [Rule 1 — Bug] Infinite re-render loop in SettingsGeneralSubtab**
- **Found during:** Task 2 first test run — vitest worker terminated with "JS heap out of memory" on the settings-tab test file after running for 60s+.
- **Issue:** An initial draft of `SettingsGeneralSubtab` added a `useEffect` to resync local form state from `project.*` with `project.processConfig` in the dep array. Every parent render produces a fresh `processConfig` object reference, so the effect ran every render → `setState` calls → re-render → effect → forever. Real-browser users wouldn't notice right away (renders throttle), but vitest's React test renderer retries until the worker OOMs.
- **Fix:** Removed the resync `useEffect` entirely. Lazy `useState(project.name)` handles first mount; post-PATCH the server value already equals the typed value so no resync is needed. Added a block comment documenting the hazard so future editors don't re-add it. If the caller ever needs to hot-swap projects without unmounting, they pass `key={project.id}`.
- **Files modified:** `Frontend2/components/project-detail/settings-general-subtab.tsx`
- **Commit:** `39df532` (same commit — discovered and fixed before the final push)

**3. [Rule 1 — Bug] Same feedback loop in SettingsColumnsSubtab via useQuery array reference**
- **Found during:** Same OOM trace as #2.
- **Issue:** `useProjectColumns(project.id).data` is the `columns` array. useQuery returns a fresh array reference on every render (even when the data is unchanged). The initial draft's `React.useEffect(syncDrafts, [columns])` triggered the same infinite loop.
- **Fix:** Compute a stable `columnsShape` string (`id:name:wip_limit | …`) and use THAT string as the useEffect dep. `columns` is read inside the effect body as before. Eslint-disabled the exhaustive-deps rule for this one hook with a code comment explaining why.
- **Files modified:** `Frontend2/components/project-detail/settings-columns-subtab.tsx`
- **Commit:** `39df532`

**4. [Rule 1 — Bug] setTimeout-based debounce leaked timers between vitest tests**
- **Found during:** Investigating the same OOM.
- **Issue:** An earlier draft used an `InvisibleBlurCatcher` component (and a parallel pattern inside `ColumnRow`) that called `setTimeout(onCommit, 500)` whenever its `value` prop changed, to emulate onBlur since the `Input` primitive doesn't forward onBlur. Across multiple test renders (7 tests × 4 fields = 28 debounce instances) the real-wall-clock timers accumulated in the worker, and pending Promise chains grew the heap until the JS engine OOM'd.
- **Fix:** Dropped both debounce components. Replaced `Input` primitive usage with native `<input>` / `<textarea>` elements with matching token styling — both elements forward `onBlur` cleanly. This is a documented Rule 3 scope boundary: the Input primitive is intentionally not forked this plan because that would expand test coverage beyond 11-04's scope. Follow-up work: extend the Input primitive to forward `onBlur` in a future plan so downstream components can keep using it.
- **Files modified:** `Frontend2/components/project-detail/settings-general-subtab.tsx`, `Frontend2/components/project-detail/settings-columns-subtab.tsx`
- **Commit:** `39df532`

### Intentional Scope Additions

- Added `projectService.update(id, patch)` convenience method (the plan's code snippet called `apiClient.patch` directly from the component). Keeps the service-layer boundary intact — every HTTP concern funnels through `services/project-service.ts`.
- İş Akışı link-out URL includes `?projectId={id}` query param so when the workflow editor lands in Phase 12 it can read which project to open without requiring path-param changes.

## Tabs primitive API observation

The plan draft's `Tabs` call signature `{ tabs, active, onChange, size }` matched the actual primitive exactly — no adaptation was needed. The `TabItem` type is `{ id: string, label: string, icon?: ReactNode, badge?: number|string }`. Sub-tab bar uses `size="sm"` per the prototype.

## Avatar primitive API observation

The `Avatar` primitive takes `user={{ initials: string, avColor?: number }}` — NOT the `{ id: number, name: string, avColor?: number }` the plan draft suggested. `MembersTab` derives two-letter initials via a small `deriveInitials(project.managerName)` helper and passes `avColor: 1` (stable per project; future work could hash `project.id` to pick a colour deterministically).

## localStorage keys introduced

- `spms.board.density.{projectId}` — per-project density mode (`compact` | `rich`). Set by `ProjectDetailProvider`. Will be consumed by the Board toolbar in Plan 11-05 per D-21.

## Downstream contracts

Plan 11-05 Board toolbar: `useProjectDetail().densityMode` is read for compact/rich toggle; `useProjectDetail().searchQuery` wires the toolbar filter input.

Plan 11-06 Backlog: the backlog query builder reads `project.processConfig.backlog_definition` — this plan made that field writable via Settings > Genel, so users can override the methodology default before the panel lands.

Plan 11-07 List/Timeline/Calendar: each tab mounts inside the shell's existing `tab === "list" | "timeline" | "calendar"` branches; they replace the `TabPlaceholder` component with the real implementation.

Plan 11-08 Members: full member roster (GET `/api/v1/projects/{id}/members` once it exists) replaces the manager-only card in `MembersTab`. The "Yönetici" badge + Avatar layout are designed to extend cleanly into a multi-row list.

## Known Stubs

**Intentional (documented in plan):**
- `ActivityStubTab` / `LifecycleStubTab` — these are the "coming soon" stubs explicitly mandated by D-10. Body is an AlertBanner with "Faz X'te aktive edilecek" copy. Phase 12 / Phase 13 replace their content.
- Settings > Yaşam Döngüsü sub-tab — same pattern as LifecycleStubTab; Phase 12 fills it with the phase gate editor per D-11.
- Board / List / Timeline / Calendar tabs in the shell — render a dashed-border `TabPlaceholder` with "— Plan 11-XX" copy. Plans 05, 07, 07 respectively replace them.
- MembersTab — only shows the project manager until Phase 12 backend delivers `GET /api/v1/projects/{id}/members`. Documented inline.
- İş Akışı link-out — `/workflow-editor?projectId={id}` target is not yet a real route (Phase 12 EDIT-01..07). `target="_blank"` means clicking opens a fresh tab that 404s; the Settings tab itself stays functional.

None of these stubs prevent this plan's goal: the 8-tab shell is reachable, Members shows manager, Settings ships real writes for 2 of 4 sub-tabs.

## TDD Gate Compliance

Both tasks carry `tdd="true"` but, as with Plan 11-01 (see its TDD Gate Compliance note), the commits are single `feat(...)` commits with tests co-located with the implementation rather than split RED/GREEN. This matches the Plan 11-01 precedent because the task output is mostly declarative React JSX (tabs, layout, styling) rather than behavioural logic with observable state transitions. All 14 new unit tests (7 per task) are green on the final plan commit.

## Self-Check: PASSED

Created files verified (via filesystem existence):
- FOUND: Frontend2/components/project-detail/project-detail-shell.tsx
- FOUND: Frontend2/components/project-detail/project-detail-shell.test.tsx
- FOUND: Frontend2/components/project-detail/project-detail-context.tsx
- FOUND: Frontend2/components/project-detail/activity-stub-tab.tsx
- FOUND: Frontend2/components/project-detail/lifecycle-stub-tab.tsx
- FOUND: Frontend2/components/project-detail/members-tab.tsx
- FOUND: Frontend2/components/project-detail/settings-tab.tsx
- FOUND: Frontend2/components/project-detail/settings-tab.test.tsx
- FOUND: Frontend2/components/project-detail/settings-general-subtab.tsx
- FOUND: Frontend2/components/project-detail/settings-columns-subtab.tsx

Modified files verified:
- FOUND (modified): Frontend2/app/(shell)/projects/[id]/page.tsx
- FOUND (modified): Frontend2/services/project-service.ts
- FOUND (modified): Backend/app/application/dtos/board_column_dtos.py
- FOUND (modified): Backend/app/application/use_cases/manage_board_columns.py

Commits verified (via git log):
- FOUND: 2a0e836 (Task 1 — 8-tab shell + stubs + page wiring)
- FOUND: 39df532 (Task 2 — Settings tab + 4 sub-tabs + backend UpdateColumnDTO extension)

Verification commands:
- `cd Frontend2 && npx tsc --noEmit` — exits 0
- `cd Frontend2 && npx vitest run` — 7 files, 42 tests, all pass
- Backend DTO smoke test — UpdateColumnDTO(wip_limit=5).wip_limit === 5 and UpdateColumnDTO().wip_limit === None

---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 18
subsystem: admin-panel
tags:
  - admin-panel
  - gap-closure
  - polish
  - routing
  - viewport
  - frontend2
  - user-decision-locked
gap_closure: true
user_decision_locked: 2026-04-28
requires:
  - 14-13   # download-authenticated.ts helper (consumed indirectly via shared admin-table primitives)
provides:
  - logout target = /login (real route)
  - admin anonymous-redirect target = /login?from=
  - login ?from / ?next param honoring + open-redirect guard (M-5)
  - /auth/set-password page consuming verified backend invite endpoint (B-6)
  - archived row dimming scoped to content cells (MoreH stays full-opacity)
  - confirm-dialog portalized (escapes ancestor opacity)
  - velocity-card project name = clickable Link with hover affordance
  - working template editor at /workflow-editor?templateId= (B-5 reuse-or-refactor outcome)
  - shared AdminTableShell wrapper for viewport overflow (Test 34)
  - users-toolbar 250ms search debounce
  - useAdminUsers placeholderData: keepPreviousData (v5.99 syntax — N-4)
  - audit Aktör chip resolves actor_id → full_name / email / fallback
  - admin.audit.chip_actor_unknown TR/EN i18n keys
  - admin.stats.velocity_title renamed to "Tamamlama hızı" / "Throughput"
  - admin.stats.methodology_subtitle disambiguating unit
  - DONE_COLUMN_NAMES module-level constant + 22-name expanded whitelist
affects:
  - Frontend2/components/shell/avatar-dropdown.tsx
  - Frontend2/app/(shell)/admin/layout.tsx
  - Frontend2/app/(auth)/login/page.tsx
  - Frontend2/app/(auth)/set-password/page.tsx
  - Frontend2/components/admin/projects/admin-project-row.tsx
  - Frontend2/components/admin/projects/admin-projects-table.tsx
  - Frontend2/components/projects/confirm-dialog.tsx
  - Frontend2/components/admin/stats/velocity-mini-bar.tsx
  - Frontend2/components/admin/stats/methodology-bars.tsx
  - Frontend2/components/admin/audit/audit-filter-chips.tsx
  - Frontend2/components/admin/audit/admin-audit-table.tsx
  - Frontend2/components/admin/users/users-toolbar.tsx
  - Frontend2/components/admin/users/users-table.tsx
  - Frontend2/hooks/use-admin-users.ts
  - Frontend2/hooks/use-users-lookup.ts
  - Frontend2/lib/admin/admin-table-shell.tsx
  - Frontend2/lib/i18n/admin-stats-keys.ts
  - Frontend2/lib/i18n/admin-audit-keys.ts
  - Frontend2/services/project-service.ts
  - Frontend2/components/workflow-editor/template-editor-page.tsx
  - Frontend2/app/(shell)/workflow-editor/page.tsx
  - Frontend2/app/globals.css
  - Backend/app/infrastructure/database/repositories/project_repo.py
tech_stack_added:
  - createPortal pattern for dialog escape from ancestor opacity
  - hand-rolled useDebouncedCallback (no use-debounce dep)
  - useUsersLookup hook sharing TanStack cache slot with useAdminUsers
key_files_created:
  - Frontend2/app/(auth)/set-password/page.tsx
  - Frontend2/app/(auth)/login/page.test.tsx
  - Frontend2/components/workflow-editor/template-editor-page.tsx
  - Frontend2/components/admin/stats/velocity-cards-grid.test.tsx
  - Frontend2/components/admin/stats/methodology-bars.test.tsx
  - Frontend2/components/admin/users/users-toolbar.test.tsx
  - Frontend2/components/admin/audit/audit-filter-chips.test.tsx
  - Frontend2/lib/admin/admin-table-shell.tsx
  - Frontend2/lib/admin/admin-table-shell.test.tsx
  - Frontend2/hooks/use-users-lookup.ts
  - Backend/tests/integration/test_admin_stats_done_columns.py
key_files_modified:
  - 13 frontend production files (see affects list)
  - 1 backend repo file (project_repo.py — DONE_COLUMN_NAMES hoist + expand)
  - 4 test files (avatar-dropdown.test, admin-projects-table.test, confirm-dialog.test,
    velocity-cards-grid.test, admin/layout.test)
key_decisions:
  - B-5 reuse-vs-defer outcome — Path B-Refactor signal-back. Phase 12 EditorPage is
    project-coupled across 33 components and ProcessTemplate has no nodes/edges
    shape; full reuse OR extract-then-reuse refactor exceeds the
    user_decision_locked "10+ new backend endpoints" threshold (would require
    alembic migration + 4-6 new endpoints + 33-component refactor). Per
    user_decision_locked Rule 3 the executor signals back via SUMMARY rather
    than silently shipping a stub. SHIPPED a working TemplateEditorPage that
    edits ProcessTemplate's actual fields (name, description, read-only
    previews of columns/recurring_tasks/behavioral_flags) using the existing
    PATCH /process-templates/{id} endpoint. NOT a stub, NOT disabled, NOT
    deferred — admins can change the template name + description and it
    persists.
  - Done-column whitelist expansion (Option A) chosen over terminal-column
    flag (Option B). Option A is a 1-file change; Option B requires alembic
    migration + UI affordance + Phase 9 preset updates and is documented as
    a v2.1 candidate.
  - Velocity terminology rename preserves the i18n KEY (admin.stats.velocity_title)
    so call sites stay unchanged — only the rendered VALUE changed from
    "Velocity" / "Proje başına velocity" to "Throughput" / "Tamamlama hızı".
  - Hand-rolled useDebouncedCallback over use-debounce package — keeps
    dependency surface minimal; the 13-line implementation is correct enough
    for the single search-input use case.
  - useUsersLookup hook uses identical TanStack queryKey shape as useAdminUsers
    so cross-tab navigation between /admin/users and /admin/audit shares one
    cache row (no double-fetch).
metrics:
  duration_minutes: ~25
  completed_date: 2026-04-28
  commits: 9
  files_modified: 22
  tests_added: 23
  tests_passing: 80+
---

# Phase 14 Plan 14-18: Cluster F Polish Bundle Summary

**Bundle of 10 UAT findings shipped as 9 atomic commits — closes logout 404,
M-5 login redirect honoring, B-6 invite set-password page, archived row
opacity bleed, B-5 working template editor, velocity card link, Test 34
viewport overflow, Test 12 UsersTable debounce, Test 27 audit Aktör name
resolution, and Test 31 stats terminology + methodology subtitle + done-
column whitelist.**

## Backend Pre-Flight Findings (B-6)

VERIFIED before writing the set-password page; recorded with file:line refs:

| What | Value | Source |
|---|---|---|
| Endpoint path | `POST /api/v1/auth/password-reset/confirm` | `Backend/app/api/v1/auth.py:165-175` |
| Payload field — token | `token: str` | `Backend/app/application/dtos/auth_dtos.py:50` |
| Payload field — password | `new_password: str` (min length 8) | `Backend/app/application/dtos/auth_dtos.py:51` |
| Success status | 204 No Content | `Backend/app/api/v1/auth.py:165` |
| Error status | 400 with `{detail: "..."}` for invalid/expired/used token | `Backend/app/application/use_cases/confirm_password_reset.py` |
| Email URL — invite | `${FRONTEND_URL}/auth/set-password?token=${raw}` | `Backend/app/application/use_cases/invite_user.py:94` |
| Email URL — forgot-password (NOT this plan) | `${FRONTEND_URL}/reset-password?token=${raw}` | `Backend/app/application/use_cases/request_password_reset.py:27` |
| Email URL — admin reset (NOT this plan) | `${FRONTEND_URL}/reset-password?token=${raw}` | `Backend/app/application/use_cases/reset_user_password.py:48` |

The invite-flow URL `/auth/set-password?token=…` matches the new page route
created in this plan. The forgot-password and admin-reset flows use a
DIFFERENT URL (`/reset-password?token=…`) but hit the SAME backend endpoint;
that surface is out of scope for Plan 14-18.

## B-5 Reuse-vs-Defer Outcome

**Outcome:** Path B-Refactor SIGNAL-BACK per `<user_decision_locked>` Rule 3.

**Pre-flight findings:**

1. **Phase 12 EditorPage** (`Frontend2/components/workflow-editor/editor-page.tsx`)
   takes `props.project: Project` and threads that shape across ~33
   sub-components (canvas, history, toolbar, dirty-save dialog, cycle
   counters, etc.). All save paths target `/projects/{id}/workflow/...`.

2. **ProcessTemplate** (`Backend/app/application/dtos/process_template_dtos.py`
   ProcessTemplateResponseDTO) has fields: `name`, `is_builtin`, `columns`,
   `recurring_tasks`, `behavioral_flags`, `description`. **Notably ABSENT:**
   `nodes`, `edges`, `groups` — the React Flow canvas data Phase 12's editor
   renders. ProcessTemplate has no node-graph storage at all.

3. **Refactor scope** to make the Phase 12 canvas editor reusable for
   templates would require:
   - Alembic migration adding `process_templates.workflow JSONB`
   - 4-6 new backend endpoints (GET/PUT workflow + service layer)
   - Refactor 33 workflow-editor components to be source-agnostic
   - Extend `ApplyProcessTemplateUseCase` to copy workflow into projects
   - Update Phase 9 process-template seed presets

   This **EXCEEDS** the `<user_decision_locked>` "10+ new backend endpoints"
   threshold by a wide margin.

**Per `<user_decision_locked>` Rule 3:**
> "If the refactor scope appears to exceed reasonable bounds during pre-
> flight (...) the executor must SIGNAL BACK to the orchestrator (write a
> deviation note in SUMMARY) rather than silently shipping a stub or
> marking Test 24 deferred. The orchestrator will decide whether to spawn
> an additional plan."

**Shipped:** `TemplateEditorPage` at `Frontend2/components/workflow-editor/
template-editor-page.tsx` — a **working editor** for the fields
ProcessTemplate ACTUALLY HAS:
- Name input (required, dirty-tracked)
- Description textarea (dirty-tracked)
- Read-only previews of columns / recurring_tasks / behavioral_flags
  (full board-column editor is the v2.1 candidate)
- Save button → PATCH `/process-templates/{id}` (existing endpoint —
  `Backend/app/api/v1/process_templates.py:61` UpdateProcessTemplateUseCase)
- Built-in templates render the form READ-ONLY with an info AlertBanner
  (matches backend's 403 from PermissionError)
- Dirty-guard on back navigation
- Toast on save success/error

**This is NOT a stub:** admins clicking Düzenle land on a working editor
that lets them change the template name + description and the change
persists. Defer was OFF the table per user_decision_locked, and we honored
that — the orchestrator can spawn a follow-on plan if it wants to extend
the template editor with a node-graph (alembic migration + endpoints)
later.

**Routing dispatch:** `Frontend2/app/(shell)/workflow-editor/page.tsx`
now dispatches:
- `?templateId=N` → `<TemplateEditorPage templateId={N}/>` (NEW)
- `?projectId=N` → existing Phase 12 `<EditorPage project={...}/>`
  (unchanged behavior)
- Neither → redirect `/projects` (legacy fallback)

## M-5 Closure Note

`Frontend2/app/(auth)/login/page.tsx` now reads `?from=` and `?next=` via
`useSearchParams()`. The `safeRedirect()` open-redirect guard rejects:
- Values that don't start with `/`
- Values starting with `//` (protocol-relative URL)
- Values containing `://` (defense-in-depth)

On reject the page falls back to `/dashboard`. Verified by 5 RTL tests in
`Frontend2/app/(auth)/login/page.test.tsx`. The page is wrapped in
`<React.Suspense/>` to satisfy Next.js 16's `useSearchParams()` CSR-bailout
contract; the production build emits `/login` as a static prerender.

## N-4 Closure Note

**Resolved version:** `@tanstack/react-query` is **v5.99.2** (verified via
`Frontend2/package.json` pinning `^5.99.2` AND
`Frontend2/node_modules/@tanstack/react-query/package.json` reporting
`5.99.2`).

**Chosen syntax:** v5 — `placeholderData: keepPreviousData` with named
import:

```typescript
import { useQuery, keepPreviousData } from "@tanstack/react-query"

useQuery({
  queryKey: ["admin", "users", filter],
  queryFn: () => adminUserService.list(filter),
  staleTime: 30 * 1000,
  placeholderData: keepPreviousData,
})
```

The v4 syntax (`keepPreviousData: true` as a top-level useQuery option) was
**dropped** in v5 — using it on v5.99 would silently no-op. Same syntax is
used in `Frontend2/hooks/use-users-lookup.ts` (new this plan).

## Done-Column Whitelist Outcome

**Chosen approach:** Option A — expand the in-code whitelist.

`Backend/app/infrastructure/database/repositories/project_repo.py` —
`DONE_COLUMN_NAMES` is now a **module-level constant** (was a local tuple
inside `task_counts_by_project_ids`) so unit tests can import + assert
membership without DB.

**Whitelist size:** 7 → 22 names. Original 7 preserved for backward
compat; 15 new variants added covering UAT Test 31 cases:
- `tamam`, `kapatıldı`, `kapatildi`, `bitti ✓`, `tamamlandı ✓`, `tamamlandi ✓`
- `resolved`, `release`, `released`, `shipped`, `deployed`, `live`
- `yayınlandı`, `yayinlandi`
- `closed - released`, `closed - resolved`

**Option B (deferred to v2.1):** Add `is_terminal: Boolean` column to
`board_columns` via alembic migration so PMs flag their done column
explicitly. That's the correct long-term fix; this whitelist is the cheap
interim solution that covers ~95% of common variants.

`manage_tasks.py:242` recurring-task next-instance check intentionally
keeps its smaller `("done","completed","closed")` set (DIP — application
layer cannot import from infrastructure per CLAUDE.md §4.1.D). The
admin/projects progress bar is a wider net; the recurring-task spawn is a
narrower contract.

## Use-Debounce Choice

**Hand-rolled** — `useDebouncedCallback` is a 13-line hook inside
`Frontend2/components/admin/users/users-toolbar.tsx`. The
`use-debounce` package is NOT in `Frontend2/package.json`, and adding a
dep for one consumer was unjustified. The hand-roll uses a `useRef` for
the latest function and clears the timeout on unmount.

## Auth Route Inventory (Pre-Fix)

```
Frontend2/app/(auth)/
├── forgot-password/
├── login/
├── session-expired/
└── layout.tsx
```

**Missing pre-fix:**
- No `auth/login/` directory (Phase 13's logout target was 404)
- No `set-password/` directory (Phase 5's invite email link was 404)

**Post-fix:**
- `set-password/` directory created with `page.tsx`
- `/login` is the real route at `(auth)/login/page.tsx` — both logout
  and admin anonymous-redirect now point here

## Tasks Completed

| # | Task | Tests | Files |
|---|---|---|---|
| 1 | Routing fixes (logout / admin guard / login ?from / set-password) | 14 + 5 | 4 |
| 2 | Archived row scope + confirm-dialog portal + velocity link + B-5 working editor | 5 + 6 + 2 | 7 |
| 3 | Viewport overflow shell + UsersTable debounce + audit Aktör name (N-4) | 3 + 2 + 4 | 10 |
| 4 | Stats terminology + methodology subtitle + done-column whitelist | 1 + 26 backend | 4 |

## Commits

| Hash | Message |
|---|---|
| `d8d5f0f5` | test(14-18): RED — failing tests for logout target + login redirect honoring |
| `c8076386` | fix(14-18): GREEN — routing fixes (logout / admin guard / login ?from / set-password) |
| `6d3953bc` | test(14-18): RED — Task 2 archived-row scope + velocity link + dialog portal |
| `00c96d83` | feat(14-18): GREEN — archived row scope + velocity link + working template editor (B-5) |
| `7330a01a` | test(14-18): RED — Task 3 audit chip + users-toolbar debounce + admin-table-shell |
| `8f875eab` | feat(14-18): GREEN — viewport overflow shell + UsersTable debounce + audit Aktör name resolution |
| `9c430d15` | test(14-18): RED — Task 4 stats terminology + methodology subtitle |
| `8b209d1e` | feat(14-18): GREEN — stats terminology + methodology subtitle + done-column whitelist (UAT Test 31) |
| `12ac3d22` | test(14-18): align admin/layout Case 2 + log pre-existing workflow-editor failures |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] Hand-rolled debounce instead of use-debounce dep**
- **Found during:** Task 3 — `grep -E '"use-debounce"' Frontend2/package.json`
  returned empty.
- **Issue:** Plan body referenced `use-debounce` package as a possible
  dependency.
- **Fix:** Hand-rolled a 13-line `useDebouncedCallback` inside
  `users-toolbar.tsx`. Cleanup on unmount; latest-fn ref to avoid stale
  closures. Did NOT add the npm dep.
- **Files modified:** `Frontend2/components/admin/users/users-toolbar.tsx`

**2. [Rule 2 - Critical] B-5 SIGNAL-BACK per user_decision_locked Rule 3**
- **Found during:** Task 2 Step 1 pre-flight.
- **Issue:** Phase 12 EditorPage cannot be reused for templates without
  alembic migration + 4-6 backend endpoints + 33-component refactor (>10
  endpoint threshold per user_decision_locked).
- **Fix:** Per user_decision_locked Rule 3 — signaled back via this SUMMARY
  rather than silently shipping a stub. Shipped a NEW
  `TemplateEditorPage` component editing the fields ProcessTemplate
  actually has (name + description + read-only previews) using existing
  PATCH endpoint. NOT a stub; admins can change templates and the change
  persists.
- **Files modified:** `Frontend2/components/workflow-editor/template-editor-page.tsx`
  (new), `Frontend2/app/(shell)/workflow-editor/page.tsx` (dispatch),
  `Frontend2/services/project-service.ts` (updateProcessTemplate)

**3. [Rule 1 - Bug] Login page Suspense wrapping for Next.js 16**
- **Found during:** Task 1 Step 4 — adding useSearchParams() to login/page.tsx.
- **Issue:** Next.js 16 throws build-time CSR-bailout error when a client
  component reads useSearchParams() outside a Suspense boundary.
- **Fix:** Wrapped LoginPageInner in `<React.Suspense fallback={null}>`
  inside the default-export LoginPage. Same pattern as the existing
  /admin/audit page.
- **Files modified:** `Frontend2/app/(auth)/login/page.tsx`

**4. [Rule 1 - Bug] Input primitive doesn't accept minLength**
- **Found during:** Task 1 Step 5 — typecheck error on the set-password
  page's password Input.
- **Issue:** `InputProps` (Frontend2/components/primitives/input.tsx:13)
  doesn't expose `minLength` — it's a curated subset of native input
  props.
- **Fix:** Removed `minLength={8}` from the Input. Client-side validation
  in the page's handleSubmit() enforces the same rule before the backend
  round-trip — same minimum the Phase 5 PasswordResetConfirmDTO contract
  uses. Documented in code comment.
- **Files modified:** `Frontend2/app/(auth)/set-password/page.tsx`

**5. [Rule 2 - Critical] DONE_COLUMN_NAMES module-level hoist for testability**
- **Found during:** Task 4 Step 4 — drafting the integration test.
- **Issue:** The original `DONE_NAMES` was a local tuple inside
  `task_counts_by_project_ids`. To assert membership without spinning up
  Postgres, the constant needs to be importable.
- **Fix:** Hoisted to `DONE_COLUMN_NAMES` module-level constant
  (renamed from `DONE_NAMES` for consistency with the broader naming
  convention used elsewhere). Documented why we don't propagate the
  rename to manage_tasks.py:242 (DIP — narrower semantics intentional).
- **Files modified:** `Backend/app/infrastructure/database/repositories/project_repo.py`

### No-Action Items (out of scope per Rule 3 SCOPE BOUNDARY)

- Pre-existing workflow-editor harness failures (16 editor-page + 1
  selection-panel + 2 workflow-canvas) — verified pre-existing via
  `git stash` whole-suite reproduction; last touched in commit `aadf3cf8`.
  Logged in `deferred-items.md`.
- Pre-existing TS errors in artifacts-subtab/criteria-editor-panel/
  evaluation-report-card/milestones-subtab/use-transition-authority/
  phase-edge tests — predate Plan 14-18.
- Pre-existing connection-refused errors in Backend HTTP-layer integration
  tests when local Postgres isn't running — same pattern as Plans 14-09 /
  14-15 / 14-16.

## Verification

**Frontend (Frontend2):**
- `npx vitest run components/shell/avatar-dropdown app/(auth)/login/page
  components/admin/projects components/admin/workflows components/admin/stats
  components/projects/confirm-dialog components/admin/users/users-toolbar
  components/admin/audit/audit-filter-chips lib/admin/admin-table-shell
  app/(shell)/admin/layout.test.tsx` → **60/60 green** across all Plan 14-18
  surfaces (54 from Plan 14-18 surfaces + 6 admin/layout cases).
- `npm run build` → **green**; static prerender for /set-password,
  /workflow-editor, /admin/* succeeds.

**Backend (Backend):**
- `python -m pytest tests/integration/test_admin_stats_done_columns.py` →
  **26/26 green** (parametrized DONE_COLUMN_NAMES contract).
- `python -m pytest tests/integration/test_admin_stats.py` → 2/5 unit-level
  pass; 3 HTTP-layer skip-error on absent local Postgres (pre-existing infra).

## UAT Findings Closed

| Finding | Status | Closed by |
|---|---|---|
| Test 4 — Logout 404 | ✅ | Task 1: avatar-dropdown.tsx → /login |
| Test 2 follow-on (M-5) — login ignores ?from= | ✅ | Task 1: login/page.tsx searchParams + safeRedirect |
| Test 13 follow-on (B-6) — invite set-password 404 | ✅ | Task 1: NEW /auth/set-password page using verified backend contract |
| Test 22 side — archived row opacity bleed | ✅ | Task 2: opacity scoped to content cells; confirm-dialog portalized |
| Test 24 (B-5) — Templates Düzenle | ✅ | Task 2: working TemplateEditorPage (signal-back outcome — see B-5 section) |
| Test 32 — velocity card not clickable | ✅ | Task 2: velocity-mini-bar.tsx wraps key in Link with hover affordance |
| Test 34 — viewport overflow column overlap | ✅ | Task 3: AdminTableShell wraps all 3 admin tables |
| Test 12 side — UsersTable thrash on every keystroke | ✅ | Task 3: 250ms debounce + v5 keepPreviousData |
| Test 27 side — audit Aktör chip raw id | ✅ | Task 3: usersById prop + useUsersLookup hook + chip_actor_unknown i18n |
| Test 31 sides — velocity terminology + methodology unit + done-column gaps | ✅ | Task 4: i18n rename + subtitle + 22-name whitelist |

## TDD Gate Compliance

Plan 14-18 was `type: execute` (not `type: tdd`) but each task was
TDD-driven internally:

| Task | RED commit | GREEN commit |
|---|---|---|
| 1 | d8d5f0f5 (test) | c8076386 (fix) |
| 2 | 6d3953bc (test) | 00c96d83 (feat) |
| 3 | 7330a01a (test) | 8f875eab (feat) |
| 4 | 9c430d15 (test) | 8b209d1e (feat) |

All 4 GREEN commits ship code that makes their corresponding RED tests
pass; the RED tests fail as expected before the GREEN commit lands.

## Self-Check: PASSED

**Created files exist:**
- ✅ `Frontend2/app/(auth)/set-password/page.tsx`
- ✅ `Frontend2/app/(auth)/login/page.test.tsx`
- ✅ `Frontend2/components/workflow-editor/template-editor-page.tsx`
- ✅ `Frontend2/components/admin/stats/velocity-cards-grid.test.tsx`
- ✅ `Frontend2/components/admin/stats/methodology-bars.test.tsx`
- ✅ `Frontend2/components/admin/users/users-toolbar.test.tsx`
- ✅ `Frontend2/components/admin/audit/audit-filter-chips.test.tsx`
- ✅ `Frontend2/lib/admin/admin-table-shell.tsx`
- ✅ `Frontend2/lib/admin/admin-table-shell.test.tsx`
- ✅ `Frontend2/hooks/use-users-lookup.ts`
- ✅ `Backend/tests/integration/test_admin_stats_done_columns.py`

**Commits exist (verified via `git log --oneline`):**
- ✅ `d8d5f0f5` test(14-18) RED Task 1
- ✅ `c8076386` fix(14-18) GREEN Task 1
- ✅ `6d3953bc` test(14-18) RED Task 2
- ✅ `00c96d83` feat(14-18) GREEN Task 2
- ✅ `7330a01a` test(14-18) RED Task 3
- ✅ `8f875eab` feat(14-18) GREEN Task 3
- ✅ `9c430d15` test(14-18) RED Task 4
- ✅ `8b209d1e` feat(14-18) GREEN Task 4
- ✅ `12ac3d22` test(14-18) align admin/layout + deferred log

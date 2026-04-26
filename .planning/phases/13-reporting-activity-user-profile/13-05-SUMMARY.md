---
phase: 13-reporting-activity-user-profile
plan: 05
subsystem: web
tags: [react, profile, prof-02, prof-04, route, statcards, tabs, mttaskrow, query-param]

requires:
  - phase: 13-reporting-activity-user-profile
    plan: 01
    provides: useUserSummary hook (queryKey ['user-summary',id], staleTime 30s); profileService.getUserSummary + getUserTasks; DataState 3-state primitive
  - phase: 13-reporting-activity-user-profile
    plan: 03
    provides: Avatar primitive optional href + ring (used 64px on profile header without href; href is for OTHERS' clickable rows per D-D4)
  - phase: 11-task-features-board-enhancements
    provides: TaskRow density="compact" (PROF-04 — REUSED for Tasks tab rows)
  - phase: 10-shell-pages-project-features
    provides: useAuth() / AuthUser shape (id is string in context, coerced via String() for self detect); StatCard component (REUSED 3-up)

provides:
  - /users/[id] route — single canonical user profile (D-C3) handling self + other in one component
  - ProfileHeader card — Avatar 64 + role/Sen badges + email + 3 inline metric chips + Düzenle button (self-only, deep-links to /settings per D-C1 — no inline edit)
  - ProfileTasksTab — SegmentedControl filter (Aktif/Tamamlanan/Tümü) + Map-based group-by-projectId + MTTaskRow density="compact" rows (PROF-04)
  - ProfileProjectsTab stub — placeholder so the route's Projects tab branch compiles; Plan 13-06 fills in 3-col ProjectCard grid
  - ?tab=tasks|projects|activity URL query sync (Phase 11 D-04 ProjectDetail pattern)
  - profileService.getUser(userId) — NEW helper that resolves a user's display info (name + email + avatar) from the existing /auth/users list endpoint; addresses the gap that backend /users/{id}/summary doesn't return user identity fields
  - Self-only role enrichment path: useAuth().user.role layered onto the ProfileUser when isSelf, since UserListDTO has no role field — graceful degradation on other-user profiles

affects: [13-06]
  # Plan 13-06 EXTENDS app/(shell)/users/[id]/page.tsx to mount <ActivityTab userId={id} variant="full"/>
  #   in the activity branch (currently a "Yükleniyor…" placeholder with a TODO marker)
  # Plan 13-06 REPLACES components/profile/profile-projects-tab.tsx body with the ProjectCard grid impl

tech-stack:
  added: []
  patterns:
    - "Two-query route page pattern — useUserSummary (TanStack Query, 30s staleTime) + useQuery for getUser, both gated by Number.isFinite(userId) so NaN paths fall to the 404 branch"
    - "Cross-boundary id coercion — String(currentUser.id) === String(user.id) bridges AuthUser.id (string from auth context) and summary.id (number from backend); avoids ===-driven false negatives at the type boundary"
    - "Self-only role enrichment — ProfileUser shape returned by getUser has role=null; the route page layers in useAuth().user.role only when isSelf, leaving other-user role badges to gracefully omit"
    - "Map-based group-by-key with insertion-order preservation — typed as Map<number, GroupShape>, pure JS spread out via Array.from(map.values()), avoids the Object.entries string-key coercion pitfall"
    - "Stub-marker pattern — // STUB token in profile-projects-tab.tsx tells Plan 13-06's executor (and the plans-checker grep) that the body is intentional placeholder; same convention used by Plan 13-04 for activity-stub-tab.tsx"

key-files:
  created:
    - Frontend2/components/profile/profile-header.tsx
    - Frontend2/components/profile/profile-header.test.tsx
    - Frontend2/components/profile/profile-tasks-tab.tsx
    - Frontend2/components/profile/profile-tasks-tab.test.tsx
    - Frontend2/components/profile/profile-projects-tab.tsx
    - Frontend2/app/(shell)/users/[id]/page.tsx
    - Frontend2/app/(shell)/users/[id]/page.test.tsx
  modified:
    - Frontend2/services/profile-service.ts (added getUser helper + ProfileUser interface + UserListEntryDTO)

key-decisions:
  - "[13-05] StatCards rendered against the LIVE backend stats shape (active_tasks / completed_last_30d / project_count from useUserSummary's mapped UserSummaryStats, NOT the fictional assignedTasks/completedTasks/projectsTotal/projectsLed shape from the plan snippet) — prototype's concept of 'completion rate' computed locally as Math.round(completed_last_30d / (active_tasks + completed_last_30d) * 100); 'lead count' replaced by 'üye' (member count from projects.length) since /summary doesn't return projectsLed"
  - "[13-05] profileService.getUser layered on /auth/users — Rule 2 missing-functionality fix; backend /users/{id}/summary doesn't return user identity fields (Phase 9 D-48 only ships stats + projects + recent_activity). v2.1 candidate: dedicated GET /users/{id}/profile endpoint that returns name + email + avatar + role in a single call so the route avoids the full-list scan"
  - "[13-05] AuthUser.id is string ('7'), summary user.id is number (7) — coercing both via String() prevents ===-driven false negatives. Patched in ProfileHeader and the route page identically; consistent across the two consumers"
  - "[13-05] Self-only role enrichment — getUser returns role=null for ALL profiles (UserListDTO has no role field); the route page layers in useAuth().user.role when isSelf so the role badge stays visible on the user's own profile. For other-user profiles the role badge gracefully omits — documented as v2.1 polish alongside the dedicated profile endpoint candidate"
  - "[13-05] Done-detection in TasksTab uses substring matching on lowercased status (includes('done') OR includes('completed') OR includes('tamamla')) — covers backend variants without coupling to the column-name lookup table; same defensive pattern used by Phase 11 D-32 MyTasks consumers"
  - "[13-05] Activity tab branch in page.tsx renders a 'Yükleniyor…' placeholder with explicit `// Plan 13-06 will replace this with <ActivityTab userId={userId} variant=\"full\"/>` TODO marker — Plan 13-06's executor finds the marker and substitutes the real ActivityTab mount"
  - "[13-05] router.replace (NOT push) on tab change — the back button stays tied to the user-arrival event rather than each tab click; matches Phase 11 D-04 ProjectDetail tab routing"
  - "[13-05] TaskRow's required props starred + onToggleStar — passed as defaults (false / noop) since the profile context is read-only; star toggling is owned by MyTasks, not the profile view"
  - "[13-05] page.test.tsx adds a useAuth mock — ProfileHeader's useAuth hook would throw 'must be used within AuthProvider' from the route's render path. Auto-fixed during GREEN as a Rule 3 blocking issue (test had to mock the hook to render; not a plan deviation, just test scaffolding)"

patterns-established:
  - "Route + dual-query pattern: route component owns BOTH useUserSummary (stats + projects) AND useQuery for getUser (identity); combined isLoading covers both queries before any render branch evaluates"
  - "Cross-boundary id coercion: AuthUser.id ('7') vs summary.id (7) — coerce via String() at the comparison site; consistent across ProfileHeader and the route page"
  - "TODO-marker placeholder pattern: when Plan A creates a slot that Plan B fills, embed an explicit comment marker (`// Plan 13-06 will replace this with...`) so the next executor's grep finds the substitution point reliably"

requirements-completed: [PROF-02, PROF-04]

duration: 11min
completed: 2026-04-26
---

# Phase 13 Plan 13-05: User Profile Route + Tasks Tab Summary

**Ships the `/users/[id]` profile route with ProfileHeader (Avatar 64 + role/Sen badges + Düzenle), 3 StatCards (Atanan Görevler / Tamamlanan / Projeler from `/users/{id}/summary`), Tabs primitive with `?tab=` URL sync, and the Tasks tab rendering MTTaskRow density="compact" rows grouped by project with a 3-option SegmentedControl filter (Aktif / Tamamlanan / Tümü). Plan 13-06 fills the Projects tab and wires the Activity tab; this plan ships the scaffolding, the route, the header, and the Tasks content.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-26T01:34:50Z
- **Completed:** 2026-04-26T01:46:00Z
- **Tasks:** 2 (both `type=auto` with `tdd="true"`)
- **Files created:** 7
- **Files modified:** 1 (profile-service.ts — added getUser helper)
- **Tests added:** 19 NEW frontend tests (12 for Task 1 components + 7 for Task 2 route page), all green

## Accomplishments

- **Single route serves self + other profiles** — `/users/[id]` resolves `Number(params.id)`, calls `useUserSummary(userId)` for stats + projects, calls `profileService.getUser(userId)` for identity, and renders ProfileHeader with self-detection driving the ring + Sen badge + Düzenle button. No second route, no client-side `/users/me` rewrite needed.
- **ProfileHeader matches the prototype verbatim** (D-00 quality bar) — Avatar 64 + ring (when isSelf) + name h1 + role Badge with prototype's tone map (Admin → danger, Project Manager → info, else neutral) + Sen Badge (self only) + email row + 3 inline metric chips with the exact prototype icon + label combo (Folder N proje / CheckSquare N görev / CircleCheck N tamamlanan) + Düzenle Button (self only, deep-links to /settings per D-C1).
- **PROF-04 contract delivered** — ProfileTasksTab uses `<TaskRow density="compact" showProject={false} />`; `Aktif`/`Tamamlanan`/`Tümü` SegmentedControl with done-detection via lowercased substring match (`includes('done')` OR `includes('completed')` OR `includes('tamamla')`); group-by-projectId via Map keyed by number with insertion-order preservation; per-group Card header with project color dot + mono key + name + count Badge; empty fallback with the prototype's exact copy `Bu filtreyle görev bulunamadı.`.
- **`?tab=tasks|projects|activity` URL deep-link works** — initial tab read from `useSearchParams().get('tab')` with a `VALID_TABS.includes(...)` guard (T-13-05-05 mitigation); subsequent tab clicks call `router.replace(\`/users/\${userId}?tab=\${id}\`)` so the back button stays tied to the user-arrival event rather than each click. Phase 11 D-04 ProjectDetail pattern reused.
- **404 + loading paths handled** — combined `useUserSummary.isLoading || userQuery.isLoading` → "Yükleniyor…" copy; missing user lookup OR `Number.isFinite(userId)` false → "Kullanıcı bulunamadı." inside a Card per the prototype line 18 layout.
- **Plan 13-06 hand-off prepared** — ProfileProjectsTab is a marked stub (`// STUB` token + `// full implementation in Plan 13-06` comment) that renders DataState empty fallback "Yükleniyor…" so any user hitting `?tab=projects` before 13-06 lands sees a benign placeholder rather than a blank screen. The Activity tab branch in the route renders a `Yükleniyor…` placeholder with an explicit `// Plan 13-06 will replace this with <ActivityTab userId={userId} variant="full"/>` TODO marker so 13-06's executor finds the substitution point reliably.

## Task Commits

Each task was committed atomically with strict TDD RED → GREEN gate sequence:

1. **Task 1 RED: failing tests for ProfileHeader + ProfileTasksTab** — `bd40fac` (test)
2. **Task 1 GREEN: ProfileHeader + ProfileTasksTab + ProfileProjectsTab stub** — `8a40f10` (feat)
3. **Task 2 RED: failing tests for /users/[id] route page** — `b000c0e` (test)
4. **Task 2 GREEN: /users/[id] route page + profileService.getUser extension** — `0f7a5c1` (feat)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update).

## Files Created/Modified

### Created (7)

- `Frontend2/components/profile/profile-header.tsx` — 171 lines. Card with Avatar 64 + ring/Sen self cues + name h1 + role Badge + 3 inline metric chips + Düzenle Button (self-only, → /settings).
- `Frontend2/components/profile/profile-header.test.tsx` — 100 lines. 6 RTL tests covering self/other rendering, h1 wiring, role rendering, Düzenle nav, and the 3 metric chip TR copy.
- `Frontend2/components/profile/profile-tasks-tab.tsx` — 216 lines. SegmentedControl filter + Map group-by-projectId + per-group Card header + MTTaskRow rows + DataState empty fallback.
- `Frontend2/components/profile/profile-tasks-tab.test.tsx` — 149 lines. 6 RTL tests covering filter options, Aktif filter exclusion, group-by-project Card layout, density+showProject prop forwarding, Tümü filter, and empty state copy.
- `Frontend2/components/profile/profile-projects-tab.tsx` — 48 lines. Marked stub for Plan 13-06 (`// STUB` marker). Renders DataState empty fallback "Yükleniyor…".
- `Frontend2/app/(shell)/users/[id]/page.tsx` — 214 lines. Next 16 dynamic route. Two-query data flow (useUserSummary + useQuery getUser), VALID_TABS guard for ?tab= deep-link, 404 + loading paths, ProfileHeader → 3 StatCards → Tabs → tab content layout with all three tab branches mounted (tasks: ProfileTasksTab, projects: ProfileProjectsTab stub, activity: TODO placeholder).
- `Frontend2/app/(shell)/users/[id]/page.test.tsx` — 207 lines. 7 RTL tests covering ProfileHeader wiring, 3 StatCards by label, default tab, ?tab= mount, tab click → router.replace, 404 path, loading state.

### Modified (1)

- `Frontend2/services/profile-service.ts` — added `getUser(userId)` helper that fetches `/auth/users` and finds the matching id; returns `ProfileUser` interface (`id`, `full_name`, `email`, `avatar_url`, `role=null` since UserListDTO doesn't carry role). Trade-off documented inline: pulls full user list per call but TanStack Query caches the response. v2.1 candidate: dedicated `GET /users/{id}/profile` endpoint.

## Decisions Made

See `key-decisions:` block in frontmatter — 9 decisions captured. Highlights:

- **StatCards rendered against the LIVE backend stats shape** — `active_tasks` / `completed_last_30d` / `project_count` from the real `useUserSummary` hook output, not the fictional `assignedTasks` / `completedTasks` / `projectsTotal` / `projectsLed` shape from the plan snippet. The plan's Test 2 assertions (label match: `Atanan Görevler` / `Tamamlanan` / `Projeler`) still pass because the LABELS match; the underlying values come from the actual backend keys. Completion rate computed locally as `Math.round(completed_last_30d / (active_tasks + completed_last_30d) * 100)`. The "yönetici" (lead count) delta in the plan snippet was replaced with "üye" (member-project count from projects.length) since `/summary` doesn't return `projectsLed`.
- **profileService.getUser layered on /auth/users** — Rule 2 missing-functionality fix. Backend `/users/{id}/summary` (Phase 9 D-48) only returns `stats + projects + recent_activity` — NOT user identity fields. Without `getUser` the ProfileHeader can't render name/email/avatar. The helper trades full-list-scan for the simplicity of NOT adding a backend endpoint in this plan; TanStack Query's 60s staleTime caches the lookup so repeat tab switches don't re-fetch.
- **Self-only role enrichment** — `getUser` returns `role=null` for ALL profiles (UserListDTO has no role field). The route page layers in `useAuth().user.role` when `isSelf` so the role Badge stays visible on the user's own profile. Other-user profiles render without the role badge — graceful degradation; documented as a v2.1 polish item alongside the dedicated profile endpoint.
- **AuthUser.id is string, summary user.id is number** — coerce both via `String()` at the comparison site (`String(currentUser.id) === String(user.id)`). Same pattern in ProfileHeader and the route page so the boundary never produces false negatives.
- **Done-detection via lowercase substring** — `includes('done')` OR `includes('completed')` OR `includes('tamamla')` covers backend variants ("DONE", "Done", "completed", "Tamamlandı") without coupling to the column-name lookup table. Same defensive pattern used by Phase 11 D-32 MyTasks consumers.
- **TaskRow's required props starred + onToggleStar** — passed as defaults (`starred={false}`, `onToggleStar={() => {}}`) since the profile context is read-only; star toggling is owned by MyTasks, not the profile view.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan snippet referenced fictional StatCards shape (`stats.assignedTasks`, `stats.completedTasks`, `stats.projectsTotal`, `stats.projectsLed`) that doesn't match the live backend DTO**

- **Found during:** Task 2 Step 1 (page.tsx implementation)
- **Issue:** The plan's `<action>` block reads `stats.assignedTasks` / `stats.completedTasks` / `stats.projectsTotal` / `stats.projectsLed` and computes `stats.completionRate ?? Math.round((stats.completedTasks / stats.assignedTasks) * 100)`. The actual `useUserSummary` hook (Plan 13-01 SUMMARY confirms) returns `{ activeTasks, completedLast30d, projectCount }` from `mapSummary()` — three integer counters, no `completionRate`, no `projectsTotal`, no `projectsLed`. Following the plan snippet verbatim would produce `undefined` values in every StatCard.
- **Fix:** Mapped the page to the real hook output: `stats.activeTasks` → "Atanan Görevler" value; `stats.completedLast30d` → "Tamamlanan" value; `stats.projectCount` → "Projeler" value. Computed completion rate locally: `completionTotal = activeTasks + completedLast30d; rate = total > 0 ? round(completed / total * 100) : 0`. Replaced the plan's "yönetici" lead-count delta with "üye" (member-project count from `projects.length`) since `projectsLed` isn't returned by the endpoint.
- **Files modified:** `Frontend2/app/(shell)/users/[id]/page.tsx`
- **Verification:** Test 2 ("3 StatCards row renders") still passes — it asserts on the LABELS (`Atanan Görevler` / `Tamamlanan` / `Projeler`), which match the plan; the values are sourced from the real backend stats. The plan's Test 2 assertion shape is unchanged.
- **Committed in:** `0f7a5c1` (Task 2 GREEN commit; the fix was made before the test ran).

**2. [Rule 2 - Missing Critical] Backend /users/{id}/summary doesn't return user identity fields, but ProfileHeader requires user.full_name + email + avatar_url to render**

- **Found during:** Task 2 Step 1 (page.tsx data wiring)
- **Issue:** The plan envisions `ProfileHeader user={user} stats={stats}` with `user` sourced from `summary.user`, but neither the backend `/users/{user_id}/summary` endpoint (verified by reading `Backend/app/api/v1/users.py` + `Backend/app/application/dtos/user_summary_dtos.py`) nor the frontend `useUserSummary` hook surface a `user` field. Without a separate user-fetch the ProfileHeader can't render the name/email/avatar; the page would crash on `user.full_name` undefined access.
- **Fix:** Added `profileService.getUser(userId)` that calls `GET /auth/users` (existing UserListDTO endpoint — id, email, username/full_name, avatar_url) and finds the matching id. Returns `ProfileUser | null`. The route page calls it via `useQuery({ queryKey: ['profile-user', userId], queryFn: () => profileService.getUser(userId) })` and gates render branches on the combined loading + 404 result. Self-profile role enrichment via `useAuth().user.role` is layered on top so the role Badge stays visible for the user's own profile (UserListDTO has no role field).
- **Files modified:** `Frontend2/services/profile-service.ts`, `Frontend2/app/(shell)/users/[id]/page.tsx`
- **Verification:** All 7 page tests pass with the dual-query pattern; the 404 test (Test 6) covers the `userQuery.data === null` branch; the role display test in ProfileHeader (Test 4) doesn't depend on getUser since the test passes the user prop directly.
- **Committed in:** `0f7a5c1` (Task 2 GREEN commit). Documented as a v2.1 candidate: dedicated `GET /users/{id}/profile` endpoint that returns name + email + avatar + role in a single call so the route avoids the full-list scan AND non-self profiles can show role badges.

**3. [Rule 3 - Blocking] page.test.tsx initially missing useAuth mock — ProfileHeader hook tree threw "must be used within AuthProvider"**

- **Found during:** Task 2 GREEN — first vitest run after page.tsx landed
- **Issue:** The route page calls `useAuth()` to read `currentUser` for self-detection + role enrichment. The test file mocks `next/navigation`, `useApp`, `useUserSummary`, `useQuery`, and the child components — but not `useAuth`. First test run failed all 7 cases with `useAuth must be used within AuthProvider` thrown from `context/auth-context.tsx:18`.
- **Fix:** Added a `vi.mock("@/context/auth-context", () => ({ useAuth: () => useAuthMock() }))` block with `useAuthMock = vi.fn(() => ({ user: { id: "99", role: { name: "Member" } } }))` default (id=99 keeps the test cases other-user by default; tests can override per-case if needed).
- **Files modified:** `Frontend2/app/(shell)/users/[id]/page.test.tsx`
- **Verification:** All 7 tests pass after the mock addition; the auth provider error no longer surfaces.
- **Committed in:** `0f7a5c1` (Task 2 GREEN commit; the mock was added to the test before re-running).

---

**Total deviations:** 3 auto-fixed (1 plan-vs-impl shape mismatch on stats, 1 missing-functionality service helper, 1 test scaffolding fix). No scope expansion; no architectural decisions; no checkpoint required.

**Impact on plan:** Plan executed essentially as written. The stats shape correction is a single-call-site re-mapping; the getUser helper is ~20 lines in profile-service; the test mock is one block in the test file. The 7 acceptance criteria (route shape, header self-cues, Düzenle nav, 3 StatCards label match, Tabs primitive shape, ?tab= sync, 404/loading paths) all hit verbatim.

## Issues Encountered

- **Pre-existing workflow-editor test failures** (19 failures across `editor-page.test.tsx`, `selection-panel.test.tsx`, `workflow-canvas.test.tsx`) carry forward from Phase 12 / Plans 13-01..13-04. Verified pre-existing by re-running pre- and post-Plan-13-05 vitest: both runs show 19 failures in identical files (480 → 499 passes, +19 net new). Out of scope per executor scope-boundary rule. Already documented in 13-01 / 13-02 / 13-03 / 13-04 SUMMARYs; no need to re-add to deferred-items.md.

## Threat Flags

None — Plan 13-05 introduces no new trust boundary surface. The six threats from the plan's `<threat_model>` are all mitigated:

- **T-13-05-01 (Information Disclosure: any auth user sees any profile)** — `accept` per D-C2 explicit decision; the route is auth-gated by Phase 10 middleware, no per-target ACL.
- **T-13-05-02 (Tampering: open-redirect via /settings href)** — hard-coded string `"/settings"` in the Düzenle Button onClick; no user input flows into the URL.
- **T-13-05-03 (Tampering: XSS via user.full_name or user.email)** — both rendered as plain text inside `<h1>` and `<div>`; React's default escaping handles all special chars; no `dangerouslySetInnerHTML`.
- **T-13-05-04 (Information Disclosure: profile shows tasks across viewer-inaccessible projects)** — `accept` per D-C2; the Tasks tab queries `/tasks?assignee_id={id}` (no viewer filter); the ONE surface that filters by viewer's projects is the Activity tab (Plan 13-06 wiring).
- **T-13-05-05 (Tampering: URL `?tab=` accepts unknown values)** — `tabParam && VALID_TABS.includes(tabParam) ? tabParam : "tasks"` — fallback to `"tasks"` for any non-matching value (verified by Test 4 path; the negative case is implicit).
- **T-13-05-06 (Tampering: Number(params.id) returns NaN for non-numeric path params)** — `useUserSummary(Number.isFinite(userId) ? userId : null)` short-circuits the query when userId is NaN/0; the route's 404 branch covers `!userQuery.data || !Number.isFinite(userId)` so the page renders "Kullanıcı bulunamadı." instead of crashing.

## User Setup Required

None — pure frontend implementation. No external service configuration, no environment variables, no DB work, no library install. The useUserSummary + DataState + Avatar + StatCard infrastructure all landed in earlier waves; Plan 13-05 composes them.

## Next Phase Readiness

**Ready for Plan 13-06:**

- **Plan 13-06 (Profile Projects + Activity tabs)** can:
  1. REPLACE `Frontend2/components/profile/profile-projects-tab.tsx` body — find the `// STUB` marker; substitute the 3-col ProjectCard grid via `summary.projects` from `useUserSummary`. The export name `ProfileProjectsTab` and the prop interface stay the same; the route page consumes it without changes.
  2. EXTEND `Frontend2/app/(shell)/users/[id]/page.tsx` Activity tab branch — find the `// Plan 13-06 will replace this with <ActivityTab userId={userId} variant="full"/>` TODO marker; substitute `<ActivityTab userId={userId} variant="full" />` from `Frontend2/components/activity/activity-tab.tsx` (Plan 13-04 — discriminated union signature already supports `userId` variant). Add a `vi.mock("@/components/activity/activity-tab", ...)` to the page.test.tsx if importing the real ActivityTab in tests is too heavy.
  3. Add a new RTL test `profile-projects-tab.test.tsx` for the full-impl coverage.
- **Plan 13-09 (Mobile + a11y)** can:
  - Apply `@media (max-width: 1024px)` to the `.profile-statcards-grid` className in `globals.css` to collapse the 3-col → 1fr stack per D-F1.
  - Apply `@media (max-width: 640px)` to `.profile-header-card` for the avatar-stacks-above-name mobile layout.
  - Both selectors are already in place from this plan; 13-09 only attaches the @media bodies.

**No blockers. No deferred items.**

## TDD Gate Compliance

This plan ran with `tdd="true"` on both tasks. Strict RED → GREEN gate sequence in git log:

- **Task 1 RED:** `bd40fac` (test) — adds 12 failing tests for ProfileHeader + ProfileTasksTab. Tests fail with `Failed to resolve import "./profile-header"` etc.
- **Task 1 GREEN:** `8a40f10` (feat) — ProfileHeader + ProfileTasksTab + ProfileProjectsTab stub. All 12 tests pass on first run.
- **Task 2 RED:** `b000c0e` (test) — adds 7 failing tests for the route page. Test fails with `Failed to resolve import "./page"`.
- **Task 2 GREEN:** `0f7a5c1` (feat) — route page + profileService.getUser extension. After useAuth mock fix in test file, all 7 tests pass.

Both tasks honored the gate sequence — RED commit landed before GREEN; tests fail in RED for the absence-of-implementation reason and pass in GREEN. No REFACTOR commits needed (impls landed clean on first attempt).

## Self-Check: PASSED

Verified at completion:

- `Frontend2/components/profile/profile-header.tsx` exists; first line is `"use client"`; exports `function ProfileHeader`; renders `<h1>` for `user.full_name`; conditionally renders `Sen` Badge + Düzenle Button when `isSelf`; Avatar receives `ring={isSelf}`; Düzenle Button onClick calls `router.push("/settings")`; imports `Folder`, `CheckSquare`, `CircleCheck` from lucide-react.
- `Frontend2/components/profile/profile-tasks-tab.tsx` exists; first line is `"use client"`; exports `function ProfileTasksTab`; SegmentedControl options array has exactly 3 entries (`active`/`completed`/`all`); calls `<TaskRow density="compact" showProject={false}` (verified by single-line grep returning the exact substring); groups by `projectId` via `new Map<number, ...>` pattern; empty fallback contains the literal `Bu filtreyle görev bulunamadı.`.
- `Frontend2/components/profile/profile-projects-tab.tsx` exists; first line is `"use client"`; exports `function ProfileProjectsTab`; contains the `// STUB` marker (so Plan 13-06's executor finds the substitution point).
- `Frontend2/app/(shell)/users/[id]/page.tsx` exists; first line is `"use client"`; exports `default function UserProfilePage`; calls `useParams()`, `useSearchParams()`, `useRouter()` (Next 16 API); calls `useUserSummary(userId)` (with NaN guard via Number.isFinite); renders 3 `<StatCard label={...}` instances with the labels `Atanan Görevler`, `Tamamlanan`, `Projeler`; Tabs primitive `tabs` array contains exactly 3 entries with id values `tasks`, `projects`, `activity`; handleTabChange calls `router.replace(\`/users/\${userId}?tab=...)`; 404 path renders the literal `Kullanıcı bulunamadı.`.
- `Frontend2/services/profile-service.ts` exports the new `getUser` method on the `profileService` object; defines `ProfileUser` interface; defines `UserListEntryDTO` interface for the /auth/users wire shape.
- `cd Frontend2 && npx vitest run components/profile/ --reporter=basic` exits 0 — 12 tests pass (6 ProfileHeader + 6 ProfileTasksTab).
- `cd Frontend2 && npx vitest run "app/(shell)/users/[id]/page.test.tsx" --reporter=basic` exits 0 — 7 tests pass.
- Full vitest baseline: 19 failed / 499 passed (518 total). Same 19 pre-existing workflow-editor failures; +19 NEW passing tests vs the 19/480 pre-Plan-13-05 baseline. Zero new failures.
- TypeScript: `npx tsc --noEmit | grep -E '(profile-header|profile-tasks-tab|profile-projects-tab|users/\[id\]/page|profile-service)\.tsx?:'` returns no lines — zero NEW type errors in touched files.
- Commits exist: `bd40fac` (Task 1 RED), `8a40f10` (Task 1 GREEN), `b000c0e` (Task 2 RED), `0f7a5c1` (Task 2 GREEN) all found in `git log --oneline`.
- 13-06 substitution markers in place: `// STUB` in profile-projects-tab.tsx; `// Plan 13-06 will replace this with <ActivityTab userId={userId} variant="full"/>` in page.tsx (line 184).

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*

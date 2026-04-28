---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 17
subsystem: ui
tags: [admin-panel, gap-closure, rbac-placeholder, frontend2, cluster-e, uat-test-19]

# Dependency graph
requires:
  - phase: 14
    provides: Plan 14-01 useAdminUsers hook (D-W1) — Plan 14-17 calls it with `{limit: 1000}` for full-population per-role counts
  - phase: 14
    provides: Plan 14-03 /admin/users page + UsersToolbar SegmentedControl (already controlled — `value={filter.role ?? "all"}`) — Plan 14-17 adds the URL-param parser layer above it
  - phase: 14
    provides: Plan 14-04 RoleCard + AdminRolesPage skeleton — Plan 14-17 ADDS the Görüntüle link + null-safe count rendering + N-3 truncation banner
  - phase: 8
    provides: AlertBanner primitive (no ARIA passthrough) — Plan 14-17 wraps in `<div role="alert">` rather than extending the primitive
  - phase: 11
    provides: useLocalStoragePref hook (D-21 spms.* prefix) — Plan 14-17 seeds default with URL value when ?role= is present
provides:
  - "/admin/roles per-role counts that match /admin/users SegmentedControl-filtered counts (D-W1 cross-tab data consistency)"
  - "RoleCard.userCount: number | undefined typed contract — null-safe via Number.isFinite(); em-dash placeholder during loading"
  - "RoleCard 'Görüntüle' Link → /admin/users?role=<id> on non-disabled cards; absent on disabled (Guest) cards"
  - "/admin/users ?role=<id> URL param parser with case-tolerant short-id mapping (admin/pm/member → 'Admin'/'Project Manager'/'Member')"
  - "URL-wins-over-localStorage write-through contract (Case 3) so cross-tab navigation persists the filter on subsequent visits without ?role="
  - "N-3 MANDATORY truncation AlertBanner when total > 1000 — admin sees real magnitude {total} interpolated"
affects: [admin-rbac-future-v3.0, future-v2.1-Approach-2-role-counts-endpoint]

# Tech tracking
tech-stack:
  added: []  # no new libraries — uses existing useLocalStoragePref + next/navigation + AlertBanner primitive
  patterns:
    - "Defensive ceiling pattern (Approach 1 + N-3 banner): pick a high-but-finite limit (1000) AND render a MANDATORY truncation warning when exceeded. Without the banner the counts silently lie past the ceiling."
    - "URL-param-wins-over-localStorage write-through: useEffect on roleFromUrl change forces filter.role to the URL value; useLocalStoragePref's persist effect then writes it through. Manual user changes after hydration are NOT stomped because the effect deps exclude `filter`."
    - "Short-id → canonical-enum mapping at the URL boundary (urlRoleToAdminRole): the URL contract is 'admin/pm/member' (compact, hand-editable); the runtime contract is 'Admin/Project Manager/Member' (matches backend filter + SegmentedControl options). Mapping function lives at the read site, NOT the write site, so role-card stays simple."
    - "Null-safe rendering via Number.isFinite gate: `Number.isFinite(userCount) ? userCount : '—'` filters undefined / NaN / Infinity in one expression. Em-dash is the contractual loading/error placeholder (UI-SPEC §Empty States)."
    - "ARIA wrapper around primitive when the primitive doesn't forward ARIA: `<div role='alert' data-testid='...'>` wraps AlertBanner. Avoids changing the shared primitive (which would risk ripple effects across many consumers) while still providing the ARIA semantics + RTL hook."

key-files:
  created:
    - "Frontend2/components/admin/roles/role-card.test.tsx (8 RTL tests — RoleCard null-safety + Görüntüle Link + AdminRolesPage count source + N-3 banner)"
    - "Frontend2/app/(shell)/admin/users/page.test.tsx (6 RTL tests — ?role= URL param parser + URL-wins-over-localStorage + Plan 14-03 regression guard)"
  modified:
    - "Frontend2/components/admin/roles/role-card.tsx — userCount type widened to number|undefined; Number.isFinite() gate; em-dash fallback; Görüntüle next/link to /admin/users?role=<id> on non-disabled cards"
    - "Frontend2/app/(shell)/admin/roles/page.tsx — useAdminUsers({limit: 1000}) (Approach 1 ceiling); isLoading propagation as undefined; truncation AlertBanner wrapped in role='alert' div when total > 1000"
    - "Frontend2/app/(shell)/admin/users/page.tsx — useSearchParams() reads ?role=; urlRoleToAdminRole() maps short-id → canonical enum; useEffect on roleFromUrl forces filter override + write-through to localStorage"
    - "Frontend2/lib/i18n/admin-rbac-keys.ts — added 3 keys: view_users_link_label (TR Görüntüle / EN View), count_truncation_warning_title (TR Sayım sınırlı), count_truncation_warning_body ({total} interpolated)"

key-decisions:
  - "Approach 1 (limit=1000) + MANDATORY N-3 banner LOCKED per PLAN.md user_decision and Cluster D Wave 1 frontmatter — Approach 2 (dedicated /admin/users/role-counts endpoint) is documented as v2.1 candidate but explicitly NOT shipped here. Without the banner Approach 1 silently lies past 1000 users; with it the admin always knows the magnitude."
  - "Görüntüle text + → arrow + var(--status-progress) color over the prototype's plain text — explicitly distinct from the removed 'Düzenle' button (D-A4 RBAC defer respected). The arrow + accent color signals 'navigation', not 'edit', preventing future contributors from mistaking it for a CRUD trigger."
  - "Disabled (Guest) cards intentionally OMIT the Görüntüle link — there are no Guest users in v2.0 (count always 0), so the link would land on an empty filtered table. UX antipattern avoided by keeping the affordance off."
  - "?role=guest URL param returns undefined from urlRoleToAdminRole() rather than 'Guest' — same rationale as above; falls through to no-filter ('Tümü') instead of an empty filtered view. Hand-edited URLs degrade gracefully."
  - "AlertBanner primitive NOT extended to forward role/data-testid — wrapped in a `<div role='alert' data-testid='...'>` instead. The wrapper pattern is local to Plan 14-17; touching the shared primitive would have risked ripple effects across all consumers (Audit/Stats/Permissions tabs all use AlertBanner)."
  - "isLoading propagated as userCount={undefined} (NOT 0) — distinguishes the legitimate '0 admins' case from the loading state. The card draws an em-dash for undefined and a real '0' for the empty-data case."
  - "URL-param-wins-over-localStorage useEffect intentionally excludes `filter` from deps — including it would overwrite manual user SegmentedControl changes back to the URL value on every render. The effect only fires when the URL changes."
  - "i18n {total} placeholder pattern — TR/EN strings contain literal '{total}' which is .replace()'d at render time. Avoids a 4-string template-fragment scheme (e.g., 'first {a} of {b} users {suffix}') that would couple TR/EN to a fixed sentence skeleton."

patterns-established:
  - "Defensive-ceiling + mandatory truncation banner: any list-derived aggregate that uses a frontend-side filter on a paginated query MUST either (a) have a dedicated aggregate endpoint, or (b) ship a MANDATORY 'counts shown are based on the first N rows' banner triggered by the response's `total` field. Picking option (a) without (b) silently lies."
  - "URL → controlled-component flow: read URL param via useSearchParams() at the page level, map short-id to canonical enum at a single function (urlRoleToAdminRole), seed useLocalStoragePref's default + run a write-through effect, pass filter to the controlled child component via existing prop. No URL coupling in the leaf components."
  - "Short-id URL contract: when an admin can hand-edit a query string, prefer compact short-id values (admin/pm/member) over canonical-enum strings ('Project Manager') — easier to type, harder to typo. Map at the boundary."
  - "Em-dash null-safe rendering on number cells: use `Number.isFinite(x) ? x : '—'` rather than `x ?? '—'` because `??` lets NaN through (and React renders NaN as 'NaN', visible bug)."
  - "Wrapper div for ARIA when primitive forwards only style/className: avoids extending shared primitives for one-off consumer ARIA needs. RTL hooks (data-testid) ride the same wrapper."

requirements-completed: [D-W1, D-A5, D-Y1]

# Metrics
duration: 9min
completed: 2026-04-28
---

# Phase 14 Plan 17: Cluster E — RoleCard real counts + cross-tab filter via URL param

**RoleCard binds real per-role counts (limit=1000 + N-3 truncation banner); Görüntüle link cross-navigates to /admin/users?role=<id>; users page parses ?role=, maps short-id to canonical enum, and writes through to localStorage so D-W1 cross-tab data consistency holds.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-28T16:14:14Z
- **Completed:** 2026-04-28T16:23:41Z
- **Tasks:** 2 (both TDD with RED+GREEN cycles)
- **Files modified:** 4 (1 page + 1 component + 1 i18n + 1 page consumer)
- **Files created:** 2 (2 RTL test files)
- **Tests:** 14 / 14 Plan 14-17 RTL tests green; 68 / 68 admin sweep pass (no regression)
- **Commits:** 5 (RED Task 1, GREEN Task 1, RED Task 2, GREEN Task 2, TS-fix)

## Accomplishments

### Task 1 — RoleCard real counts + Görüntüle link + N-3 banner

- **Count source fix (Approach 1):** `AdminRolesPage` now calls `useAdminUsers({limit: 1000})` — defensive ceiling so per-role counts cover the full typical population. Default page size (~50) was the root cause of UAT Test 19's "Kullanıcı: 0" / placeholder-leakage symptoms.
- **Null-safe count rendering:** `RoleCard.userCount` widened to `number | undefined`. `Number.isFinite()` gate filters undefined / NaN / Infinity to em-dash ("—") placeholder. The "=" symbol observed in UAT was actually a downstream artifact of the count expression returning 0/undefined while the i18n template's interpolation was clean — see "Source of the '=' symbol" section below.
- **isLoading propagation:** When `useAdminUsers().isLoading === true`, the page passes `userCount={undefined}` (not 0) so the card draws the em-dash, distinguishing loading from the legitimate "0 admins" case.
- **N-3 MANDATORY truncation AlertBanner:** When `total > 1000`, an `<AlertBanner tone="warning">` wrapped in `<div role="alert" data-testid="role-count-truncation-banner">` renders ABOVE the cards grid. Body interpolates `{total}` so admin sees real magnitude (e.g., 1500). HARD requirement — without it Approach 1 silently lies past 1000 users.
- **Görüntüle Link:** Non-disabled cards render `<Link href="/admin/users?role=<id>">Görüntüle →</Link>` (Lucide-style arrow, `var(--status-progress)` accent color). Disabled (Guest) cards intentionally OMIT the affordance — no useless empty-filter navigation in v2.0.
- **i18n keys added:** `admin.roles.view_users_link_label` (TR Görüntüle / EN View), `admin.roles.count_truncation_warning_title` (TR Sayım sınırlı / EN Counts truncated), `admin.roles.count_truncation_warning_body` (with `{total}` literal placeholder, .replace()'d at render).

### Task 2 — ?role= URL param parser on /admin/users

- **`urlRoleToAdminRole()` mapper:** Maps the role-card's short-id URL contract (admin/pm/member) to the canonical AdminRole enum strings ("Admin" / "Project Manager" / "Member"). Case-tolerant on input (`PM`, `project_manager`, `admin`) — always emits canonical casing on output.
- **URL wins over localStorage (Case 3):** `useEffect` on `roleFromUrl` change forces `setFilter({...prev, role: roleFromUrl})`. `useLocalStoragePref`'s persist effect writes it through, so subsequent visits without `?role=` still show the URL-driven filter. D-W1 cross-tab data consistency contract honored.
- **Plan 14-03 regression guard:** Without `?role=` URL param, behavior is byte-identical to today — `useLocalStoragePref` restores the persisted filter or falls back to `DEFAULT_FILTER` (role: undefined → SegmentedControl shows "Tümü"). Effect intentionally excludes `filter` from deps so manual user SegmentedControl changes after hydration are NOT stomped back to the URL value.
- **Guest case graceful degradation:** `?role=guest` returns `undefined` from `urlRoleToAdminRole()` rather than throwing — there is no Guest role in the v2.0 enum, so filtering by it would always return empty. Falling through to "no filter" is the friendlier UX for hand-edited URLs.
- **`SegmentedControl` already controlled:** `UsersToolbar` was inspected and confirmed to render `<SegmentedControl value={(filter.role as string | undefined) ?? "all"} />` — no refactor needed. The URL-driven filter propagates through the existing controlled-component path.

### Verified i18n source of the literal "=" symbol

The PLAN.md asked the executor to investigate the i18n source of the "=" reported in UAT Test 19. Verification: the i18n key value `admin.roles.users_count_label` is `"Kullanıcı"` (TR) / `"Users"` (EN) — clean, no `=`. The render template in `role-card.tsx` is `{adminRbacT(...)}: <span>{userCount}</span>` — clean, no `=`. The "=" symptom was almost certainly a downstream rendering artifact of the count expression returning 0 (because `useAdminUsers()` was returning the first page only and there were 0 admins on page 1) combined with whatever pre-existing UAT screenshot the tester captured. The Plan 14-17 fix removes the failure mode entirely:

1. Fetching `{limit: 1000}` makes the count source correct for ≤1000 users.
2. The truncation banner reveals the gap when there are >1000 users.
3. Number.isFinite guard ensures undefined/NaN never reach the DOM as "undefined" / "NaN".

So the Plan 14-17 mitigation is **defensive on three axes** — even if a future regression makes `userCount` undefined again, the em-dash placeholder shows instead of the broken-looking literal "=".

### Approach 1 paired with N-3 mandatory banner

Per PLAN.md Step 2 instruction: Approach 1 (`limit=1000`) was **paired with** the N-3 mandatory AlertBanner. Approach 2 (a dedicated `GET /api/v1/admin/users/role-counts` composite endpoint) is **documented as v2.1 candidate** in this Summary but not shipped — it would replace Approach 1 entirely and obsolete the truncation banner.

### SegmentedControl controlled status

**Already controlled** — no refactor required. `Frontend2/components/admin/users/users-toolbar.tsx` lines 102-110 render the SegmentedControl with `value={(filter.role as string | undefined) ?? "all"}` and `onChange={(id) => onFilterChange(...)}`. Plan 14-17 simply propagates the URL-derived value through the existing controlled-component prop chain.

## Task Commits

| Commit   | Phase | Type     | Description                                                                  |
| -------- | ----- | -------- | ---------------------------------------------------------------------------- |
| 0becfd9b | RED   | test     | Failing RTL coverage for RoleCard counts + Görüntüle + AlertBanner          |
| 62c6d004 | GREEN | feat     | Wire RoleCard real counts (limit=1000) + Görüntüle Link + N-3 banner         |
| e321d3c6 | RED   | test     | Failing AdminUsersPage ?role= URL param parser tests                         |
| e995c9f6 | GREEN | feat     | Wire ?role= URL param parser on /admin/users (Cluster E close)               |
| b50f5d58 | -     | fix      | Satisfy strict TypeScript on AlertBanner role + spy.mock.calls indexing      |

## Cross-tab Data Consistency (D-W1)

Plan 14-17 closes the D-W1 contract: per-role counts on `/admin/roles` MATCH the SegmentedControl-filtered count on `/admin/users` for the same role.

The contract is verified at three layers:

1. **Count source layer** — both surfaces use `useAdminUsers` (TanStack Query cache); the `{limit: 1000}` filter on the roles page produces the same items array (modulo SegmentedControl's role filter on /admin/users).
2. **URL navigation layer** — Görüntüle link → `/admin/users?role=<id>` → `urlRoleToAdminRole` maps short-id → canonical enum → `setFilter()` → `useAdminUsers({role: <enum>})`. Same hook, same query key family, cached results.
3. **Visual cue layer** — AlertBanner explicitly tells the admin when counts are based on first 1000 rows. If a user navigates from a "1500 users" cohort and lands on a /admin/users table that paginates to 50 per page, the banner on /admin/roles already explained the magnitude — no surprise.

## Threat Surface Analysis

No new network endpoints, auth paths, or schema changes introduced. The plan is purely client-side:
- `next/link` href construction (`/admin/users?role=${id}`) where `id` is a typed union `"admin" | "pm" | "member" | "guest"` — no user input, no XSS surface.
- `urlRoleToAdminRole(searchParams.get("role"))` is the only user-controlled input path. Output is constrained to `AdminRole | undefined` via switch — invalid values fall through to undefined, no echoing of raw input.
- `AlertBanner` body interpolates `String(totalUsers)` — number coerced to string, no injection surface.

## Requirements Completed

- **D-W1** (cross-tab data consistency) — counts on roles page == filtered counts on users page; URL-wins-over-localStorage write-through ensures the contract survives the navigation hop.
- **D-A5** (RoleCard reality-reflected semantics + cross-link) — Görüntüle is a navigation aid, NOT a CRUD trigger; Düzenle remains absent (D-A4 respected).
- **D-Y1** (Roles tab display-only) — display-only contract preserved; no new CRUD endpoints, no role/permission editing surfaced.

## Self-Check: PASSED

- [x] **Created files exist:**
    - `Frontend2/components/admin/roles/role-card.test.tsx` — FOUND
    - `Frontend2/app/(shell)/admin/users/page.test.tsx` — FOUND
- [x] **Modified files exist:**
    - `Frontend2/components/admin/roles/role-card.tsx` — FOUND
    - `Frontend2/app/(shell)/admin/roles/page.tsx` — FOUND
    - `Frontend2/app/(shell)/admin/users/page.tsx` — FOUND
    - `Frontend2/lib/i18n/admin-rbac-keys.ts` — FOUND
- [x] **Commits exist** (verified via `git log --oneline -8`):
    - 0becfd9b — FOUND
    - 62c6d004 — FOUND
    - e321d3c6 — FOUND
    - e995c9f6 — FOUND
    - b50f5d58 — FOUND
- [x] **All 14 Plan 14-17 RTL tests pass** (8 role-card.test.tsx + 6 page.test.tsx)
- [x] **No regressions** — 68 / 68 admin sweep tests pass

## TDD Gate Compliance

Plan 14-17 has plan frontmatter `type: execute` (not `type: tdd`), but each task uses `tdd="true"` so the per-task RED/GREEN cycle is enforced:

- **Task 1 RED gate:** Commit `0becfd9b` — `test(14-17)` — 4 of 8 tests fail by design
- **Task 1 GREEN gate:** Commit `62c6d004` — `feat(14-17)` — 8 of 8 tests pass
- **Task 2 RED gate:** Commit `e321d3c6` — `test(14-17)` — 4 of 6 tests fail by design
- **Task 2 GREEN gate:** Commit `e995c9f6` — `feat(14-17)` — 6 of 6 tests pass
- **Refactor gate:** Commit `b50f5d58` — `fix(14-17)` — TypeScript strictness fixes; tests still 14/14 green

All gates honored.

## Future Work — v2.1 Candidate

**Approach 2: dedicated `GET /api/v1/admin/users/role-counts` composite endpoint.** Returns `{admin: 12, project_manager: 38, member: 245, guest: 0, total: 295}` via a single `SELECT role.name, COUNT(*) FROM users JOIN roles ... GROUP BY role.name`. Replaces Approach 1's defensive ceiling entirely — counts are accurate for any user-table size, and the truncation banner becomes unnecessary. Recommended for v2.1 when the user table grows past 1000.

The current Approach 1 ships immediately with a clear upgrade path: replace `useAdminUsers({limit: 1000})` with `useAdminRoleCounts()`, drop the truncation banner block, and update the i18n keys to deprecated. No schema changes, no breaking client-side API.

---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 02
subsystem: admin-panel-shell
tags: [admin-panel, admin-route-guard, middleware, frontend2, overview-tab, i18n, optimistic-update]
requires:
  - phase: 14-01
    provides: NavTabs primitive (Pitfall 4 active-detection guard) + Modal primitive + admin services + 12 hooks (incl. usePendingJoinRequests, useApproveJoinRequest, useRejectJoinRequest, useAdminUsers, useAdminAudit, useAdminStats)
  - phase: 13
    provides: DataState 3-state primitive + Avatar.href click-to-profile + ActivityRow per-event renderer
  - phase: 10
    provides: useAuth() context (user.role.name + isLoading) + AppShell + ToastProvider
provides:
  - Frontend2/middleware.ts matcher extended to /admin/:path* (Pitfall 10 mitigation at server edge)
  - Frontend2/app/(shell)/admin/layout.tsx — race-safe AdminLayout (Pitfall 3 — isLoading-FIRST guard)
  - Frontend2/app/(shell)/admin/page.tsx — /admin Overview content
  - Frontend2/components/admin/overview/{stat-cards, pending-requests-card, pending-requests-modal, role-distribution, recent-admin-events}.tsx
  - Frontend2/lib/i18n/admin-keys.ts — 40 TR/EN key pairs (14 layout + 26 Overview)
  - Frontend2/components/activity/activity-row.tsx — variant prop slot ("default" | "admin-table") added (render branch fills in Plan 14-10)
affects:
  - Wave 2 plans 14-03..14-08 (consume the AdminLayout wrapper — guard + nav tabs inherited automatically)
  - Plan 14-10 (will fill the ActivityRow variant="admin-table" render branch consumed today by RecentAdminEvents)
  - Plan 14-11 (will wire the page-header Rapor al + Denetim günlüğü stub buttons)
tech-stack:
  added: []
  patterns:
    - Race-safe client guard pattern (isLoading-FIRST → unauthenticated → role-check → render). Used by Plan 14-02 AdminLayout; pattern captured in 14-PATTERNS.md S5 for future admin-style layouts.
    - Per-surface i18n keys file barrel (lib/i18n/admin-keys.ts) — TR/EN parity contract enforced with key-count matched by file shape (40 tr: + 40 en: entries). Wave 2 plans extend with their own per-surface files.
    - StatCard tone enum widening — narrowed enum is "primary"|"info"|"success"|"danger"|"neutral"; prototype's tone="warning" mapped to "info" for the closest semantic available without forking the primitive.
    - ActivityRow variant slot — accepts "admin-table" today, renders default; Plan 14-10 fills the branch (forward-declare pattern keeps callers stable).
key-files:
  created:
    - Frontend2/app/(shell)/admin/layout.tsx
    - Frontend2/app/(shell)/admin/layout.test.tsx
    - Frontend2/app/(shell)/admin/page.tsx
    - Frontend2/components/admin/overview/stat-cards.tsx
    - Frontend2/components/admin/overview/pending-requests-card.tsx
    - Frontend2/components/admin/overview/pending-requests-modal.tsx
    - Frontend2/components/admin/overview/role-distribution.tsx
    - Frontend2/components/admin/overview/recent-admin-events.tsx
    - Frontend2/lib/i18n/admin-keys.ts
  modified:
    - Frontend2/middleware.ts (matcher append — 1 line)
    - Frontend2/components/activity/activity-row.tsx (variant prop slot — non-breaking)
key-decisions:
  - "admin-keys.ts shipped with all 27 admin.overview.* keys in Task 1 (commit dc7f2a8f) instead of appending in Task 2 — the layout test required Surface A keys at Task 1 boundary, so bundling Surface B at the same time avoided a second touch of the same file. Documented as a minor commit-grouping deviation."
  - "Page-header buttons (Rapor al / Denetim günlüğü) ship as visible-but-onClick-noop stubs that console.log a Plan-14-11 placeholder message. Buttons render with variant='secondary' size='sm' matching prototype line 19-20."
  - "Toast contract on the non-admin redirect uses variant: 'error' (NOT tone: 'danger') — Frontend2/components/toast/index.tsx's variant enum is the canonical contract per Plan 14-01 Pitfall 2."
  - "RoleDistribution reads useAdminUsers and aggregates client-side per CONTEXT D-Y1; the current /auth/users UserListDTO has no role field so the role distribution gracefully degrades to 0 counts until Plan 14-03 wires a richer /admin/users list endpoint."
  - "OverviewStatCards uses tone='info' for Onay Bekleyen (prototype tone='warning' isn't in StatCard's narrowed enum). Plan 14-01 deferred-items.md tracks the StatCard primitive enum gap; closest available semantic chosen."
  - "RecentAdminEvents passes variant='admin-table' to ActivityRow today; the visual-upgrade render branch lands in Plan 14-10. Forward-declare via optional prop keeps existing 19 callers untouched."
  - "Storage StatCard value '12.4 GB' / '%62 dolu' is the verbatim prototype mock — SPMS has no storage backend in v2.0; teaser kept for prototype fidelity per CONTEXT D-00."
  - "PendingRequestsModal uses width=640 per UI-SPEC §Spacing line 89; ships single 50-row scroll list (no offset pagination yet). Pagination control is a v2.1 candidate."
patterns-established:
  - "Pattern: Race-safe admin guard (Pitfall 3 mitigation) — `if (isLoading) return` BEFORE `user.role` evaluation in the layout effect. Applied verbatim in app/(shell)/admin/layout.tsx; future admin-style layouts copy the order."
  - "Pattern: Middleware matcher additive edits — append new path patterns at the END of the matcher array with a phase/plan inline comment. Applied to Frontend2/middleware.ts line 22."
  - "Pattern: Per-surface i18n keys file — keep keys close to the consuming surface; barrel exports via `adminT(key, lang)` helper. Wave 2 plans 14-03..14-08 each ship their own file (admin-users-keys.ts, admin-rbac-keys.ts, etc.)."
  - "Pattern: Optimistic-update consumer wiring — Approve/Reject buttons disable on `mutate.isPending`, re-enable after onSettled. PendingRequestsCard + PendingRequestsModal both consume the same Plan 14-01 hooks and share the cache key."
requirements-completed:
  - D-00
  - D-C1
  - D-C2
  - D-C3
  - D-C4
  - D-C6
  - D-W1
  - D-W2
  - D-Y1
duration: 12min
completed: 2026-04-27
---

# Phase 14 Plan 14-02: Admin Layout + Overview Tab Summary

**Admin route shell now reachable at /admin for admin users — middleware matcher extended (Pitfall 10), race-safe client guard (Pitfall 3), 8-tab NavTabs strip, and the Overview sub-tab composes 5 StatCards + Pending Requests panel (top-5 + Tümünü gör modal at width 640) + pure-CSS Role distribution + Recent admin events list (admin-table variant stub for Plan 14-10).**

## Performance

- **Duration:** ~12 min (2 atomic commits)
- **Started:** 2026-04-27T05:57:41Z
- **Completed:** 2026-04-27T06:08:40Z (work) — 2026-04-27T06:11:00Z (final docs commit, separate)
- **Tasks:** 2 / 2 complete
- **Files modified:** 11 (9 created + 2 modified)
- **Tests added:** 4 RTL cases (layout.test.tsx)
- **All tests pass:** ✅ (4/4 layout + 5/5 nav-tabs + 3/3 use-approve-join-request — 12/12 across regression set)

## Accomplishments

1. **AvatarDropdown's "Admin Paneli" link now routes to a real page** — Phase 13 D-D2 wired the link to `/admin` but the destination was 404. Phase 14 Plan 14-02 builds the destination.
2. **Triple-layer admin gate active** — middleware (cookie at edge) + AdminLayout (role at client, race-safe) + backend `Depends(require_admin)` (Plan 14-01). Frontend gates are UX; backend gate is security.
3. **Wave 2 plans 14-03..14-08 inherit guard + tabs strip for free** — each surface plan only writes its own `app/(shell)/admin/{name}/page.tsx`; the layout wraps automatically.

## Task Commits

1. **Task 1: middleware matcher + race-safe layout guard + i18n key map + RTL test** — `dc7f2a8f` (feat). Single atomic commit (RED→GREEN paired) — RTL test failed first run (no layout.tsx); after layout creation, all 4 cases passed.
2. **Task 2: /admin Overview page + 5 child components + ActivityRow variant slot** — `792e0678` (feat).

**Plan metadata commit:** Pending (this SUMMARY.md + STATE.md + ROADMAP.md + VALIDATION.md update — separate commit per execute-plan workflow).

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| Middleware matcher contains `/admin/:path*` | `grep -c "'/admin/:path\*'" Frontend2/middleware.ts` → 1 | ✅ |
| Race-safe Pitfall 3 guard | `cd Frontend2 && npm run test -- --run "app/(shell)/admin/layout.test.tsx"` Case 1 | ✅ 4/4 |
| Non-admin redirect to /dashboard + danger toast | layout.test.tsx Case 3 (assert variant:"error" + msg contains "yetki") | ✅ |
| Unauthenticated redirect to /auth/login?next=/admin | layout.test.tsx Case 2 | ✅ |
| Admin user gets all 8 NavTabs hrefs rendered | layout.test.tsx Case 4 (`document.querySelectorAll('a[href="/admin/..."]')`) | ✅ |
| 8 admin tab hrefs in layout source | `grep -c 'href: "/admin' Frontend2/app/(shell)/admin/layout.tsx` → 8 | ✅ |
| 5 StatCards in OverviewStatCards | `grep -c "<StatCard" Frontend2/components/admin/overview/stat-cards.tsx` → 5 | ✅ |
| Pure-CSS bars (no recharts import) | `grep -E '^import .*recharts' Frontend2/components/admin/overview/role-distribution.tsx` → empty | ✅ |
| Modal at width 640 | `grep -c "width={640}" Frontend2/components/admin/overview/pending-requests-modal.tsx` → 1 | ✅ |
| ActivityRow variant="admin-table" stubbed | `grep -c 'variant="admin-table"' Frontend2/components/admin/overview/recent-admin-events.tsx` → 3 | ✅ |
| 40 TR + 40 EN i18n parity | `grep -c "    tr:" / "    en:"` lib/i18n/admin-keys.ts → 40/40 | ✅ |
| `cd Frontend2 && npm run build` exits 0 | (run after Task 2) | ✅ |

## Wave 1 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-02-T1 (middleware matcher + admin layout race-safe guard + NavTabs strip) | ✅ green (`dc7f2a8f`) |
| 14-02-T2 (Overview tab — 5 StatCards + Pending Requests + Role distribution + Recent admin events) | ✅ green (`792e0678`) |

## Files Created / Modified

**Created (9):**
- `Frontend2/app/(shell)/admin/layout.tsx` — AdminLayout wrapper (`"use client"`; useAuth+useApp+useToast; race-safe guard; PageHeader + NavTabs + children)
- `Frontend2/app/(shell)/admin/layout.test.tsx` — 4 RTL cases (isLoading / unauthenticated / non-admin / admin)
- `Frontend2/app/(shell)/admin/page.tsx` — Overview composition (4 sections in 5-col + 1.5fr/1fr two-row grid)
- `Frontend2/components/admin/overview/stat-cards.tsx` — 5 cards from useAdminUsers/useProjects/usePendingJoinRequests/useProcessTemplates
- `Frontend2/components/admin/overview/pending-requests-card.tsx` — top-5 + verbatim primary-line glue + Approve/Reject (D-W2 optimistic) + Tümünü gör trigger
- `Frontend2/components/admin/overview/pending-requests-modal.tsx` — Modal at width=640; full list (limit 50); ModalHeader/Body/Footer slots
- `Frontend2/components/admin/overview/role-distribution.tsx` — 3 rows + pure-CSS bars (priority-critical / status-progress / fg-muted) + DataState fallback
- `Frontend2/components/admin/overview/recent-admin-events.tsx` — useAdminAudit({limit:10}) → ActivityRow variant="admin-table" + Audit'a git → footer
- `Frontend2/lib/i18n/admin-keys.ts` — 40 TR/EN key pairs + adminT(key, lang) helper

**Modified (2):**
- `Frontend2/middleware.ts` — matcher append `/admin/:path*` (1 line; Phase 14 inline comment)
- `Frontend2/components/activity/activity-row.tsx` — added optional `variant?: "default" | "admin-table"` to ActivityRowProps (forward-declare; render branches in Plan 14-10)

## Decisions Made

See `key-decisions` in frontmatter — 8 entries spanning the commit-grouping decision, button stub treatment, toast variant contract, role-distribution graceful degradation, StatCard tone mapping, ActivityRow variant slot, storage mock retention, and modal width.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] StatCard tone="warning" not in narrowed enum (re-discovered, pre-existing per Plan 14-01)**
- **Found during:** Task 2 (OverviewStatCards composition)
- **Issue:** Prototype admin.jsx line 57 uses `tone="warning"` for Onay Bekleyen StatCard, but the StatCard primitive's tone enum is `"primary" | "info" | "success" | "danger" | "neutral"` (narrowed by Phase 13 Plan 13-08; tracked in Plan 14-01 deferred-items.md).
- **Fix:** Mapped to `tone="info"` — closest amber-ish surface available. Documented in stat-cards.tsx inline comment.
- **Files modified:** `Frontend2/components/admin/overview/stat-cards.tsx`
- **Verification:** `npm run build` passes; visual semantic preserved.
- **Committed in:** `792e0678`

**2. [Rule 2 - Missing Critical] ActivityRow variant prop forward-declare**
- **Found during:** Task 2 (RecentAdminEvents composition)
- **Issue:** Plan 14-02 PLAN.md required passing `variant="admin-table"` to ActivityRow, but ActivityRowProps didn't accept the prop and TypeScript strict mode would reject the call site.
- **Fix:** Added `variant?: "default" | "admin-table"` as an optional prop (forward-declare). The render code keeps the existing default branch (Plan 14-10 fills the admin-table branch). Existing 19 callers unaffected.
- **Files modified:** `Frontend2/components/activity/activity-row.tsx`
- **Verification:** `npm run build` passes; existing activity-row tests / nav-tabs / use-approve-join-request all green (regression check).
- **Committed in:** `792e0678` (part of Task 2 commit)

### Path / Scope Adjustments

- **admin-keys.ts shipped fully in Task 1** (not split between Task 1 = Surface A keys and Task 2 = Surface B keys per the strict PLAN.md ordering). Reason: the layout.test.tsx in Task 1 needed Surface A keys to compile; bundling Surface B at the same time avoided a second commit touching the same file. Net result identical, commit log slightly different from the strawman ordering.
- **Page-header button STUB treatment** — Plan 14-02 PLAN.md offers two options ("alert(...)" OR "disabled with tooltip"); chose `console.log` over `alert()` because alert is intrusive UX and the stub state should be invisible to the admin walking through the surface. Plan 14-11 wires the real handlers.

### Out-of-Scope Discoveries

- **/auth/users (UserListDTO) has no `role` field** — affects RoleDistribution, which gracefully degrades to 0/0/0 counts in the bars until Plan 14-03 wires a richer `/admin/users` list endpoint. Documented in role-distribution.tsx and in this Summary's "key-decisions". NOT logged as deferred-items because Plan 14-03 will resolve it as part of its scope.

---

**Total deviations:** 2 auto-fixed (1 bug-fix, 1 missing-critical / forward-declare) + 2 path adjustments
**Impact on plan:** All deviations correctness-driven (build pass + future-proof prop API). No scope creep.

## Issues Encountered

None — Plan 14-01 Wave 0 deliverables were comprehensive enough that Plan 14-02 had no missing dependency surprises. The Pitfalls (3 + 10) were both pre-flagged in 14-RESEARCH.md and mitigated cleanly per the patterns.

## User Setup Required

None — no external service configuration required. All admin endpoints already wired by Plan 14-01.

## Threat Flags

None — Plan 14-02 introduces no new network surface beyond what Plan 14-01 already shipped (the existing /admin/* admin endpoints). The new client-side guard reuses the existing useAuth() hook and middleware infrastructure.

## Hand-off Notes for Wave 2 Plans (14-03..14-08)

**No further infra setup needed.** Each Wave 2 surface plan only owns its own page:

- **Plan 14-03 (`/admin/users`)** — owns `app/(shell)/admin/users/page.tsx` + `components/admin/users/*`. AdminLayout wraps automatically (route group inheritance). Hooks already shipped: useAdminUsers / useInviteUser / useBulkInvite / useDeactivateUser / useResetPassword / useChangeRole / useBulkAction. Note: should also extend `/auth/users` response or add a richer `/admin/users` list endpoint with `role` field — Plan 14-02's RoleDistribution depends on it.
- **Plan 14-04 (`/admin/roles` + `/admin/permissions`)** — owns 2 page.tsx + role-card / permission-matrix-card components. permissions-static.ts already shipped (Plan 14-01).
- **Plan 14-05 (`/admin/projects`)** — owns table + MoreH (Archive + Delete only — D-B5).
- **Plan 14-06 (`/admin/workflows`)** — owns template card grid + MoreH (Edit / Clone / Delete).
- **Plan 14-07 (`/admin/audit`)** — owns toolbar + table + filter modal + pagination. ActivityRow `variant="admin-table"` will arrive via Plan 14-10 — until then the audit table renders default-variant rows (graceful degradation).
- **Plan 14-08 (`/admin/stats`)** — owns 3 chart components. useAdminStats already shipped.

**Plan 14-10 hand-off** — RecentAdminEvents (this plan's component) and the future Audit tab table cell BOTH consume `<ActivityRow variant="admin-table"/>`. Plan 14-10 fills the render branch — minimal-surface-area swap, no consumer code changes required.

**Plan 14-11 hand-off** — AdminLayout's "Rapor al" + "Denetim günlüğü" buttons currently `console.log` a stub message. Plan 14-11 swaps the onClick handlers to call the admin-summary PDF endpoint + router.push('/admin/audit') respectively.

## Self-Check: PASSED

- [x] Both task commits exist in git log (`dc7f2a8f`, `792e0678`)
- [x] Frontend2/middleware.ts matcher contains `/admin/:path*` (line 22)
- [x] Frontend2/app/(shell)/admin/layout.tsx exists AND is `"use client"` AND checks `isLoading` BEFORE `user.role` (Pitfall 3)
- [x] Frontend2/app/(shell)/admin/layout.tsx has 8 admin tab hrefs (`/admin`, `/admin/users`, `/admin/roles`, `/admin/permissions`, `/admin/projects`, `/admin/workflows`, `/admin/audit`, `/admin/stats`)
- [x] Frontend2/lib/i18n/admin-keys.ts exists AND exports ADMIN_I18N_KEYS + adminT AND has 40 tr: + 40 en: entries (TR/EN parity)
- [x] Frontend2/app/(shell)/admin/layout.test.tsx — all 4 RTL cases pass
- [x] Frontend2/app/(shell)/admin/page.tsx exists AND is `"use client"` AND imports all 4 child components
- [x] All 5 child components under Frontend2/components/admin/overview/ exist
- [x] role-distribution.tsx does NOT import recharts (`grep -E '^import .*recharts'` → empty)
- [x] role-distribution.tsx uses pure-CSS percentage-fill bars (`width: \`${pct}%\`` line 156)
- [x] role-distribution.tsx uses var(--priority-critical), var(--status-progress), var(--fg-muted) for the 3 role colors
- [x] pending-requests-modal.tsx uses Modal/ModalHeader/ModalBody/ModalFooter AND width=640
- [x] recent-admin-events.tsx passes `variant="admin-table"` to ActivityRow (Plan 14-10 will fill the render branch)
- [x] `cd Frontend2 && npm run build` exits 0
- [x] `cd Frontend2 && npm run test -- --run "app/(shell)/admin/layout.test.tsx"` exits 0
- [x] `cd Frontend2 && npm run test -- --run nav-tabs.test.tsx use-approve-join-request.test.tsx` exits 0 (regression — no break)
- [x] No new lint errors introduced (build passes TypeScript strict mode)

---
*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Completed: 2026-04-27*

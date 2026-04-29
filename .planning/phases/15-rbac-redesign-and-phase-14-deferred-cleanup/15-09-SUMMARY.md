---
phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
plan: 09
subsystem: ui
tags: [rbac, tanstack-query, react-19, optimistic-mutation, audit-log, permissions, jwt, semantic-event]

# Dependency graph
requires:
  - phase: 15
    provides: "Plan 15-04/05/06 backend role/permission/matrix DTOs + endpoints; Plan 15-08 JWT permissions[] claim; Plan 15-07 rbac.* audit emission"
provides:
  - "Frontend2/services/admin-rbac-service.ts: 7-method service for /admin/roles + /admin/permissions"
  - "7 TanStack Query v5 hooks: useRoles, usePermissions, usePermissionMatrix, useCreateRole, useUpdateRole, useDeleteRole, useUpdatePermissionCell (Pattern 3 optimistic)"
  - "<RequirePermission perm='X'>: D-1.7 UI hide guard (Client Component, hook + early return)"
  - "AuthContext extended with permissions[] + hasPermission(key) helper (D-1.7 + D-1.5 super-role short-circuit + Pitfall 9 backwards-compat)"
  - "audit-event-mapper SemanticEventType union extended with 5 rbac.* members + entity_type='role' branch"
  - "activity-row.tsx 5 NEW render branches for rbac.* events"
  - "event-meta.ts 5 NEW verb formatter labels (TR/EN)"
affects: [15-10, 15-11, 15-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern 3 (optimistic mutation): onMutate cancels in-flight queries → snapshot → setQueryData; onError reverts to snapshot + Toast; onSettled invalidates"
    - "Pattern 11 (admin service shape): apiClient methods returning typed DTOs verbatim from admin-user-service.ts"
    - "RequirePermission hook + early return composition (React 19 idiomatic; no HOC ceremony)"
    - "JWT decode with backwards-compat fallback to [] (Pitfall 9)"

key-files:
  created:
    - "Frontend2/services/admin-rbac-service.ts"
    - "Frontend2/services/admin-rbac-service.test.ts"
    - "Frontend2/hooks/use-roles.ts"
    - "Frontend2/hooks/use-roles.test.ts"
    - "Frontend2/hooks/use-permissions.ts"
    - "Frontend2/hooks/use-permissions.test.ts"
    - "Frontend2/hooks/use-permission-matrix.ts"
    - "Frontend2/hooks/use-permission-matrix.test.ts"
    - "Frontend2/hooks/use-create-role.ts"
    - "Frontend2/hooks/use-update-role.ts"
    - "Frontend2/hooks/use-delete-role.ts"
    - "Frontend2/hooks/use-update-permission-cell.ts"
    - "Frontend2/hooks/use-update-permission-cell.test.ts"
    - "Frontend2/components/auth/require-permission.tsx"
    - "Frontend2/components/auth/require-permission.test.tsx"
    - "Frontend2/components/auth/use-has-permission.ts"
  modified:
    - "Frontend2/context/auth-context.tsx (permissions[] + hasPermission)"
    - "Frontend2/lib/audit-event-mapper.ts (5 rbac.* + entity_type='role' branch + admin chip mapping)"
    - "Frontend2/lib/audit-event-mapper.test.ts (+5 mapping + 2 chip routing tests)"
    - "Frontend2/lib/activity/event-meta.ts (+5 rbac.* verb labels with lucide-react ShieldPlus/CheckCircle/XCircle imports)"
    - "Frontend2/components/activity/activity-row.tsx (Phase14NewSemantic union extended; 5 render branches; 3 metadata reads role_name/perm_key/affected_user_count)"
    - "Frontend2/components/activity/activity-row.test.tsx (+3 rbac.* render branch tests)"
    - "Frontend2/hooks/use-transition-authority.test.tsx (extend useAuth mock fixtures with permissions[]/hasPermission for type compat)"
    - "Frontend2/components/shell/avatar-dropdown.test.tsx (extend useAuth mock)"
    - "Frontend2/components/lifecycle/evaluation-report-card.test.tsx (extend useAuth mock)"
    - "Frontend2/components/lifecycle/artifacts-subtab.test.tsx (extend useAuth mock)"
    - "Frontend2/components/lifecycle/phase-gate-expand.test.tsx (extend useAuth mock)"

key-decisions:
  - "Optimistic mutation in useUpdatePermissionCell: applyCellUpdate() exported as a pure helper for unit-testable matrix mutation rules (4 helper tests + 2 lifecycle tests = 6 total)"
  - "AuthContext permissions decode: backwards-compat fallback to [] for tokens lacking the claim, combined with role.name === 'Admin' super-role short-circuit ensures pre-Plan-15-08 tokens still grant Admin access without forcing re-login (Pitfall 9 mitigation)"
  - "rbac.* events fold into existing 'admin' chip (not a new chip) — RESEARCH Open Question Q8 RESOLVED. Activity SegmentedControl already at 6 chips; rbac is a strict subset of admin actions."
  - "RequirePermission as Client Component with hook + early return (Open Question Q3 RESOLVED). React 19 prefers composition over HOC; the guard is intentionally a UX hide (server-side require_permission is authoritative — T-15-05 accept)."
  - "AvatarDropdown admin-link gate migration deferred to Plan 15-11 (D-2.11). Plan 15-09 ships only the hasPermission(key) helper that 15-11 will consume."

patterns-established:
  - "TanStack Query v5 optimistic mutation lifecycle: onMutate (cancelQueries → snapshot → setQueryData) → onError (rollback) → onSuccess (Toast) → onSettled (invalidateQueries)"
  - "JWT decode helper: defensive base64url padding compensation; non-array claim → []; non-string array element filtered out; any decode failure → []"
  - "RequirePermission isLoading guard: render null while AuthContext hydrates to prevent flash-of-fallback during page reload"
  - "Audit-event-mapper extension: append to SemanticEventType union → add entity_type branch BEFORE catch-all return null → fold new chip into existing chip set unless visual real estate demands a new one"
  - "Activity-row Phase14NewSemantic union extension: rbac.* members reuse the same primary-line replacement path Phase 14 14-10 settled on; secondary rows (status pair etc.) remain attached only to Phase 13 types"

requirements-completed: [RBAC-06, RBAC-08]

# Metrics
duration: 12 min
completed: 2026-04-29
---

# Phase 15 Plan 15-09: Wave 2 RBAC frontend services + hooks + RequirePermission + AuthContext + audit-event-mapper Summary

**RBAC frontend service + 7 TanStack Query v5 hooks (1 with Pattern-3 optimistic mutation) + AuthContext.hasPermission helper + RequirePermission UI guard + audit-event-mapper extended with 5 rbac.* SemanticEventType members across mapper + activity-row + event-meta**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-29T02:39:08Z
- **Completed:** 2026-04-29T02:50:34Z
- **Tasks:** 2 (atomic commits)
- **Files created:** 16
- **Files modified:** 11
- **Tests added:** 96 (across 8 test files)

## Accomplishments

- **Service layer (Plan 15-10/11 dependency):** `adminRbacService` ships 7 typed methods backed by /admin/roles + /admin/permissions + /admin/permissions/matrix endpoints. Mirrors `admin-user-service.ts` shape verbatim per PATTERNS §11.
- **7 TanStack Query v5 hooks:**
  - `useRoles` (60s staleTime; placeholderData: keepPreviousData)
  - `usePermissions` (5min staleTime; scope-aware queryKey)
  - `usePermissionMatrix` (60s staleTime; cache slot the optimistic mutation targets)
  - `useCreateRole` (handles 409 reserved/duplicate; invalidates roles + matrix)
  - `useUpdateRole` (handles 422 SYSTEM_ROLE_PROTECTED)
  - `useDeleteRole` (D-2.2 — invalidates roles + matrix + admin/users because orphans migrate to Member)
  - `useUpdatePermissionCell` (Pattern 3 optimistic — onMutate cancels + snapshots + applies; onError reverts to snapshot + TR/EN Toast; onSettled invalidates)
- **AuthContext extension:**
  - `permissions: string[]` state hydrated from JWT `payload.permissions` claim on mount + login; cleared on logout
  - `hasPermission(key)` helper: short-circuits to `true` for `role.name === 'Admin'` (D-1.5 super-role); else `permissions.includes(key)`
  - `decodePermissions()` defensive: pads base64url, filters non-string array elements, falls back to `[]` on any failure (Pitfall 9 backwards-compat)
- **`<RequirePermission perm='X'>` guard:** Client Component using hook + early return; default `fallback={null}`; renders `null` while `isLoading=true` to prevent hydration flash
- **`useHasPermission(perm)` companion hook:** thin composition over `useAuth().hasPermission` for callers wanting a single boolean
- **audit-event-mapper cross-cutting (R-11):**
  - `SemanticEventType` union gains 5 `rbac.*` members
  - `mapAuditToSemantic` adds `entity_type === "role"` branch with 5 action arms (created/updated/deleted/permission_granted/permission_revoked) — backend reuses the single `entity_type` per CONTEXT D-1.9
  - `semanticToFilterChip` folds rbac.* into existing `"admin"` chip (Pitfall 19 + Q8 RESOLVED — no new chip)
- **`event-meta.ts`:** 5 verb labels with TR/EN + icons (ShieldPlus / ShieldCheck / Trash2 / CheckCircle / XCircle from lucide-react v1.8.0)
- **`activity-row.tsx`:** 5 render branches inside `renderPhase14Primary` switch:
  - role_created / role_updated: `firstName + verb + roleName`
  - role_deleted: adds `(N kullanıcı Member'a taşındı)` count badge per D-2.2
  - permission_granted: `firstName + verb + permKey + → + roleName`
  - permission_revoked: `firstName + verb + permKey + ← + roleName`
- **5 existing `useAuth()` mock fixtures updated** so the AuthContextType extension type-checks across pre-existing tests (use-transition-authority, avatar-dropdown, evaluation-report-card, artifacts-subtab, phase-gate-expand)

## Task Commits

Each task was committed atomically:

1. **Task 1: Service + 7 hooks + AuthContext extension** — `654e2f41` (feat)
2. **Task 2: RequirePermission + audit-event-mapper rbac.* + activity-row branches** — `14553327` (feat)

## Files Created/Modified

### Created (16)

- `Frontend2/services/admin-rbac-service.ts` — Service layer for /admin/roles + /admin/permissions endpoints
- `Frontend2/services/admin-rbac-service.test.ts` — 10 tests (URL + body assertions per method)
- `Frontend2/hooks/use-roles.ts` — useQuery wrapper, queryKey ["admin","roles"], 60s staleTime
- `Frontend2/hooks/use-roles.test.ts` — 1 test
- `Frontend2/hooks/use-permissions.ts` — useQuery wrapper, scope-aware queryKey, 5min staleTime
- `Frontend2/hooks/use-permissions.test.ts` — 2 tests (with/without scope)
- `Frontend2/hooks/use-permission-matrix.ts` — useQuery wrapper, queryKey ["admin","permissions","matrix"]
- `Frontend2/hooks/use-permission-matrix.test.ts` — 1 test
- `Frontend2/hooks/use-create-role.ts` — useMutation; 409 reserved/duplicate detail handling; TR/EN toast
- `Frontend2/hooks/use-update-role.ts` — useMutation; 422 SYSTEM_ROLE_PROTECTED handling
- `Frontend2/hooks/use-delete-role.ts` — useMutation; invalidates roles+matrix+admin/users (D-2.2 Member migration)
- `Frontend2/hooks/use-update-permission-cell.ts` — Pattern 3 optimistic mutation; applyCellUpdate() pure helper exported
- `Frontend2/hooks/use-update-permission-cell.test.ts` — 6 tests (4 pure helper + 2 lifecycle)
- `Frontend2/components/auth/require-permission.tsx` — Client Component guard
- `Frontend2/components/auth/require-permission.test.tsx` — 4 tests (granted, denied, fallback, isLoading)
- `Frontend2/components/auth/use-has-permission.ts` — Thin hook composition

### Modified (11)

- `Frontend2/context/auth-context.tsx` — permissions[] state + hasPermission helper + decodePermissions; AuthContextType interface extended
- `Frontend2/lib/audit-event-mapper.ts` — 5 SemanticEventType members + entity_type='role' branch + admin chip routing
- `Frontend2/lib/audit-event-mapper.test.ts` — 5 mapping + 2 chip routing tests appended
- `Frontend2/lib/activity/event-meta.ts` — 5 verb labels + 3 lucide-react icon imports (ShieldPlus, CheckCircle, XCircle)
- `Frontend2/components/activity/activity-row.tsx` — Phase14NewSemantic union extended; 5 switch arms; 3 defensive metadata reads (role_name, perm_key, affected_user_count)
- `Frontend2/components/activity/activity-row.test.tsx` — 3 render branch tests appended (role_created, role_deleted with affected_user_count, permission_granted)
- `Frontend2/hooks/use-transition-authority.test.tsx` — useAuth mock fixtures extended with permissions[]/hasPermission for type compat
- `Frontend2/components/shell/avatar-dropdown.test.tsx` — useAuth mock fixtures extended
- `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` — useAuth mock fixtures extended
- `Frontend2/components/lifecycle/artifacts-subtab.test.tsx` — useAuth mock fixture extended (factory pattern)
- `Frontend2/components/lifecycle/phase-gate-expand.test.tsx` — useAuth mock fixtures extended

## Decisions Made

1. **applyCellUpdate exported as a pure helper** for the optimistic mutation — enables 4 standalone unit tests (grant new cell / revoke existing / unknown perm passthrough / undefined matrix passthrough) without spinning up a QueryClient. Follows the established Pattern 3 (RESEARCH §3) shape.
2. **JWT decode backwards-compat:** `decodePermissions(null)` → `[]`; tokens minted before Plan 15-08 (no `permissions` claim) → `[]`; combined with `role.name === 'Admin'` short-circuit means pre-existing Admins keep access without forcing re-login (Pitfall 9 mitigation).
3. **rbac.\* fold into "admin" chip** (Open Question Q8 RESOLVED) — the activity SegmentedControl already has 6 chips and rbac events are strictly admin-action subset. No new chip introduced.
4. **RequirePermission as Client Component** with `"use client"` directive (Frontend2/AGENTS.md — "this is NOT the Next.js you know" reminder). React 19 hook + early return composition; no HOC ceremony (Open Question Q3 RESOLVED).
5. **AvatarDropdown admin-link gate migration deferred to Plan 15-11** (D-2.11). Plan 15-09 only ships the `hasPermission(key)` helper that Plan 15-11 will consume.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AuthContextType extension broke 5 existing useAuth() mock fixtures**

- **Found during:** Task 1 (AuthContext extension typecheck)
- **Issue:** Adding `permissions: string[]` and `hasPermission` to `AuthContextType` made existing `mockReturnValue({ user, token, isLoading, login, logout })` calls fail type-check across 5 test files (use-transition-authority, avatar-dropdown, evaluation-report-card, artifacts-subtab, phase-gate-expand). Existing tests still passed at runtime (vitest doesn't strict-type-check), but `npx tsc --noEmit` reported "missing properties: permissions, hasPermission".
- **Fix:** Updated each mock fixture to include `permissions: []` + `hasPermission: () => false` defaults. Cumulative changes: 8 mock occurrences across 5 files.
- **Verification:** `npx tsc --noEmit -p .` reports 0 auth-context-related errors after the fix; remaining 14 type errors are PRE-EXISTING and unrelated (vi.mocked spread typing in lifecycle tests, tuple type errors in download-authenticated.test.ts — out of scope per scope boundary).
- **Committed in:** `654e2f41` (Task 1)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Mock fixture sync was unavoidable — extending a TypeScript context interface without updating consumers leaves the codebase in a broken-typecheck state. No scope creep; no functionality changed.

## Issues Encountered

None — plan executed largely as written. The optimistic mutation pattern was a verbatim port of Pattern 3 from RESEARCH.md / use-approve-join-request.ts.

## Threat Surface Scan

No new threat surface introduced beyond the plan's `<threat_model>`. The 5 mitigations called out (T-15-05 RequirePermission tamper accept, T-15-01 JWT permissions tamper accept, T-15-10 stale JWT mitigate via Pitfall 9 fallback, T-15-04 last-admin lockout mitigate via SYSTEM_ROLE_PROTECTED revert, Audit-01 rbac.\* leak mitigate via backend Phase 13 D-D6 admin-only audit feed) are all delivered as planned.

## Self-Check: PASSED

**File existence verified:**

- Frontend2/services/admin-rbac-service.ts: FOUND
- Frontend2/services/admin-rbac-service.test.ts: FOUND
- Frontend2/hooks/use-roles.ts: FOUND
- Frontend2/hooks/use-permissions.ts: FOUND
- Frontend2/hooks/use-permission-matrix.ts: FOUND
- Frontend2/hooks/use-create-role.ts: FOUND
- Frontend2/hooks/use-update-role.ts: FOUND
- Frontend2/hooks/use-delete-role.ts: FOUND
- Frontend2/hooks/use-update-permission-cell.ts: FOUND
- Frontend2/hooks/use-update-permission-cell.test.ts: FOUND
- Frontend2/hooks/use-roles.test.ts: FOUND
- Frontend2/hooks/use-permissions.test.ts: FOUND
- Frontend2/hooks/use-permission-matrix.test.ts: FOUND
- Frontend2/components/auth/require-permission.tsx: FOUND
- Frontend2/components/auth/require-permission.test.tsx: FOUND
- Frontend2/components/auth/use-has-permission.ts: FOUND
- Frontend2/lib/audit-event-mapper.ts (modified): FOUND
- Frontend2/lib/audit-event-mapper.test.ts (modified): FOUND
- Frontend2/lib/activity/event-meta.ts (modified): FOUND
- Frontend2/components/activity/activity-row.tsx (modified): FOUND
- Frontend2/components/activity/activity-row.test.tsx (modified): FOUND
- Frontend2/context/auth-context.tsx (modified): FOUND

**Commit existence verified:**

- 654e2f41: FOUND (Task 1)
- 14553327: FOUND (Task 2)

**Plan verification command exits 0:**

```
cd Frontend2 && npx vitest run services/admin-rbac-service.test.ts hooks/use-roles.test.ts hooks/use-permissions.test.ts hooks/use-permission-matrix.test.ts hooks/use-update-permission-cell.test.ts components/auth/require-permission.test.tsx lib/audit-event-mapper.test.ts components/activity/activity-row.test.tsx
→ 8 test files / 96 tests passed (10 service + 1+2+1+6 hooks + 4 RequirePermission + 47 audit-mapper + 25 activity-row)
```

## Next Phase Readiness

- **Plan 15-10 (matrix uplift):** Ready to consume `useRoles` / `usePermissions(scope)` / `usePermissionMatrix` / `useUpdatePermissionCell`. The optimistic mutation rolls back on SYSTEM_ROLE_PROTECTED so the Admin column is naturally read-only at the UX layer.
- **Plan 15-11 (Roles tab CRUD + AvatarDropdown gate migration):** Ready to consume `useCreateRole` / `useUpdateRole` / `useDeleteRole` and `<RequirePermission perm='admin.access'>` to migrate the AvatarDropdown's `role.name === 'Admin'` check (D-2.11).
- **Plans 15-05/06/07 audit emission:** rbac.\* events emitted by the backend will now render correctly in admin/audit + admin/users activity feeds via the extended SemanticEventType + activity-row branches.

---
*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Completed: 2026-04-29*

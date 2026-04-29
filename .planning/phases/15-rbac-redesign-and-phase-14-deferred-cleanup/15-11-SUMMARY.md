---
phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
plan: 11
subsystem: ui
tags: [rbac, frontend2, modal-crud, cross-phase-migration, perm-gate, self-edit-prevention, icon-picker, color-swatch, react-19, tanstack-query]

# Dependency graph
requires:
  - phase: 15
    provides: "Plan 15-09 useCreateRole/useUpdateRole/useDeleteRole/useRoles + AuthContext.hasPermission"
  - phase: 15
    provides: "Plan 15-10 NewRoleModalTrigger + RoleCard.onEdit/onDelete props + isSystemRole prop"
provides:
  - "Frontend2/lib/admin/role-validation.ts: client-side regex + reserved-name validator (Pydantic mirror)"
  - "Frontend2/components/admin/roles/role-icon-picker.tsx: 4×2 radiogroup of 8 lucide icons"
  - "Frontend2/components/admin/roles/role-color-swatch.tsx: 6 oklch token chips with selection ring"
  - "Frontend2/components/admin/roles/role-create-modal.tsx: useCreateRole-backed modal with form validation"
  - "Frontend2/components/admin/roles/role-edit-modal.tsx: pre-fill modal with system-role disabled state"
  - "Frontend2/components/admin/roles/role-delete-confirm.tsx: ConfirmDialog tone=danger with Member fallback body"
  - "AvatarDropdown admin link gate: migrated from role.name=='Admin' to hasPermission('admin.access') (D-2.11)"
  - "Self-edit prevention UI: 'Rolü değiştir' menuitem disabled when row.user.id === currentUser.id (D-2.9)"
affects: [15-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Atomic single-commit cross-phase contract migration: avatar-dropdown.tsx (production) + avatar-dropdown.test.tsx Test 14 (Plan 14-11 D-D2 regression guard) shipped SAME COMMIT per R-01 invariant"
    - "Discriminated-union validator return type: validateRoleName → {ok: true} | {ok: false, reason: 'empty'|'too_long'|'invalid_chars'|'reserved'} so consumers render localized errors per reason without re-running the regex"
    - "Pydantic-mirror client validation: ROLE_NAME_RE mirrors Backend/app/application/dtos/role_dtos.py — backend authoritative, client copy is UX accelerator (Pitfall 5)"
    - "is_system_role-driven Edit modal disabled state: AlertBanner + input.disabled + Save.disabled — defense in depth on top of backend SYSTEM_ROLE_PROTECTED 422"
    - "Mock factory with re-configurable hasPermission: AvatarDropdown test file now exposes mockPermissions + mockHasPermission so each test owns its perm shape (D-1.5 short-circuit + Pitfall 9 backwards-compat both verifiable)"

key-files:
  created:
    - "Frontend2/lib/admin/role-validation.ts"
    - "Frontend2/lib/admin/role-validation.test.ts"
    - "Frontend2/components/admin/roles/role-icon-picker.tsx"
    - "Frontend2/components/admin/roles/role-icon-picker.test.tsx"
    - "Frontend2/components/admin/roles/role-color-swatch.tsx"
    - "Frontend2/components/admin/roles/role-color-swatch.test.tsx"
    - "Frontend2/components/admin/roles/role-create-modal.tsx"
    - "Frontend2/components/admin/roles/role-create-modal.test.tsx"
    - "Frontend2/components/admin/roles/role-edit-modal.tsx"
    - "Frontend2/components/admin/roles/role-edit-modal.test.tsx"
    - "Frontend2/components/admin/roles/role-delete-confirm.tsx"
    - "Frontend2/components/admin/roles/role-delete-confirm.test.tsx"
    - "Frontend2/components/admin/users/user-row-actions.test.tsx"
  modified:
    - "Frontend2/app/(shell)/admin/roles/page.tsx (3 modals wired + custom role list rendering + affected-user count derivation)"
    - "Frontend2/components/admin/users/user-row-actions.tsx (D-2.9 self-edit disable on Rolü değiştir)"
    - "Frontend2/components/shell/avatar-dropdown.tsx (D-2.11 perm-based admin link gate)"
    - "Frontend2/components/shell/avatar-dropdown.test.tsx (Test 14 D-D2 → D-2.11 cross-phase migrate + Tests 15-16 added)"
    - "Frontend2/components/admin/roles/role-card.test.tsx (mocks added: useRoles + 3 modal hooks + toast — for AdminRolesPage tests)"

key-decisions:
  - "Cross-phase contract migration shipped SAME COMMIT (R-01): avatar-dropdown.tsx (production) and avatar-dropdown.test.tsx (Plan 14-11 Test 14 regression guard, originally a Phase 13 D-D2 contract). Splitting them would have left the test asserting against the OLD gate while production used the NEW gate, producing a guaranteed-RED state for the entire interim period. R-04 invariant (atomic state) honored exactly as PATTERNS §13 prescribes."
  - "Tests 3 and 5 of avatar-dropdown.test.tsx updated to set mockHasPermission to true. The original tests passed because the OLD gate was role.name-based; under the NEW gate they would have RED'd because the inline mock returned hasPermission: () => false. Updating them mirrors the AuthContext's role.name === 'Admin' super-role short-circuit (D-1.5 + Pitfall 9 backwards-compat), so the Admin-role behavior is still asserted but via the NEW gate path."
  - "Self-edit detection uses Number(currentUser.id) loose-equality with row.user.id. AuthUser.id is string per services/auth-service.ts; admin user shape has number id per services/admin-user-service.ts. Both branches are exercised in the unit tests via mockCurrentUserRef.current = {id: 42} (number) — production users supply string ids that Number() coerces."
  - "Custom role icon mapping in admin/roles/page.tsx is intentionally a small switch (4 explicit keys + default User fallback) rather than a full registry. The 8 picker icons are split into two camps: icons with semantic mapping to system roles (ShieldCheck → admin tone, Briefcase → manager tone, User → member tone, Eye → guest tone) which the page renders for custom roles too, and 4 'aesthetic' icons (Star, Settings, Globe, Award) which fall through to the User default. v2.1 candidate: a complete icon registry in lib/admin/role-icon-registry.ts so the icon picker and the page card render are driven by the same data."
  - "Role-card.test.tsx Rule 3 deviation (Blocking): adding useRoles + 3 modal hooks to AdminRolesPage required mocking 5 additional hooks in the test file. Without mocks, the test file's render(<AdminRolesPage/>) would throw 'No QueryClient set'. The mocks return inert mutate stubs + an empty roles list so the existing 16 cases (Plan 14-17 + Plan 15-10) continue asserting unchanged. No assertion semantics changed — purely defensive mock additions."

patterns-established:
  - "Cross-phase contract migration pattern: when a Phase N-1 test file is a regression guard for a Phase N-2 contract, and Phase N migrates the contract, the Phase N production change AND the Phase N-1 test update must ship in ONE commit (R-04 invariant). The commit message references the originating plan (14-11) and the migrating plan (15-11) so future archeology can trace the contract evolution chain."
  - "Pydantic-mirror discriminated-union validator: the client copy of a backend Pydantic regex returns a discriminated-union over a 'reason' literal (e.g., 'empty' | 'too_long' | 'invalid_chars' | 'reserved'). Consumers exhaust the union to render localized errors. Adding a new validation reason on the backend forces the client to add a switch arm (TS exhaustiveness) — no silent drift."
  - "is_system_role-driven Edit modal disabled state: backend's authoritative is_system_role boolean drives a 3-tier UI suppression: (a) AlertBanner explaining the protection, (b) inputs.disabled on text fields, (c) wrapper opacity 0.55 + pointer-events: none on icon/color pickers. Save button also disabled. Backend SYSTEM_ROLE_PROTECTED 422 is the defense-in-depth tier 4."
  - "Mock factory with per-test perm overrides: AvatarDropdown test exposes mockPermissions + mockHasPermission as let-bound module-level state, reset in beforeEach. Each test sets the perm shape it needs (true for Admin short-circuit, ['admin.access'] + key-match function for custom role, [] + () => false for non-admin). Generalizable to any auth-gated component."

requirements-completed: [RBAC-06, RBAC-08]

# Metrics
duration: ~23 min
completed: 2026-04-29
---

# Phase 15 Plan 15-11: Wave 2 RBAC frontend Roles tab full CRUD + AvatarDropdown gate cross-phase migrate Summary

**Lands the role create / edit / delete modals + icon picker + color swatch + role-validation lib + self-edit UI + AvatarDropdown gate migration. Cross-phase R-01 contract migration: Phase 13 D-D2 / Plan 14-11 Test 14 → Phase 15 D-2.11 perm-based admin.access gate, shipped atomically SAME COMMIT.**

## Performance

- **Duration:** ~23 min
- **Started:** 2026-04-29T03:13:45Z
- **Completed:** 2026-04-29T03:37:09Z
- **Tasks:** 2 (Task 1 = TDD RED + GREEN = 2 commits; Task 2 = atomic cross-phase commit = 1 commit; 3 commits total)
- **Files created:** 13 (1 lib + 5 component + 6 test + 1 user-row-actions test)
- **Files modified:** 5 (admin/roles/page.tsx + user-row-actions.tsx + avatar-dropdown.tsx + avatar-dropdown.test.tsx + role-card.test.tsx mock add)
- **Tests added:** 36 (Task 1) + 4 (user-row-actions) + 3 (avatar-dropdown migration: Test 14 reshape + Tests 15-16 new) = 43 new test cases
- **Plan-scoped tests:** 76 / 76 passing across 10 test files (full plan verification command exits 0)
- **Frontend2 regression suite:** 810 / 810 passing across 118 test files (zero regressions)

## Accomplishments

### Task 1: Role validation lib + 5 RBAC role-CRUD components (TDD RED + GREEN)

**Frontend2/lib/admin/role-validation.ts (D-2.6)**

Mirror of the backend Pydantic regex at `Backend/app/application/dtos/role_dtos.py`:

- `ROLE_NAME_RE = /^[A-Za-zÇĞİÖŞÜçğıöşü0-9 _-]+$/` — Latin letters + Turkish characters (Ç/Ğ/İ/Ö/Ş/Ü + lowercase) + digits + space + underscore + hyphen.
- `ROLE_NAME_MIN = 1`, `ROLE_NAME_MAX = 50` — character length bounds (after `.trim()`).
- `RESERVED_ROLE_NAMES = ["admin", "project manager", "member", "guest"]` — case-insensitive deny list.
- `validateRoleName(name)` returns a discriminated union: `{ok: true} | {ok: false, reason: 'empty'|'too_long'|'invalid_chars'|'reserved'}`.

The discriminated union forces consumers to handle every reason explicitly via a TS-exhaustive switch.

**Frontend2/components/admin/roles/role-icon-picker.tsx (D-2.8)**

4×2 grid of 8 lucide-react icon buttons inside a `role="radiogroup"`. Each button is a `role="radio"` with `aria-checked` reflecting the controlled value. Selection state is conveyed via a 2px primary inset shadow ring. Icons:

- User, Briefcase, ShieldCheck, Star, Eye, Settings, Globe, Award.

**Frontend2/components/admin/roles/role-color-swatch.tsx (D-2.8)**

6 round chips inside a `role="radiogroup"`, each backed by an oklch CSS token via inline `background: var(${token})`:

- `--priority-critical`, `--status-progress`, `--fg-muted`, `--info`, `--warning`, `--status-todo`.

Selection ring uses a 2px primary outline outside the chip via two-layer box-shadow.

**Frontend2/components/admin/roles/role-create-modal.tsx (D-2.6 + D-2.8)**

`<Modal width={480}>` with `<ModalHeader>` + form (name + description + icon picker + color swatch) + `<ModalFooter>`. State reset on every open. Validation runs client-side via `validateRoleName`; localized error message rendered inline per reason (empty / too_long / invalid_chars / reserved). Submit fires `useCreateRole().mutate(...)` with the trimmed payload; `onSuccess` closes the modal. Save button disabled while form invalid OR createRole.isPending.

**Frontend2/components/admin/roles/role-edit-modal.tsx (D-2.3 + D-2.6 + D-2.8)**

Sibling of RoleCreateModal. Pre-fills form fields from the supplied `role` prop on every open. System roles (`role.is_system_role === true`):

- Top-of-modal AlertBanner "Sistem rolleri düzenlenemez" / "System roles cannot be edited".
- All text inputs disabled.
- Icon/color pickers wrapped in `opacity: 0.55 + pointer-events: none`.
- Save button disabled.

Backend `SYSTEM_ROLE_PROTECTED 422` is the defense-in-depth fallback. role=null returns null (defensive guard during state transitions in the parent).

**Frontend2/components/admin/roles/role-delete-confirm.tsx (D-2.2)**

Wraps the existing `ConfirmDialog` primitive (Phase 14 14-01 D-25) with `tone="danger"`. Body explicitly states the migration: `"Bu rolü silmek ${affectedUserCount} kullanıcıyı Member rolüne taşıyacak. Devam?"` (TR) / `"Deleting this role will move ${affectedUserCount} user(s) to Member. Continue?"` (EN). On confirm: `useDeleteRole().mutate(role.id, {onSuccess: onClose})`. Backend handles the Member migration in a single transaction (Plan 15-06 D-2.2).

### Task 2: Roles page wiring + user-row-actions self-edit + AvatarDropdown gate migrate (atomic cross-phase)

**Frontend2/app/(shell)/admin/roles/page.tsx (modal wiring + custom role list)**

3 modal mounts wired against useState slots:

```tsx
<RoleCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
<RoleEditModal open={editingRole !== null} role={editingRole} onClose={() => setEditingRole(null)} />
<RoleDeleteConfirm
  open={deletingRole !== null}
  role={deletingRole}
  affectedUserCount={deletingRoleAffectedCount}
  onClose={() => setDeletingRole(null)}
/>
```

`useRoles` drives the custom-role card rendering (filter `is_system_role === false`). Each custom role's `RoleCard` receives `onEdit={() => setEditingRole(role)}` + `onDelete={() => setDeletingRole(role)}`. The `affectedUserCount` for the delete confirmation is computed from the EXISTING Plan 14-17 `useAdminUsers({limit: 1000})` count pipeline — no extra round-trip.

Custom role icon/color rendering: 4 explicit lucide icon keys map to system-role-style chips (`ShieldCheck → admin tone`, `Briefcase → manager tone`, `Eye → guest tone`); other keys fall through to the `User` icon. Color uses `var(${role.color_token || '--fg-muted'})` with `color-mix(in oklch, ... 18%, transparent)` background — same shape as the system role cards (visual consistency).

**Frontend2/components/admin/users/user-row-actions.tsx (D-2.9 self-edit prevention)**

The `change_role` MoreMenu item now reads `disabled: isSelf` where `isSelf = currentUser != null && Number(currentUser.id) === user.id`. Even if the user clicks the disabled item (DOM tamper), the `onClick` handler short-circuits with `if (isSelf) return` before `setRoleSubmenuOpen(true)`. Backend `ChangeUserRoleUseCase` ALSO raises `PermissionError` on self-edit (Plan 15-05 D-2.9 server-side gate) — defense in depth. The visual disabled state surfaces the prohibition BEFORE the click, which is more discoverable than a silent server-side rejection.

**Frontend2/components/shell/avatar-dropdown.tsx (D-2.11 perm-based admin link gate) — CROSS-PHASE**

```diff
- const { user, logout } = useAuth()
+ const { user, logout, hasPermission } = useAuth()
  ...
  // PRESERVED for role badge tone (D-2.10) — tone derivation still uses roleName.
  const isAdmin = roleName.toLowerCase() === "admin"
+ const canAccessAdmin = hasPermission("admin.access")
  ...
- {isAdmin && (
+ {canAccessAdmin && (
    <button onClick={handleNav("/admin")}>
      ...
```

The AuthContext's `hasPermission` helper short-circuits to `true` for `role.name === "Admin"` (D-1.5 super-role + Pitfall 9 backwards-compat), so:

1. Existing Admin users with stale JWTs (no `permissions[]` claim, predating Plan 15-08) STILL see the link.
2. Custom roles like "SuperUser" with `admin.access` toggled-on in the matrix ALSO see the link.
3. Member / Guest / non-admin custom roles do NOT see the link.

PRESERVED unchanged: 3 dismiss effects (mousedown / Escape / pathname), keyboard navigation (ArrowUp/Down/Home/End), role badge tone derivation (D-2.10 mandates role-name-driven badge — only the link gate migrates).

**Frontend2/components/shell/avatar-dropdown.test.tsx (R-01 SAME COMMIT cross-phase update)**

Test 14 (originally Plan 14-11's D-D2 cross-phase regression guard) reshaped:

- **Before:** "link visible when role.name === 'Admin'" (gate was role-name-based).
- **After:** "link routes to /admin AND is gated by hasPermission('admin.access')" — preserved the Plan 14-11 routing-destination assertion (`pushMock.toHaveBeenCalledWith("/admin")`) AND added the new D-2.11 gate semantics.

Tests 15 + 16 NEW:

- **Test 15** — Custom role "SuperUser" with `permissions: ["admin.access"]` and matching `hasPermission` function sees the link (D-2.11 explicit-perm path).
- **Test 16** — Member with `permissions: []` and `hasPermission: () => false` does NOT see the link (D-2.11 deny path).

Tests 3 + 5 (existing Admin-role checks) updated: `mockHasPermission = () => true` to mirror the AuthContext's super-role short-circuit. Without this update, the new gate would have RED'd these tests (their inline mock returned `() => false` while their role was "Admin" — which the production code now ignores in favor of the perm check).

Mock factory restructured: `mockPermissions: string[]` and `mockHasPermission: (k) => boolean` are now module-level let-bindings, reset in beforeEach. Each test owns its perm shape.

## Task Commits

Each task was committed individually. Task 2's atomic single-commit is mandated by R-01 (cross-phase contract atomicity invariant).

1. **Task 1 RED — failing tests for role validation + 5 components** — `679b2539` (test)

   ```
   test(15-11): add failing tests for role validation + 5 RBAC role-CRUD components
   ```

2. **Task 1 GREEN — production for the 6 contracts** — `8d75a0fc` (feat)

   ```
   feat(15-11): role validation lib + 5 RBAC role-CRUD components
   ```

3. **Task 2 atomic cross-phase migration** — `a221e13a` (feat)

   ```
   feat(15-11): wire roles CRUD modals + self-edit UI + AvatarDropdown perm gate
   Cross-phase contract migrate: Phase 13 D-D2 / Plan 14-11 Test 14 → perm-based admin.access gate (D-2.11)
   ```

   `git show --name-only a221e13a` confirms `Frontend2/components/shell/avatar-dropdown.tsx` AND `Frontend2/components/shell/avatar-dropdown.test.tsx` are in the SAME commit (R-04 atomicity).

## Files Created/Modified

### Created (13)

- `Frontend2/lib/admin/role-validation.ts` — Pydantic-mirror regex + reserved-name validator (D-2.6)
- `Frontend2/lib/admin/role-validation.test.ts` — 9 unit cases (regex / reserved / TR / Latin / trim / constants)
- `Frontend2/components/admin/roles/role-icon-picker.tsx` — 8-icon radiogroup (D-2.8)
- `Frontend2/components/admin/roles/role-icon-picker.test.tsx` — 4 RTL cases
- `Frontend2/components/admin/roles/role-color-swatch.tsx` — 6-token radiogroup (D-2.8)
- `Frontend2/components/admin/roles/role-color-swatch.test.tsx` — 4 RTL cases
- `Frontend2/components/admin/roles/role-create-modal.tsx` — useCreateRole-backed modal (D-2.6/2.8)
- `Frontend2/components/admin/roles/role-create-modal.test.tsx` — 9 RTL cases (validation + submit + reset)
- `Frontend2/components/admin/roles/role-edit-modal.tsx` — pre-fill modal with system disabled (D-2.3/2.6/2.8)
- `Frontend2/components/admin/roles/role-edit-modal.test.tsx` — 6 RTL cases (pre-fill / system-disabled / submit / null-guard)
- `Frontend2/components/admin/roles/role-delete-confirm.tsx` — ConfirmDialog tone=danger + Member fallback body (D-2.2)
- `Frontend2/components/admin/roles/role-delete-confirm.test.tsx` — 4 RTL cases (body / confirm / cancel / null-guard)
- `Frontend2/components/admin/users/user-row-actions.test.tsx` — 4 RTL cases for self-edit prevention (D-2.9)

### Modified (5)

- `Frontend2/app/(shell)/admin/roles/page.tsx` — 3 modal mounts + useRoles-driven custom role rendering + affected-user count derivation
- `Frontend2/components/admin/users/user-row-actions.tsx` — useAuth + isSelf flag drives `disabled` on Rolü değiştir
- `Frontend2/components/shell/avatar-dropdown.tsx` — D-2.11 gate migrate (canAccessAdmin = hasPermission('admin.access'))
- `Frontend2/components/shell/avatar-dropdown.test.tsx` — Test 14 reshape (D-D2 → D-2.11) + Tests 15-16 added + Tests 3/5 mockHasPermission update + mock factory exposes per-test perm overrides
- `Frontend2/components/admin/roles/role-card.test.tsx` — useRoles + 3 modal hooks + toast mocks added (Rule 3 deviation; required after AdminRolesPage gained those dependencies)

## Decisions Made

1. **Atomic same-commit cross-phase invariant honored.** Task 2 committed avatar-dropdown.tsx production change AND avatar-dropdown.test.tsx Test 14 update in commit `a221e13a`. Splitting them would have left the test asserting against the OLD gate (RED entire interim period) — R-01 explicitly forbids this. The plan's success criterion line 839 was the literal acceptance gate; satisfied.

2. **Tests 3 and 5 updated to match the NEW gate semantics.** Originally these passed because the OLD gate was role-name based; under the NEW gate they would have RED'd because their inline mock returned `hasPermission: () => false`. Setting `mockHasPermission = () => true` mirrors the AuthContext's role.name === "Admin" super-role short-circuit (D-1.5 + Pitfall 9 backwards-compat) so the Admin-role behavior IS still asserted but now via the perm path.

3. **Self-edit detection via `Number(currentUser.id) === user.id`.** AuthUser.id is `string` per services/auth-service.ts; admin user shape has `number` id per services/admin-user-service.ts. `Number()` coerces strings cleanly. Both branches exercised in tests.

4. **Custom role icon registry deferred to v2.1.** admin/roles/page.tsx maps 4 of the 8 picker icons to semantic system-role-style chips; the other 4 fall through to User. A complete `lib/admin/role-icon-registry.ts` shared between picker and card render is the v2.1 candidate.

5. **role-card.test.tsx mock additions are NOT a test rewrite.** Adding useRoles + 3 modal hooks + toast mocks is a Rule 3 (Blocking) deviation — without them the existing 16 cases would have RED'd with "No QueryClient set". The mocks return inert stubs + an empty roles list so all 16 assertions are unchanged. Pure defensive infrastructure addition.

6. **No new threat surface.** All 6 STRIDE entries from the plan's threat model (T-15-02 self-edit / T-15-04 last-admin-lockout / T-15-05 admin link DOM tamper / T-15-07 reserved-name tamper / Cross-Phase-01 Plan 14-11 RED / RBAC-08-01 system role UX) are mitigated as planned. No additional surface introduced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adding useRoles to AdminRolesPage broke role-card.test.tsx (16 cases)**

- **Found during:** Task 2, after editing app/(shell)/admin/roles/page.tsx to import useRoles and the 3 modal components.
- **Issue:** The role-card.test.tsx file renders `<AdminRolesPage/>` directly without a QueryClientProvider. When AdminRolesPage now calls `useRoles()` (which internally calls `useQuery`), TanStack throws "No QueryClient set, use QueryClientProvider to set one". This RED'd 7 of 16 cases.
- **Fix:** Added module-level `vi.mock` for `@/hooks/use-roles`, `@/hooks/use-create-role`, `@/hooks/use-update-role`, `@/hooks/use-delete-role`, and `@/components/toast`. Each mock returns inert stubs (empty roles list, `mutate: vi.fn()`, `isPending: false`). NO assertion changes — purely test-infrastructure plumbing.
- **Verification:** `cd Frontend2 && npx vitest run components/admin/roles/role-card.test.tsx` reports 16/16 passing post-fix.
- **Committed in:** `a221e13a` (atomic Task 2 commit).

**2. [Rule 1 - Bug] Initial test queries used `/i` flag with Turkish capital İ**

- **Found during:** Task 1 GREEN phase verification (running the new tests against the production files).
- **Issue:** `getByLabelText(/^isim$/i)` and `getByRole("button", { name: /iptal/i })` etc. failed with "Unable to find an accessible element ..." because Turkish capital `İ` (U+0130) does NOT lowercase to ASCII `i` via the JavaScript `/i` regex flag — it's a different codepoint with a different lowercase mapping.
- **Fix:** Updated test queries to literal Turkish strings (`/İsim/`, `/Açıklama/`, `/İptal/`) or alternation with the English fallback (`/İkon|Icon/`, `/Renk|Color/`). The production strings (rendered TR labels) do NOT change — only the test's regex literal does.
- **Verification:** All 36 tests in the 6 Task-1 files pass post-fix (`npx vitest run lib/admin/role-validation.test.ts components/admin/roles/role-{icon-picker,color-swatch,create-modal,edit-modal,delete-confirm}.test.tsx`).
- **Committed in:** `8d75a0fc` (Task 1 GREEN commit — tests + production land together so the GREEN phase can verify the tests as written match production).

**3. [Rule 1 - Bug] role-create-modal Case 3 — disabled Save button does not trigger onClick**

- **Found during:** Task 1 GREEN phase verification.
- **Issue:** Case 3 ("empty name submit shows 'İsim boş olamaz' validation error") originally clicked the Save button to trigger validation. But the React `disabled` attribute prevents `onClick` from firing — the validation error never surfaced and the test RED'd.
- **Fix:** Switched the test to submit the form directly via `fireEvent.submit(form)`. The form's onSubmit handler runs handleSubmit unconditionally, which sets `submitted=true` (revealing the error message) before the early-return on `!formValid`.
- **Verification:** Case 3 green after the fix.
- **Committed in:** `8d75a0fc` (same atomic GREEN commit as the Turkish-I fix).

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs).
**Impact on plan:** All deviations were straightforward test-infrastructure or assertion-shape adjustments. No production semantics changed. No scope creep; no functionality changed beyond the plan's intent.

## Issues Encountered

None of substance. The Task 1/Task 2 boundary was crisp — Task 1's TDD RED+GREEN landed cleanly in 2 commits, and Task 2's cross-phase atomicity required just careful pre-test mock setup (Deviation #1).

The Turkish-I regex pitfall (Deviation #2) is worth memorializing: future test files asserting against Turkish UI labels should use literal strings or matched-pair regex (`/Türkçe Word|English Word/`), not `/word/i`. The lucide icon labels and Turkish-localized button text both surface this issue.

## Threat Surface Scan

Per the plan's `<threat_model>`:

- **T-15-02 (Elevation: self-role-change privilege escalation)** — Mitigated. UserRowActions disables the Rolü değiştir menuitem when `isSelf`; even if disabled is stripped via DOM tamper, `onClick` short-circuits. Backend ChangeUserRoleUseCase raises PermissionError as defense layer 3.
- **T-15-04 (DoS: last-admin lockout)** — Mitigated. `hasPermission` short-circuits to true for `role.name === "Admin"` (D-1.5 + Pitfall 9), so legacy Admin tokens with empty `permissions[]` still see the admin link. Test 14 (Plan 14-11 D-D2 contract migrated) explicitly asserts this backwards-compat path.
- **T-15-05 (Information disclosure: admin link visible to non-admin via DOM tamper)** — Mitigated. UI visibility is cosmetic; the admin route guard middleware (Phase 14 14-02) gates `/admin/*` server-side. Even if the link is forced visible via DevTools, navigation to /admin returns 403/redirect.
- **T-15-07 (Tampering: custom role with reserved name)** — Mitigated. validateRoleName rejects Admin/Project Manager/Member/Guest case-insensitive client-side; backend RESERVED_ROLE_NAMES set in CreateRoleUseCase enforces the same on the wire. Defense in depth across two layers.
- **Cross-Phase-01 (Regression: Plan 14-11 Test 14 RED after avatar-dropdown migrate)** — Mitigated. avatar-dropdown.tsx + avatar-dropdown.test.tsx in `a221e13a` SAME COMMIT; Test 14 reshaped to assert the new D-2.11 gate; Tests 3/5 mock-updated to mirror the AuthContext super-role short-circuit; Tests 15/16 NEW assert the perm-based path. 16 tests pass post-migrate.
- **RBAC-08-01 (UX confusion: system role buttons hidden but user assumes editable)** — Accepted. AlertBanner explicitly states "Sistem rolleri düzenlenemez". Inputs disabled. Save button disabled. UI conveys readonly clearly across 3 visual cues.

No NEW threat surface introduced beyond the plan's `<threat_model>`. The 5 new components and 1 lib file introduce no security-relevant surface.

## Self-Check: PASSED

**File existence verified:**

- `Frontend2/lib/admin/role-validation.ts`: FOUND
- `Frontend2/lib/admin/role-validation.test.ts`: FOUND
- `Frontend2/components/admin/roles/role-icon-picker.tsx`: FOUND
- `Frontend2/components/admin/roles/role-icon-picker.test.tsx`: FOUND
- `Frontend2/components/admin/roles/role-color-swatch.tsx`: FOUND
- `Frontend2/components/admin/roles/role-color-swatch.test.tsx`: FOUND
- `Frontend2/components/admin/roles/role-create-modal.tsx`: FOUND
- `Frontend2/components/admin/roles/role-create-modal.test.tsx`: FOUND
- `Frontend2/components/admin/roles/role-edit-modal.tsx`: FOUND
- `Frontend2/components/admin/roles/role-edit-modal.test.tsx`: FOUND
- `Frontend2/components/admin/roles/role-delete-confirm.tsx`: FOUND
- `Frontend2/components/admin/roles/role-delete-confirm.test.tsx`: FOUND
- `Frontend2/components/admin/users/user-row-actions.test.tsx`: FOUND
- `Frontend2/components/admin/users/user-row-actions.tsx`: MODIFIED (FOUND)
- `Frontend2/app/(shell)/admin/roles/page.tsx`: MODIFIED (FOUND)
- `Frontend2/components/shell/avatar-dropdown.tsx`: MODIFIED (FOUND)
- `Frontend2/components/shell/avatar-dropdown.test.tsx`: MODIFIED (FOUND)

**Commit existence verified:**

- `679b2539`: FOUND (Task 1 RED)
- `8d75a0fc`: FOUND (Task 1 GREEN)
- `a221e13a`: FOUND (Task 2 atomic cross-phase)

**Cross-phase invariant verified:**

```
git show --name-only a221e13a | grep avatar-dropdown
→ Frontend2/components/shell/avatar-dropdown.test.tsx
→ Frontend2/components/shell/avatar-dropdown.tsx
```

Both files in the SAME commit. R-01 / R-04 atomicity satisfied.

**Plan verification command exits 0:**

```
cd Frontend2 && npx vitest run components/admin/roles/ components/shell/avatar-dropdown.test.tsx components/admin/users/user-row-actions.test.tsx lib/admin/role-validation.test.ts
→ 10 test files / 76 tests passed
```

**Acceptance criteria gates passed:**

- `Frontend2/lib/admin/role-validation.ts` contains `ROLE_NAME_RE`, `RESERVED_ROLE_NAMES`, `validateRoleName` (6 hits)
- `Frontend2/components/admin/roles/role-icon-picker.tsx` contains `lucide-react` (2 hits) + 8 icon imports (User/Briefcase/ShieldCheck/Star/Eye/Settings/Globe/Award all present)
- `Frontend2/components/admin/roles/role-color-swatch.tsx` contains 6 token literals (10 hits — array literal + 4 trailing comments)
- `Frontend2/components/admin/roles/role-create-modal.tsx` contains `useCreateRole` and `validateRoleName` (7 hits)
- `Frontend2/components/admin/roles/role-edit-modal.tsx` contains `is_system_role` and `useUpdateRole` (4 hits)
- `Frontend2/components/admin/roles/role-delete-confirm.tsx` contains `Member` and `tone="danger"` (9 hits)
- `Frontend2/app/(shell)/admin/roles/page.tsx` contains `RoleCreateModal`, `RoleEditModal`, `RoleDeleteConfirm` (11 hits) + state setters `setEditingRole`, `setDeletingRole`, `setCreateOpen` (9 hits)
- `Frontend2/components/admin/users/user-row-actions.tsx` contains `currentUser` self-edit check (3 hits)
- `Frontend2/components/shell/avatar-dropdown.tsx` contains `hasPermission("admin.access")` (1 hit) and `canAccessAdmin` (2 hits — declaration + use)
- `Frontend2/components/shell/avatar-dropdown.test.tsx` contains `D-2.11` (12 hits — header + 3 test annotations)

**Full Frontend2 regression suite:**

```
cd Frontend2 && npx vitest run
→ 118 test files / 810 tests passed (zero regressions across the entire codebase)
```

## Next Phase Readiness

- **Plan 15-12 (E2E admin-rbac-roles-crud + admin-rbac-link-gate):** Ready. The Roles tab is now fully interactive — E2E spec can drive the create-modal, edit-modal, delete-confirm flows via the `data-testid="new-role-modal-trigger"` hook (Plan 15-10) plus the standard role-name + role-card-view-link- testids. The AvatarDropdown link gate is also fully testable end-to-end via login as Admin (sees link) → login as Member (does not see link) → admin creates SuperUser custom role with admin.access perm → reload → SuperUser sees link.
- **Backend Plan 15-05/06 contract:** Frontend now consumes the full Role / RoleCreateRequest / RoleUpdateRequest DTO surface from adminRbacService. Any backend DTO field additions (e.g., a v2.1 `priority_order` for sort) will surface as TS errors in role-create-modal / role-edit-modal — failing loud rather than silently dropping fields.
- **Phase 13 D-D2 contract:** Migrated to D-2.11. avatar-dropdown.tsx is now perm-aware. The original Phase 13 contract ("Admin Paneli link visible for Admin role") survives via the AuthContext super-role short-circuit (Pitfall 9 backwards-compat) — explicitly tested in Test 14 (post-migrate).

---
*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Completed: 2026-04-29*

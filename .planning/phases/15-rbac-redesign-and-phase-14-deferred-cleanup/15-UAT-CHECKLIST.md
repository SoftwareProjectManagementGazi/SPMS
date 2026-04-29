---
phase: 15
slug: rbac-redesign-and-phase-14-deferred-cleanup
type: uat-checklist
audience: gsd-verify-work + human reviewer
created: 2026-04-29
last_updated: 2026-04-29
related_plans: [15-01, 15-02, 15-03, 15-04, 15-05, 15-06, 15-07, 15-08, 15-09, 15-10, 15-11, 15-12]
related_e2e:
  - Frontend2/e2e/admin-rbac-roles-crud.spec.ts
  - Frontend2/e2e/admin-rbac-matrix.spec.ts
  - Frontend2/e2e/admin-rbac-self-edit.spec.ts
  - Frontend2/e2e/admin-rbac-guest-readonly.spec.ts
  - Frontend2/e2e/admin-rbac-link-gate.spec.ts
---

# Phase 15 — UAT Checklist (RBAC Redesign + Phase 14 Deferred Cleanup)

> Manual verification queue for the `/gsd-verify-work` post-merge pass.
> Each row references the locked decision (D-X.Y) it verifies — see
> `15-CONTEXT.md` for the canonical decisions list.
>
> **Pre-flight setup:**
> - Migration 007 applied (`cd Backend && alembic upgrade head` exits 0;
>   re-run is a no-op per Plan 15-04 Pitfall 8 idempotency).
> - Backend dev server running (`cd Backend && uvicorn app.main:app --reload`).
> - Frontend dev server running (`cd Frontend2 && npm run dev`).
> - All Phase 15 plans 15-01..15-12 complete; backend pytest + Frontend2
>   vitest suites green.
> - Test users seeded: Admin (admin@example.com), PM (pm@example.com),
>   Member (member@example.com), Guest (guest@example.com), and a custom
>   "SuperUser" role with admin.access perm assigned to superuser@example.com.
>
> **Status legend:** ⬜ pending · ✅ pass · ❌ fail · ⚠️ flaky / partial.
>
> **Locale parity:** every surface row implicitly has a TR/EN label parity
> check; flip the locale once after the first walkthrough and re-walk only
> if a delta is suspected on a specific row.

---

## Surface 0 — Pre-flight schema & build smoke

- [ ] **U-15-01**: `cd Backend && alembic upgrade head` exits 0 on first run; re-run is a no-op (Pitfall 8 idempotency); verify `permissions` (38 rows: 26 project + 12 system) + `role_permissions` matrix (PM 23 / Member 5 / Admin 0 / Guest 0) + 4 system roles flagged `is_system_role=true` (verifies: RBAC-01 Plan 15-04, D-1.5)
- [ ] **U-15-02**: `cd Frontend2 && npm run build` exits 0 — Plan 14-13/14-18 StatCard tone enum drift fully resolved (TIDY-01) (verifies: Plan 15-03)
- [ ] **U-15-03**: `cd Backend && python -m pytest tests/unit/ -q` reports 0 fail; previously failing 11 unit tests across 5 files now green (TIDY-02) (verifies: Plan 15-02)
- [ ] **U-15-04**: `cd Backend && python -m pytest tests/integration/api/test_project_workflow_patch.py -q` reports 3/3 green; PATCH workflow ValidationError → 422 translation lands (TIDY-03) (verifies: Plan 15-02)
- [ ] **U-15-05**: `cd Backend && python -m pytest -m "not requires_db"` runs without DB; `requires_db` marker auto-skip works (TIDY-05) (verifies: Plan 15-02)
- [ ] **U-15-06**: `cd Frontend2 && npx vitest run components/workflow-editor/` reports 19/19 green (TIDY-04 ReactFlowProvider harness fix) (verifies: Plan 15-01)

## Surface A — Permission Matrix (Plan 15-10 atomic 7-layer uplift)

- [ ] **U-15-07**: Login as admin → `/admin/permissions`. AlertBanner copy reads positive: "RBAC altyapısı aktif. Toggle değişiklikleri anında kaydedilir; Admin sütunu salt okunur (sistem rolü korunur)." (TR) / "RBAC infrastructure active. Toggle changes save instantly; Admin column is read-only (system role protected)." (EN). NO "v3.0" string in any visible copy or DOM (verifies: D-2.7 7-layer atomic invariant, R-04)
- [ ] **U-15-08**: Matrix renders 38 rows × 4+ columns. Each row has a per-row scope chip rendering "(sistem)" (TR) / "(system)" (EN) for admin.* perms OR "(proje)" / "(project)" for project.* perms (D-3.4) (verifies: Plan 15-10 PermissionScopeBadge)
- [ ] **U-15-09**: Each system-role column (Admin / Project Manager / Member / Guest) header carries a "Sistem" / "System" Badge tone="neutral" size="xs" (D-2.4) (verifies: Plan 15-10 per-column badge)
- [ ] **U-15-10**: Toggle a PM × project.delete cell. Optimistic update flips IMMEDIATELY (no spinner). Toast "Yetki güncellendi" (TR) / "Permission updated" (EN) appears within ~300ms. Reload the page → cell still reflects the new state (verifies: D-1.12 auto-save + Plan 15-09 Pattern-3 optimistic mutation)
- [ ] **U-15-11**: Try to toggle an Admin × task.delete cell. Toggle is disabled visually (cursor: not-allowed). Even if you strip `disabled` via DevTools, clicking is a no-op (defense-in-depth onChange short-circuit per Plan 15-10 layer 2). Backend rejects with 422 SYSTEM_ROLE_PROTECTED if the request reaches it (Plan 15-06 layer 3) (verifies: D-1.5 super-role read-only, T-15-04 last-admin lockout mitigation)
- [ ] **U-15-12**: Try to toggle a Guest × task.create cell. Same defense-in-depth chain (visually disabled + onChange short-circuit) per D-2.4 Guest read-only (verifies: D-2.4)
- [ ] **U-15-13**: Devtools-throttle the network to "Slow 3G". Toggle a PM × non-Admin/non-Guest cell. Optimistic update is visible IMMEDIATELY; on backend 500 the cell REVERTS to its snapshot AND a Toast/AlertBanner surfaces the error (verifies: Plan 15-09 useUpdatePermissionCell.onError snapshot revert)
- [ ] **U-15-14**: Click "Kopyala" / "Copy" toolbar button. Clipboard receives the full matrix as pretty-printed JSON. Toast "İzin matrisi panoya kopyalandı" / "Permission matrix copied to clipboard" surfaces (verifies: Plan 15-10 Layer 5 Kopyala enabled)
- [ ] **U-15-15**: `git log --oneline 15-10` shows ONE atomic commit touching all 14 files (5 production + 1 i18n + 5 tests + 1 rename + 1 deletion + 1 new prod). `git show --name-only <hash> | wc -l` ≥ 14. NO "v3.0" string in any production file: `grep -rn "v3.0" Frontend2/components/admin/ Frontend2/app/(shell)/admin/ | grep -v ".test." | wc -l` returns 0 (verifies: D-2.7 + R-04 atomic invariant, PATTERNS §21)

## Surface B — Roles tab CRUD (Plans 15-05 + 15-10 + 15-11)

- [ ] **U-15-16**: `/admin/roles` shows 4 system role cards (Admin / Project Manager / Member / Guest) each with Sistem badge. Düzenle / Sil buttons HIDDEN on system role cards (Plan 15-10 RoleCard isSystemRole prop suppresses action buttons) (verifies: D-2.3 system role protection, D-2.4)
- [ ] **U-15-17**: Click "Yeni rol oluştur" / "New role" trigger. RoleCreateModal opens with name input + description input + 8-icon radiogroup + 6-color swatch radiogroup + Save button. Form is empty on open (state reset per Plan 15-11) (verifies: D-2.6 + D-2.8)
- [ ] **U-15-18**: Try name="Admin". Inline error "Bu isim sistem rolü için ayrılmıştır" (TR) / "This name is reserved for a system role" (EN) appears. Save button stays disabled. validateRoleName returned `{ok: false, reason: "reserved"}` (verifies: D-2.6 + Pitfall 5 Pydantic mirror; T-15-07 reserved-name tamper mitigation)
- [ ] **U-15-19**: Try name="Designer@!" (invalid char). Inline error matches `reason="invalid_chars"`. Save disabled (verifies: D-2.6 ROLE_NAME_RE regex)
- [ ] **U-15-20**: Try name=" " (whitespace only). Inline error matches `reason="empty"` (after `.trim()`). Save disabled (verifies: D-2.6 trim semantics)
- [ ] **U-15-21**: Fill name="Designer", description="Custom designer role", pick Briefcase icon, pick warning color → Save. Modal closes. Toast "Rol oluşturuldu" / "Role created" appears. New card "Designer" with Briefcase icon + warning color appears in the role grid (verifies: D-2.6 + D-2.8 happy path; useCreateRole onSuccess invalidates ["admin","roles"])
- [ ] **U-15-22**: Try create another role with name="Designer" (duplicate of U-15-21). Backend returns 409 with `error_code=ROLE_NAME_INVALID, reason="duplicate"`. Toast surfaces the localized error. Modal stays open (verifies: backend RESERVED_ROLE_NAMES mirror + uniqueness check; defense in depth)
- [ ] **U-15-23**: Click Düzenle on the Designer card. RoleEditModal opens pre-filled with the current name + description + icon + color (Plan 15-11 useState pre-fill on open). Update description to "Updated by UAT" → Save. Toast "Rol güncellendi" / "Role updated" appears. Card description updates (verifies: D-2.3 RoleEditModal pre-fill semantics)
- [ ] **U-15-24**: Click Düzenle on the Member system role card → expect NO Düzenle button visible at all (system role action suppression per Plan 15-10). If you forcibly open RoleEditModal via DOM tampering, AlertBanner "Sistem rolleri düzenlenemez" / "System roles cannot be edited" renders + all inputs disabled + Save disabled. Backend defense: SYSTEM_ROLE_PROTECTED 422 (Plan 15-06 D-2.3) (verifies: 4-tier defense-in-depth chain)
- [ ] **U-15-25**: Assign 2 users to Designer via /admin/users → Rolü değiştir → Designer. Then on /admin/roles, click Sil on Designer. ConfirmDialog (tone=danger) opens with body explicitly stating "Bu rolü silmek 2 kullanıcıyı Member rolüne taşıyacak. Devam?" (TR) / "Deleting this role will move 2 user(s) to Member. Continue?" (EN). Confirm. Backend executes Member migration in single transaction (Plan 15-06 D-2.2). Card vanishes. Re-check /admin/users — those 2 users now show Member role (verifies: D-2.2 Member fallback single-transaction)

## Surface C — Self-edit prevention (Plan 15-05 + 15-11)

- [ ] **U-15-26**: Login as admin → /admin/users. Locate own row (admin@example.com). Open MoreH menu. "Rolü değiştir" / "Change role" menuitem is DISABLED (aria-disabled="true"). Title attribute shows tooltip "Kendi rolünü değiştiremezsin" / "You cannot change your own role" (verifies: D-2.9 Plan 15-11 user-row-actions.tsx isSelf gate)
- [ ] **U-15-27**: Even if you click the disabled menuitem (DOM tamper), the role-picker submenu does NOT open — Plan 15-11 onClick short-circuit (`if (isSelf) return`). Defense layer 2 (verifies: D-2.9 short-circuit defense)
- [ ] **U-15-28**: Direct API call: `PATCH /api/v1/admin/users/{adminId}/role` body `{role_id: 3}` from a tool like Postman with the admin's own JWT. Response: 403 PERMISSION_DENIED with body `{error_code: "PERMISSION_DENIED", message: "Kendi rolünü değiştiremezsin"}`. Plan 15-05 ChangeUserRoleUseCase backend layer 3 (verifies: D-2.9 backend defensive raise)

## Surface D — Hibrit 2-tier perm + scope check (Plan 15-08 RBAC-04)

- [ ] **U-15-29**: Login as PM (has task.delete in seeded matrix). Navigate to a project where PM is the leader (`team_projects.team_leader_id == pm_id`). Open a task → click ⋮ → Sil. Task delete succeeds. Backend chain: require_permission("task.delete") passes → require_project_transition_authority passes (project leader) (verifies: D-1.13 hibrit 2-tier perm + scope)
- [ ] **U-15-30**: Login as PM (same user). Navigate to a project where PM is NOT the leader (member-only on that project). Open a task → click ⋮ → Sil. Backend returns 403 (require_project_transition_authority blocks). Toast surfaces error (verifies: D-1.13 scope check, NOT only the perm check)
- [ ] **U-15-31**: As admin, grant Member role the `task.delete` perm via /admin/permissions toggle. Login as Member. On a project where Member is a project_member, can delete tasks. On a project where Member is NOT a member, cannot — 403 (verifies: D-1.13 Member tier — perm + membership)

## Surface E — Audit emission (Plan 15-07 RBAC-03)

- [ ] **U-15-32**: After creating a custom role (U-15-21), navigate to /admin/audit. Filter by event prefix `rbac.` → row `rbac.role_created` visible with: actor=admin email, target=role name (Designer), timestamp ≤30s ago (verifies: D-1.9 audit emission, R-11 cross-cutting mapper extension)
- [ ] **U-15-33**: After granting/revoking a perm via matrix toggle (U-15-10), audit row `rbac.permission_granted` (or `rbac.permission_revoked`) is visible with metadata: role_name, perm_key, scope (verifies: D-1.9 + Plan 15-09 audit-event-mapper 5 rbac.* SemanticEventTypes)
- [ ] **U-15-34**: Activity feed (Surface E from Phase 13) renders rbac.* rows with TR/EN labels: "Rol oluşturuldu" / "Role created", "Yetki verildi" / "Permission granted", etc. Icons: ShieldPlus, ShieldCheck, Trash2, CheckCircle, XCircle from lucide-react. Plan 15-09 event-meta.ts (verifies: R-11 frontend cross-cut)
- [ ] **U-15-35**: rbac.* events fold into the existing "Yönetim" / "Admin" SegmentedControl chip (Plan 15-09 Q8 RESOLVED — no new chip). Toggle the chip → rbac.* rows visible in the filtered feed (verifies: Plan 15-09 chip routing)

## Surface F — Avatar dropdown perm gate (Plan 15-11 D-2.11 cross-phase)

- [ ] **U-15-36**: Login as Member. Click avatar in header. AvatarDropdown opens. "Yönetim Paneli" / "Admin Panel" link NOT visible — hasPermission('admin.access') === false (verifies: D-2.11 deny path)
- [ ] **U-15-37**: Login as user assigned to custom 'SuperUser' role (created via U-15-21 flow + admin granted admin.access perm via matrix). Click avatar. Yönetim Paneli link IS visible — hasPermission('admin.access') === true via permissions[] claim (verifies: D-2.11 explicit-perm path)
- [ ] **U-15-38**: Login as legacy admin user with stale JWT (no permissions[] claim — minted before Plan 15-08). Yönetim Paneli link STILL visible because role.name === "Admin" → super-role short-circuit (D-1.5 + Pitfall 9 backwards-compat). NO forced re-login required (verifies: T-15-04 last-admin lockout mitigation)
- [ ] **U-15-39**: After clicking Yönetim Paneli, URL changes to /admin and Overview tab is active. Phase 13 D-D2 contract (Plan 14-11 Test 14) preserved post-migration (verifies: cross-phase R-01 contract atomicity from Plan 15-11)

## Surface G — Guest read-only (Plan 15-04 D-2.4 + Plan 15-09 D-1.7)

- [ ] **U-15-40**: Login as guest@example.com. Dashboard loads (read endpoint works). "Yeni Proje" / "New Project" button HIDDEN per <RequirePermission perm='project.create'> (Plan 15-09 D-1.7) (verifies: Guest UI tier)
- [ ] **U-15-41**: Direct API call as guest: `POST /api/v1/projects` body `{name: "GuestForbidden", methodology: "scrum"}`. Response: 403 PERMISSION_DENIED. Backend require_permission decorator (Plan 15-06) is the authoritative gate (verifies: T-15-05 backend defense)
- [ ] **U-15-42**: Try /admin route as guest. middleware.ts (Phase 14 14-02 Pitfall 10) bounces to /auth/login OR /dashboard with access-denied Toast. NO admin DOM rendered (verifies: cross-phase admin route guard chain)

## Surface H — Cross-phase regression (Plan 14-11 D-D2 / Plan 15-11)

- [ ] **U-15-43**: `cd Frontend2 && npx vitest run components/shell/avatar-dropdown.test.tsx` — Test 14 (D-D2 → D-2.11 migrated) green; Tests 15-16 (NEW perm-based assertions) green. 16/16 cases pass (verifies: cross-phase R-01 atomicity, Plan 15-11 atomic commit a221e13a)
- [ ] **U-15-44**: `cd Frontend2 && npx vitest run` — full suite reports 800+ tests passing, zero regressions across the entire codebase (verifies: Phase 15 ships without breaking Phase 8-14 tests)
- [ ] **U-15-45**: `cd Backend && python -m pytest tests/integration/admin/ -q` — Phase 14 admin integration tests still green AFTER Plan 15-07 require_admin → require_permission migration (verifies: backwards-compat of admin endpoints under new RBAC)

## Surface I — E2E spec discovery (Plan 15-12)

- [ ] **U-15-46**: `cd Frontend2 && npx playwright test admin-rbac- --list` lists 5 spec files (admin-rbac-roles-crud, admin-rbac-matrix, admin-rbac-self-edit, admin-rbac-guest-readonly, admin-rbac-link-gate); each spec contains the skip-guard pattern per Phase 11 D-50 (verifies: Plan 15-12 E2E artifacts)
- [ ] **U-15-47**: With seeded backend (`/api/v1/health` reachable + test users seeded + JWT session), run `npx playwright test admin-rbac-` → tests run instead of skip; assertions exercise the contracts above (manual seeded-lane verification — optional for the verify-work pass)

---

## Sign-Off

- [ ] All scenarios above pass
- [ ] No regressions in Phase 14 admin tests (`cd Frontend2 && npx vitest run components/admin/` exits 0)
- [ ] No regressions in Phase 14 admin integration tests (`cd Backend && python -m pytest tests/integration/admin/` exits 0)
- [ ] Migration 007 idempotency verified (`cd Backend && alembic upgrade head` ×2; second run is no-op)
- [ ] Atomic 7-layer invariant verified — `git log --oneline | head -10` shows the Plan 15-10 atomic commit; `git show --name-only <hash>` shows ≥14 files in one commit
- [ ] Cross-phase Plan 14-11 D-D2 contract migration verified — `git log --grep="D-2.11" --grep="avatar-dropdown" --grep="perm-based"` shows the Plan 15-11 atomic commit
- [ ] VALIDATION.md `nyquist_compliant: true` flipped after sign-off (Plan 15-12 Task 2)

---

*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Author: gsd-executor*
*Last updated: 2026-04-29*

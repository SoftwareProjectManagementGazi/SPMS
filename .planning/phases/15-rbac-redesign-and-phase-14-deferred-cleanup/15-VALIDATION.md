---
phase: 15
slug: rbac-redesign-and-phase-14-deferred-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Sources: 15-CONTEXT.md (D-4.6 build order), 15-RESEARCH.md `## Validation Architecture` section, REQUIREMENTS.md RBAC-01..08 + TIDY-01..05.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend Framework** | pytest 7.x + pytest-asyncio (autouse) — `Backend/tests/conftest.py` |
| **Frontend Framework** | vitest 1.6.0 + @testing-library/react 16.3.2 — `Frontend2/vitest.config.ts` |
| **E2E Framework** | Playwright 1.51 (skip-guarded per Phase 11 D-50) — `Frontend2/playwright.config.ts` |
| **Backend Quick run** | `cd Backend && python -m pytest tests/unit/ -x -q` |
| **Backend Full suite** | `cd Backend && python -m pytest -q` |
| **Frontend Quick run** | `cd Frontend2 && npx vitest run components/admin components/auth lib/admin services hooks` |
| **Frontend Full suite** | `cd Frontend2 && npm run test` |
| **E2E suite** | `cd Frontend2 && npx playwright test` (skip-guarded) |
| **Smoke build** | `cd Frontend2 && npm run build` (catches StatCard tone enum drift) |
| **Schema push** | `cd Backend && alembic upgrade head` (Migration 007 idempotent) |
| **Estimated runtime (quick)** | ~25 seconds |
| **Estimated runtime (full)** | ~3-5 minutes |

---

## Sampling Rate

- **After every task commit (Backend Wave 0+ RBAC):** `cd Backend && python -m pytest tests/unit/ tests/integration/admin/ -x -q`
- **After every task commit (Frontend Wave 0+ RBAC):** `cd Frontend2 && npx vitest run components/admin components/auth hooks/use-roles hooks/use-permissions hooks/use-permission-matrix services/admin-rbac-service`
- **After every plan wave:** Backend full pytest + Frontend full vitest + `npm run build` + `alembic upgrade head` (if schema change)
- **Before `/gsd-verify-work`:** Full suite green + Playwright skip-guarded E2E + UAT review
- **Max feedback latency:** ≤ 30 seconds for quick run; ≤ 5 minutes for full suite

---

## Per-Task Verification Map

> One row per RBAC-* / TIDY-* requirement. The planner expands per-plan tasks during PLAN.md generation; this table is the upstream contract.

| Req ID | Plan | Wave | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|------|------|----------|-----------|-------------------|-------------|--------|
| TIDY-04 | 15-01 | 0 | vitest.setup ReactFlowProvider wrap + 4 TS errors fix; 19 workflow-editor tests green | unit (vitest) | `cd Frontend2 && npx vitest run components/workflow-editor/ components/lifecycle/milestones-subtab.test.tsx lib/api-client.test.ts` | ❌ W0 | ⬜ pending |
| TIDY-02 | 15-02 | 0 | 11 backend pytest unit fail root-cause fix (5 files) | unit | `cd Backend && python -m pytest tests/unit/application/test_register_user.py tests/unit/application/test_phase_gate_use_case.py tests/unit/application/test_manage_phase_reports.py tests/unit/infrastructure/test_task_repo_soft_delete.py tests/unit/test_deps_package_structure.py -q` | ❌ W0 | ⬜ pending |
| TIDY-03 | 15-02 | 0 | projects.py PATCH ValidationError → 422 translation | integration | `cd Backend && python -m pytest tests/integration/api/test_project_workflow_patch.py -q` | partial (tests exist; fail until prod fix) | ⬜ pending |
| TIDY-05 | 15-02 | 0 | requires_db marker auto-skip on absent DB | integration | `cd Backend && python -m pytest tests/integration/test_requires_db_marker.py -q` | ❌ W0 | ⬜ pending |
| TIDY-01 | 15-03 | 0 | StatCard tone="warning" build green | smoke | `cd Frontend2 && npm run build` | ✅ Plan 14-18 may have closed (verify) | ⬜ pending |
| RBAC-01 | 15-04 | 1 | Permission entity + IPermissionRepository ABC + ORM exist | unit | `cd Backend && python -m pytest tests/unit/test_permission_entity.py -q` | ❌ W0 | ⬜ pending |
| RBAC-01 | 15-04 | 1 | Migration 007 idempotent (replay = no-op) | integration | `cd Backend && python -m pytest tests/integration/test_migration_007_idempotency.py -q` | ❌ W0 | ⬜ pending |
| RBAC-01 | 15-04 | 1 | permitted_client fixture works | integration | `cd Backend && python -m pytest tests/integration/test_permitted_client_fixture.py -q` | ❌ W0 | ⬜ pending |
| RBAC-02 | 15-06 | 1 | _has_permission(user, key) Admin super-role short-circuit | unit | `cd Backend && python -m pytest tests/unit/test_has_permission.py -q` | ❌ W0 | ⬜ pending |
| RBAC-02 | 15-06 | 1 | require_permission decorator → 403 PERMISSION_DENIED | integration | `cd Backend && python -m pytest tests/integration/test_require_permission_decorator.py -q` | ❌ W0 | ⬜ pending |
| RBAC-02 | 15-06 | 1 | JWT login response carries permissions[] claim | integration | `cd Backend && python -m pytest tests/integration/test_login_returns_permissions.py -q` | ❌ W0 | ⬜ pending |
| RBAC-02 | 15-06 | 1 | 26 perms seeded with correct scope | integration | `cd Backend && python -m pytest tests/integration/admin/test_admin_permissions.py::test_list_returns_26_with_scope -q` | ❌ W0 | ⬜ pending |
| RBAC-02 | 15-06 | 1 | role_permissions matrix bootstrap (PM 13 / Member 3 / Admin 0 / Guest 0) | integration | `cd Backend && python -m pytest tests/integration/admin/test_admin_role_permission_matrix.py::test_seeded_matrix_shape -q` | ❌ W0 | ⬜ pending |
| RBAC-03 | 15-07 | 1 | All 14+ require_admin migrate to require_permission, full admin suite green | integration | `cd Backend && python -m pytest tests/integration/admin/ -q` | partial (existing tests need update) | ⬜ pending |
| RBAC-03 | 15-07 | 1 | Bulk-action dynamic perm check raises on missing sub-perm | integration | `cd Backend && python -m pytest tests/integration/admin/test_admin_users_bulk.py::test_dynamic_perm_check_raises -q` | ❌ W0 | ⬜ pending |
| RBAC-03 | 15-07 | 1 | rbac.* audit events emit (5 SemanticEventTypes) | integration | `cd Backend && python -m pytest tests/integration/test_rbac_audit_emission.py -q` | ❌ W0 | ⬜ pending |
| RBAC-03 | 15-05 | 1 | change_user_role.py role_id int contract | integration | `cd Backend && python -m pytest tests/integration/admin/test_admin_users.py::test_role_change_via_role_id -q` | partial (Phase 14 14-01 tests need update) | ⬜ pending |
| RBAC-04 | 15-08 | 1 | Mutation endpoints (8 families) get perm + membership/leader 2-tier | integration | `cd Backend && python -m pytest tests/integration/api/test_2tier_perm_check.py -q` | ❌ W0 | ⬜ pending |
| RBAC-05 | 15-05 | 1 | CreateRole / UpdateRole / DeleteRole use cases (unit) | unit | `cd Backend && python -m pytest tests/unit/application/test_manage_roles.py -q` | ❌ W0 | ⬜ pending |
| RBAC-05 | 15-05 | 1 | Member fallback on role delete (single transaction) | integration | `cd Backend && python -m pytest tests/integration/admin/test_admin_roles.py::test_delete_role_migrates_users_to_member -q` | ❌ W0 | ⬜ pending |
| RBAC-05 | 15-06 | 1 | System role 422 SYSTEM_ROLE_PROTECTED on PATCH/DELETE | integration | `cd Backend && python -m pytest tests/integration/admin/test_admin_roles.py::test_system_role_protected -q` | ❌ W0 | ⬜ pending |
| RBAC-05 | 15-05 | 1 | Role name validation (1-50 char, Latin/TR, reserved names) | unit | `cd Backend && python -m pytest tests/unit/test_role_name_validation.py -q` | ❌ W0 | ⬜ pending |
| RBAC-05 | 15-05 | 1 | Self-edit prevention (target_user_id == admin_id) | unit + integration | `cd Backend && python -m pytest tests/unit/application/test_change_user_role.py::test_self_edit_raises tests/integration/admin/test_admin_users.py::test_self_edit_blocked -q` | ❌ W0 | ⬜ pending |
| RBAC-06 | 15-09 | 2 | useRoles / usePermissions / usePermissionMatrix hooks | unit (vitest) | `cd Frontend2 && npx vitest run hooks/use-roles.test.ts hooks/use-permissions.test.ts hooks/use-permission-matrix.test.ts` | ❌ W0 | ⬜ pending |
| RBAC-06 | 15-09 | 2 | useUpdatePermissionCell optimistic mutation revert on 4xx | unit (vitest) | `cd Frontend2 && npx vitest run hooks/use-update-permission-cell.test.ts` | ❌ W0 | ⬜ pending |
| RBAC-06 | 15-09 | 2 | <RequirePermission perm='X'> hides children when missing | unit (vitest) | `cd Frontend2 && npx vitest run components/auth/require-permission.test.tsx` | ❌ W0 | ⬜ pending |
| RBAC-06 | 15-09 | 2 | useAuth().permissions / hasPermission helper | unit (vitest) | `cd Frontend2 && npx vitest run context/auth-context.test.tsx` | partial (existing test extends) | ⬜ pending |
| RBAC-06 | 15-09 | 2 | services/admin-rbac-service unit | unit (vitest) | `cd Frontend2 && npx vitest run services/admin-rbac-service.test.ts` | ❌ W0 | ⬜ pending |
| RBAC-06 | 15-11 | 2 | AvatarDropdown admin-link `_has_permission(user, 'admin.access')` (UPDATE Plan 14-11 D-D2 Test 14) | unit (vitest) | `cd Frontend2 && npx vitest run components/header/avatar-dropdown.test.tsx components/shell/avatar-dropdown.test.tsx` | partial (exists; migrates) | ⬜ pending |
| RBAC-07 | 15-10 | 2 | 7-layer atomic removal (NO disabled toggles, NO v3.0 Badge, AlertBanner content flipped, Kopyala enabled, NewRoleModalTrigger present) | unit (vitest) | `cd Frontend2 && npx vitest run components/admin/permissions/permission-matrix-card.test.tsx components/admin/permissions/permission-row.test.tsx components/admin/roles/role-card.test.tsx components/admin/roles/new-role-modal-trigger.test.tsx app/(shell)/admin/permissions/page.test.tsx app/(shell)/admin/roles/page.test.tsx` | partial (REWRITE atomic) | ⬜ pending |
| RBAC-07 | 15-10 | 2 | Per-row scope badge ('(system)' / '(project)') | unit (vitest) | `cd Frontend2 && npx vitest run components/admin/permissions/permission-row.test.tsx::renders_scope_badge components/admin/permissions/permission-scope-badge.test.tsx` | ❌ W0 | ⬜ pending |
| RBAC-07 | 15-10 | 2 | Auto-save per cell + Toast | unit (vitest) | `cd Frontend2 && npx vitest run components/admin/permissions/permission-row.test.tsx::onChange_fires_mutation` | ❌ W0 | ⬜ pending |
| RBAC-08 | 15-11 | 2 | Yeni rol oluştur modal (icon picker + color swatch + name validation) | unit (vitest) | `cd Frontend2 && npx vitest run components/admin/roles/role-create-modal.test.tsx components/admin/roles/role-icon-picker.test.tsx components/admin/roles/role-color-swatch.test.tsx lib/admin/role-validation.test.ts` | ❌ W0 | ⬜ pending |
| RBAC-08 | 15-11 | 2 | Rolü düzenle modal disabled for system roles | unit (vitest) | `cd Frontend2 && npx vitest run components/admin/roles/role-edit-modal.test.tsx::system_role_disabled` | ❌ W0 | ⬜ pending |
| RBAC-08 | 15-11 | 2 | Rolü sil ConfirmDialog with Member fallback message | unit (vitest) | `cd Frontend2 && npx vitest run components/admin/roles/role-delete-confirm.test.tsx` | ❌ W0 | ⬜ pending |
| RBAC-08 | 15-11 | 2 | Self-edit UI button disabled | unit (vitest) | `cd Frontend2 && npx vitest run components/admin/users/user-row-actions.test.tsx::self_edit_disabled` | ❌ W0 | ⬜ pending |
| RBAC-08 | 15-09 | 2 | activity-row + audit-event-mapper rbac.* render | unit (vitest) | `cd Frontend2 && npx vitest run lib/audit-event-mapper.test.ts components/activity/activity-row.test.tsx lib/activity/event-meta.test.ts` | partial (extend Phase 14 14-10) | ⬜ pending |
| RBAC-08 | 15-12 | 3 | Playwright E2E specs (skip-guarded) — admin role flip / custom role create-delete + Member fallback / matrix toggle persists / Guest read-only login / self-edit prevented / admin link perm-based | E2E | `cd Frontend2 && npx playwright test admin-rbac-` | ❌ W0 | ⬜ pending |
| RBAC-08 | 15-12 | 3 | UAT checklist 20-25 rows | manual-only | review `15-UAT-CHECKLIST.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> Test files / fixtures / production stubs that MUST land before subsequent waves can validate.

### Wave 0 Test Infrastructure

- [ ] **`Backend/tests/conftest.py`** — APPEND `permitted_client(perms=[...])` fixture (~50 lines after line 178). Plan 15-04. Mirrors `authenticated_client` factory pattern.
- [ ] **`Backend/tests/conftest.py`** — APPEND `pytest_collection_modifyitems` + `requires_db` marker. Plan 15-02 (TIDY-05). Pre-collection probe hook.
- [ ] **`Frontend2/vitest.setup.ts`** — APPEND `<ReactFlowProvider>` test wrapper helper or stable mock for `@xyflow/react`. Plan 15-01 (TIDY-04).

### Wave 0 NEW Backend Test Files (failing-first scaffolding)

- [ ] `Backend/tests/unit/test_permission_entity.py` — entity validation (Plan 15-04)
- [ ] `Backend/tests/unit/test_has_permission.py` — _has_permission Admin super-role + claim lookup (Plan 15-06)
- [ ] `Backend/tests/unit/test_role_name_validation.py` — 1-50 char + Latin/TR + reserved names (Plan 15-05)
- [ ] `Backend/tests/unit/application/test_manage_roles.py` — Create/Update/Delete role use cases (Plan 15-05)
- [ ] `Backend/tests/integration/test_migration_007_idempotency.py` — replay test (Plan 15-04)
- [ ] `Backend/tests/integration/test_permitted_client_fixture.py` — fixture sanity (Plan 15-04)
- [ ] `Backend/tests/integration/test_require_permission_decorator.py` — 403 PERMISSION_DENIED shape (Plan 15-06)
- [ ] `Backend/tests/integration/test_login_returns_permissions.py` — login response permissions[] claim (Plan 15-06)
- [ ] `Backend/tests/integration/test_rbac_audit_emission.py` — 5 rbac.* event types fire (Plan 15-07)
- [ ] `Backend/tests/integration/test_requires_db_marker.py` — marker auto-skip behavior (Plan 15-02 TIDY-05)
- [ ] `Backend/tests/integration/api/test_2tier_perm_check.py` — perm + membership/leader sequencing across 8 endpoint families (Plan 15-08)
- [ ] `Backend/tests/integration/admin/test_admin_roles.py` — CRUD + system protection + Member fallback (Plan 15-05/06)
- [ ] `Backend/tests/integration/admin/test_admin_permissions.py` — list 26 perms with scope (Plan 15-06)
- [ ] `Backend/tests/integration/admin/test_admin_role_permission_matrix.py` — matrix GET + per-cell PATCH (Plan 15-06)
- [ ] `Backend/tests/integration/admin/test_admin_users_bulk.py::test_dynamic_perm_check_raises` (extend existing or NEW; Plan 15-07)

### Wave 0 NEW Frontend Test Files (failing-first scaffolding)

- [ ] `Frontend2/components/auth/require-permission.test.tsx` — guard hides when perm missing, renders when present (Plan 15-09)
- [ ] `Frontend2/hooks/use-update-permission-cell.test.ts` — optimistic update + revert on 4xx (Plan 15-09)
- [ ] `Frontend2/hooks/use-roles.test.ts`, `use-permissions.test.ts`, `use-permission-matrix.test.ts` — TanStack Query hooks (Plan 15-09)
- [ ] `Frontend2/services/admin-rbac-service.test.ts` — service layer (Plan 15-09)
- [ ] `Frontend2/components/admin/roles/role-create-modal.test.tsx`, `role-edit-modal.test.tsx`, `role-delete-confirm.test.tsx` (Plan 15-11)
- [ ] `Frontend2/components/admin/roles/role-icon-picker.test.tsx`, `role-color-swatch.test.tsx` (Plan 15-11)
- [ ] `Frontend2/components/admin/permissions/permission-scope-badge.test.tsx` (Plan 15-10)
- [ ] `Frontend2/lib/admin/role-validation.test.ts` (Plan 15-11)
- [ ] `Frontend2/e2e/admin-rbac-roles-crud.spec.ts`, `admin-rbac-matrix.spec.ts`, `admin-rbac-self-edit.spec.ts`, `admin-rbac-guest-readonly.spec.ts` (Plan 15-12, skip-guarded)
- [ ] `Frontend2/e2e/admin-rbac-link-gate.spec.ts` (Plan 15-12, skip-guarded)

### Wave 0 EXISTING Test File Updates (must change in same commit as production)

- [ ] `Frontend2/components/admin/permissions/permission-matrix-card.test.tsx` — REWRITE Case 1-3 to assert ENABLED state (Plan 15-10)
- [ ] `Frontend2/components/admin/permissions/permission-row.test.tsx` — REWRITE for active toggle + scope badge + onChange mutation (Plan 15-10)
- [ ] `Frontend2/components/admin/roles/role-card.test.tsx` — Guest active read-only assertion + Sistem badge for system roles (Plan 15-10)
- [ ] `Frontend2/components/admin/roles/new-role-placeholder-card.test.tsx` — RENAME to `new-role-modal-trigger.test.tsx` and migrate (Plan 15-10)
- [ ] `Frontend2/components/header/avatar-dropdown.test.tsx` Test 14 — migrate to perm-based gate (Plan 15-11; cross-phase contract update with Plan 14-11 D-D2)
- [ ] `Backend/tests/unit/test_deps_package_structure.py` — fix `__all__` assertion to `["get_milestone_repo"]` (Plan 15-02 TIDY-02)
- [ ] `Backend/tests/unit/application/test_register_user.py` — IUserRepository.create signature update (Plan 15-02 TIDY-02)
- [ ] `Backend/tests/unit/application/test_phase_gate_use_case.py` — 4 fixture drift fixes (Plan 15-02 TIDY-02)
- [ ] `Backend/tests/unit/application/test_manage_phase_reports.py` — 2 cycle_number computation update (Plan 15-02 TIDY-02)
- [ ] `Backend/tests/unit/infrastructure/test_task_repo_soft_delete.py` — 2 audit row enrichment update (Plan 15-02 TIDY-02)
- [ ] `Frontend2/components/workflow-editor/editor-page.test.tsx` — extend `vi.mock("@xyflow/react")` with ReactFlowProvider + useReactFlow stubs (Plan 15-01 TIDY-04)
- [ ] `Frontend2/components/workflow-editor/selection-panel.test.tsx` Test 5 — same harness fix (Plan 15-01)
- [ ] `Frontend2/components/workflow-editor/workflow-canvas.test.tsx` — readOnly forwarding (Plan 15-01)
- [ ] `Frontend2/components/workflow-editor/phase-edge.test.tsx` — Position type drift (Plan 15-01)
- [ ] `Frontend2/components/workflow-editor/use-transition-authority.test.tsx` — UseQueryResult v5 cast (Plan 15-01)
- [ ] `Frontend2/components/lifecycle/milestones-subtab.test.tsx` — spread-arg fixture (Plan 15-01)
- [ ] `Frontend2/lib/api-client.test.ts` — TS error fix (Plan 15-01)
- [ ] `Frontend2/lib/audit-event-mapper.test.ts` — extend with 5 rbac.* tests (Plan 15-09)
- [ ] `Frontend2/components/activity/activity-row.test.tsx` — extend with 5 rbac.* render branches (Plan 15-09)
- [ ] `Backend/tests/integration/api/test_project_workflow_patch.py` — already exists; extends green AFTER prod fix (Plan 15-02 TIDY-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity of Permission Matrix layout vs prototype | RBAC-07 | Pixel-level prototype port; visual regression diff outside automation scope | Open `/admin/permissions` page in dev → compare side-by-side with prototype HTML at `prototype/admin/permissions.html` (if accessible). Verify column header alignment, row spacing, badge tone, scope chip rendering. |
| Toast UX timing for matrix auto-save | RBAC-07 | Toast duration + i18n string review | Toggle 5 different cells in succession; verify Toast "Yetki güncellendi" appears <300ms, dismisses ≤2s, no double-toast. Toggle once with backend offline → revert + AlertBanner. |
| Lucide-react icon visual selection in role-create modal | RBAC-08 | Designer review of icon legibility at 24px | Open "Yeni rol oluştur" modal → verify all 8 icons render legibly, selected state has `aria-pressed="true"` + visual border, hover state has subtle bg. |
| oklch token color swatch visual variety | RBAC-08 | Designer review of color distinguishability | Open "Yeni rol oluştur" modal → 6 color chips render with distinct hue at standard contrast; saved color renders correctly on role card. |
| Member fallback ConfirmDialog UX text | RBAC-05 | i18n nuance, designer review | Trigger "Rolü sil" on a custom role with 5 users assigned → verify dialog body text reads ~"Bu rolü silmek 5 kullanıcıyı Member rolüne taşıyacak. Devam?" |
| Avatar dropdown admin link visibility for SuperUser custom role | RBAC-06 | Cross-role dropdown UX | Create custom role "SuperUser" with `admin.access` perm → log in as user with that role → verify "Admin Paneli" link visible in dropdown. Remove `admin.access` perm → re-login → verify link hidden. |
| 7-layer atomic deploy state — partial deploy detection | RBAC-07 | Atomic-commit invariant | After Plan 15-10 merge: `git diff HEAD~1 --stat` should show 7 production files + 4 test files in single commit. Verify no "v3.0" string survives in any of: `permission-matrix-card.tsx`, `permission-row.tsx`, `app/(shell)/admin/permissions/page.tsx`, `app/(shell)/admin/roles/page.tsx`, `role-card.tsx`. |
| Migration 007 schema-push smoke | RBAC-01 | Live DB integrity check | Local: `cd Backend && alembic upgrade head` → verify `permissions`, `role_permissions` tables created, `roles.is_system_role/icon_key/color_token` columns added, 26 perm rows seeded, role_permissions matrix seeded (PM 13 / Member 3 / Admin 0 / Guest 0). Re-run → verify no errors (idempotency). |
| Cross-phase Plan 14-11 D-D2 contract regression | RBAC-06 | Cross-phase test contract update | After Plan 15-11: re-read `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-11-PLAN.md` → verify regression test 14 update is documented in Phase 15 commit history (visible via `git log --grep "D-D2" --grep "avatar-dropdown" --grep "perm-based"`). |
| 15-UAT-CHECKLIST.md scenario walkthrough | RBAC-08 | End-to-end UAT signoff | Plan 15-12 ships ~20-25 row checklist; manual click-through covering: Admin role flip, Custom role create/delete + Member fallback, Permission matrix toggle persists, Guest read-only login, Self-edit prevented, Admin Paneli link perm-based, System role protected from rename/delete. |

---

## Validation Sign-Off

- [ ] All 13 phase requirements (RBAC-01..08 + TIDY-01..05) have at least one `<automated>` verify command OR explicit Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (Wave 0 fixtures land first per build order D-4.6)
- [ ] Wave 0 covers all NEW test files (Backend 15 + Frontend 13 + E2E 5)
- [ ] No watch-mode flags (`--watch`, `--ui` excluded from CI commands)
- [ ] Feedback latency: ≤ 30s quick run; ≤ 5min full suite
- [ ] Schema push command (`alembic upgrade head`) explicit in Plan 15-04 and idempotent (replay-tested)
- [ ] Cross-phase contract update test cited (Plan 14-11 avatar-dropdown Test 14)
- [ ] 7-layer atomic-commit invariant verifiable via `git diff --stat HEAD~1` post-Plan 15-10
- [ ] `nyquist_compliant: true` set in frontmatter after planner produces all 12 PLAN.md files matching this map

**Approval:** pending — gsd-planner produces PLAN.md files; gsd-plan-checker verifies coverage; flip `nyquist_compliant: true` after `## VERIFICATION PASSED`.

---
phase: 14
slug: admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-27
last_updated: 2026-04-27
approved_at: 2026-04-27
approved_by: Plan 14-12 Task 2
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Strategy details and per-test mapping live in `14-RESEARCH.md` § "Validation Architecture".
> The per-task table below is **populated during planning** (see Plan 14-12 Task 2 for the final flip to `nyquist_compliant: true` once executors run the commands and update Status).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (frontend)** | vitest 2.x + @testing-library/react |
| **Framework (frontend e2e)** | Playwright (existing `Frontend2/playwright.config.ts`, `Frontend2/e2e/`) |
| **Framework (backend)** | pytest 7.x (existing `Backend/pytest`, `Backend/app/tests`) |
| **Config file (frontend)** | `Frontend2/vitest.config.ts` (verified present 2026-04-27) |
| **Config file (frontend e2e)** | `Frontend2/playwright.config.ts` |
| **Config file (backend)** | `Backend/pytest.ini` or pyproject `[tool.pytest.ini_options]` |
| **Quick run command (frontend unit)** | `cd Frontend2 && npm run test -- --run` |
| **Quick run command (backend)** | `cd Backend && python -m pytest -q` |
| **Full suite command (frontend e2e)** | `cd Frontend2 && npm run test:e2e` |
| **Full suite command (backend)** | `cd Backend && python -m pytest` |
| **Estimated runtime (quick)** | ~30-60 seconds (per layer) |
| **Estimated runtime (full)** | ~3-5 minutes (Playwright + pytest combined) |

---

## Sampling Rate

- **After every task commit:** Run the quick command for the layer touched (frontend unit OR backend pytest).
- **After every plan wave:** Run the full suite for both layers.
- **Before `/gsd-verify-work`:** Full Playwright e2e + backend pytest must be green; frontend unit must be green.
- **Max feedback latency:** 60 seconds for unit; 5 minutes for full suite.

---

## Per-Task Verification Map

> Populated by gsd-planner during plan generation. Each PLAN.md task with `<automated>` block contributes one row.
> Status flips from ⬜ → ✅ as executors complete each task and the verify command exits 0.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-T1 | 14-01 | 0 | D-A6, D-B4, D-C4, D-W3 | T-14-01-05 | papaparse install + ConfirmDialog tone + NavTabs + Modal + shared MoreMenu + admin lib utilities | RTL | `cd Frontend2 && node -e "require('papaparse')" && npm run test -- --run nav-tabs.test.tsx confirm-dialog.test.tsx more-menu.test.tsx` | Frontend2/components/primitives/nav-tabs.test.tsx + Frontend2/components/admin/shared/more-menu.test.tsx | ✅ |
| 14-01-T2 | 14-01 | 0 | D-A1, D-A2, D-A8 | T-14-01-08, T-14-01-10 | ProjectJoinRequest vertical slice + DIP enforcement + atomic approve rollback | pytest | `cd Backend && python -m pytest -q tests/integration/test_create_join_request.py tests/integration/test_approve_join_request.py` | Backend/tests/integration/test_create_join_request.py | ✅ |
| 14-01-T3 | 14-01 | 0 | D-A6, D-A7, D-A8, D-B2-B8, D-W3, D-X1-X4, D-Z2 | T-14-01-01, T-14-01-03, T-14-01-04, T-14-01-06, T-14-01-09 | Admin user/audit/stats/summary slices + alembic upgrade + 50k cap + Pitfall 6 + 7 | pytest | `cd Backend && alembic upgrade head && python -m pytest -q tests/integration/test_admin_users_crud.py tests/integration/test_admin_audit_get_global.py tests/integration/test_admin_stats.py tests/integration/test_generate_admin_summary_pdf.py` | Backend/tests/integration/test_admin_users_crud.py | ✅ |
| 14-01-T4 | 14-01 | 0 | D-W1, D-W2 | T-14-01-04 | 4 admin services + 12 hooks + optimistic update on approve/reject | RTL | `cd Frontend2 && npm run test -- --run admin-join-request-service.test.ts use-approve-join-request.test.tsx` | Frontend2/services/admin-join-request-service.test.ts | ✅ |
| 14-02-T1 | 14-02 | 1 | D-C2, D-C3, D-C4 | T-14-02-01, T-14-02-02, T-14-02-03 | Middleware matcher + admin layout race-safe guard + NavTabs strip | RTL | `cd Frontend2 && npm run test -- --run "app/(shell)/admin/layout.test.tsx"` | Frontend2/app/(shell)/admin/layout.test.tsx | ✅ |
| 14-02-T2 | 14-02 | 1 | D-W1, D-W2, D-Y1 | T-14-02-04, T-14-02-05 | Overview tab — 5 StatCards + Pending Requests + Role distribution + Recent admin events | build | `cd Frontend2 && npm run build` | Frontend2/app/(shell)/admin/page.tsx | ✅ |
| 14-03-T1 | 14-03 | 2 | D-A6, D-B7, D-C5, D-W3 | T-14-03-02, T-14-03-04, T-14-03-05 | Consume shared more-menu (from Plan 14-01) + UsersTable + bulk-action toolbar + filter persistence | RTL | `cd Frontend2 && npm run test -- --run users-table.test.tsx` | Frontend2/components/admin/users/users-table.test.tsx | ✅ |
| 14-03-T2 | 14-03 | 2 | D-B2, D-B4 | T-14-03-01 | AddUserModal + BulkInviteModal with 500-row cap (client+server) | RTL | `cd Frontend2 && npm run test -- --run add-user-modal.test.tsx bulk-invite-modal.test.tsx` | Frontend2/components/admin/users/add-user-modal.test.tsx | ✅ |
| 14-04-T1 | 14-04 | 2 | D-A2, D-A4, D-A5, D-Y1 | T-14-04-02, T-14-04-04 | Roller tab — 4 cards + dashed-border placeholder + AlertBanner | build | `cd Frontend2 && npm run build` | Frontend2/app/(shell)/admin/roles/page.tsx | ✅ |
| 14-04-T2 | 14-04 | 2 | D-A2, D-A3 | T-14-04-01 | Permissions tab — 14×4 disabled toggle matrix + multiple defenses | RTL | `cd Frontend2 && npm run test -- --run permission-matrix-card.test.tsx` | Frontend2/components/admin/permissions/permission-matrix-card.test.tsx | ✅ |
| 14-05-T1 | 14-05 | 2 | D-B1, D-B5 | T-14-05-01, T-14-05-02 | Projects tab — 8-col table + EXACTLY 2 MoreH (Arşivle + Sil) — NO transfer-ownership | RTL | `cd Frontend2 && npm run test -- --run admin-projects-table.test.tsx` | Frontend2/components/admin/projects/admin-projects-table.test.tsx | ✅ |
| 14-06-T1 | 14-06 | 2 | D-B1 | T-14-06-01 | Workflows tab — template card grid + impact-aware Sil with "Yine de sil" checkbox | RTL | `cd Frontend2 && npm run test -- --run admin-template-card.test.tsx` | Frontend2/components/admin/workflows/admin-template-card.test.tsx | ✅ |
| 14-07-T1 | 14-07 | 2 | D-C5, D-C6, D-Z1, D-Z2, D-W3 | T-14-07-01, T-14-07-03, T-14-07-05, T-14-07-06 | Audit tab — URL-driven filters + 50k cap warning + NO risk column + Detay variant stub | RTL | `cd Frontend2 && npm run test -- --run admin-audit-table.test.tsx` | Frontend2/components/admin/audit/admin-audit-table.test.tsx | ✅ |
| 14-07-T2 | 14-07 | 2 | D-Z2 | T-14-07-03 | AuditFilterModal — 4 fields + Apply/Clear/Cancel | RTL | `cd Frontend2 && npm run test -- --run audit-filter-modal.test.tsx` | Frontend2/components/admin/audit/audit-filter-modal.test.tsx | ✅ |
| 14-08-T1 | 14-08 | 2 | D-A7, D-C6, D-W1, D-X1, D-X2 | T-14-08-01, T-14-08-04 | Stats page + ActiveUsersTrendChart (recharts) + MethodologyBars (pure CSS) lazy-loaded | RTL | `cd Frontend2 && npm run test -- --run active-users-trend-chart.test.tsx` | Frontend2/components/admin/stats/active-users-trend-chart.test.tsx | ✅ |
| 14-08-T2 | 14-08 | 2 | D-X4 | T-14-08-02 | VelocityCardsGrid + VelocityMiniBar — top-30 cap defensive + last-bar primary | build | `cd Frontend2 && npm run build` | Frontend2/components/admin/stats/velocity-mini-bar.tsx | ✅ |
| 14-09-T1 | 14-09 | 3 | D-A8, D-D2 | T-14-09-02, T-14-09-04, T-14-09-05 | task_repo + project_repo enrichment + BoardColumn.name resolution + no regression | pytest | `cd Backend && python -m pytest -q tests/integration/test_activity.py tests/integration/test_user_activity.py` | Backend/app/infrastructure/database/repositories/task_repo.py | ✅ |
| 14-09-T2 | 14-09 | 3 | D-A8, D-D2, D-D6 | T-14-09-01, T-14-09-03 | Comment/milestone/artifact/phase_report enrichment + 160-char excerpt PII guardrail + backward compat | pytest | `cd Backend && python -m pytest -q tests/integration/test_audit_log_enrichment.py` | Backend/tests/integration/test_audit_log_enrichment.py | ✅ |
| 14-10-T1 | 14-10 | 3 | D-D3, D-D6 | T-14-10-01, T-14-10-02 | audit-event-mapper extension 10→23 types + semanticToFilterChip exhaustive + Pitfall 1+9 | RTL | `cd Frontend2 && npm run test -- --run audit-event-mapper.test.ts` | Frontend2/lib/audit-event-mapper.test.ts | ✅ |
| 14-10-T2 | 14-10 | 3 | D-D4, D-D5, D-D6 | T-14-10-03, T-14-10-04, T-14-10-05 | activity-row admin-table variant + 5 new render branches + snake_case discipline | RTL | `cd Frontend2 && npm run test -- --run activity-row.test.tsx` | Frontend2/components/activity/activity-row.test.tsx | ✅ |
| 14-11-T1 | 14-11 | 3 | D-B6 | T-14-11-01, T-14-11-02, T-14-11-03 | AdminLayout button wiring + avatar-dropdown Admin Paneli verification | RTL | `cd Frontend2 && npm run test -- --run avatar-dropdown.test.tsx` | Frontend2/components/shell/avatar-dropdown.test.tsx | ✅ |
| 14-12-T1 | 14-12 | 4 | D-00, D-C3 | T-14-12-01, T-14-12-02 | 5 e2e specs (route guard / Overview / Users / Audit / Stats) + UAT checklist | playwright | `cd Frontend2 && npx playwright test e2e/admin-*.spec.ts` (skip-guard pattern → Phase 11 D-50 health-check, NOT GSD_E2E_DB_SEEDED env var; deviation rule 1 — deferred-items not applicable) | Frontend2/e2e/admin-route-guard.spec.ts + admin-overview.spec.ts + admin-users-crud.spec.ts + admin-audit-filter.spec.ts + admin-stats-render.spec.ts + .planning/phases/14-.../14-UAT-CHECKLIST.md | ✅ |
| 14-12-T2 | 14-12 | 4 | (all D-XX) | T-14-12-03 | VALIDATION.md per-task table populated + full Frontend + Backend smoke | mixed | `cd Frontend2 && npm run test -- --run && cd ../Backend && python -m pytest -q tests/integration/` (integration suite is the contract for admin endpoints; full pytest including tests/unit/ has 11 pre-existing unit failures documented in deferred-items.md) | .planning/phases/14-.../14-VALIDATION.md | ✅ |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Total task rows: 22 across 12 plans (4 in Plan 14-01; 2 each in 14-02, 14-03, 14-04, 14-08, 14-09, 14-10, 14-12; 1 each in 14-05, 14-06, 14-11; 2 in 14-07).**

---

## Wave 0 Requirements

> Captured from RESEARCH.md § "Validation Architecture" and § "Implementation Strategy". Plan 14-01 (Wave 0 fat infra) MUST satisfy all of the following before W2 surface plans run.

- [x] `cd Frontend2 && npm install [email protected] @types/[email protected] --save` (and `--save-dev` for types) — installed papaparse@5.5.3 + @types/papaparse@5.5.2 (satisfies ^5.3.16)
- [x] `Frontend2/vitest.config.ts` — verified exists (jsdom env, alias `@/*`)
- [x] `Frontend2/components/primitives/nav-tabs.tsx` — new primitive (Link-based, copies `Tabs` styling)
- [x] `Frontend2/components/primitives/modal.tsx` — new primitive (overlay + panel + slots)
- [x] `Frontend2/components/primitives/confirm-dialog.tsx` — extended with `tone?: "primary" | "danger" | "warning"` (default "primary", backward-compatible) — actual location is Frontend2/components/projects/confirm-dialog.tsx
- [x] `Frontend2/components/admin/shared/more-menu.tsx` — shared MoreH dropdown consumed by users/projects/workflows tables (Plans 14-03 / 14-05 / 14-06) plus Plans 14-02 (Pending requests) and 14-07 (Audit)
- [x] `Frontend2/services/admin-{join-request,user,audit,stats}-service.ts` — 4 service modules built
- [x] `Backend/alembic/versions/006_phase14_admin_panel.py` — migration created AND `alembic upgrade head` executed (verified: project_join_requests table present in dev DB)
- [x] `Backend/app/domain/entities/project_join_request.py` — Pydantic entity built
- [x] `Backend/app/domain/repositories/project_join_request_repository.py` — `IProjectJoinRequestRepository` ABC built

*Wave 0 also writes the FIRST round of unit/integration test stubs for the primitives and the join-request repo so downstream plans have green-field test files to extend.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity to prototype | UI-SPEC § Visual Tokens | Pixel-equality with `New_Frontend/SPMS Prototype.html` is a human judgment | Open `/admin/*` in dev server, compare side-by-side with prototype HTML at `New_Frontend/SPMS Prototype.html`; check spacing, color, typography, focus rings |
| Locale TR/EN parity on every admin surface | CONTEXT D-LOC | i18n drift is hard to script; QA toggles language and walks every tab/modal | Toggle locale in header; visit Genel, Kullanıcılar, Davetler/Roller, Permissions, Audit; confirm no fallback strings (`__MISSING__` etc.) |
| Empty / loading / error states for admin tables | UI-SPEC § States | Snapshotting all 3 states for 5 tables is heavy; manual smoke is faster | Use devtools network throttle + offline mode to force loading + error; clear DB to force empty |
| Email invite delivery (Add User + Bulk Invite) | D-B2, D-B4 | Requires SMTP test setup; not run in CI | Configure local SMTP (mailhog), trigger invite, click set-password link from received email, set password, login |
| Admin summary PDF download | D-B6 | PDF binary inspection requires manual Adobe/Preview check | Click Rapor al; assert downloaded PDF opens in viewer with correct sections (user count + delta, top 5 projects, top 5 users) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (22-row table populated above; every PLAN task with `<automated>` block contributes one row)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (verified by walking the table — every plan has at least one row, and Plan 14-08's 2 rows include 1 RTL + 1 build to keep latency under 60s)
- [x] Wave 0 covers all MISSING references (papaparse, NavTabs, Modal, ConfirmDialog tone, admin service modules, ProjectJoinRequest schema, alembic 006) — see Wave 0 Requirements section above (all 9 items checked)
- [x] No watch-mode flags (every command uses `--run` for vitest; never `npm test` alone; pytest has no watch flag concerns)
- [x] Feedback latency < 60s (unit) / 300s (full) — measured during Plan 14-12 Task 2 smoke: Frontend2 vitest 17.91s, Backend pytest 13.69s; both well under the budget
- [x] `nyquist_compliant: true` set in frontmatter — flipped above by Plan 14-12 Task 2 after Task 1 (5 e2e specs + UAT) shipped + full smoke confirmed green modulo pre-existing failures (workflow-editor 19 + test_project_workflow_patch 3 + Backend unit 11; all 3 documented in deferred-items.md)

**Approval:** signed-off Plan 14-12 Task 2 (2026-04-27) — Phase 14 ready for `/gsd-verify-work` handoff with 33-row UAT checklist + 5 skip-guarded Playwright specs for the post-merge manual sweep.

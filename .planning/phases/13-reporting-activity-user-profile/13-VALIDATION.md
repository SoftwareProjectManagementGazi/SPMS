---
phase: 13
slug: reporting-activity-user-profile
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x (Backend) + vitest + RTL (Frontend2) + Playwright (E2E with skip-guards) |
| **Config file** | `Backend/pyproject.toml`, `Frontend2/vitest.config.ts`, `Frontend2/playwright.config.ts` |
| **Quick run command** | `cd Backend && pytest -x -q tests/integration/test_charts.py tests/integration/test_user_activity.py` for backend; `cd Frontend2 && npx vitest run --reporter=basic <changed-test>` for frontend |
| **Full suite command** | `cd Backend && pytest -q` + `cd Frontend2 && npx vitest run` + `cd Frontend2 && npx playwright test --grep @phase-13 --skip-on-missing-seed` |
| **Estimated runtime** | ~30s backend + ~25s frontend unit + ~20s E2E (skip-guarded) |

---

## Sampling Rate

- **After every task commit:** Run quick scope test (single file vitest or pytest -x against the changed file).
- **After every plan wave:** Run full suite for that layer (backend pytest -q OR frontend vitest run).
- **Before `/gsd-verify-work`:** Full suite (backend + frontend + E2E) must be green.
- **Max feedback latency:** 30 seconds (single-file scope), 90 seconds (per-wave full suite).

---

## Per-Task Verification Map

> Filled in by the planner during Step 8. Each PLAN.md task carries an `<automated>` block; this table is the index.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-* | 01 | 1 | REPT-01..04, PROF-01..04 (backend infra) | SEC-09 (RBAC) / SEC-PRIV (viewer-filter) | Project-member gate enforced; user activity filtered by viewer projects | integration (in-memory fakes) | `cd Backend && pytest -x -q tests/integration/test_charts.py tests/integration/test_user_activity.py` | ❌ W0 | ⬜ pending |
| 13-02-* | 02 | 2 | PROF-03 (header dropdown) | A11Y / SEC-AUTH (logout) | Logout clears token; admin gate hides menu item; click-outside dismiss | unit + RTL | `cd Frontend2 && npx vitest run components/shell/avatar-dropdown.test.tsx` | ❌ W0 | ⬜ pending |
| 13-03-* | 03 | 2 | PROF-03 (cross-site avatar links) | — | Avatar `href` optional, no consumer regression, AvatarStack overflow chip non-linkable | unit + RTL | `cd Frontend2 && npx vitest run components/primitives/avatar.test.tsx` | ❌ W0 | ⬜ pending |
| 13-04-* | 04 | 3 | PROF-01 (project Activity tab) | SEC-09 | Audit-event mapper handles 10 types; filter persistence per-project; clickable refs | unit + RTL | `cd Frontend2 && npx vitest run components/activity/activity-tab.test.tsx` | ❌ W0 | ⬜ pending |
| 13-05-* | 05 | 3 | PROF-02, PROF-04 (profile route + Tasks tab) | SEC-PRIV (any auth user can view) | Sen badge on self; tasks grouped by project; row click → task detail | unit + RTL | `cd Frontend2 && npx vitest run app/\(shell\)/users/\[id\]/page.test.tsx` | ❌ W0 | ⬜ pending |
| 13-06-* | 06 | 3 | PROF-02 (Profile Projects + Activity tabs) | SEC-PRIV | Activity reuses Plan 13-04 ActivityTab via `<ActivityTab userId={id} variant="full"/>`; query-param tab routing | unit + RTL | `cd Frontend2 && npx vitest run components/profile/profile-projects-tab.test.tsx` (Activity coverage provided by Plan 13-04 `components/activity/activity-tab.test.tsx`) | ❌ W0 | ⬜ pending |
| 13-07-* | 07 | 3 | REPT-01, REPT-02 (CFD + Lead/Cycle) | SEC-09 | Methodology gating (CFD = Kanban only); chart cards consume DataState | unit + RTL | `cd Frontend2 && npx vitest run components/reports/cfd-chart.test.tsx components/reports/lead-cycle-chart.test.tsx` | ❌ W0 | ⬜ pending |
| 13-08-* | 08 | 3 | REPT-03, REPT-04 (Iteration + Faz Raporları) | SEC-09 | Iteration gated to cycle methodologies; phase-report row inline expand reuses Phase 12 EvaluationReportCard | unit + RTL | `cd Frontend2 && npx vitest run components/reports/iteration-chart.test.tsx components/reports/phase-reports-section.test.tsx` | ❌ W0 | ⬜ pending |
| 13-09-* | 09 | 4 | REPT-01..04 + PROF-01..04 (responsive + a11y) | A11Y | Mobile ≤640px layouts; chart aria-labels; keyboard nav for dropdown + tabs | unit + RTL + axe | `cd Frontend2 && npx vitest run --grep "responsive\|a11y"` | ❌ W0 | ⬜ pending |
| 13-10-* | 10 | 4 | All Phase 13 REQs (E2E smoke) | — | 5 Playwright specs (charts render, activity tab, profile load, dropdown logout, phase reports) with skip-guards (no test-DB seeder yet) | E2E | `cd Frontend2 && npx playwright test --grep @phase-13` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `Backend/tests/integration/test_charts.py` — stubs for REPT-01, REPT-02, REPT-03 (CFD + Lead/Cycle + Iteration endpoints, in-memory fakes per Phase 12 D-09)
- [ ] `Backend/tests/integration/test_user_activity.py` — stubs for PROF-02 (`/users/{id}/activity` viewer-filter privacy + admin bypass)
- [ ] `Backend/tests/integration/test_audit_event_mapper.py` — stubs for the audit_log → semantic event mapping contract (Plan 13-01 critical hidden contract per RESEARCH.md §Pattern 7)
- [ ] `Frontend2/components/primitives/data-state.test.tsx` — stubs for DataState 3-state primitive (loading / error / empty / children slots)
- [ ] `Frontend2/components/primitives/avatar.test.tsx` — extended for optional `href` prop (no regression on non-linked variants)
- [ ] `Frontend2/components/shell/avatar-dropdown.test.tsx` — stubs for menu items + admin gating + dismiss + logout
- [ ] `Frontend2/components/activity/activity-tab.test.tsx` — stubs for projectId vs userId variant + filter persistence + 10 event types
- [ ] `Frontend2/app/(shell)/users/[id]/page.test.tsx` — stubs for self-vs-other rendering + tab routing
- [ ] `Frontend2/components/reports/{cfd,lead-cycle,iteration}-chart.test.tsx` — stubs for chart methodology gating + DataState integration
- [ ] `Frontend2/components/reports/phase-reports-section.test.tsx` — stubs for 2-tab outer Tabs + project+phase pickers + row inline expand
- [ ] `Frontend2/e2e/reports-charts.spec.ts`, `Frontend2/e2e/profile-page.spec.ts`, `Frontend2/e2e/avatar-dropdown.spec.ts`, `Frontend2/e2e/activity-tab.spec.ts`, `Frontend2/e2e/phase-reports.spec.ts` — 5 skip-guarded E2E specs (Phase 11 D-50 pattern)
- [ ] `13-UAT-CHECKLIST.md` artifact — manual UAT rows for REPT-01..04 + PROF-01..04 (~15-20 rows)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity vs prototype (Reports / Activity / Profile / AvatarDropdown) | D-00 quality bar | Pixel-level fidelity is subjective; UAT compares side-by-side with prototype HTML | Open prototype `New_Frontend/src/pages/{misc,activity-tab,user-profile}.jsx` + `shell.jsx` side-by-side with built page; verify card layout, spacing, badge tones, font weights match. |
| Chart visual quality at multiple ranges (7d/30d/90d) | REPT-01..03 | Chart rendering is library-dependent; subjective shape/legibility check | Switch range chips on each chart; confirm shape evolves as expected and legends/tooltips remain legible. |
| Avatar dropdown role-conditional Admin Paneli | PROF-03 D-D2 | Requires login as admin user vs non-admin user | Log in as Admin → dropdown shows Admin Paneli; log in as Member → it is hidden. |
| Privacy filter for `/users/{id}/activity` | PROF-02 D-C7 | Cross-account verification | As User A (member of Project X only): visit User B's profile → Activity tab shows only events on Project X (NOT Project Y where A is not a member). As Admin: see all events. |
| Mobile ≤640px layouts | D-F1 | DevTools / real device viewport | DevTools 375×812 → confirm Reports stacks 1fr, Profile header stacks vertically, chart heights tighten per D-F1, dropdown adapts. |
| Logout flow lands cleanly on `/auth/login` | PROF-03 D-D3 | Cross-route navigation + token clearing in real browser | Click Çıkış Yap → confirm redirect to `/auth/login`, token gone from localStorage, no flash of authed UI. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s (per-wave) / < 30s (per-task)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

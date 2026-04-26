---
phase: 14
slug: admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

> Strategy details and per-test mapping live in `14-RESEARCH.md` § "Validation Architecture".
> The planner will populate the per-task table below from the PLAN.md task IDs as plans are written.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (frontend)** | vitest 2.x + @testing-library/react |
| **Framework (frontend e2e)** | Playwright (existing `Frontend2/playwright.config.ts`, `Frontend2/e2e/`) |
| **Framework (backend)** | pytest 7.x (existing `Backend/.pytest_cache`, `Backend/app/`) |
| **Config file (frontend)** | `Frontend2/vitest.config.ts` (verify presence in Wave 0; add if missing) |
| **Config file (frontend e2e)** | `Frontend2/playwright.config.ts` |
| **Config file (backend)** | `Backend/pytest.ini` or pyproject `[tool.pytest.ini_options]` |
| **Quick run command (frontend unit)** | `cd Frontend2 && npm run test -- --run` |
| **Quick run command (backend)** | `cd Backend && pytest -q app/tests` |
| **Full suite command (frontend e2e)** | `cd Frontend2 && npm run test:e2e` |
| **Full suite command (backend)** | `cd Backend && pytest` |
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _to be populated by planner_ | | | | | | | | | |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> Captured from RESEARCH.md § "Validation Architecture" and § "Implementation Strategy". Plan 14-01 (Wave 0 fat infra) MUST satisfy all of the following before W2 surface plans run:

- [ ] `cd Frontend2 && npm install papaparse@^5.5.3 @types/papaparse@^5.3.16 --save` (and `--save-dev` for types)
- [ ] `Frontend2/vitest.config.ts` — verify exists; add if missing (jsdom env, alias `@/*` to project root)
- [ ] `Frontend2/components/primitives/nav-tabs.tsx` — new primitive scaffold (Link-based, copies `Tabs` styling)
- [ ] `Frontend2/components/primitives/modal.tsx` — new primitive scaffold (overlay + panel + header/body/footer slots)
- [ ] `Frontend2/components/primitives/confirm-dialog.tsx` — extend with `tone?: "primary" | "danger" | "warning"` (default `"primary"`, backward-compatible)
- [ ] `Frontend2/lib/api/admin.ts` — service module scaffold (typed wrappers around fetch for admin endpoints)
- [ ] `Backend/alembic/versions/006_*.py` — migration for `project_join_requests` table only (RBAC tables DEFERRED per CONTEXT D-A2)
- [ ] `Backend/app/domain/entities/project_join_request.py` — Pydantic entity scaffold
- [ ] `Backend/app/domain/repositories/project_join_request_repository.py` — `IProjectJoinRequestRepository` ABC scaffold

*Wave 0 also writes the FIRST round of unit/integration test stubs for the primitives and the join-request repo so downstream plans have green-field test files to extend.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity to prototype | UI-SPEC § Visual Tokens | Pixel-equality with `New_Frontend/SPMS Prototype.html` is a human judgment | Open `/admin/*` in dev server, compare side-by-side with prototype HTML at `New_Frontend/SPMS Prototype.html`; check spacing, color, typography, focus rings |
| Locale TR/EN parity on every admin surface | CONTEXT D-LOC | i18n drift is hard to script; QA toggles language and walks every tab/modal | Toggle locale in header; visit Genel, Kullanıcılar, Davetler, Roller, Permissions, Audit; confirm no fallback strings (`__MISSING__` etc.) |
| Empty / loading / error states for admin tables | UI-SPEC § States | Snapshotting all 3 states for 5 tables is heavy; manual smoke is faster | Use devtools network throttle + offline mode to force loading + error; clear DB to force empty |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (papaparse, NavTabs, Modal, ConfirmDialog tone, admin service module, join-request schema)
- [ ] No watch-mode flags (always `--run` for vitest, never `npm test` alone)
- [ ] Feedback latency < 60s (unit) / 300s (full)
- [ ] `nyquist_compliant: true` set in frontmatter once planner populates the per-task table

**Approval:** pending

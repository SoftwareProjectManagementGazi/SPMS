---
phase: 11
slug: task-features-board-enhancements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated by gsd-nyquist-auditor / gsd-planner from RESEARCH.md § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (frontend unit)** | Vitest (install in Wave 0) |
| **Framework (frontend E2E)** | Playwright (install in Wave 0) |
| **Framework (backend)** | pytest 7.x (already installed) |
| **Config file (frontend)** | `Frontend2/vitest.config.ts`, `Frontend2/playwright.config.ts` (Wave 0) |
| **Config file (backend)** | `Backend/pytest.ini` |
| **Quick run command** | `cd Frontend2 && npm run test -- --run` (unit); `cd Backend && pytest -q` |
| **Full suite command** | `cd Frontend2 && npm run test -- --run && npm run test:e2e` + `cd Backend && pytest` |
| **Estimated runtime** | ~45–75 seconds (unit + backend); + 2–4 min for Playwright |

---

## Sampling Rate

- **After every task commit:** Run the quick command for the layer that changed (frontend unit OR backend pytest)
- **After every plan wave:** Run the full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds for quick, 5 minutes for full

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _To be filled by planner — tasks map to this table as plans are written._ | | | | | | | | | |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `Frontend2/package.json` — add `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/user-event` devDependencies
- [ ] `Frontend2/vitest.config.ts` — jsdom environment + path alias
- [ ] `Frontend2/playwright.config.ts` + `Frontend2/e2e/` — Playwright install for E2E
- [ ] `Frontend2/test/setup.ts` — testing-library matchers + TanStack Query test client
- [ ] Any npm test scripts (`test`, `test:watch`, `test:e2e`) in `Frontend2/package.json`

*If Vitest/Playwright already exist in Frontend2 when plans start: the planner can strike Wave 0 items that are already satisfied.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Custom SVG Gantt renders Day/Week/Month without visual jank | PAGE-03 | Visual/animation quality is not covered by unit tests | Open `/projects/{id}` → Timeline tab → toggle views; confirm smooth transition and no layout flicker |
| WIP column background color shift matches prototype tone | PAGE-07 | Color token lookup + CSS visual check | Exceed WIP on a column; confirm `color-mix(in oklch, var(--priority-critical) 6%, var(--bg-2))` applied and AlertBanner visible |
| TipTap toolbar matches prototype spacing/kbd hints | TASK-01 | Visual DOM inspection needed | Open Task Detail → Description → Rich mode; inspect toolbar groups |
| Backlog panel 300px fixed column pushes content without overlap | TASK-02 | Layout behavior across breakpoints | Open backlog at ≥1280px and <1280px; verify auto-close and hint text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (Vitest, Playwright)
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s (quick) / < 5min (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

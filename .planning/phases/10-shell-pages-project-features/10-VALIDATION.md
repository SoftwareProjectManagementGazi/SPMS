---
phase: 10
slug: shell-pages-project-features
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-21
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend Framework** | TypeScript compiler + Next.js build (`npx tsc --noEmit` + `npx next build`) |
| **Backend Framework** | pytest 7.x (existing pattern from Phase 9) |
| **Frontend config** | `Frontend2/tsconfig.json` |
| **Backend config** | `Backend/pytest.ini` (or `pyproject.toml`) |
| **Quick run (frontend)** | `cd Frontend2 && npx tsc --noEmit` |
| **Quick run (backend)** | `cd Backend && pytest tests/integration/test_activity.py -x -q` |
| **Full suite (frontend)** | `cd Frontend2 && npx next build` |
| **Full suite (backend)** | `cd Backend && pytest tests/ -x -q` |
| **Estimated runtime** | ~30s (tsc) + ~60s (backend pytest) |

---

## Sampling Rate

- **After every task commit:** Run `cd Frontend2 && npx tsc --noEmit`
- **After every plan wave:** Run frontend `npx next build` + backend `pytest tests/ -x -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds (tsc is fast; next build catches import/routing errors)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | PAGE-01 | — | Auth token not exposed to non-authenticated routes | build | `cd Frontend2 && npx tsc --noEmit` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | PAGE-06 | — | Login redirects to /dashboard on success | build | `cd Frontend2 && npx tsc --noEmit` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 2 | PAGE-02 | — | Projects grid renders with status badges | build | `cd Frontend2 && npx next build` | ✅ | ⬜ pending |
| 10-04-01 | 04 | 2 | PROJ-01 | — | Wizard step advances only when required fields filled | build | `cd Frontend2 && npx tsc --noEmit` | ✅ | ⬜ pending |
| 10-05-01 | 05 | 2 | PROJ-02 | — | Status change requires confirmation before PATCH | build | `cd Frontend2 && npx tsc --noEmit` | ✅ | ⬜ pending |
| 10-06-01 | 06 | 3 | PAGE-05 | — | Settings tabs render prototype-matching layout | build | `cd Frontend2 && npx next build` | ✅ | ⬜ pending |
| 10-07-01 | 07 | 3 | PROJ-03 | — | Archived project shows AlertBanner, edits disabled | build | `cd Frontend2 && npx tsc --noEmit` | ✅ | ⬜ pending |
| 10-08-01 | 08 | 3 | PROJ-04 | — | Status badge colors match prototype token system | build | `cd Frontend2 && npx tsc --noEmit` | ✅ | ⬜ pending |
| 10-09-01 | 09 | 3 | PROJ-05 | — | SegmentedControl filter calls GET /projects?status=X | build | `cd Frontend2 && npx tsc --noEmit` | ✅ | ⬜ pending |
| 10-10-01 | 10 | 4 | PAGE-01 | — | Global activity endpoint returns audit_log entries | integration | `cd Backend && pytest tests/integration/test_activity.py -x -q` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `Frontend2/` — npm install completed (Plan 01 Task 1)
- [x] `Frontend2/` — @tanstack/react-query-devtools installed (Plan 01 Task 1)
- [x] `Backend/tests/integration/test_activity.py` — stub created (Plan 01 Task 3)

*Wave 0 must complete before any frontend tasks can type-check or build.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity — all pages pixel-match prototype | PAGE-01, PAGE-02, PAGE-05, PAGE-06 (D-35) | No automated visual diff tooling configured | Open prototype HTML side-by-side with Next.js dev server. Compare layout, spacing, colors, fonts for each page. |
| Login → auth cookie + localStorage both set | D-03 | Requires browser devtools inspection | Login as test user. Check Application > LocalStorage for token. Check Application > Cookies for auth_session=1. |
| Wizard sessionStorage draft survives refresh | D-21 | Requires browser interaction | Fill wizard Step 1. Refresh page. Verify fields restored. Complete or cancel. Verify sessionStorage cleared. |
| Auth middleware redirects unauthenticated users | D-13 | Requires no-cookie browser state | Clear cookies. Navigate to /dashboard directly. Verify redirect to /login. |
| Seeder populates varied project statuses | D-36 | Requires DB restart + seed | Run seeder script. Verify 2× ACTIVE, 1× COMPLETED, 1× ON_HOLD projects exist via GET /projects. |
| SegmentedControl filter shows correct projects | PROJ-05 | Requires live API + seeded data | Click each filter tab. Verify only matching-status projects appear. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`test_activity.py` stub + npm install)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

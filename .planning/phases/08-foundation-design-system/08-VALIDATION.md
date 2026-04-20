---
phase: 8
slug: foundation-design-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured in Frontend2/ — using `next build` as type-check proxy |
| **Config file** | None — Wave 0 uses build as verification |
| **Quick run command** | `cd Frontend2 && npx next build` |
| **Full suite command** | `cd Frontend2 && npx next build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Frontend2 && npx next build`
- **After every plan wave:** Run `cd Frontend2 && npx next build` + manual visual comparison with prototype
- **Before `/gsd-verify-work`:** Full build must be green + visual parity confirmed
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | FOUND-01 | — | N/A | build | `cd Frontend2 && npx next build` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | FOUND-04 | — | N/A | grep | `grep "status-todo\|status-blocked" Frontend2/app/globals.css` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 2 | FOUND-02 | — | N/A | build | `cd Frontend2 && npx next build` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 3 | FOUND-02 | — | N/A | build | `cd Frontend2 && npx next build` | ✅ | ⬜ pending |
| 08-04-01 | 04 | 4 | FOUND-05 | — | N/A | build+visual | `cd Frontend2 && npx next build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test framework configured — using `next build` as type-check and CSS parse error proxy
- [ ] No visual regression tool — manual comparison against HTML prototype

*Existing infrastructure covers basic type-checking via the Next.js build process.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App Shell visual parity with prototype | FOUND-05 | No visual regression tool | Open both Next.js app and HTML prototype side-by-side; compare Sidebar, Header, Layout |
| Theme preset switching (6 presets) | FOUND-01 | Requires visual inspection | Toggle through all 6 presets, verify colors change correctly |
| Dark mode toggle | FOUND-01 | Requires visual inspection | Toggle dark mode, verify all components style correctly |
| Component visual fidelity | FOUND-02 | Requires visual inspection | Render each primitive component, compare against prototype |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

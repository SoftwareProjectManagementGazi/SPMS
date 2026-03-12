---
phase: 2
slug: authentication-team-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + pytest-asyncio (auto mode) |
| **Config file** | `Backend/pytest.ini` |
| **Quick run command** | `cd Backend && pytest tests/unit/ -x -q` |
| **Full suite command** | `cd Backend && pytest tests/ -q` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && pytest tests/unit/ -x -q`
- **After every plan wave:** Run `cd Backend && pytest tests/ -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-??-01 | profile | 1 | AUTH-01 | unit | `pytest tests/unit/application/test_update_user_profile.py -x` | ❌ W0 | ⬜ pending |
| 2-??-02 | profile | 1 | AUTH-01 | integration | `pytest tests/integration/api/test_auth_avatar.py -x` | ❌ W0 | ⬜ pending |
| 2-??-03 | profile | 1 | AUTH-01 | unit | `pytest tests/unit/application/test_update_user_profile.py::test_email_change_requires_password -x` | ❌ W0 | ⬜ pending |
| 2-??-04 | teams | 1 | AUTH-02 | unit | `pytest tests/unit/application/test_manage_teams.py::test_create_team -x` | ❌ W0 | ⬜ pending |
| 2-??-05 | teams | 1 | AUTH-02 | unit | `pytest tests/unit/application/test_manage_teams.py::test_add_member -x` | ❌ W0 | ⬜ pending |
| 2-??-06 | password-reset | 2 | AUTH-03 | unit | `pytest tests/unit/application/test_password_reset.py::test_request_generic_response -x` | ❌ W0 | ⬜ pending |
| 2-??-07 | password-reset | 2 | AUTH-03 | unit | `pytest tests/unit/application/test_password_reset.py::test_token_expiry -x` | ❌ W0 | ⬜ pending |
| 2-??-08 | password-reset | 2 | AUTH-03 | unit | `pytest tests/unit/application/test_password_reset.py::test_token_single_use -x` | ❌ W0 | ⬜ pending |
| 2-??-09 | lockout | 2 | AUTH-04 | unit | `pytest tests/unit/application/test_account_lockout.py -x` | ❌ W0 | ⬜ pending |
| 2-??-10 | lockout | 2 | AUTH-04 | unit | `pytest tests/unit/application/test_account_lockout.py::test_counter_resets_on_success -x` | ❌ W0 | ⬜ pending |
| 2-??-11 | lockout | 2 | AUTH-04 | unit | `pytest tests/unit/application/test_account_lockout.py::test_auto_unlock -x` | ❌ W0 | ⬜ pending |
| 2-??-12 | rate-limit | 2 | SEC-01 | integration | `pytest tests/integration/api/test_rate_limiting.py -x` | ❌ W0 | ⬜ pending |
| 2-??-13 | compliance | 3 | SEC-04 | manual | N/A — document review | N/A | ⬜ pending |
| 2-??-14 | dialogs | 3 | SAFE-01 | manual | N/A — browser test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/application/test_update_user_profile.py` — stubs for AUTH-01 (profile update + email password confirmation)
- [ ] `tests/unit/application/test_manage_teams.py` — stubs for AUTH-02 (create team, add member)
- [ ] `tests/unit/application/test_password_reset.py` — stubs for AUTH-03 (generic response, expiry, single-use)
- [ ] `tests/unit/application/test_account_lockout.py` — stubs for AUTH-04 (5 attempts, counter reset, auto-unlock)
- [ ] `tests/integration/api/test_rate_limiting.py` — stubs for SEC-01 (429 after rate limit)
- [ ] `tests/integration/api/test_auth_avatar.py` — stubs for AUTH-01 avatar upload (integration)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AlertDialog renders on delete/critical action | SAFE-01 | Requires browser DOM interaction | Open app, trigger destructive action, verify dialog appears before proceeding |
| SEC-04 compliance note exists in SDD | SEC-04 | Document review, not runtime behavior | Open `sdd_revizyon.md`, verify rate limiting and lockout are documented |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

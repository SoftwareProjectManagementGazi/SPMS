---
phase: 1
slug: foundation-security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + pytest-asyncio |
| **Config file** | `Backend/pytest.ini` |
| **Quick run command** | `cd Backend && python -m pytest tests/unit -x -q` |
| **Full suite command** | `cd Backend && python -m pytest tests/ -x` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && python -m pytest tests/unit -x -q`
- **After every plan wave:** Run `cd Backend && python -m pytest tests/ -x`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-??-01 | RBAC | 0 | ARCH-10 | integration | `pytest tests/integration/api/test_auth_rbac.py -x` | Partial (broken — needs fix) | ⬜ pending |
| 1-??-02 | RBAC | 1 | ARCH-10 | integration | `pytest tests/integration/api/test_rbac_tasks.py -x` | ❌ W0 | ⬜ pending |
| 1-??-03 | Startup | 1 | ARCH-08 | unit | `pytest tests/unit/test_startup_validation.py -x` | ❌ W0 | ⬜ pending |
| 1-??-04 | Config | 1 | ARCH-07 | unit | `pytest tests/unit/test_config.py -x` | ❌ W0 | ⬜ pending |
| 1-??-05 | SoftDelete | 2 | DATA-04 | unit | `pytest tests/unit/infrastructure/test_task_repo_soft_delete.py -x` | ❌ W0 | ⬜ pending |
| 1-??-06 | AuditLog | 2 | DATA-02 | integration | `pytest tests/integration/infrastructure/test_audit_log.py -x` | ❌ W0 | ⬜ pending |
| 1-??-07 | Indexes | 2 | DATA-05 | integration | `pytest tests/integration/infrastructure/test_indexes.py -x` | ❌ W0 | ⬜ pending |
| 1-??-08 | CORS | 1 | SEC-03 | integration | `pytest tests/integration/api/test_cors.py -x` | ❌ W0 | ⬜ pending |
| 1-??-09 | Frontend | 2 | SAFE-02 | manual | N/A — frontend 401 redirect behavior | manual only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Fix `tests/integration/api/test_auth_rbac.py` — remove broken `status_id=1` field (field doesn't exist in schema)
- [ ] `tests/integration/api/test_rbac_tasks.py` — stubs for ARCH-10 (non-member 403 + admin bypass)
- [ ] `tests/unit/test_startup_validation.py` — stubs for ARCH-08 (startup crash on insecure defaults)
- [ ] `tests/unit/test_config.py` — stubs for ARCH-07 (DEBUG flag controls SQLAlchemy echo)
- [ ] `tests/unit/infrastructure/test_task_repo_soft_delete.py` — stubs for DATA-04 (soft-delete filter)
- [ ] `tests/integration/infrastructure/test_audit_log.py` — stubs for DATA-02 (field-level audit diff)
- [ ] `tests/integration/infrastructure/test_indexes.py` — stubs for DATA-05 (index existence checks)
- [ ] `tests/integration/api/test_cors.py` — stubs for SEC-03 (CORS rejection from non-allowlisted origins)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Frontend redirects to login with "Session expired" message on receiving HTTP 401 | SAFE-02 | Frontend browser behavior — no backend test can assert client-side redirect | Open app in browser, expire/delete JWT token, navigate to a protected page, verify redirect to /login with "Session expired" toast |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

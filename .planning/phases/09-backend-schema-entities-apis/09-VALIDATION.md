---
phase: 9
slug: backend-schema-entities-apis
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x + pytest-asyncio (per existing Backend/tests/) |
| **Config file** | Backend/pytest.ini (existing) |
| **Quick run command** | `cd Backend && pytest tests/unit -x --tb=short` |
| **Full suite command** | `cd Backend && pytest` |
| **Estimated runtime** | ~60s unit, ~180s full (with Postgres integration) |

---

## Sampling Rate

- **After every task commit:** Run `cd Backend && pytest tests/unit -x --tb=short`
- **After every plan wave:** Run `cd Backend && pytest`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds (unit) / 180 seconds (full)

---

## Per-Task Verification Map

*Populated by planner during plan generation. Each task must have either an automated verify command OR reference a Wave 0 fixture/test stub.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 establishes shared test infrastructure before feature implementation:

- [ ] `Backend/tests/conftest.py` — shared async fixtures (db_session, test_user, test_project, test_team, test_process_template, clean_db)
- [ ] `Backend/tests/integration/conftest.py` — Postgres-backed fixtures (test_engine, test_async_session, alembic upgrade to 005)
- [ ] `Backend/tests/unit/test_process_config_normalizer.py` — stubs for BACK-07 schema_version normalizer
- [ ] `Backend/tests/unit/test_workflow_config_validator.py` — stubs for API-10 Pydantic workflow validation
- [ ] `Backend/tests/integration/test_migration_005.py` — idempotency check (run migration twice)
- [ ] `Backend/tests/integration/test_advisory_lock.py` — stub for D-02 pg_advisory_xact_lock concurrency test
- [ ] `Backend/tests/factories/` — test data factories for new entities (Milestone, Artifact, PhaseReport)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF visual correctness (fonts, layout) | BACK-06 / API-09 PDF export | Visual fidelity cannot be asserted reliably in CI | Run full suite, open generated `test-output-phase-report.pdf`, verify header/sections/tables render cleanly in Adobe Reader + Preview + browser PDF viewer |
| Turkish locale rendering in PDF | BACK-06 / API-09 | fpdf2 Unicode font embedding visual check | Render report with Turkish fields ("Tasarım", "Kodlama"), confirm no `?` boxes, correct diacritics |
| `process_config` schema_version normalizer backward compat (legacy row) | BACK-07 | Requires pre-v2.0 production snapshot data | Load pg_dump from v1.0 staging, verify normalizer resolves `schema_version=1` default on read, no data loss |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (unit) / 180s (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
status: partial
phase: 09-backend-schema-entities-apis
source: [09-VERIFICATION.md]
started: 2026-04-21T14:30:00.000Z
updated: 2026-04-21T14:30:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Database Migration Execution
expected: Run `alembic upgrade head` twice on a Postgres instance; verify idempotency and all schema objects (GIN index on milestones.linked_phase_ids, partial unique index ux_phase_reports_active, new columns projects.status/process_template_id/tasks.phase_id/teams.leader_id, new tables milestones/artifacts/phase_reports, process_config jsonb_set backfill sets schema_version=1)
result: [pending]

### 2. Integration Test Suite
expected: Run `pytest tests/integration/` against live `spms_db` with migration 005 applied; all 15+ Phase 9 integration tests must pass (test_migration_005.py, test_milestone_repo_integration.py, test_artifact_repo_integration.py, test_phase_report_repo_integration.py, test_phase_transitions_api.py, test_activity_api.py, test_user_summary_api.py, test_teams_leader_api.py, test_milestones_api.py, test_artifacts_api.py, test_phase_reports_api.py)
result: [pending]

### 3. PDF Visual Quality
expected: Open a Phase Report PDF generated with Turkish content (characters with diacritics like ş, ğ, ü, ö, ı, ç) and verify they render legibly; the DejaVu font chain should handle full Unicode
result: [pending]

### 4. Concurrent Advisory Lock
expected: Send two simultaneous phase-transition requests for the same project; verify one gets HTTP 409 with error_code PHASE_GATE_LOCKED while the other succeeds; confirms pg_advisory_xact_lock contention handling works correctly
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

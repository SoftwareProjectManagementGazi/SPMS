# Phase 15 Deferred Items

Items discovered during phase execution that are out of scope for the current
plan. Each entry: discovery context, scope boundary reason, and resolution
candidate (next plan or out-of-phase).

## Plan 15-02 (TIDY-02 / TIDY-03 / TIDY-05)

### tests/integration/test_admin_destructive_ops.py — pre-existing email-validation failure

**Discovered:** 2026-04-29 during Plan 15-02 final regression run
(`pytest tests/integration/`).

**Symptom:** 2 tests fail with `pydantic_core.ValidationError` for email
`'authclient+Project Manager@testexample.com'` (invalid: space character before
`@`). The test fixture seeds a user whose role name is "Project Manager" (with
space) and the `authenticated_client` factory builds the email as
`f"authclient+{role}@testexample.com"`.

**Scope boundary:** This failure exists on the parent commit (verified via
`git stash` regression check). Plan 15-02 only realigned unit tests, fixed the
projects.py 422 path, and added the `requires_db` marker — it does NOT touch
the `authenticated_client` fixture or the seeder.

**Resolution candidate:** Either
1. Phase 15 RBAC plans (15-04+) when they overhaul role names (likely renames
   "Project Manager" to "project_manager" or similar; would dissolve the
   space).
2. A standalone Plan 15-XX-TIDY-06 if RBAC redesign keeps human-readable role
   labels — fix `_make_test_jwt` / `authenticated_client` to slugify the role
   string before composing the email.

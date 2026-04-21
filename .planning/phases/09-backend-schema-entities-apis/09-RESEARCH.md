# Phase 9: Backend Schema, Entities & APIs - Research

**Researched:** 2026-04-21
**Domain:** FastAPI + SQLAlchemy async + Pydantic v2 + Alembic + PostgreSQL (pg_advisory_xact_lock, JSONB) + fpdf2
**Confidence:** HIGH

## Summary

Phase 9 is a pure backend expansion: 8 schema/entity requirements (BACK-01..08) and 10 API endpoints (API-01..10). It adds 3 new vertical slices (Milestone, Artifact, PhaseReport) following the existing Clean Architecture pattern already established in v1.0, plus schema evolution on 4 existing tables (projects, tasks, teams, process_templates, audit_log) via a single idempotent Alembic migration.

All research decisions are pre-locked in 09-CONTEXT.md (60 user decisions D-01..D-60). The job of this research is **not** to explore alternatives but to map each locked decision onto a concrete implementation recipe and flag implementation-time pitfalls. The codebase already contains every reusable asset required: idempotent migration helpers (`_table_exists`, `_column_exists` in `004_phase5_schema.py`), async repo pattern (`user_repo.py`), DI container (`dependencies.py`, 220 lines), slowapi rate limiter (used on `/auth/login`), in-memory lockout store (`services/lockout.py` — template for idempotency cache), fpdf2 in `requirements.txt` (already used in `reports.py` for table-style PDFs), and Pydantic v2 `ConfigDict(from_attributes=True)` pattern. Every architecture element already has a local precedent — the phase is high-confidence execution, not research-heavy discovery.

The single methodology-agnostic principle from `tasarım.md` §Lego Mimari (lines 722-1073) — **behavior driven by `workflow.mode` + feature toggles, never by `Project.methodology`** — must be enforced everywhere. No `if methodology == 'SCRUM'` branches in Phase 9 code. This is a critical architectural invariant that the planner and executor must preserve.

**Primary recommendation:** Execute in 3 waves. Wave 0: foundation (migration 005 + exceptions + DI split). Wave 1: schema/entity slices (Project.status, Task.phase_id, process_config normalizer, Team.leader_id, 3 new entities with repo/use-case/router). Wave 2: API endpoints (Phase Gate, Activity feed, User summary, filters, PhaseReport PDF, workflow JSON validation). Tests authored alongside each wave; no separate test phase.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Gate API (API-01):**
- **D-01:** Contention on simultaneous phase transitions: return **409 Conflict** immediately. Second request does NOT wait. Frontend shows toast + manual retry.
- **D-02:** Advisory lock scope: **per-project** via `pg_advisory_xact_lock(hash(project_id))`. Only one transition per project at a time regardless of phase pair.
- **D-03:** Auto-criteria fail: return **422 Unprocessable Entity** with per-criterion detail in response body: `{"unmet": [{"check":"all_tasks_done","passed":false,"detail":"3/5 done"}, ...]}`.
- **D-04:** Open tasks action: **bulk action + optional per-task exceptions list**. Request body shape:
  ```json
  { "source_phase_id": "nd_abc", "target_phase_id": "nd_xyz",
    "open_tasks_action": "move_to_next" | "move_to_backlog" | "keep_in_source",
    "exceptions": [{"task_id": 123, "action": "keep_in_source"}],
    "note": "...", "allow_override": false, "idempotency_key": "uuid" }
  ```
- **D-05:** Mode override: frontend sends `allow_override: bool`. Backend honors `allow_override=true` in **ALL modes including sequential-locked**. Audit log records `override_used: true`.
- **D-06:** Completion criteria storage: `process_config.phase_completion_criteria[phase_id]` JSON, project-local, **no methodology-based defaults**. Schema: `{ "phase_completion_criteria": { "nd_abc": { "auto": {...}, "manual": [...] } } }`.
- **D-07:** Continuous/Kanban mode: return **400 Bad Request** with `"Phase Gate not applicable for this workflow mode"`. Check against `workflow.mode` (not deprecated `Project.methodology`).
- **D-08:** Audit log detail: full transition envelope in `audit_log.metadata` JSONB column.
- **D-09:** Permission: **Admin + Project Manager + Team Leader** whose team works on this project.
- **D-10:** Transaction scope: **single atomic tx** — advisory lock acquisition → criteria check → task moves → audit log insert all in same AsyncSession. Advisory lock via `pg_advisory_xact_lock` releases at commit/rollback.
- **D-11:** PhaseReport coupling: **independent endpoint**. Transition writes audit log only. PhaseReport CRUD is a separate flow.
- **D-12:** Cycle counter (×N badge): **derived from audit_log** via `COUNT(action='phase_transition' AND source_phase_id=X)`. No separate column/table.

**Team Leader Role Infrastructure:**
- **D-13:** Team Leader is **organizational**, NOT project-level. Add `Team.leader_id` nullable FK → users(id).
- **D-14:** Permission scope is **project-scoped via TeamProjects join**: `EXISTS(Teams JOIN TeamProjects WHERE leader_id=user AND project_id=p)`.
- **D-15:** New DI helper: `require_project_transition_authority(project_id, current_user, ...)` — passes if Admin OR `project.manager_id == user.id` OR `user_leads_any_team_on_project(user.id, project_id)`.
- **D-16:** New `ITeamRepository` methods: `user_leads_any_team_on_project(user_id, project_id) -> bool`, `get_teams_led_by(user_id) -> list[Team]`.
- **D-17:** New endpoints: `PATCH /teams/{id}` (sets/clears `leader_id`, Admin only), `GET /users/me/led-teams`.
- **D-18:** Frontend note deferred to Phase 10-12.

**Phase ID Cross-Entity References:**
- **D-19:** Phase ID references validated on create/update against `project.process_config.workflow.nodes`. Non-existent OR `is_archived==true` → **400 Bad Request**.
- **D-20:** Validation scope is **project-local only**. Cross-project references rejected.
- **D-21:** Node deletion: **soft-delete via `node.is_archived: true`**. Archived nodes cannot be assigned to new tasks/artifacts/milestones/reports. Existing references preserved.
- **D-22:** Node ID format: `nd_` + `nanoid(10)` = 13-char URL-safe string. Generated **client-side**. Backend validates format only.
- **D-23:** Node display name (`node.name`) is user-editable, separate from `node.id`.
- **D-24:** `Milestone.linked_phase_ids`: array of node IDs. Each validated individually. Empty array valid. Backend dedupes duplicates on write.
- **D-25:** `PhaseReport` uniqueness: `UNIQUE (project_id, phase_id, cycle_number)`. `cycle_number` auto-calculated from audit_log. `revision` auto-increments on each PATCH.
- **D-26:** `Artifact.linked_phase_id`: **nullable**.

**Artifact Auto-Seed:**
- **D-27:** Default artifact list: new JSONB column `process_templates.default_artifacts`. Admin editable.
- **D-28:** Seed timing: inside `CreateProjectUseCase.execute()` in **same atomic transaction**. Delegate to `ArtifactSeeder` helper.
- **D-29:** Methodology change (process_template_id PATCH): **no-op on existing artifacts**. User manages manually.
- **D-30:** Custom workflow (no ProcessTemplate): **empty seed**, zero artifacts.

**Backend Infra:**
- **D-31:** `dependencies.py` split by-entity under `Backend/app/api/deps/`. `deps/__init__.py` re-exports all legacy symbols (backward compat). Existing `dependencies.py` becomes thin re-export shim.
- **D-32:** `process_config` schema_version normalizer: **domain entity pure method** — `Project._normalize_process_config()` wired via `@model_validator(mode='before')`. Framework-independent, testable in isolation.
- **D-33:** schema_version semantic: **integer (v1, v2, v3...)** with on-read lazy migration. Current version for Phase 9: **v1**. Canonical fields: `methodology_legacy?`, `workflow: {mode, nodes, edges, groups}`, `phase_completion_criteria: {}`, `enable_phase_assignment: bool`, `enforce_sequential_dependencies: bool`, `enforce_wip_limits: bool`, `restrict_expired_sprints: bool`.
- **D-34:** Alembic migration: single idempotent file `Backend/alembic/versions/005_phase9_schema.py`. Uses existing `_table_exists()` / `_column_exists()` helpers. `methodology` column **NOT dropped** — deferred to Phase 10+ (006_drop_methodology).

**Milestone/Artifact/PhaseReport CRUD Permissions:**
- **D-35:** Milestone: `GET` all project members. `POST/PATCH/DELETE` gated by `require_project_transition_authority`.
- **D-36:** Artifact: `GET` all members. `POST/DELETE` require `require_project_transition_authority`. `PATCH` additionally permitted for `artifact.assignee_id == current_user.id`. Assignee **cannot** reassign (split use cases: `update_artifact_by_assignee` vs `update_artifact_by_manager`).
- **D-37:** PhaseReport: `GET` all members. `POST/PATCH/DELETE` Admin+PM+TL only.

**JSON vs Relational:**
- **D-38:** `Milestone.linked_phase_ids`: **JSONB column** + GIN index for `@> '["nd_abc"]'` queries. No junction table.
- **D-39:** `PhaseReport.summary_*` fields: **explicit SQL columns** (task_count, done_count, moved_count, duration_days).
- **D-40:** `PhaseReport.completed_tasks_notes`: **JSONB column** `{"task_123": "note...", ...}`.
- **D-41:** `Artifact.file_id`: **nullable FK to existing `files` table**. Reuse v1.0 upload/download/soft-delete machinery.

**Methodology Cleanup:**
- **D-42:** Drop `Project.methodology` enum field. Replace with `Project.process_template_id` nullable FK. **Deferred to 006 migration.**
- **D-43:** Cycle i18n labels move to `ProcessTemplate.cycle_label_tr`, `ProcessTemplate.cycle_label_en` columns.
- **D-44:** Apply-to-projects: `POST /process-templates/{id}/apply` with `{project_ids, require_pm_approval}`. Per-project advisory lock before applying; if active transition detected, 5s wait then 409.
- **D-45:** Migration path: two-step. Phase 9 (005) adds `process_template_id` + backfill. Phase 10+ (006) drops `methodology`.

**Activity + Profile API:**
- **D-46:** `GET /projects/{id}/activity?type[]=...&user_id=X&date_from=Y&date_to=Z&limit=30&offset=0`. `type` multi-value from audit_log.action.
- **D-47:** Activity response: **backend JOINs users + entity labels**. Each item includes `user_name`, `user_avatar`, `entity_label`. Frontend renders without N+1.
- **D-48:** `GET /users/{id}/summary` uses `asyncio.gather()` for parallel SQL: (1) stats aggregation, (2) project list, (3) recent activity (limit 5).
- **D-49:** User profile projects list: user is member via Team → TeamProjects → Project, AND `project.status IN ('ACTIVE','COMPLETED','ON_HOLD')`. `?include_archived=true` allows archived.

**Rate Limiting + Idempotency:**
- **D-50:** Phase Gate `POST /projects/{id}/phase-transitions`: **rate limit 10s per (user_id, project_id)**. Second within window → 429. **Idempotency:** `Idempotency-Key: <uuid>` header. Cache 10 min by (user_id, project_id, idempotency_key).
- **D-51:** PDF export `GET /phase-reports/{id}/pdf`: rate limit 30s per user (CPU-heavy sync).
- **D-52:** Other CRUD endpoints: rely on existing API-wide rate limiter (slowapi SEC-01). Idempotency optional.
- **D-53:** Idempotency cache: **in-memory for Phase 9** (reuse existing lockout-store pattern). Clears on app restart. Redis deferred (v3.0 ADV-04).

**Workflow JSON Validation (API-10):**
- **D-54:** Pydantic nested models: `WorkflowNode`, `WorkflowEdge`, `WorkflowGroup`, `WorkflowConfig`. Invalid shape → 422 with Pydantic error detail.
- **D-55:** Business-rule validation: node IDs unique, edge source/target existence, sequential-flexible mode cycle detection (topological sort on flow edges; feedback edges exempt), group bounds (width/height > 0, x/y >= 0).

**Task Parent-Child:**
- **D-56:** **No inheritance enforcement** on phase_id. Parent and child independent.
- **D-57:** Parent "phase summary" mini-stepper: **frontend-derived** from children.

**PhaseReport PDF:**
- **D-58:** Library: **fpdf2** (pure Python, no system deps). Already in `requirements.txt`.
- **D-59:** Template: **programmatic composition** in `Backend/app/application/services/phase_report_pdf.py`. Functions `render_header`, `render_summary`, `render_tasks_section`, `render_reflection`. No HTML/Jinja2.
- **D-60:** Rendering: **sync** (request thread). <2MB, <500ms target.

### Claude's Discretion (to be resolved during execution)
- **Enum placement strategy:** each entity's enum (ProjectStatus, MilestoneStatus, ArtifactStatus, PhaseReportStatus) lives in entity file vs. shared module. Convention: follow existing pattern (Methodology lives in project.py, TaskPriority in task.py) — co-locate with entity.
- **DTO naming:** follow existing CreateDTO/UpdateDTO/ResponseDTO split. snake_case output (existing convention).
- **Testing strategy:** unit tests for use cases (mock repos), integration tests for repos (real Postgres via docker-compose.yaml). Match existing pytest-asyncio pattern. New test files: `tests/unit/test_phase_gate_use_case.py`, `tests/integration/test_milestone_repo.py`, etc.
- **Error code taxonomy:** custom `error_code` keys alongside HTTP status. Decide during API-01 implementation; document in PLAN.md Decision Log.
- **Deployment/migration coordination:** migration runs before API deploy. Alembic 005 only adds nullable columns + new tables → zero-downtime on rolling deploy.
- **Logging:** existing console/print pattern. Structured logging (structlog) deferred.

### Deferred Ideas (OUT OF SCOPE)
- v3.0 ADV-04 Redis for idempotency cache
- v3.0 ADV-06 Isolated test database
- Multi-file artifact attachments
- Async PDF job queue
- Approval workflow UI for template apply-to-projects (backend accepts flag; UI later)
- Drop `Project.methodology` column — deferred to Phase 10+ (006 migration)
- **Frontend concerns for Phase 10-13:** hide CRUD buttons for users lacking `require_project_transition_authority`; cycle label i18n via `process_template.cycle_label_*`; task form phase_id dropdown filters archived nodes; workflow editor archive UX; Phase Gate 422/409/429 handling.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BACK-01 | Project.status field (ACTIVE/COMPLETED/ON_HOLD/ARCHIVED enum, default ACTIVE) | Standard Stack → SQLAlchemy + Alembic; Schema Patterns → enum column; Migration 005 recipe |
| BACK-02 | Task.phase_id nullable lifecycle canvas node ID reference | Standard Stack → VARCHAR(20) column; Node ID format validation pattern (D-22 regex); Migration 005 |
| BACK-03 | process_config schema_version + on-read normalizer | Pydantic v2 @model_validator(mode='before') pattern; example in Code Examples section; schema_version chain |
| BACK-04 | Milestone entity vertical slice | Repo pattern replication from user_repo.py; JSONB + GIN index (D-38); full slice recipe |
| BACK-05 | Artifact entity vertical slice + auto-seed | Same slice pattern; CreateProjectUseCase extension; ArtifactSeeder helper (D-28) |
| BACK-06 | PhaseReport entity vertical slice + PDF | Same slice pattern; fpdf2 programmatic composition (D-58/59/60); UNIQUE constraint (D-25) |
| BACK-07 | dependencies.py split (deps/ submodules) | Python import mechanics for re-export shim; deps/auth.py, deps/project.py, ... layout |
| BACK-08 | Single idempotent Alembic migration 005 | `_table_exists`/`_column_exists` pattern (copied from 004); full recipe in Architecture Patterns |
| API-01 | Phase Gate transition endpoint | pg_advisory_xact_lock in single AsyncSession tx; 409/422/400/429 response matrix |
| API-02 | GET /projects/{id}/activity filtered paginated | Denormalized JOIN query pattern (D-47); multi-value type filter |
| API-03 | GET /users/{id}/summary rich response | asyncio.gather() 3-parallel-query pattern (D-48) |
| API-04 | GET /projects?status=ACTIVE filter | Existing projects router extension; query param on `get_all` |
| API-05 | GET /tasks/project/{id}?phase_id=X filter | Existing tasks router extension; optional query param |
| API-06 | Phase completion criteria CRUD | process_config.phase_completion_criteria PATCH-in-place; no separate table |
| API-07 | Milestone CRUD endpoints | Standard router recipe; permissions per D-35 |
| API-08 | Artifact CRUD endpoints | Same recipe; split-by-role use cases per D-36 |
| API-09 | PhaseReport CRUD + PDF export | Same recipe + fpdf2 streaming response (example in reports.py); rate limit per D-51 |
| API-10 | Workflow data structure validation | Pydantic nested BaseModel + business rules (D-54/55); topological sort for cycle detection |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Phase Gate transition mechanics | API / Backend | Database / Storage | Advisory lock is a Postgres primitive; coordination logic in backend use case |
| Advisory lock acquisition | Database / Storage | API / Backend | `pg_advisory_xact_lock` is Postgres native; SQLAlchemy async is the mediator |
| Criteria evaluation | API / Backend | — | Read-only queries over tasks + config; pure backend logic |
| Workflow JSON validation | API / Backend | — | Pydantic validators + business-rule validators run in FastAPI request handler |
| Node ID generation | Browser / Client | — | D-22: `nanoid(10)` generated **client-side**; backend validates format only |
| Audit log writes | API / Backend | Database / Storage | Backend writes; DB stores append-only |
| PDF rendering | API / Backend | — | D-60: sync fpdf2 in request thread; no frontend PDF generation |
| User summary aggregation | API / Backend | — | `asyncio.gather()` parallel SQL; returned as single JSON response |
| Idempotency cache | API / Backend (in-memory) | — | D-53: in-memory Python dict reused across requests in same process. No DB backing. |
| Rate limiting | API / Backend | — | slowapi + in-memory tracking; same process scope |
| process_config normalization | API / Backend | — | Pydantic model_validator runs on entity hydration; server-side only |
| Team-leader permission check | API / Backend | Database / Storage | SQL EXISTS query via TeamProjects join |

## Standard Stack

### Core (Already Installed — Versions from requirements.txt + sys.path)
| Library | Version in Codebase | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| fastapi | unpinned (latest) | REST API framework | Project foundation [VERIFIED: requirements.txt] |
| sqlalchemy | unpinned (async) | ORM + async engine | Project foundation [VERIFIED: requirements.txt, main.py] |
| asyncpg | unpinned | PostgreSQL async driver for SQLAlchemy | Required for async engine [VERIFIED: requirements.txt] |
| pydantic | v2 (via `pydantic-settings`) | Data validation + entity models | ConfigDict(from_attributes=True) used everywhere [VERIFIED: codebase grep] |
| pydantic[email] | unpinned | EmailStr validator | Existing in entities [VERIFIED: requirements.txt] |
| alembic | (shipped with SQLAlchemy) | Schema migrations | Existing `alembic/versions/` dir [VERIFIED: 004_phase5_schema.py] |
| slowapi | unpinned | Rate limiting middleware | Already used on `/auth/login` with `@limiter.limit("5/minute")` [VERIFIED: auth.py line 45] |
| fpdf2 | 2.8.7 (latest Feb 2026) | PDF generation | Already used in `reports.py` export_pdf endpoint [VERIFIED: requirements.txt + codebase grep; CITED: py-pdf.github.io/fpdf2] |
| passlib[bcrypt] | unpinned | Password hashing | Unchanged from v1.0 [VERIFIED: requirements.txt] |
| python-jose | unpinned | JWT validation | Unchanged from v1.0 — used in get_current_user [VERIFIED: dependencies.py] |
| pytest + pytest-asyncio | unpinned | Async test runner | Existing `pytest.ini` with `asyncio_mode=auto` [VERIFIED] |
| httpx | unpinned | Async HTTP client for API tests | Existing conftest.py via ASGITransport [VERIFIED] |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-multipart | unpinned | File upload parsing | Reuse for Artifact.file_id attachments via existing `attachments.py` pipeline |
| apscheduler | unpinned | Cron jobs | Not needed for Phase 9; exists for deadline_alert_job |
| fastapi-mail | unpinned | Email sending | Not needed for Phase 9 |
| openpyxl | unpinned | Excel export | Not needed for Phase 9 (only fpdf2) |
| aiosqlite | unpinned | In-memory test DB | Not used — integration tests use Postgres via docker-compose |

### New Libraries Needed
**NONE.** All Phase 9 requirements can be built with existing dependencies. Specifically:
- `pg_advisory_xact_lock` is a Postgres primitive accessed via `sqlalchemy.func` — no new library [CITED: leontrolski.github.io/postgres-advisory-locks.html]
- `nanoid` format validation is a regex — no `nanoid` Python package needed (IDs generated client-side)
- Idempotency cache is a plain `dict` — no `cachetools` needed (in-memory per D-53)
- Topological sort for workflow cycle detection: use `collections.deque` with Kahn's algorithm — no `networkx` needed

### Alternatives Considered
| Instead of | Could Use | Tradeoff | Verdict |
|------------|-----------|----------|---------|
| `pg_advisory_xact_lock` | Redis lock | Redis requires extra infra; advisory_xact_lock auto-releases on tx end | **Use advisory_xact_lock** — matches D-02/D-10 |
| In-memory idempotency | Redis | Redis persistent across restarts, cross-instance. Deferred to v3.0 ADV-04 | **In-memory** per D-53 |
| fpdf2 | WeasyPrint | WeasyPrint requires system libs (cairo, pango); fpdf2 pure Python | **fpdf2** per D-58 |
| fpdf2 | ReportLab | Similar, but ReportLab syntax more verbose; fpdf2 already in codebase | **fpdf2** — precedent |
| `@model_validator(mode='before')` | Custom parser func | model_validator auto-runs on every `Project.model_validate(orm)` call — no wiring needed | **model_validator** per D-32 |

**Installation:** No new packages. Existing `requirements.txt` sufficient.

**Version verification:**
```bash
# Run from Backend/ to confirm versions in your venv:
python -c "import fastapi, sqlalchemy, pydantic, fpdf, alembic; print(fastapi.__version__, sqlalchemy.__version__, pydantic.VERSION, fpdf.__version__, alembic.__version__)"
```
[ASSUMED] Exact installed versions could not be verified in this research session (no venv activation available). Planner should verify on executor machine before starting Wave 0.

## Architecture Patterns

### System Architecture Diagram

```
                                   HTTP Request
                                        |
                                        v
                         +-----------------------------+
                         | FastAPI Router (v1/*.py)    |
                         | - Extract path/query/body   |
                         | - Depends(): DI resolution  |
                         +-----------------------------+
                                        |
                                        v
                         +------------------------------------------------+
                         | DI Container (deps/*.py re-exported via        |
                         | dependencies.py shim)                          |
                         | - get_current_user (JWT decode)                |
                         | - require_project_transition_authority        |
                         |     = Admin || PM || TeamLeader-of-project    |
                         | - get_<entity>_repo(session)                   |
                         +------------------------------------------------+
                                        |
                                        v
                         +------------------------------------------------+
                         | Use Case (application/use_cases/*.py)          |
                         | - async def execute(dto, ...)                  |
                         | - orchestrate repos + services                 |
                         | - raise domain exceptions (never HTTPException)|
                         +------------------------------------------------+
                                        |
                                        v
                         +---+-------------------+-----------+
                         |   |                   |           |
                         v   v                   v           v
                   [Repository]         [PhaseGateService]  [Idempotency
                    interface (ABC)      - advisory_lock     Cache (dict)]
                    impl: SqlAlchemy     - criteria check
                                         - task moves
                                         - audit log
                         |
                         v
                   +-----------------------+
                   | SQLAlchemy AsyncSession |
                   | (scoped per request)    |
                   +-----------------------+
                         |
                         v
                   +------------------+
                   | PostgreSQL 15    |
                   | - JSONB columns  |
                   | - advisory locks |
                   | - GIN indexes    |
                   +------------------+
                         |
                         v
                   Response DTO <--- JOIN queries return rich payload for
                   (Pydantic v2)     API-02 activity feed (D-47)
                                     API-03 user summary (D-48 asyncio.gather)


  Phase Gate Request Flow (API-01, D-01..D-12, D-50):
  ---------------------------------------------------
  POST /projects/{id}/phase-transitions
       |
       +-- slowapi @limiter.limit("10/minute") (global SEC-01)
       |
       +-- Custom rate-limit check: 10s per (user_id, project_id)     --> 429
       |
       +-- Idempotency cache check: (user_id, project_id, key)         --> return cached
       |
       v
  PhaseGateService.execute(dto):
       |
       +-- async with session.begin():  (single atomic tx, D-10)
       |   |
       |   +-- await session.execute(
       |   |       select(func.pg_try_advisory_xact_lock(hash(project_id)))
       |   |   ) --> False? raise PhaseGateLockedError      --> 409
       |   |
       |   +-- Fetch project + process_config; normalize via @model_validator
       |   |
       |   +-- Check workflow.mode == continuous? --> 400 BadRequestError
       |   |
       |   +-- Validate source_phase_id, target_phase_id in workflow.nodes
       |   |   (not archived) --> else 400 ArchivedNodeReferenceError
       |   |
       |   +-- Check completion criteria (auto + manual):
       |   |   - If allow_override=False AND unmet --> 422 CriteriaUnmetError (with unmet[])
       |   |   - If allow_override=True --> log override_used=true, proceed
       |   |
       |   +-- Apply open_tasks_action (with exceptions list):
       |   |   - move_to_next: UPDATE tasks SET phase_id = target WHERE ...
       |   |   - move_to_backlog: UPDATE tasks SET phase_id = NULL, sprint_id = NULL
       |   |   - keep_in_source: no-op
       |   |
       |   +-- INSERT audit_log (entity_type='project', entity_id=project_id,
       |   |   action='phase_transition', user_id=user.id, metadata=JSON envelope per D-08)
       |   |
       |   +-- commit (advisory lock auto-releases at tx end)
       |
       +-- Cache response in Idempotency cache (10 min TTL)
       |
       v
  Response: 200 OK with transition summary
```

### Recommended Project Structure

```
Backend/app/
|-- api/
|   |-- deps/                                # D-31: NEW split DI modules
|   |   |-- __init__.py                      # re-exports every legacy symbol for back-compat
|   |   |-- auth.py                          # oauth2_scheme, get_current_user, require_admin, require_project_transition_authority
|   |   |-- project.py                       # get_project_repo, get_project_member
|   |   |-- task.py                          # get_task_repo, get_task_project_member, get_dependency_repo
|   |   |-- team.py                          # get_team_repo
|   |   |-- milestone.py                     # get_milestone_repo (NEW)
|   |   |-- artifact.py                      # get_artifact_repo (NEW)
|   |   |-- phase_report.py                  # get_phase_report_repo (NEW)
|   |   |-- audit.py                         # get_audit_repo
|   |   |-- sprint.py                        # get_sprint_repo, get_sprint_project_member
|   |   |-- comment.py                       # get_comment_repo
|   |   |-- attachment.py                    # get_attachment_repo
|   |   |-- board_column.py                  # get_board_column_repo
|   |   |-- notification.py                  # get_notification_repo, get_notification_preference_repo, get_notification_service
|   |   |-- password_reset.py                # get_password_reset_repo
|   |   |-- process_template.py              # get_process_template_repo
|   |   |-- system_config.py                 # get_system_config_repo
|   |   |-- report.py                        # get_report_repo
|   |   |-- user.py                          # get_user_repo
|   |   `-- security.py                      # get_security_service
|   |-- dependencies.py                      # LEGACY SHIM: `from app.api.deps import *`
|   |-- main.py                              # Extended: mount new routers
|   `-- v1/
|       |-- projects.py                      # EXTEND: ?status= filter (API-04)
|       |-- tasks.py                         # EXTEND: phase_id create/update + ?phase_id= filter (API-05)
|       |-- teams.py                         # EXTEND: PATCH leader_id (D-17)
|       |-- users.py                         # NEW ROUTER or extend: /users/{id}/summary, /users/me/led-teams
|       |-- phase_transitions.py             # NEW: POST /projects/{id}/phase-transitions (API-01)
|       |-- activity.py                      # NEW: GET /projects/{id}/activity (API-02) — or extend projects.py
|       |-- milestones.py                    # NEW: CRUD (API-07)
|       |-- artifacts.py                     # NEW: CRUD (API-08)
|       |-- phase_reports.py                 # NEW: CRUD + PDF (API-09)
|       `-- process_templates.py             # EXTEND: apply endpoint (D-44)
|
|-- application/
|   |-- dtos/
|   |   |-- milestone_dtos.py                # NEW: CreateDTO, UpdateDTO, ResponseDTO
|   |   |-- artifact_dtos.py                 # NEW
|   |   |-- phase_report_dtos.py             # NEW
|   |   |-- phase_transition_dtos.py         # NEW
|   |   |-- activity_dtos.py                 # NEW
|   |   |-- user_summary_dtos.py             # NEW
|   |   |-- workflow_dtos.py                 # NEW: WorkflowConfig, WorkflowNode, WorkflowEdge, WorkflowGroup (D-54)
|   |   |-- project_dtos.py                  # EXTEND: ProjectResponseDTO.status, process_template_id
|   |   |-- task_dtos.py                     # EXTEND: phase_id in Create/Update/Response
|   |   `-- team_dtos.py                     # EXTEND: leader_id in ResponseDTO + PATCH DTO
|   |-- services/
|   |   |-- idempotency_cache.py             # NEW: in-memory cache per D-53, TTL logic
|   |   |-- artifact_seeder.py               # NEW: ArtifactSeeder per D-28
|   |   |-- phase_gate_service.py            # NEW: orchestrates advisory lock + criteria + task moves (API-01)
|   |   |-- phase_report_pdf.py              # NEW: programmatic fpdf2 composition per D-59
|   |   |-- process_config_normalizer.py     # NEW: optional batch migration helper calling Project._normalize_process_config
|   |   `-- lockout.py                       # EXISTING — template for idempotency_cache.py
|   `-- use_cases/
|       |-- manage_projects.py               # EXTEND: CreateProjectUseCase wires ArtifactSeeder in same tx (D-28)
|       |-- manage_milestones.py             # NEW: Create, Update, Delete, List use cases
|       |-- manage_artifacts.py              # NEW: Split by role per D-36
|       |-- manage_phase_reports.py          # NEW: revision auto-increment per D-25
|       |-- execute_phase_transition.py      # NEW: ExecutePhaseTransitionUseCase (API-01)
|       |-- apply_process_template.py        # NEW: bulk apply per D-44
|       |-- get_user_summary.py              # NEW: asyncio.gather parallel queries (D-48)
|       `-- get_project_activity.py          # NEW: denormalized JOIN query (D-47)
|
|-- domain/
|   |-- entities/
|   |   |-- milestone.py                     # NEW
|   |   |-- artifact.py                      # NEW
|   |   |-- phase_report.py                  # NEW
|   |   |-- project.py                       # EXTEND: ProjectStatus enum + status field + process_template_id + _normalize_process_config (D-32)
|   |   |-- task.py                          # EXTEND: phase_id: Optional[str] = None (D-22 format validator)
|   |   `-- team.py                          # EXTEND: leader_id: Optional[int] = None
|   |-- repositories/
|   |   |-- milestone_repository.py          # NEW: IMilestoneRepository
|   |   |-- artifact_repository.py           # NEW: IArtifactRepository
|   |   |-- phase_report_repository.py       # NEW: IPhaseReportRepository
|   |   |-- team_repository.py               # EXTEND: user_leads_any_team_on_project, get_teams_led_by (D-16)
|   |   |-- audit_repository.py              # EXTEND: create_with_metadata (JSONB envelope), get_project_activity (filtered)
|   |   |-- user_repository.py               # EXTEND: get_summary_stats (counts for D-48)
|   |   |-- task_repository.py               # EXTEND: get_by_project_and_phase, bulk_update_phase_id
|   |   `-- project_repository.py            # EXTEND: list_by_status, get_project_for_transition (locks row optimistically)
|   `-- exceptions.py                        # EXTEND: PhaseGateLockedError, CriteriaUnmetError, ArchivedNodeReferenceError,
|                                              WorkflowValidationError, ProcessConfigSchemaError, CrossProjectPhaseReferenceError
|
|-- infrastructure/
|   `-- database/
|       |-- models/
|       |   |-- milestone.py                 # NEW: MilestoneModel (table "milestones")
|       |   |-- artifact.py                  # NEW: ArtifactModel (table "artifacts")
|       |   |-- phase_report.py              # NEW: PhaseReportModel (table "phase_reports") with UNIQUE (project_id, phase_id, cycle_number)
|       |   |-- audit_log.py                 # EXTEND: add `metadata` JSONB column (must exist after migration 005)
|       |   |-- project.py                   # EXTEND: status column, process_template_id FK
|       |   |-- task.py                      # EXTEND: phase_id VARCHAR(20)
|       |   |-- team.py                      # EXTEND: leader_id FK
|       |   |-- process_template.py          # EXTEND: default_artifacts, default_phase_criteria, default_workflow, cycle_label_tr, cycle_label_en JSONB columns
|       |   `-- __init__.py                  # EXTEND: register new models
|       `-- repositories/
|           |-- milestone_repo.py            # NEW: SqlAlchemyMilestoneRepository
|           |-- artifact_repo.py             # NEW
|           |-- phase_report_repo.py         # NEW
|           |-- team_repo.py                 # EXTEND: user_leads_any_team_on_project (EXISTS query via TeamProjectModel)
|           |-- audit_repo.py                # EXTEND: create_with_metadata; get_project_activity with JOIN on users + entity labels
|           |-- user_repo.py                 # EXTEND: get_summary_stats (asyncio.gather target queries)
|           |-- task_repo.py                 # EXTEND: filter by phase_id; bulk_update_phase_id
|           `-- project_repo.py              # EXTEND: list with ?status= filter; audit_log with metadata JSONB
|
|-- alembic/versions/
|   `-- 005_phase9_schema.py                 # NEW: single idempotent migration (D-34)
|
`-- tests/
    |-- unit/application/
    |   |-- test_phase_gate_use_case.py      # NEW
    |   |-- test_artifact_seeder.py          # NEW
    |   |-- test_manage_milestones.py        # NEW
    |   |-- test_manage_artifacts.py         # NEW
    |   |-- test_manage_phase_reports.py     # NEW
    |   |-- test_process_config_normalizer.py # NEW
    |   |-- test_workflow_validation.py      # NEW
    |   |-- test_idempotency_cache.py        # NEW
    |   `-- test_phase_report_pdf.py         # NEW (smoke — render produces non-empty bytes, no crash)
    `-- integration/
        |-- api/
        |   |-- test_phase_transitions_api.py        # NEW: 200/400/409/422/429 matrix
        |   |-- test_milestones_api.py               # NEW
        |   |-- test_artifacts_api.py                # NEW
        |   |-- test_phase_reports_api.py            # NEW (incl. PDF content-type)
        |   |-- test_activity_api.py                 # NEW
        |   |-- test_user_summary_api.py             # NEW
        |   |-- test_teams_leader_api.py             # NEW: PATCH + /users/me/led-teams
        |   `-- test_workflow_validation_api.py      # NEW
        `-- infrastructure/
            |-- test_milestone_repo_integration.py   # NEW: GIN index query test
            |-- test_artifact_repo_integration.py    # NEW
            |-- test_phase_report_repo_integration.py # NEW: UNIQUE (project_id,phase_id,cycle_number)
            `-- test_audit_metadata_integration.py   # NEW: JSONB round-trip
```

### Pattern 1: Vertical Slice Template (Milestone/Artifact/PhaseReport)

Each new entity follows this 5-file template. Copy, rename, adjust fields, implement business rules.

**1. Domain entity** (`domain/entities/milestone.py`):
```python
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"

class Milestone(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: MilestoneStatus = MilestoneStatus.PENDING
    linked_phase_ids: List[str] = Field(default_factory=list)  # D-24: array of nd_xxx IDs
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)
```

**2. Repository interface** (`domain/repositories/milestone_repository.py`):
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.milestone import Milestone

class IMilestoneRepository(ABC):
    @abstractmethod
    async def create(self, milestone: Milestone) -> Milestone: ...
    @abstractmethod
    async def get_by_id(self, milestone_id: int) -> Optional[Milestone]: ...
    @abstractmethod
    async def list_by_project(self, project_id: int) -> List[Milestone]: ...
    @abstractmethod
    async def list_by_phase(self, project_id: int, phase_id: str) -> List[Milestone]: ...  # D-38: GIN query
    @abstractmethod
    async def update(self, milestone: Milestone) -> Milestone: ...
    @abstractmethod
    async def delete(self, milestone_id: int) -> bool: ...  # Soft-delete per repo convention
```

**3. ORM model** (`infrastructure/database/models/milestone.py`):
```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base, TimestampedMixin
from app.domain.entities.milestone import MilestoneStatus

class MilestoneModel(TimestampedMixin, Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(SqlEnum(MilestoneStatus, name="milestone_status"), default=MilestoneStatus.PENDING, nullable=False)
    linked_phase_ids = Column(JSONB, nullable=False, default=list)  # D-38
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    project = relationship("ProjectModel", backref="milestones")
```

**4. Repository impl** (`infrastructure/database/repositories/milestone_repo.py`): replicate `user_repo.py` pattern:
```python
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.domain.entities.milestone import Milestone
from app.domain.repositories.milestone_repository import IMilestoneRepository
from app.infrastructure.database.models.milestone import MilestoneModel

class SqlAlchemyMilestoneRepository(IMilestoneRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: MilestoneModel) -> Milestone:
        return Milestone.model_validate(model)

    def _to_model(self, entity: Milestone) -> MilestoneModel:
        # Dedupe linked_phase_ids (D-24)
        entity.linked_phase_ids = list(dict.fromkeys(entity.linked_phase_ids))
        data = entity.model_dump(exclude={"id", "created_at", "updated_at"})
        return MilestoneModel(**data)

    def _base_query(self):
        return select(MilestoneModel).where(MilestoneModel.is_deleted == False)

    async def create(self, milestone: Milestone) -> Milestone:
        model = self._to_model(milestone)
        self.session.add(model)
        await self.session.flush()
        # Re-fetch — pattern from user_repo
        refreshed = await self.get_by_id(model.id)
        return refreshed

    async def get_by_id(self, milestone_id: int) -> Optional[Milestone]:
        stmt = self._base_query().where(MilestoneModel.id == milestone_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_project(self, project_id: int) -> List[Milestone]:
        stmt = self._base_query().where(MilestoneModel.project_id == project_id)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_phase(self, project_id: int, phase_id: str) -> List[Milestone]:
        # D-38: GIN-indexed JSONB containment query
        # Equivalent to: WHERE linked_phase_ids @> '["nd_abc"]'
        stmt = self._base_query().where(
            MilestoneModel.project_id == project_id,
            MilestoneModel.linked_phase_ids.contains([phase_id]),
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def update(self, milestone: Milestone) -> Milestone:
        # Re-select and copy, increment version; pattern from project_repo.py
        ...

    async def delete(self, milestone_id: int) -> bool:
        stmt = select(MilestoneModel).where(
            MilestoneModel.id == milestone_id, MilestoneModel.is_deleted == False
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.is_deleted = True
            model.deleted_at = datetime.utcnow()
            await self.session.commit()
            return True
        return False
```

**5. Router + DTOs** (`api/v1/milestones.py` + `application/dtos/milestone_dtos.py`): follow `api/v1/tasks.py` pattern for CRUD endpoints.

### Pattern 2: pg_advisory_xact_lock in AsyncSession (API-01, D-02/D-10)

**Critical:** the lock key must be a Python `int` fitting in Postgres int64. Use `hash(project_id) & 0x7FFFFFFFFFFFFFFF` to mask to 63 bits and avoid int64 overflow.

```python
# application/services/phase_gate_service.py
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

async def acquire_project_lock_or_fail(session: AsyncSession, project_id: int) -> None:
    """Acquire per-project advisory lock within current tx.
    Raises PhaseGateLockedError if another tx holds the lock.
    Lock auto-releases at tx commit/rollback (xact_lock semantics).
    """
    # Mask to 63 bits so Python's arbitrary-precision hash fits int64
    key = hash(f"phase_gate:{project_id}") & 0x7FFFFFFFFFFFFFFF
    # pg_try_advisory_xact_lock returns True on success, False if held by another tx
    result = await session.execute(select(func.pg_try_advisory_xact_lock(key)))
    acquired = result.scalar_one()
    if not acquired:
        raise PhaseGateLockedError(project_id)

# Usage inside single atomic tx:
async def execute_transition(self, dto, user):
    async with self.session.begin():  # single tx; lock releases at commit/rollback
        await acquire_project_lock_or_fail(self.session, dto.project_id)
        # ... criteria check, task moves, audit log insert all use self.session
        # No explicit unlock — xact_lock releases at tx end
```
[CITED: leontrolski.github.io/postgres-advisory-locks.html, medium.com/@n0mn0m/postgres-advisory-locks-with-asyncio]

**Why `pg_try_advisory_xact_lock` (not `pg_advisory_xact_lock`):**
- `pg_try_*` is non-blocking: returns False immediately if held. D-01 requires "return 409 immediately, do NOT wait."
- `pg_advisory_xact_lock` (without `try`) blocks until released — wrong semantics for D-01.

### Pattern 3: process_config Schema Version Normalizer (BACK-03, D-32/D-33)

Pure Pydantic v2 method on the Project entity, invoked automatically via `@model_validator(mode='before')`:

```python
# domain/entities/project.py
from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, Dict, Any

CURRENT_SCHEMA_VERSION = 1

def _migrate_v0_to_v1(config: dict) -> dict:
    """V0 (legacy) -> V1: rename methodology -> methodology_legacy, seed workflow stub."""
    new = dict(config)
    if "methodology" in new and "methodology_legacy" not in new:
        new["methodology_legacy"] = new.pop("methodology")
    new.setdefault("workflow", {"mode": "flexible", "nodes": [], "edges": [], "groups": []})
    new.setdefault("phase_completion_criteria", {})
    new.setdefault("enable_phase_assignment", False)
    new.setdefault("enforce_sequential_dependencies", False)
    new.setdefault("enforce_wip_limits", False)
    new.setdefault("restrict_expired_sprints", False)
    new["schema_version"] = 1
    return new

_MIGRATIONS = {
    0: _migrate_v0_to_v1,
    # 1: _migrate_v1_to_v2,  # future
}

class Project(BaseModel):
    id: Optional[int] = None
    # ... existing fields ...
    process_config: Optional[Dict[str, Any]] = None

    @model_validator(mode='before')
    @classmethod
    def normalize_process_config(cls, values):
        """Run before field validation. Lazy-migrate process_config to current schema."""
        if isinstance(values, dict):
            # Plain dict (from DTO or API body) — normalize inline
            pc = values.get("process_config")
            if pc:
                values["process_config"] = cls._normalize_pc(pc)
        else:
            # ORM model attribute access
            pc = getattr(values, "process_config", None)
            if pc:
                # NOTE: SQLAlchemy attribute writes propagate only if tracked by session
                # Since `mode='before'` runs before from_attributes conversion to dict,
                # we return the normalized dict via `values` reshape or mutate the ORM attr.
                # Safe pattern: return dict form
                from pydantic import TypeAdapter
                return {
                    **{c.name: getattr(values, c.name) for c in values.__table__.columns},
                    "process_config": cls._normalize_pc(pc),
                }
        return values

    @staticmethod
    def _normalize_pc(config: dict) -> dict:
        current = config.get("schema_version", 0)
        while current < CURRENT_SCHEMA_VERSION:
            if current in _MIGRATIONS:
                config = _MIGRATIONS[current](config)
            current = config.get("schema_version", current + 1)
        return config

    model_config = ConfigDict(from_attributes=True)
```

**Testability (D-32):** `Project._normalize_pc({"methodology":"SCRUM"})` returns fully-hydrated dict without a DB. Pure function.

**Batch migration (D-32):** `application/services/process_config_normalizer.py` provides:
```python
async def migrate_all_projects_to_current_schema(project_repo):
    """One-shot eager migration. Calls Project._normalize_pc for every project
    and writes back via project_repo.update. Run once per schema_version bump."""
    ...
```

[CITED: docs.pydantic.dev/latest/migration/ — `@model_validator(mode='before')` is the Pydantic v2 replacement for `@root_validator(pre=True)`]

### Pattern 4: Workflow JSON Pydantic Validation (API-10, D-54/D-55)

```python
# application/dtos/workflow_dtos.py
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from typing import List, Literal, Optional
from collections import defaultdict, deque
import re

NODE_ID_REGEX = re.compile(r"^nd_[A-Za-z0-9_-]{10}$")  # D-22

class WorkflowNode(BaseModel):
    id: str
    name: str
    x: float
    y: float
    color: str
    is_archived: bool = False

    @field_validator("id")
    @classmethod
    def validate_id_format(cls, v):
        if not NODE_ID_REGEX.match(v):
            raise ValueError(f"Invalid node ID format: {v} (expected nd_xxxxxxxxxx)")
        return v

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Literal["flow", "verification", "feedback"] = "flow"
    label: Optional[str] = None

class WorkflowGroup(BaseModel):
    id: str
    name: str
    x: float
    y: float
    width: float
    height: float
    color: str

    @model_validator(mode='after')
    def check_bounds(self):
        if self.width <= 0 or self.height <= 0:
            raise ValueError("Group width and height must be > 0")
        if self.x < 0 or self.y < 0:
            raise ValueError("Group x/y must be >= 0")
        return self

class WorkflowConfig(BaseModel):
    mode: Literal["flexible", "sequential-locked", "continuous", "sequential-flexible"]
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    groups: List[WorkflowGroup] = []

    @model_validator(mode='after')
    def validate_business_rules(self):
        # D-55 rule 1: node IDs unique
        ids = [n.id for n in self.nodes]
        if len(ids) != len(set(ids)):
            raise ValueError("Node IDs must be unique within workflow")

        # D-55 rule 2: edge source/target reference existing non-archived nodes
        active_ids = {n.id for n in self.nodes if not n.is_archived}
        for e in self.edges:
            if e.source not in active_ids:
                raise ValueError(f"Edge {e.id} source '{e.source}' references non-existent or archived node")
            if e.target not in active_ids:
                raise ValueError(f"Edge {e.id} target '{e.target}' references non-existent or archived node")

        # D-55 rule 3: sequential-flexible mode — flow edges must not form cycles
        # (feedback edges exempt — they are explicit loopbacks)
        if self.mode == "sequential-flexible":
            flow_edges = [e for e in self.edges if e.type == "flow"]
            if self._has_cycle(active_ids, flow_edges):
                raise ValueError("Flow edges form a cycle in sequential-flexible mode")

        return self

    @staticmethod
    def _has_cycle(node_ids: set, edges: list) -> bool:
        """Kahn's topological sort; returns True if a cycle exists."""
        in_degree = defaultdict(int)
        adj = defaultdict(list)
        for e in edges:
            adj[e.source].append(e.target)
            in_degree[e.target] += 1
        queue = deque([n for n in node_ids if in_degree[n] == 0])
        processed = 0
        while queue:
            n = queue.popleft()
            processed += 1
            for m in adj[n]:
                in_degree[m] -= 1
                if in_degree[m] == 0:
                    queue.append(m)
        return processed != len(node_ids)
```

Validation runs automatically whenever a request body includes `process_config.workflow` as a `WorkflowConfig`. Invalid → Pydantic 422.

### Pattern 5: Idempotency Cache (D-50, D-53)

Reuse the in-memory pattern from `services/lockout.py`. New module `services/idempotency_cache.py`:

```python
# application/services/idempotency_cache.py
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class CachedResponse:
    value: Any
    stored_at: datetime

_cache: dict[tuple, CachedResponse] = {}
TTL_MINUTES = 10
RATE_LIMIT_SECONDS = 10  # D-50

_last_request: dict[tuple, datetime] = {}  # (user_id, project_id) -> last request time

def check_rate_limit(user_id: int, project_id: int) -> Optional[float]:
    """Return seconds until next allowed request, or None if allowed now."""
    key = (user_id, project_id)
    last = _last_request.get(key)
    if last:
        elapsed = (datetime.utcnow() - last).total_seconds()
        if elapsed < RATE_LIMIT_SECONDS:
            return RATE_LIMIT_SECONDS - elapsed
    return None

def record_request(user_id: int, project_id: int) -> None:
    _last_request[(user_id, project_id)] = datetime.utcnow()

def lookup(user_id: int, project_id: int, idempotency_key: str) -> Optional[Any]:
    entry = _cache.get((user_id, project_id, idempotency_key))
    if entry and datetime.utcnow() - entry.stored_at < timedelta(minutes=TTL_MINUTES):
        return entry.value
    return None

def store(user_id: int, project_id: int, idempotency_key: str, value: Any) -> None:
    _cache[(user_id, project_id, idempotency_key)] = CachedResponse(value, datetime.utcnow())

def cleanup_expired() -> None:
    """Optional: call periodically via APScheduler to purge entries older than TTL."""
    now = datetime.utcnow()
    expired = [k for k, v in _cache.items() if now - v.stored_at > timedelta(minutes=TTL_MINUTES)]
    for k in expired:
        _cache.pop(k, None)
```

**Caveat (D-53):** Cache clears on app restart; does not work across multiple processes. Acknowledged. Planner should note: if executor uses gunicorn with multiple workers, idempotency may be partial. Single-worker uvicorn (current setup) is fine.

### Pattern 6: asyncio.gather for User Summary (API-03, D-48)

```python
# application/use_cases/get_user_summary.py
import asyncio
from datetime import datetime, timedelta

class GetUserSummaryUseCase:
    def __init__(self, user_repo, project_repo, audit_repo, task_repo):
        self.user_repo = user_repo
        self.project_repo = project_repo
        self.audit_repo = audit_repo
        self.task_repo = task_repo

    async def execute(self, user_id: int, include_archived: bool = False):
        # Run 3 independent queries in parallel
        stats_task = self._get_stats(user_id)
        projects_task = self._get_projects(user_id, include_archived)
        activity_task = self.audit_repo.get_recent_by_user(user_id, limit=5)

        stats, projects, activity = await asyncio.gather(stats_task, projects_task, activity_task)
        return {
            "stats": stats,
            "projects": projects,
            "recent_activity": activity,
        }

    async def _get_stats(self, user_id: int) -> dict:
        # Sub-queries inside also use gather for parallel COUNT queries
        active_count, completed_30d_count, project_count = await asyncio.gather(
            self.task_repo.count_active_by_assignee(user_id),
            self.task_repo.count_completed_since(user_id, datetime.utcnow() - timedelta(days=30)),
            self.project_repo.count_by_member(user_id),
        )
        return {
            "active_tasks": active_count,
            "completed_last_30d": completed_30d_count,
            "project_count": project_count,
        }

    async def _get_projects(self, user_id: int, include_archived: bool):
        statuses = ["ACTIVE", "COMPLETED", "ON_HOLD"]
        if include_archived:
            statuses.append("ARCHIVED")
        return await self.project_repo.list_by_member_and_status(user_id, statuses)
```

[VERIFIED: `asyncio.gather()` is Python 3.12 stdlib; used in existing `projects.py` line 112 for admin notifications.]

### Pattern 7: fpdf2 Programmatic PDF Composition (API-09, D-58/59/60)

Model after existing `reports.py export_pdf`. Composition split by section:

```python
# application/services/phase_report_pdf.py
import io
from pathlib import Path
from fpdf import FPDF
from app.domain.entities.phase_report import PhaseReport

UNICODE_FONT = "/Library/Fonts/Arial Unicode.ttf"  # falls back to Helvetica on non-macOS

def render_pdf(report: PhaseReport, project_name: str, phase_name: str) -> bytes:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Font fallback pattern (matches reports.py)
    if Path(UNICODE_FONT).exists():
        pdf.add_font("uni", fname=UNICODE_FONT)
        font = "uni"
    else:
        font = "Helvetica"

    _render_header(pdf, font, project_name, phase_name, report)
    _render_summary(pdf, font, report)
    _render_tasks_section(pdf, font, report)
    _render_reflection(pdf, font, report)

    return bytes(pdf.output())

def _render_header(pdf: FPDF, font: str, project_name: str, phase_name: str, report):
    pdf.set_font(font, size=16)
    pdf.cell(0, 10, f"Faz Değerlendirme Raporu", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=11)
    pdf.cell(0, 7, f"Proje: {project_name}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, f"Faz: {phase_name}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, f"Döngü: {report.cycle_number} | Revizyon: {report.revision}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

def _render_summary(pdf: FPDF, font: str, report):
    pdf.set_font(font, size=12, style="B")
    pdf.cell(0, 8, "Özet Metrikler", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=10)
    pdf.cell(0, 6, f"Toplam Görev: {report.summary_task_count}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Tamamlanan: {report.summary_done_count}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Taşınan: {report.summary_moved_count}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Süre: {report.summary_duration_days} gün", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

def _render_tasks_section(pdf: FPDF, font: str, report):
    pdf.set_font(font, size=12, style="B")
    pdf.cell(0, 8, "Görev Notları", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=9)
    for task_id, note in (report.completed_tasks_notes or {}).items():
        pdf.multi_cell(0, 5, f"Task {task_id}: {note}")
    pdf.ln(3)

def _render_reflection(pdf: FPDF, font: str, report):
    pdf.set_font(font, size=12, style="B")
    pdf.cell(0, 8, "Değerlendirme", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=10)
    if report.issues:
        pdf.cell(0, 6, "Sorunlar:", new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(0, 5, report.issues)
    if report.lessons:
        pdf.cell(0, 6, "Dersler:", new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(0, 5, report.lessons)
    if report.recommendations:
        pdf.cell(0, 6, "Öneriler:", new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(0, 5, report.recommendations)
```

Router wires it to a `StreamingResponse`:
```python
# api/v1/phase_reports.py
@router.get("/{report_id}/pdf")
@limiter.limit("2/minute")  # D-51: 30s per user
async def export_pdf(report_id: int, ...):
    report = await repo.get_by_id(report_id)
    project = await project_repo.get_by_id(report.project_id)
    phase_name = _lookup_phase_name(project, report.phase_id)
    pdf_bytes = render_pdf(report, project.name, phase_name)
    filename = f"PhaseReport_{project.key}_{report.phase_id}_{report.revision}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
```

[CITED: py-pdf.github.io/fpdf2/Unicode.html — font embedding pattern]

### Pattern 8: Team Leader Permission Helper (D-15, D-16)

```python
# api/deps/auth.py
from fastapi import Depends, HTTPException, status
from app.domain.entities.user import User
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.team_repository import ITeamRepository
from app.api.deps.project import get_project_repo
from app.api.deps.team import get_team_repo

async def require_project_transition_authority(
    project_id: int,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    team_repo: ITeamRepository = Depends(get_team_repo),
) -> User:
    """D-15: Admin OR PM OR Team Leader of any team on the project."""
    if _is_admin(current_user):
        return current_user
    project = await project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(404, f"Project {project_id} not found")
    if project.manager_id == current_user.id:
        return current_user
    # D-14: EXISTS(Teams JOIN TeamProjects WHERE leader_id=user AND project_id=p)
    if await team_repo.user_leads_any_team_on_project(current_user.id, project_id):
        return current_user
    raise HTTPException(403, "Phase transition authority required (Admin/PM/Team Leader)")
```

And in `team_repo.py`:
```python
async def user_leads_any_team_on_project(self, user_id: int, project_id: int) -> bool:
    from app.infrastructure.database.models.team import TeamModel, TeamProjectModel
    stmt = (
        select(TeamModel.id)
        .join(TeamProjectModel, TeamProjectModel.team_id == TeamModel.id)
        .where(
            TeamModel.leader_id == user_id,
            TeamProjectModel.project_id == project_id,
            TeamModel.is_deleted == False,
        )
        .limit(1)
    )
    result = await self.session.execute(stmt)
    return result.first() is not None
```

### Pattern 9: DI Split Backward-Compat Shim (D-31)

**Structure:**
```python
# api/deps/__init__.py
"""Backward-compat: re-export ALL symbols from sub-modules so existing
`from app.api.dependencies import get_project_repo` continues to work."""
from app.api.deps.auth import *  # noqa: F401, F403
from app.api.deps.project import *  # noqa: F401, F403
from app.api.deps.task import *
from app.api.deps.team import *
from app.api.deps.milestone import *
from app.api.deps.artifact import *
from app.api.deps.phase_report import *
from app.api.deps.audit import *
from app.api.deps.sprint import *
from app.api.deps.comment import *
from app.api.deps.attachment import *
from app.api.deps.board_column import *
from app.api.deps.notification import *
from app.api.deps.password_reset import *
from app.api.deps.process_template import *
from app.api.deps.system_config import *
from app.api.deps.report import *
from app.api.deps.user import *
from app.api.deps.security import *

# api/dependencies.py  -- LEGACY SHIM
"""Legacy import path. New code should import from app.api.deps."""
from app.api.deps import *  # noqa: F401, F403
```

Each sub-module defines `__all__ = ["get_project_repo", ...]` so `from x import *` is explicit and linters are happy.

**Risk:** `from X import *` is discouraged by linters (F403). Suppress with `# noqa: F401, F403` per file. Document pattern in top-of-file docstring.

### Pattern 10: Single Atomic Transaction for Phase Transition (D-10)

```python
# application/use_cases/execute_phase_transition.py
class ExecutePhaseTransitionUseCase:
    def __init__(self, project_repo, task_repo, audit_repo, session):
        self.project_repo = project_repo
        self.task_repo = task_repo
        self.audit_repo = audit_repo
        self.session = session  # AsyncSession — same instance used by all repos

    async def execute(self, dto: PhaseTransitionRequestDTO, user: User) -> PhaseTransitionResponseDTO:
        # Pre-tx: rate limit + idempotency (not part of DB atomic tx)
        # See Pattern 5 for idempotency_cache.

        async with self.session.begin():  # D-10: single atomic tx wraps everything
            # 1. Acquire advisory lock (Pattern 2) — 409 on contention
            await acquire_project_lock_or_fail(self.session, dto.project_id)

            # 2. Load project + normalize process_config (Pattern 3)
            project = await self.project_repo.get_by_id(dto.project_id)
            if not project:
                raise ProjectNotFoundError(dto.project_id)

            # 3. Gate on workflow.mode (D-07)
            mode = project.process_config.get("workflow", {}).get("mode")
            if mode == "continuous":
                raise PhaseGateNotApplicableError(mode)

            # 4. Validate source/target phase IDs exist and not archived (D-19, D-21)
            nodes = project.process_config.get("workflow", {}).get("nodes", [])
            node_map = {n["id"]: n for n in nodes}
            for pid in (dto.source_phase_id, dto.target_phase_id):
                node = node_map.get(pid)
                if not node:
                    raise ArchivedNodeReferenceError(f"Node {pid} not in project workflow")
                if node.get("is_archived"):
                    raise ArchivedNodeReferenceError(f"Node {pid} is archived")

            # 5. Criteria check (D-03, D-05)
            criteria = project.process_config.get("phase_completion_criteria", {}).get(dto.source_phase_id, {})
            unmet = await self._check_criteria(dto.project_id, dto.source_phase_id, criteria)
            if unmet and not dto.allow_override:
                raise CriteriaUnmetError(unmet)

            # 6. Apply open_tasks_action with exceptions (D-04)
            moved_count = await self._apply_task_moves(
                dto.project_id, dto.source_phase_id, dto.target_phase_id,
                dto.open_tasks_action, dto.exceptions
            )

            # 7. Insert audit_log with full transition envelope (D-08)
            envelope = {
                "source_phase_id": dto.source_phase_id,
                "source_phase_name": node_map[dto.source_phase_id].get("name"),
                "target_phase_id": dto.target_phase_id,
                "target_phase_name": node_map[dto.target_phase_id].get("name"),
                "workflow_mode": mode,
                "criteria_snapshot": criteria,
                "unmet_criteria": unmet,
                "override_used": bool(unmet and dto.allow_override),
                "open_tasks_action": dto.open_tasks_action,
                "exceptions": [e.model_dump() for e in dto.exceptions],
                "moved_task_count": moved_count,
                "note": dto.note,
            }
            await self.audit_repo.create_with_metadata(
                entity_type="project",
                entity_id=dto.project_id,
                action="phase_transition",
                user_id=user.id,
                metadata=envelope,
            )
            # Commit happens at `async with session.begin()` exit
            # Advisory lock releases with commit
        return PhaseTransitionResponseDTO(
            moved_count=moved_count,
            override_used=bool(unmet and dto.allow_override),
            unmet_criteria=unmet,
        )
```

**Gotcha (asyncpg + SQLAlchemy):** Do NOT issue `pg_advisory_xact_lock(key)` and another statement in the same `session.execute(text(...))` call — asyncpg doesn't allow "multiple commands in a prepared statement." Use separate `session.execute(select(func.pg_try_advisory_xact_lock(key)))` calls. [VERIFIED: GitHub issue langchain-ai/langchain-postgres#101, WebSearch]

### Anti-Patterns to Avoid

- **Hardcoded methodology branches:** `if project.methodology == Methodology.SCRUM`. Forbidden per CONTEXT.md §Phase Boundary. Use `workflow.mode` or feature toggles.
- **HTTPException in domain/application:** raises domain exceptions only. Router converts. `user_repo.py` line 95 violates this (`update` raises `HTTPException(404)`) — new repos must NOT follow that mistake; raise domain exception or return None.
- **Multi-statement `session.execute(text())`:** asyncpg will refuse. One SQL command per `execute()` call.
- **Hard-delete on soft-deletable entities:** Milestone/Artifact/PhaseReport use `is_deleted=True` + `deleted_at` (TimestampedMixin). Never `DELETE FROM ...`.
- **`pg_advisory_lock` without `_xact_`:** session-scope lock doesn't auto-release at tx end — risk of forgotten unlock. Always use `_xact_` variant.
- **`pg_advisory_xact_lock` (blocking) instead of `pg_try_advisory_xact_lock` (non-blocking):** D-01 requires 409 immediate return, not waiting.
- **Writing the normalized `process_config` back eagerly:** D-33 says write-back is lazy (next PATCH). Don't add auto-save side effects in the normalizer.
- **Excluding `metadata` column from SQLAlchemy model on audit_log without adding to migration 005:** mismatch → runtime errors. Order: migration FIRST, model second.
- **`hash(project_id)` unmasked:** Python's `hash()` can return values outside int64 range on some platforms. Always mask with `& 0x7FFFFFFFFFFFFFFF`.
- **Two AsyncSessions for one transaction:** tasks + audit_log + advisory_lock MUST share the same `AsyncSession`. Inject once, pass through.
- **Idempotency cache leaks across users:** key must include `user_id`. Key shape = `(user_id, project_id, idempotency_key)`.
- **Topological sort forgetting feedback edges exempt:** D-55 explicitly exempts `type="feedback"` from cycle detection. Only filter flow edges before running Kahn's algo.
- **`@model_validator(mode='after')` for schema_version migration:** `after` runs post field-validation; missing fields in legacy config will fail validation first. Use `mode='before'`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-project serialized execution | Custom mutex / threading.Lock | `pg_try_advisory_xact_lock` | Postgres lock survives process restart mid-tx, auto-releases, no deadlock risk [CITED: postgres docs] |
| JSON schema version migration | Custom parser that mutates DB rows | Pydantic `@model_validator(mode='before')` | Transparent, lazy, testable, no eager DB writes (D-32/D-33) |
| Rate limiter | Custom dict + datetime check | `slowapi` for global limits | Already in requirements.txt and used. Keep per-endpoint custom dict only for D-50 per-user-per-project pair |
| PDF generation | Custom render-to-HTML-then-print | fpdf2 programmatic API | Pure Python, no system libs; already proven in `reports.py` |
| Topological sort | `networkx` (graph lib) | Hand-rolled Kahn's algo in ~15 LOC | Lightweight; no new dep; D-55 rule is simple |
| JSONB array queries | Load all rows and filter in Python | JSONB `@>` operator + GIN index | Index-backed O(log n) lookups vs O(n) scan |
| Per-entity ID generation for nodes | Backend UUID generation | Client-side `nanoid(10)` | D-22 — prevents round-trip on canvas ID creation |
| User summary parallelization | Sequential awaits | `asyncio.gather()` | D-48 — 3x speedup for independent queries |
| Soft-delete reimplementation | Custom is_deleted field per entity | `TimestampedMixin` (existing) | Reuses existing mixin from base.py |
| Idempotency cache persistence | Write to DB per request | In-memory dict with TTL | D-53: Redis deferred to v3.0. Current scope is process-local cache. |
| Workflow cycle detection impl | DFS with recursion | Kahn's BFS in-degree algo | No recursion depth limits; cleaner error reporting |

**Key insight:** Phase 9 is 95% mechanical replication of existing v1.0 patterns (repo, use case, router, DTO). The 5% novelty is `pg_advisory_xact_lock`, `@model_validator(mode='before')`, workflow cycle detection, and idempotency cache. Even those have local precedents or well-established patterns.

## Runtime State Inventory

This phase is a **forward-only schema expansion** — not a rename/refactor. Full inventory still applies because we're changing a DB schema:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | `projects.process_config` JSONB: existing projects lack `schema_version` key. Phase 9 backfill (migration 005 line per D-34) sets `schema_version=1`. Project entity's `@model_validator(mode='before')` handles any legacy rows the migration missed. | Code edit (normalizer) + data migration (UPDATE statement in 005) |
| **Stored data** | Existing `projects.methodology` enum values → must backfill `process_template_id` via `UPDATE projects SET process_template_id=(SELECT id FROM process_templates WHERE UPPER(name)=p.methodology)`. Handled in migration 005 (D-45). | Data migration |
| **Stored data** | No existing milestones/artifacts/phase_reports rows — new tables. No data migration; fresh seed. | None |
| **Live service config** | None — this is pure backend. No external service configs touch Phase 9 entities. | None — verified by searching codebase for external integrations (only slack/zulip webhook integrations in `integrations/`, unaffected by Phase 9 changes). |
| **OS-registered state** | None — no Windows Task Scheduler / cron / systemd references to Phase 9 entities. APScheduler jobs (`deadline_alert_job`, `purge_notifications_job`) unaffected. | None |
| **Secrets/env vars** | No new env vars required. `DATABASE_URL`, `JWT_SECRET`, `ACCESS_TOKEN_EXPIRE_MINUTES` unchanged. | None |
| **Build artifacts** | Alembic version history: must update `down_revision` chain. `005_phase9_schema.py` sets `down_revision = "004_phase5"`. | Migration file creation |
| **Build artifacts** | SQLAlchemy metadata: `Backend/app/infrastructure/database/models/__init__.py` must import new models (milestone, artifact, phase_report) so `Base.metadata` knows about them — used by `alembic/env.py` target_metadata AND by `conftest.py` `Base.metadata.create_all` for tests. | Code edit to `__init__.py` |

**Canonical question confirmation:** *After migration 005 runs, what runtime systems still have old state?*
- Existing running instances of the backend process: their Python objects (e.g., cached `Project` entities in test fixtures) have the old `process_config` shape. Restart required. Production rolling deploy: rollout migration, then rotate app processes — this is standard Alembic rolling-deploy hygiene, and the migration is intentionally backward-compatible (only adds nullable columns).
- Test DB: `conftest.py` uses `Base.metadata.create_all` on a fresh test DB every session — NOT alembic migrations. Therefore any new model must be registered in `models/__init__.py` for tests to see the new tables. **Critical gotcha.**

## Common Pitfalls

### Pitfall 1: `Base.metadata.create_all` vs Alembic Divergence
**What goes wrong:** Tests pass with `create_all` (uses ORM model definitions) but production fails because Alembic migration 005 missed a column.
**Why it happens:** Two independent sources of truth — ORM models (for tests) and Alembic migration (for prod). Easy to update one and forget the other.
**How to avoid:** For every field added to a new entity, verify both: (1) ORM model has the column, (2) migration 005 has the `sa.Column(...)`. Add a test that queries `information_schema.columns` against the test DB and compares to ORM metadata. Alternative: run Alembic migrations on test DB (but `conftest.py` currently uses `create_all` per pytest.ini integration tests — changing this is out of Phase 9 scope per v3.0 ADV-06 deferred).
**Warning signs:** `pytest` green but `alembic upgrade head` fails in CI/prod; new column present in ORM but missing in migration file.

### Pitfall 2: asyncpg Multi-Statement Error
**What goes wrong:** `session.execute(text("SELECT pg_advisory_xact_lock(...); UPDATE ..."))` raises "cannot insert multiple commands into a prepared statement."
**Why it happens:** asyncpg uses prepared statements by default; one statement per `execute()`.
**How to avoid:** Always use `func.pg_try_advisory_xact_lock()` via SQLAlchemy expression API in its own `session.execute(select(func.xxx(key)))`. Separate all DDL/DML into individual `execute()` calls.
**Warning signs:** Error message "cannot insert multiple commands into a prepared statement" at runtime.
[CITED: GitHub langchain-ai/langchain-postgres#101]

### Pitfall 3: `hash(project_id)` Overflow
**What goes wrong:** `pg_advisory_xact_lock` expects Postgres bigint (signed int64, -2^63 to 2^63-1). Python's `hash()` can return outside this range → asyncpg raises an overflow error.
**Why it happens:** Python ints are arbitrary-precision; `hash()` is `__hash__` which for strings isn't bounded.
**How to avoid:** Mask to 63 bits: `key = hash(f"phase_gate:{project_id}") & 0x7FFFFFFFFFFFFFFF`. Also prefix with a namespace string so different lock domains (phase_gate, template_apply) don't collide.
**Warning signs:** "value out of int64 range" or similar asyncpg error at lock acquisition.
[CITED: GitHub expobrain/sqlalchemy-asyncpg-advisory-lock-int64 tracker issue]

### Pitfall 4: `process_config.schema_version` Normalizer Infinite Loop
**What goes wrong:** Migration `v1_to_v2` forgets to update `schema_version`, so `while current < CURRENT` never terminates.
**Why it happens:** Each migration step MUST increment `schema_version` on the output dict.
**How to avoid:** Enforce in a unit test: for each migration function in `_MIGRATIONS`, assert `result["schema_version"] == k+1` for input `{"schema_version": k}`. Also guard with `max_iterations = 20` in the normalizer loop; raise `ProcessConfigSchemaError` if exceeded.
**Warning signs:** Test runs forever; stack trace hangs on model_validator.

### Pitfall 5: Pydantic v2 model_validator `mode='before'` Receives SQLAlchemy Model, Not Dict
**What goes wrong:** `@model_validator(mode='before')` receives `values` which may be a SQLAlchemy ORM object (when `Project.model_validate(orm_model)` is called), not a plain dict. Calling `.get("process_config")` on an ORM model raises `AttributeError`.
**Why it happens:** Pydantic v2's `from_attributes=True` invokes the validator BEFORE attribute extraction when `mode='before'`.
**How to avoid:** Inspect `type(values)` and branch: if dict, operate in place; else extract attributes via `getattr`. See the Pattern 3 code above which handles both paths. Alternative: use `mode='after'` and accept that legacy configs missing keys will raise validation errors — then add defaults as field defaults on Project.
**Warning signs:** `AttributeError: 'ProjectModel' object has no attribute 'get'` on any read.
[CITED: docs.pydantic.dev/latest/concepts/validators/]

### Pitfall 6: GIN Index on JSONB Array — Wrong Operator
**What goes wrong:** `WHERE linked_phase_ids = '["nd_abc"]'` does exact-match and won't use the GIN index.
**Why it happens:** Equality `=` uses b-tree only. Containment `@>` uses GIN.
**How to avoid:** Use `MilestoneModel.linked_phase_ids.contains([phase_id])` which SQLAlchemy translates to `@>`. Verify with `EXPLAIN ANALYZE` that plan shows "Bitmap Heap Scan on milestones using ix_milestones_linked_phase_ids_gin".
**Warning signs:** `list_by_phase` slow on large milestone tables; query plan shows seq scan.

### Pitfall 7: `audit_log.metadata` Column Name Collision
**What goes wrong:** `metadata` is a reserved name in SQLAlchemy (used by `Base.metadata`). Adding `metadata = Column(...)` to `AuditLogModel` may shadow or error out.
**Why it happens:** Every SQLAlchemy declarative-base subclass has an implicit `__table__.metadata` reference.
**How to avoid:** Use column key `extra_metadata` or `event_metadata` with DB column name `metadata` via `Column("metadata", JSONB, ...)` — SQLAlchemy allows naming the DB column differently from the Python attribute. Alternative: name it `envelope` or `details`. Planner should pick a name that doesn't clash.
**Warning signs:** Pydantic entity serialization crashes; alembic autogenerate produces unexpected diff.

### Pitfall 8: `UNIQUE (project_id, phase_id, cycle_number)` With Soft-Delete
**What goes wrong:** User creates PhaseReport (cycle_number=1), soft-deletes it, creates again (cycle_number=1) — UNIQUE constraint fails because soft-deleted row still exists.
**Why it happens:** Postgres UNIQUE includes all rows, even `is_deleted=TRUE`.
**How to avoid:** Either (a) use a partial index: `CREATE UNIQUE INDEX ux_phase_reports_active ON phase_reports (project_id, phase_id, cycle_number) WHERE is_deleted = FALSE`, or (b) hard-delete PhaseReports (acceptable per D-37 if we say so explicitly). **Recommendation:** partial unique index. Document in migration 005.
**Warning signs:** 409 conflicts when recreating a deleted PhaseReport.

### Pitfall 9: `cycle_number` Auto-Calc Race Condition
**What goes wrong:** Two concurrent PhaseReport creates for the same (project_id, phase_id) both read `COUNT(audit_log WHERE...) = 2`, both set `cycle_number=3`, second insert fails UNIQUE.
**Why it happens:** Read-modify-write race without a lock.
**How to avoid:** Auto-calc happens inside the same tx that holds `pg_advisory_xact_lock(hash("phase_report:" + project_id))` — different lock namespace than Phase Gate's lock so they don't serialize against each other. Alternative: catch IntegrityError, re-read, retry once.
**Warning signs:** Flaky 409 errors on concurrent report creation under load.

### Pitfall 10: `asyncio.gather` Error Swallowing
**What goes wrong:** One of the 3 queries in GetUserSummaryUseCase fails; gather raises that error but cancels other coroutines silently — user sees generic 500.
**Why it happens:** `asyncio.gather(return_exceptions=False)` (default) raises on first failure, cancels others.
**How to avoid:** For UX, use `asyncio.gather(..., return_exceptions=True)`, then inspect each result; log failures but return partial data. Alternative: keep default and let the error bubble (simpler). **Recommendation:** keep default for Phase 9; UX can degrade later.
**Warning signs:** Intermittent empty user summary blocks; no clear error trail.

### Pitfall 11: Team Leader Permission — N+1 Queries
**What goes wrong:** `require_project_transition_authority` runs a SELECT per request even for the same user+project pair in a hot loop.
**Why it happens:** No caching on permission check.
**How to avoid:** Phase 9 scope: no cache. One indexed query is fast enough. (Teams JOIN TeamProjects via composite PKs is O(log n).) Add GIN-free composite index on `teams(leader_id)` — already exists via leader_id FK auto-index? Verify during migration 005.
**Warning signs:** Slow Phase Gate endpoint under concurrent load.

### Pitfall 12: Idempotency Cache Grows Unbounded
**What goes wrong:** `_cache` dict accumulates entries until OOM.
**Why it happens:** Keys with expired TTL not evicted unless looked up or explicit cleanup runs.
**How to avoid:** Schedule `cleanup_expired()` via APScheduler (already in codebase) — cron every 10 min, purge entries >TTL. Alternatively, bound cache size and evict LRU. **Recommendation:** APScheduler cron.
**Warning signs:** Memory growth over hours/days.

## Code Examples

### Common Operation 1: Create Phase Gate Endpoint Router

```python
# api/v1/phase_transitions.py
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import Optional
from app.api.deps.auth import require_project_transition_authority, get_current_user
from app.api.deps.project import get_project_repo
from app.api.deps.task import get_task_repo
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.execute_phase_transition import ExecutePhaseTransitionUseCase
from app.application.dtos.phase_transition_dtos import (
    PhaseTransitionRequestDTO, PhaseTransitionResponseDTO
)
from app.application.services import idempotency_cache
from app.domain.exceptions import (
    PhaseGateLockedError, CriteriaUnmetError, PhaseGateNotApplicableError,
    ArchivedNodeReferenceError, ProjectNotFoundError
)

router = APIRouter()

@router.post("/projects/{project_id}/phase-transitions", response_model=PhaseTransitionResponseDTO)
async def create_phase_transition(
    project_id: int,
    dto: PhaseTransitionRequestDTO,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    user = Depends(require_project_transition_authority),
    project_repo = Depends(get_project_repo),
    task_repo = Depends(get_task_repo),
    audit_repo = Depends(get_audit_repo),
):
    # D-50: custom rate limit (10s per (user_id, project_id))
    wait_s = idempotency_cache.check_rate_limit(user.id, project_id)
    if wait_s is not None:
        raise HTTPException(429, f"Rate limit; retry after {wait_s:.1f}s")

    # D-50: idempotency cache lookup
    if idempotency_key:
        cached = idempotency_cache.lookup(user.id, project_id, idempotency_key)
        if cached:
            return cached

    idempotency_cache.record_request(user.id, project_id)
    use_case = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, project_repo.session)
    try:
        response = await use_case.execute(dto, user)
    except PhaseGateLockedError as e:
        raise HTTPException(409, str(e))
    except CriteriaUnmetError as e:
        raise HTTPException(422, detail={"unmet": e.unmet_criteria})
    except PhaseGateNotApplicableError as e:
        raise HTTPException(400, str(e))
    except ArchivedNodeReferenceError as e:
        raise HTTPException(400, str(e))
    except ProjectNotFoundError as e:
        raise HTTPException(404, str(e))

    if idempotency_key:
        idempotency_cache.store(user.id, project_id, idempotency_key, response)
    return response
```

### Common Operation 2: Alembic Migration 005 Skeleton

```python
# alembic/versions/005_phase9_schema.py
"""Phase 9 schema: Project.status, Task.phase_id, Team.leader_id,
ProcessTemplate new columns, audit_log.metadata, and 3 new tables.

Revision ID: 005_phase9
Revises: 004_phase5
Create Date: 2026-04-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "005_phase9"
down_revision = "004_phase5"
branch_labels = None
depends_on = None


def _table_exists(t: str) -> bool:
    conn = op.get_bind()
    return conn.execute(
        sa.text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=:t"),
        {"t": t},
    ).scalar() > 0


def _column_exists(t: str, c: str) -> bool:
    conn = op.get_bind()
    return conn.execute(
        sa.text("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c"),
        {"t": t, "c": c},
    ).scalar() > 0


def _index_exists(name: str) -> bool:
    conn = op.get_bind()
    return conn.execute(
        sa.text("SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname=:n"),
        {"n": name},
    ).scalar() > 0


def upgrade() -> None:
    # ---- projects.status (BACK-01) ----
    if not _column_exists("projects", "status"):
        op.add_column(
            "projects",
            sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        )
        op.create_index("ix_projects_status", "projects", ["status"])

    # ---- projects.process_template_id (D-45) ----
    if not _column_exists("projects", "process_template_id"):
        op.add_column(
            "projects",
            sa.Column("process_template_id", sa.Integer(), sa.ForeignKey("process_templates.id"), nullable=True),
        )
        op.create_index("ix_projects_process_template_id", "projects", ["process_template_id"])
        # Backfill per D-45:
        op.execute("""
            UPDATE projects p
            SET process_template_id = pt.id
            FROM process_templates pt
            WHERE UPPER(pt.name) = p.methodology::text AND p.process_template_id IS NULL
        """)

    # ---- tasks.phase_id (BACK-02) ----
    if not _column_exists("tasks", "phase_id"):
        op.add_column("tasks", sa.Column("phase_id", sa.String(20), nullable=True))
        op.create_index("ix_tasks_phase_id", "tasks", ["phase_id"])

    # ---- teams.leader_id (D-13) ----
    if not _column_exists("teams", "leader_id"):
        op.add_column(
            "teams",
            sa.Column("leader_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        )
        op.create_index("ix_teams_leader_id", "teams", ["leader_id"])

    # ---- process_templates new columns (D-27, D-43) ----
    for col_name, col_type in [
        ("default_artifacts", JSONB),
        ("default_phase_criteria", JSONB),
        ("default_workflow", JSONB),
    ]:
        if not _column_exists("process_templates", col_name):
            op.add_column("process_templates", sa.Column(col_name, col_type, nullable=True))
    if not _column_exists("process_templates", "cycle_label_tr"):
        op.add_column("process_templates", sa.Column("cycle_label_tr", sa.String(50), nullable=True))
    if not _column_exists("process_templates", "cycle_label_en"):
        op.add_column("process_templates", sa.Column("cycle_label_en", sa.String(50), nullable=True))

    # ---- audit_log.metadata (D-08) ----
    # Column name 'metadata' via python key 'extra_metadata' to avoid SQLAlchemy reserved name clash.
    # In DB, column is called 'metadata'; in ORM, attribute is 'extra_metadata' via Column("metadata", ...).
    if not _column_exists("audit_log", "metadata"):
        op.add_column("audit_log", sa.Column("metadata", JSONB, nullable=True))

    # ---- milestones table (BACK-04) ----
    if not _table_exists("milestones"):
        op.create_table(
            "milestones",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("target_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("linked_phase_ids", JSONB, nullable=False, server_default="[]"),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_milestones_project_id", "milestones", ["project_id"])
    # GIN index on linked_phase_ids for JSONB containment queries (D-38)
    if not _index_exists("ix_milestones_linked_phase_ids_gin"):
        op.execute(
            "CREATE INDEX ix_milestones_linked_phase_ids_gin ON milestones USING GIN (linked_phase_ids)"
        )

    # ---- artifacts table (BACK-05) ----
    if not _table_exists("artifacts"):
        op.create_table(
            "artifacts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="not_created"),
            sa.Column("assignee_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("linked_phase_id", sa.String(20), nullable=True),
            sa.Column("note", sa.Text(), nullable=True),
            sa.Column("file_id", sa.Integer(), sa.ForeignKey("files.id"), nullable=True),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_artifacts_project_id", "artifacts", ["project_id"])
        op.create_index("ix_artifacts_assignee_id", "artifacts", ["assignee_id"])
        op.create_index("ix_artifacts_linked_phase_id", "artifacts", ["linked_phase_id"])

    # ---- phase_reports table (BACK-06) ----
    if not _table_exists("phase_reports"):
        op.create_table(
            "phase_reports",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
            sa.Column("phase_id", sa.String(20), nullable=False),
            sa.Column("cycle_number", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("summary_task_count", sa.Integer(), nullable=True),
            sa.Column("summary_done_count", sa.Integer(), nullable=True),
            sa.Column("summary_moved_count", sa.Integer(), nullable=True),
            sa.Column("summary_duration_days", sa.Integer(), nullable=True),
            sa.Column("completed_tasks_notes", JSONB, nullable=False, server_default="{}"),
            sa.Column("issues", sa.Text(), nullable=True),
            sa.Column("lessons", sa.Text(), nullable=True),
            sa.Column("recommendations", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_phase_reports_project_id", "phase_reports", ["project_id"])
    # Partial unique index — accounts for soft-delete (Pitfall 8)
    if not _index_exists("ux_phase_reports_active"):
        op.execute("""
            CREATE UNIQUE INDEX ux_phase_reports_active
            ON phase_reports (project_id, phase_id, cycle_number)
            WHERE is_deleted = FALSE
        """)

    # ---- Backfill schema_version on existing projects (D-34) ----
    op.execute("""
        UPDATE projects
        SET process_config = jsonb_set(
            COALESCE(process_config, '{}'::jsonb),
            '{schema_version}',
            '1'::jsonb
        )
        WHERE process_config IS NULL OR NOT (process_config ? 'schema_version')
    """)


def downgrade() -> None:
    if _table_exists("phase_reports"):
        op.execute("DROP INDEX IF EXISTS ux_phase_reports_active")
        op.drop_table("phase_reports")
    if _table_exists("artifacts"):
        op.drop_table("artifacts")
    if _table_exists("milestones"):
        op.execute("DROP INDEX IF EXISTS ix_milestones_linked_phase_ids_gin")
        op.drop_table("milestones")
    if _column_exists("audit_log", "metadata"):
        op.drop_column("audit_log", "metadata")
    for col in ["cycle_label_en", "cycle_label_tr", "default_workflow", "default_phase_criteria", "default_artifacts"]:
        if _column_exists("process_templates", col):
            op.drop_column("process_templates", col)
    if _column_exists("teams", "leader_id"):
        op.drop_column("teams", "leader_id")
    if _column_exists("tasks", "phase_id"):
        op.drop_column("tasks", "phase_id")
    if _column_exists("projects", "process_template_id"):
        op.drop_column("projects", "process_template_id")
    if _column_exists("projects", "status"):
        op.drop_column("projects", "status")
```

### Common Operation 3: audit_log.metadata via Column Rename Trick

```python
# infrastructure/database/models/audit_log.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.infrastructure.database.models.base import Base

class AuditLogModel(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)
    # DB column is "metadata", Python attribute is "extra_metadata" (avoids SQLAlchemy Base.metadata clash)
    extra_metadata = Column("metadata", JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
```

### Common Operation 4: Node ID Format Validator in Task Entity

```python
# domain/entities/task.py
from pydantic import field_validator
import re

NODE_ID_REGEX = re.compile(r"^nd_[A-Za-z0-9_-]{10}$")

class Task(BaseModel):
    # ... existing fields ...
    phase_id: Optional[str] = None  # D-22 format; validated below

    @field_validator("phase_id")
    @classmethod
    def validate_phase_id_format(cls, v):
        if v is None:
            return v
        if not NODE_ID_REGEX.match(v):
            raise ValueError(f"Invalid phase_id format: expected 'nd_' followed by 10 URL-safe chars, got {v}")
        return v
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@root_validator(pre=True)` | `@model_validator(mode='before')` | Pydantic v2 (2023) | Use `@model_validator` everywhere in Phase 9 |
| `sa.JSON` for JSON columns | `sa.dialects.postgresql.JSONB` | SQLAlchemy 1.4+ | Already used in `process_template.py`. Use JSONB for all Phase 9 new JSON columns (better indexing, containment ops) |
| `pg_advisory_lock` (session scope) | `pg_advisory_xact_lock` / `pg_try_advisory_xact_lock` | Postgres 9.x+ | Always use xact variant — auto-releases on tx end, no leaks |
| `ThreadPoolExecutor` for PDF | sync `fpdf2` in request handler | N/A | D-60: sync is acceptable for <2MB reports. Only move to job queue if reports grow |
| fpdf2 2.5.x | fpdf2 2.8.7 (Feb 2026) | 2026-02-28 | `new_x`/`new_y` API in `cell()` replaced legacy `ln` argument [CITED: py-pdf.github.io/fpdf2 — already used in `reports.py` line 198] |
| `sa.Enum(py_enum, name="x")` | Same pattern (stable since v1.3) | — | Unchanged; continue existing pattern |

**Deprecated/outdated:**
- **SQLAlchemy 1.x async**: project uses SQLAlchemy 2.x async (confirmed by `ext.asyncio` imports). No sync engine paths in new code.
- **Pydantic v1 `@validator`**: project uses Pydantic v2 (confirmed by `ConfigDict(from_attributes=True)`). Never use `@validator` in new code; use `@field_validator` / `@model_validator`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Installed versions of fastapi, sqlalchemy, pydantic, fpdf2, alembic are current-enough to support patterns shown here (model_validator, pg_advisory_xact_lock, JSONB.contains, StreamingResponse) | Standard Stack | Low — requirements.txt unpinned means latest-at-install; code uses only stable APIs introduced pre-2024. Planner must verify with `python -c "import ..."` on executor machine before Wave 0. |
| A2 | Test DB is created via `Base.metadata.create_all` (from `conftest.py` line 65), not Alembic migrations | Runtime State Inventory | Medium — if changed later, migration 005 behavior in tests changes. Planner adds a smoke test that asserts both paths produce identical schema. |
| A3 | `process_templates` table already has built-in Scrum/Kanban/Waterfall/Iterative rows from Phase 7 seed | Standard Stack, Pattern for default_artifacts backfill | High — migration 005 backfill `UPDATE projects SET process_template_id = ...` assumes matching rows exist. If not, backfill is a no-op and frontend will see orphaned projects. Executor should verify with `SELECT name FROM process_templates;` before running migration. |
| A4 | `audit_log.metadata` column is the intended column name (not "details" or "envelope") | Pitfall 7, Migration | Low — user can rename. D-08 uses "metadata" verbatim. |
| A5 | `asyncio.gather(return_exceptions=False)` (default) is acceptable UX for D-48; partial failures return 500 | Pattern 6 | Low — can change to `return_exceptions=True` in future without API contract change. |
| A6 | `hash()` of string needs `& 0x7FFFFFFFFFFFFFFF` mask for Postgres int64 compatibility | Pattern 2, Pitfall 3 | Low — well-documented gotcha [CITED: expobrain/sqlalchemy-asyncpg-advisory-lock-int64]. |
| A7 | nanoid(10) generates URL-safe alphanumeric IDs matching regex `^nd_[A-Za-z0-9_-]{10}$` | D-22, Pattern 4 | Low — standard nanoid alphabet is `A-Za-z0-9_-`. Matches regex. |
| A8 | Pydantic v2 `field_validator` + `model_validator(mode='before'/'after')` are the current decorators | Patterns 3, 4 | Low — Pydantic v2 is stable; codebase uses ConfigDict (v2 pattern). [CITED: docs.pydantic.dev] |
| A9 | Soft-delete with partial UNIQUE index resolves Pitfall 8 without hard-deleting reports | Pitfall 8 | Medium — alternative is hard-delete. Planner should confirm with a user question if uncertain. |
| A10 | `conftest.py` recreates test DB per session (pytest fixture scope="session") and auto-imports all models via `from app.infrastructure.database.models import *` | Runtime State Inventory | Low — verified in conftest.py line 11-13. |
| A11 | `slowapi` `@limiter.limit("2/minute")` is acceptable for D-51 "30s per user" rate limit on PDF endpoint (slowapi uses per-IP by default; `key_func=user.id` injection needed) | Pattern 7 | Medium — slowapi's `Limiter(key_func=get_remote_address)` keys by IP; for per-user need custom key_func. Planner: implement custom decorator that keys by `current_user.id`. |
| A12 | Currency of fpdf2 API in codebase (2.8.7) matches what `reports.py` already uses; new `phase_report_pdf.py` can use identical `new_x="LMARGIN", new_y="NEXT"` pattern | Pattern 7 | Low — verified by reading reports.py line 198-204. |

## Open Questions

1. **What if `process_templates` lacks a template matching a legacy project's methodology?**
   - What we know: D-45 backfill assumes matching rows.
   - What's unclear: Edge case — a project created with methodology="SCRUM" when the Scrum template was later renamed.
   - Recommendation: Migration 005 logs a NOTICE per project left with NULL `process_template_id`. Frontend in Phase 10 handles NULL gracefully (render as "Custom" process).

2. **Should `require_project_transition_authority` cache team-leadership lookups?**
   - What we know: One indexed query per endpoint call is fast but adds up.
   - What's unclear: Whether current load justifies request-scoped or session-scoped cache.
   - Recommendation: No cache in Phase 9. Revisit when Phase 12 lifecycle tab starts hammering endpoints.

3. **Does `audit_log` need `action` enum values registered anywhere?**
   - What we know: Current `action` column is `String(50)` (001 migration), no enum constraint.
   - What's unclear: Whether D-46 activity type filter `type[]=task_created,phase_transition,...` expects backend to validate values.
   - Recommendation: Validate at router DTO layer with `Literal[...]` Pydantic type; DB column stays flexible for forward compat.

4. **Should Team Leader role be visible in User.role?**
   - What we know: D-13 says Team Leader is per-team, not a system role.
   - What's unclear: Whether `GET /users/me` should include a `leader_team_ids` field.
   - Recommendation: Separate endpoint `GET /users/me/led-teams` (D-17). Don't bloat User response.

5. **Workflow validation — when is `WorkflowConfig` validated?**
   - What we know: Pydantic runs on request body parse.
   - What's unclear: Does Phase Gate endpoint re-validate the workflow stored in process_config?
   - Recommendation: Yes — Phase Gate use case calls `WorkflowConfig.model_validate(project.process_config['workflow'])` before any logic. Catches corrupted DB state.

6. **`Milestone.linked_phase_ids` validation — per-ID or batch?**
   - What we know: D-24 says each ID validated individually, dedupe on write.
   - What's unclear: Should we reject the whole request if one ID is invalid, or silently drop invalid IDs?
   - Recommendation: Reject whole request with 400 listing all bad IDs. Matches D-19 strict validation principle.

7. **PhaseReport.created_by — nullable or required?**
   - What we know: Created via D-37 Admin+PM+TL; use case has access to `user.id`.
   - What's unclear: Migration 005 makes `created_by` nullable (since audit-log-style semantics tolerate missing user).
   - Recommendation: Required at API/use-case layer; nullable at DB for forward compat with admin scripts.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | Backend runtime | ✓ | 3.12.10 | — |
| fastapi | All HTTP endpoints | Assumed ✓ | [ASSUMED] latest from requirements.txt | Can't run without — blocking |
| sqlalchemy (async) | All DB access | Assumed ✓ | [ASSUMED] latest | Can't run without — blocking |
| asyncpg | Postgres driver | Assumed ✓ | [ASSUMED] latest | Can't run without — blocking |
| alembic | Migration runner | Assumed ✓ | [ASSUMED] latest | Can't run without — blocking |
| pydantic v2 | Entity validation | Verified ✓ (codebase uses ConfigDict) | v2.x | Can't run without — blocking |
| fpdf2 | PDF generation | ✓ in requirements.txt, imported in reports.py | 2.8.7 target | None — blocking for API-09 PDF |
| slowapi | Rate limiting | ✓ in requirements.txt, used in auth.py | latest | Custom dict fallback (already built-in for D-50) |
| Docker + Postgres 15 | Tests + local dev | Unverified in this research session | docker-compose.yaml expects 15 | Integration tests SKIP if Postgres unreachable — pre-existing issue (v3.0 ADV-06) |
| pytest + pytest-asyncio | Test runner | Assumed ✓ | latest | Unit tests block; integration tests may skip if DB unavailable |
| pg_isready / psql | DB health check | Not installed on research machine | — | Docker exec into postgres container; conftest.py handles DB creation |

**Missing dependencies with no fallback:** None — all required packages in requirements.txt. The research machine lacks an activated venv, but executor machine presumably has it (v1.0 shipped; Phase 8 used this same setup).

**Missing dependencies with fallback:** Docker + Postgres absent on research host. Executor will have this (docker-compose.yaml in Backend/ already used for Phase 1-7 integration tests).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + pytest-asyncio (asyncio_mode=auto from pytest.ini) |
| Config file | `Backend/pytest.ini` |
| Quick run command | `cd Backend && pytest tests/unit/ -x` (unit only — no DB) |
| Full suite command | `cd Backend && pytest tests/ -v` (requires docker-compose up postgres) |
| Integration DB | Test DB (`{DB_NAME}_test`) auto-created by conftest.py per session. Main `spms_db` must be running (current limitation — v3.0 ADV-06). |
| API tests | `httpx.AsyncClient` + `ASGITransport(app=app)` per `conftest.py`. No real HTTP server. |
| Mocking | Unit tests mock repos by passing `MagicMock(spec=IRepository)` to use cases. |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BACK-01 | Project.status enum persists across tx | integration | `pytest tests/integration/infrastructure/test_project_status_integration.py -x` | ❌ Wave 0 |
| BACK-01 | Project.status rejects invalid values | unit | `pytest tests/unit/test_project_entity.py::test_status_invalid -x` | ❌ Wave 1 |
| BACK-02 | Task.phase_id nullable; format validator rejects malformed | unit | `pytest tests/unit/test_task_entity.py::test_phase_id_format -x` | ❌ Wave 1 |
| BACK-02 | Task filter by phase_id returns correct rows | integration | `pytest tests/integration/api/test_tasks_api.py::test_phase_id_filter -x` | ❌ Wave 2 |
| BACK-03 | process_config normalizer runs on read (lazy migration v0→v1) | unit | `pytest tests/unit/application/test_process_config_normalizer.py -x` | ❌ Wave 1 |
| BACK-03 | Normalizer is idempotent (running twice produces same output) | unit | Same file as above | ❌ Wave 1 |
| BACK-03 | Normalizer never throws on missing keys; fills defaults | unit | Same file | ❌ Wave 1 |
| BACK-04 | Milestone CRUD round-trip (create, read, update, delete) | integration | `pytest tests/integration/infrastructure/test_milestone_repo_integration.py -x` | ❌ Wave 1 |
| BACK-04 | GIN index backs `list_by_phase` (EXPLAIN ANALYZE shows Bitmap Heap Scan) | integration | Same file, test_gin_index_used | ❌ Wave 1 |
| BACK-04 | linked_phase_ids dedupes on write | unit | `pytest tests/unit/test_milestone_entity.py::test_dedupe -x` | ❌ Wave 1 |
| BACK-05 | ArtifactSeeder creates default artifacts in same tx as project creation | unit | `pytest tests/unit/application/test_artifact_seeder.py -x` | ❌ Wave 1 |
| BACK-05 | ArtifactSeeder rolls back project on artifact failure | unit | Same file, test_rollback_on_seeder_failure | ❌ Wave 1 |
| BACK-05 | Empty default_artifacts produces zero artifacts (D-30 custom workflow) | unit | Same file, test_empty_seed | ❌ Wave 1 |
| BACK-05 | Methodology change leaves existing artifacts untouched (D-29) | integration | `pytest tests/integration/api/test_projects_api.py::test_methodology_change_no_op_on_artifacts -x` | ❌ Wave 2 |
| BACK-06 | PhaseReport creates with auto-calculated cycle_number | unit | `pytest tests/unit/application/test_manage_phase_reports.py::test_cycle_number_auto -x` | ❌ Wave 1 |
| BACK-06 | PhaseReport PATCH auto-increments revision | unit | Same file, test_revision_increment | ❌ Wave 1 |
| BACK-06 | UNIQUE (project_id, phase_id, cycle_number) enforced with soft-delete tolerance | integration | `pytest tests/integration/infrastructure/test_phase_report_repo_integration.py::test_unique_partial_index -x` | ❌ Wave 1 |
| BACK-06 | PDF generates non-empty bytes, correct content-type (smoke) | unit | `pytest tests/unit/application/test_phase_report_pdf.py::test_render_smoke -x` | ❌ Wave 2 |
| BACK-07 | Legacy `from app.api.dependencies import get_project_repo` still works (backward compat) | unit | `pytest tests/unit/test_deps_backward_compat.py -x` | ❌ Wave 0 |
| BACK-07 | New `from app.api.deps.auth import require_project_transition_authority` resolves | unit | Same file, test_new_import_path | ❌ Wave 0 |
| BACK-08 | Migration 005 runs idempotently (run twice without error) | integration | `pytest tests/integration/infrastructure/test_migration_005.py::test_idempotent -x` | ❌ Wave 0 |
| BACK-08 | Migration 005 down/up round-trip restores original schema | integration | Same file, test_upgrade_downgrade_roundtrip | ❌ Wave 0 |
| BACK-08 | Post-migration: existing projects have schema_version=1 in process_config | integration | Same file, test_schema_version_backfill | ❌ Wave 0 |
| API-01 | Phase Gate returns 409 on concurrent request (second blocked by advisory lock) | integration | `pytest tests/integration/api/test_phase_transitions_api.py::test_concurrent_409 -x` | ❌ Wave 2 |
| API-01 | Phase Gate returns 422 with unmet[] when criteria fail and allow_override=False | integration | Same file, test_criteria_unmet_422 | ❌ Wave 2 |
| API-01 | Phase Gate returns 400 for continuous mode (D-07) | integration | Same file, test_continuous_mode_400 | ❌ Wave 2 |
| API-01 | Phase Gate allows override in all modes (D-05) including sequential-locked | integration | Same file, test_override_in_sequential_locked | ❌ Wave 2 |
| API-01 | Phase Gate rate limit 429 after 2 requests <10s (D-50) | integration | Same file, test_rate_limit_429 | ❌ Wave 2 |
| API-01 | Phase Gate idempotency-key returns cached response on retry (D-50) | integration | Same file, test_idempotency_cache_hit | ❌ Wave 2 |
| API-01 | Phase Gate audit_log envelope contains full transition detail (D-08) | integration | Same file, test_audit_envelope_complete | ❌ Wave 2 |
| API-01 | Phase Gate applies open_tasks_action with exceptions correctly (D-04) | integration | Same file, test_open_tasks_exceptions | ❌ Wave 2 |
| API-01 | Phase Gate rejects archived target node (D-21) | integration | Same file, test_archived_node_400 | ❌ Wave 2 |
| API-01 | Phase Gate rejects non-project-member user (D-09 + D-15) | integration | Same file, test_403_non_authority | ❌ Wave 2 |
| API-01 | Phase Gate permits team leader (D-14 Models-of-team-on-project) | integration | Same file, test_team_leader_allowed | ❌ Wave 2 |
| API-02 | Activity feed filters by type[] multi-value (D-46) | integration | `pytest tests/integration/api/test_activity_api.py::test_type_filter -x` | ❌ Wave 2 |
| API-02 | Activity feed returns denormalized user_name and entity_label (D-47) | integration | Same file, test_denormalized_response | ❌ Wave 2 |
| API-02 | Activity feed pagination (limit/offset) | integration | Same file, test_pagination | ❌ Wave 2 |
| API-03 | User summary runs 3 queries via asyncio.gather (parallel, not sequential) | unit | `pytest tests/unit/application/test_get_user_summary.py::test_gather_parallel -x` | ❌ Wave 2 |
| API-03 | User summary filters projects by status (ACTIVE/COMPLETED/ON_HOLD default, +ARCHIVED with ?include_archived) | integration | `pytest tests/integration/api/test_user_summary_api.py -x` | ❌ Wave 2 |
| API-04 | GET /projects?status=ACTIVE returns only active projects | integration | `pytest tests/integration/api/test_projects_api.py::test_status_filter -x` | ❌ Wave 2 |
| API-05 | GET /tasks/project/{id}?phase_id=X returns filtered tasks | integration | `pytest tests/integration/api/test_tasks_api.py::test_phase_id_query_filter -x` | ❌ Wave 2 |
| API-06 | Phase completion criteria PATCH writes to process_config.phase_completion_criteria | integration | `pytest tests/integration/api/test_projects_api.py::test_criteria_crud -x` | ❌ Wave 2 |
| API-07 | Milestone CRUD full flow (201, 200, 200, 204) | integration | `pytest tests/integration/api/test_milestones_api.py -x` | ❌ Wave 2 |
| API-07 | Milestone POST gated by require_project_transition_authority (D-35) | integration | Same file, test_403_non_authority | ❌ Wave 2 |
| API-07 | Milestone backend validates linked_phase_ids format and existence (D-24) | integration | Same file, test_invalid_phase_id_400 | ❌ Wave 2 |
| API-08 | Artifact PATCH permitted for assignee on own artifact (D-36) | integration | `pytest tests/integration/api/test_artifacts_api.py::test_assignee_patch -x` | ❌ Wave 2 |
| API-08 | Artifact assignee cannot reassign (D-36) | integration | Same file, test_assignee_cant_reassign | ❌ Wave 2 |
| API-08 | Artifact DELETE gated (D-36) | integration | Same file, test_delete_authority | ❌ Wave 2 |
| API-09 | PhaseReport PDF returns application/pdf with valid bytes | integration | `pytest tests/integration/api/test_phase_reports_api.py::test_pdf_export -x` | ❌ Wave 2 |
| API-09 | PhaseReport PDF rate limit 30s per user (D-51) | integration | Same file, test_pdf_rate_limit | ❌ Wave 2 |
| API-10 | Workflow invalid shape rejected at Pydantic parse (422) | unit | `pytest tests/unit/application/test_workflow_validation.py::test_shape_422 -x` | ❌ Wave 2 |
| API-10 | Workflow duplicate node IDs rejected (D-55) | unit | Same file, test_duplicate_ids | ❌ Wave 2 |
| API-10 | Workflow edge source/target validated against existing non-archived nodes (D-55) | unit | Same file, test_invalid_edge_target | ❌ Wave 2 |
| API-10 | Workflow sequential-flexible cycle detection on flow edges (feedback exempt) (D-55) | unit | Same file, test_cycle_detection_flow_vs_feedback | ❌ Wave 2 |
| API-10 | Workflow group bounds validation (D-55) | unit | Same file, test_group_bounds | ❌ Wave 2 |

### Sampling Rate
- **Per task commit:** `cd Backend && pytest tests/unit/ -x` (fast, no DB). Rule of thumb: every commit that touches application/ or domain/ runs unit tests before commit.
- **Per wave merge:** `cd Backend && pytest tests/ -v` (full suite incl. integration). Requires docker-compose postgres up.
- **Phase gate:** Full suite green before `/gsd-verify-work`. Additionally: manual smoke test by hitting `/api/v1/projects/{id}/phase-transitions` via curl to verify end-to-end 200/409/422 flow.

### Nyquist Coverage (What feature DOES and what it DOESN'T do — positive + negative)

For each high-risk requirement, pair a positive test with the complementary negative:

| Requirement | Positive | Negative |
|-------------|----------|----------|
| API-01 Phase Gate | Returns 200 with moved_count when criteria pass | Returns 422 with per-criterion unmet[] when criteria fail |
| API-01 Phase Gate | Accepts override in sequential-locked | Rejects transition in continuous mode (400) |
| API-01 Phase Gate | First request succeeds | Second request within 10s → 429 |
| API-01 Phase Gate | Different users different projects concurrent → both 200 | Same user same project concurrent → 2nd 409 |
| API-01 Phase Gate | Duplicate idempotency key returns cached response | Different key triggers fresh execution |
| BACK-03 Normalizer | Legacy config with only `methodology` key → V1 canonical shape | V2 config (already current) pass-through unchanged |
| BACK-04 Milestone GIN | list_by_phase("nd_abc") returns rows with that ID | list_by_phase("nd_nonexistent") returns empty list |
| BACK-06 UNIQUE | Can create cycle_number=2 after cycle_number=1 | Cannot create duplicate (project, phase, cycle) among active rows |
| BACK-06 UNIQUE | Soft-deleted row does NOT block re-create (partial index) | Two active rows with same tuple → IntegrityError |
| D-15 Authority | Admin: 200; PM: 200; Team Leader of team-on-project: 200 | Team Leader of unrelated team: 403; Plain member: 403 |
| D-22 Node ID | "nd_V1StGXR8_Z" accepted | "nd_abc" (too short), "xx_V1StGXR8_Z" (wrong prefix) rejected |
| API-10 Cycle detection | Flow edges A→B→C accepted | Flow edges A→B→A rejected in sequential-flexible (422) |
| API-10 Cycle detection | Feedback edge A→B→A accepted (feedback exempt) | Same shape but type="flow" rejected |

### Wave 0 Gaps
- [ ] `tests/integration/infrastructure/test_migration_005.py` — covers BACK-08 idempotency + schema_version backfill
- [ ] `tests/unit/test_deps_backward_compat.py` — covers BACK-07 shim
- [ ] `tests/unit/test_project_entity.py` — new, covers BACK-01 status + Project model_validator (BACK-03)
- [ ] `tests/unit/test_task_entity.py` — new, covers BACK-02 format validator
- [ ] `tests/unit/test_milestone_entity.py`, `test_artifact_entity.py`, `test_phase_report_entity.py` — new
- [ ] `tests/integration/infrastructure/test_{milestone,artifact,phase_report}_repo_integration.py` — new
- [ ] `tests/integration/api/test_{phase_transitions,milestones,artifacts,phase_reports,activity,user_summary,teams_leader,workflow_validation}_api.py` — new
- [ ] `tests/unit/application/test_{phase_gate_use_case,artifact_seeder,manage_milestones,manage_artifacts,manage_phase_reports,process_config_normalizer,workflow_validation,idempotency_cache,phase_report_pdf,get_user_summary}.py` — new
- Framework install: none (pytest already installed)
- **Fixtures needed:** `tests/conftest.py` currently provides `db_engine`, `db_session`, `client`. Add Wave 0: `authenticated_client(role="admin"|"pm"|"member"|"team_leader")` that pre-provisions a User with a JWT token and returns an httpx client with `Authorization: Bearer ...` header. Saves boilerplate across all new API tests.

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` in project root. No global directives to honor beyond Clean Architecture rules already documented in `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/CONVENTIONS.md`.

## Security Domain

> Security enforcement assumed ON (default — no `security_enforcement: false` in `.planning/config.json`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing JWT via `python-jose` in `dependencies.py`. New endpoints use existing `get_current_user` — no auth changes in Phase 9. |
| V3 Session Management | yes (JWT stateless) | JWT 30 min expiry (existing). No session store added. |
| V4 Access Control | yes (critical) | `require_project_transition_authority` (D-15), project membership check (`get_project_member`), role-based admin-only endpoints (`require_admin`, D-17). Every new endpoint MUST declare exactly one of these dependencies. |
| V5 Input Validation | yes (critical) | Pydantic v2 DTOs validate all request bodies. Node ID format regex (D-22). WorkflowConfig nested validation (D-54). Phase ID existence check against project workflow (D-19). |
| V6 Cryptography | no change | No new crypto in Phase 9. Existing bcrypt/JWT unchanged. |
| V7 Error Handling | yes | Domain exception → HTTPException mapping. Never leak stack traces. Structured `{"error_code": "PHASE_GATE_LOCKED", "detail": "..."}` format (discretion per CONTEXT.md). |
| V8 Data Protection | yes | `_sanitize_process_config` in `projects.py` already strips webhook_url from responses. Audit log envelope may contain sensitive notes — ensure GET /activity respects project membership filter (D-09+D-14). |
| V10 Malicious Code | yes | fpdf2 PDF rendering accepts user-supplied text (issues, lessons, recommendations). Ensure no XSS vector — fpdf2 escapes by default, but `multi_cell` should not interpret any markup. Verify during test. |
| V13 API | yes | All endpoints require auth (except /auth/login existing). Rate limiting on Phase Gate (D-50) and PDF (D-51) prevents DoS. |

### Known Threat Patterns for FastAPI + Postgres + JWT

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via node_id or phase_id path params | Tampering | SQLAlchemy parameterized queries (already used). Phase ID also validated with regex (D-22) so cannot contain SQL metacharacters. |
| Mass-assignment on PATCH | Tampering | `UpdateDTO` with explicit `Optional` fields; `model_dump(exclude_unset=True)`. Already pattern in v1.0 (`UpdateProjectUseCase`). |
| Privilege escalation via manipulated user_id in Activity feed filter | Elevation | User can only filter on users visible in their projects. Backend enforces `project_member` check before returning activity. |
| DoS via unbounded workflow JSON | DoS | Pydantic validation bounds: reasonable max node/edge counts (suggest 500 nodes, 1000 edges) enforced via `list[max_length=500]`. Planner decides exact limits. |
| Concurrent PhaseReport create → data inconsistency | Tampering | Per-project advisory lock + partial UNIQUE index (Pitfall 8 + 9). |
| Information disclosure via audit_log.metadata (reveals deleted notes) | Information Disclosure | Activity feed only returns rows for projects the requester is a member of (permission check in use case before query). |
| PDF injection via user-supplied text | Tampering / XSS | fpdf2 text rendering is raw — no HTML parsing. `multi_cell` treats input as literal. Verify that no pathway reaches `html_parse` or similar. |
| Idempotency cache poisoning across users | Tampering | Cache key includes `user_id` (Pattern 5). Cannot collide across users. |

## Sources

### Primary (HIGH confidence)

**In-repo (VERIFIED by file read):**
- `.planning/phases/09-backend-schema-entities-apis/09-CONTEXT.md` — 60 locked decisions D-01..D-60
- `.planning/REQUIREMENTS.md` — BACK-01..08, API-01..10 requirement rows
- `.planning/codebase/ARCHITECTURE.md` — Clean Architecture layer rules
- `.planning/codebase/CONVENTIONS.md` — Naming patterns (I-prefix, DTO suffix, snake_case)
- `.planning/codebase/STACK.md` — FastAPI / SQLAlchemy async / Pydantic v2 / asyncpg baseline
- `Backend/alembic/versions/004_phase5_schema.py` — `_table_exists`, `_column_exists`, `_enum_value_exists` helpers + autocommit_block for ALTER TYPE
- `Backend/alembic/versions/001_phase1_schema.py` — audit_log table schema (no `metadata` column currently — must be added in 005)
- `Backend/alembic/versions/003_phase3_schema.py` — task_key, task_seq patterns
- `Backend/app/api/dependencies.py` — 220-line DI container (current state — to be split per D-31)
- `Backend/app/api/main.py` — slowapi limiter setup (line 125-129), router mounts (lines 143-156), AsyncSessionLocal seed
- `Backend/app/api/v1/reports.py` — fpdf2 programmatic PDF pattern (lines 180-247)
- `Backend/app/api/v1/auth.py` — slowapi `@limiter.limit` usage on `/login` (line 59)
- `Backend/app/api/v1/projects.py` — existing projects router, `_sanitize_process_config` (line 59)
- `Backend/app/domain/entities/project.py` — existing Project entity (to be extended with `status`, `process_template_id`, `_normalize_process_config`)
- `Backend/app/domain/entities/task.py` — existing Task entity (to be extended with `phase_id`)
- `Backend/app/domain/entities/team.py` — existing Team entity (to be extended with `leader_id`)
- `Backend/app/domain/entities/file.py` — existing File entity for Artifact.file_id reuse
- `Backend/app/domain/exceptions.py` — existing exception hierarchy (to be extended)
- `Backend/app/application/use_cases/manage_projects.py` — CreateProjectUseCase (to be extended with ArtifactSeeder)
- `Backend/app/application/services/lockout.py` — in-memory cache template for idempotency_cache
- `Backend/app/infrastructure/database/models/base.py` — TimestampedMixin (version, updated_at, is_deleted, deleted_at)
- `Backend/app/infrastructure/database/models/audit_log.py` — current AuditLogModel (no `metadata` column)
- `Backend/app/infrastructure/database/models/project.py` — ProjectModel (to add status, process_template_id)
- `Backend/app/infrastructure/database/models/task.py` — TaskModel (to add phase_id)
- `Backend/app/infrastructure/database/models/team.py` — TeamModel + TeamMemberModel + TeamProjectModel
- `Backend/app/infrastructure/database/models/process_template.py` — ProcessTemplateModel (to add 5 new columns)
- `Backend/app/infrastructure/database/models/__init__.py` — model registration (must add new Milestone/Artifact/PhaseReport models)
- `Backend/app/infrastructure/database/repositories/user_repo.py` — reference async repo pattern
- `Backend/app/infrastructure/database/repositories/project_repo.py` — reference repo with audit diff writes
- `Backend/app/infrastructure/database/repositories/team_repo.py` — reference team repo (to add user_leads_any_team_on_project)
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — existing audit repo (to add `create_with_metadata`)
- `Backend/requirements.txt` — dependency list (fpdf2, slowapi, apscheduler present)
- `Backend/pytest.ini` — asyncio_mode=auto, testpaths=tests
- `Backend/tests/conftest.py` — test DB auto-creation, AsyncClient fixture
- `tasarım.md` lines 722-779 — Lego Mimari §1-2, 4 bağımsız boyut, cycle genelleştirmesi

**External (CITED):**
- [Pydantic V2 migration guide — @model_validator(mode='before')](https://docs.pydantic.dev/latest/migration/)
- [Pydantic V2 validators — field_validator and model_validator](https://docs.pydantic.dev/2.0/usage/validators/)
- [fpdf2 manual — Unicode + cell API](https://py-pdf.github.io/fpdf2/Unicode.html)
- [fpdf2 2.8.7 PyPI release (2026-02-28)](https://pypi.org/project/fpdf2/)
- [Postgres advisory locks for Python developers](https://leontrolski.github.io/postgres-advisory-locks.html)
- [Postgres advisory locks with asyncio](https://medium.com/@n0mn0m/postgres-advisory-locks-with-asyncio-a6e466f04a34)
- [Async Without Tears: 10 Patterns for asyncpg + SQLModel](https://medium.com/@bhagyarana80/async-without-tears-10-patterns-for-asyncpg-sqlmodel-72c68aa68f0d)

### Secondary (MEDIUM confidence)
- [sqlalchemy-asyncpg-advisory-lock-int64 GitHub tracker](https://github.com/expobrain/sqlalchemy-asyncpg-advisory-lock-int64) — documents int64 masking requirement
- [LangChain Postgres issue #101 — cannot insert multiple commands in prepared statement](https://github.com/langchain-ai/langchain-postgres/issues/101) — asyncpg multi-statement gotcha
- [SQLAlchemy FastAPI Database Locks guide](https://medium.com/@mojimich2015/sqlalchemy-database-locks-using-fastapi-a-simple-guide-3e7dcd552d87)
- [Practical Guide to using Advisory Locks](https://medium.com/inspiredbrilliance/a-practical-guide-to-using-advisory-locks-in-your-application-7f0e7908d7e9)

### Tertiary (LOW confidence — marked for validation)
- Version numbers for fastapi, sqlalchemy, alembic, asyncpg, pydantic: UNPINNED in requirements.txt. Marked [ASSUMED] in Standard Stack. Planner verifies on executor machine via `pip list` or `python -c "import X; print(X.__version__)"` before Wave 0 starts.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed and used in codebase
- Architecture: HIGH — replicates existing v1.0 Clean Architecture patterns verbatim
- Pitfalls: HIGH — codebase grep + web research verified each
- Migration patterns: HIGH — `004_phase5_schema.py` is a direct template
- Pydantic normalizer: HIGH — cited official docs + local codebase uses ConfigDict v2 pattern
- pg_advisory_xact_lock: HIGH — cited multiple independent sources + local codebase has no precedent (first use of this primitive)
- fpdf2: HIGH — existing `reports.py` proves pattern works
- Idempotency cache: HIGH — `lockout.py` is exact precedent
- Rate limiting: MEDIUM — slowapi per-IP already used; per-(user,project) custom dict is new (but straightforward)
- Workflow validation algorithms (topological sort): HIGH — standard CS algorithm
- Version numbers: LOW — unpinned in requirements.txt

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (30 days — stable tech stack; no fast-moving dependencies)

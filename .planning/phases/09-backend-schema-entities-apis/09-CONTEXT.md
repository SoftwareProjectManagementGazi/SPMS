# Phase 9: Backend Schema, Entities & APIs - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend has all new entities, schema changes, and API endpoints ready for frontend consumption. This phase delivers:

**Schema/Entity Changes (BACK-01..08):**
- Project.status enum field (ACTIVE/COMPLETED/ON_HOLD/ARCHIVED)
- Task.phase_id (nullable, lifecycle node UUID reference)
- process_config.schema_version + on-read normalizer (backward-compat)
- 3 new entities: Milestone, Artifact, PhaseReport (all Clean Architecture vertical slices)
- dependencies.py split (by-entity sub-modules)
- Single idempotent Alembic migration (005_phase9_schema)

**API Endpoints (API-01..10):**
- Phase Gate transition (API-01)
- Project activity feed (API-02)
- User profile summary (API-03)
- Project status filter (API-04)
- Task phase_id filter (API-05)
- Phase completion criteria CRUD (API-06)
- Milestone/Artifact/PhaseReport CRUD (API-07/08/09, +PDF export)
- Workflow data structure extensions (API-10 — edge types, groups, sequential-flexible mode)

**Scope additions agreed in discussion (not in original requirements):**
- Team Leader role infrastructure (organizational, not project-level)
- ProcessTemplate expansion + apply-to-projects flow
- Drop Project.methodology field → ProcessTemplate FK (migration spans Phase 9 + next phase)

**Critical architectural principle (from tasarım.md Lego Mimari, lines 722-1073):**
The system is **methodology-agnostic**. Methodology labels (Scrum/Waterfall/V-Model/etc.) are display tags, NOT behavior drivers. Behavior is driven by:
- `workflow.mode` (flexible / sequential-locked / continuous / sequential-flexible)
- Feature toggles in `process_config` (enable_phase_assignment, enforce_wip_limits, etc.)
- 4 independent dimensions (Phase/Status/Cycle/Hierarchy) don't cross each other

Decisions in this phase MUST respect this principle — no hardcoded methodology branches in backend logic.

</domain>

<decisions>
## Implementation Decisions

### Phase Gate API (API-01)
- **D-01:** Contention behavior on simultaneous phase transitions: return **409 Conflict** immediately. Second request does NOT wait. Frontend shows toast + manual retry option.
- **D-02:** Advisory lock scope: **per-project** via `pg_advisory_xact_lock(hash(project_id))`. Only one transition per project at a time regardless of phase pair.
- **D-03:** When auto-criteria fail: return **422 Unprocessable Entity** with per-criterion detail in response body:
  ```json
  { "unmet": [
      { "check": "all_tasks_done", "passed": false, "detail": "3/5 done" },
      { "check": "no_critical_tasks", "passed": false, "detail": "1 critical still open" }
  ]}
  ```
- **D-04:** Open tasks action model: **bulk action + optional per-task exceptions list**. Request body:
  ```json
  { "source_phase_id": "nd_abc", "target_phase_id": "nd_xyz",
    "open_tasks_action": "move_to_next" | "move_to_backlog" | "keep_in_source",
    "exceptions": [{ "task_id": 123, "action": "keep_in_source" }],
    "note": "...", "allow_override": false, "idempotency_key": "uuid" }
  ```
- **D-05:** Mode override semantics: frontend sends `allow_override: bool`. Backend honors `allow_override=true` in **ALL modes including sequential-locked**. Rationale: Even in Waterfall, a user may need to force-transition to fix a mis-phased task (user decision explicit). Audit log records `override_used: true`.
- **D-06:** Completion criteria storage: `process_config.phase_completion_criteria[phase_id]` JSON, project-local, **no methodology-based defaults**. Each phase's criteria defined by user in Settings > Lifecycle (UI-TASARIM-PLANI.md §5). Schema:
  ```json
  { "phase_completion_criteria": {
      "nd_abc": {
        "auto": { "all_tasks_done": true, "no_critical_tasks": true, "no_blockers": false },
        "manual": ["Gereksinim dokümanı onaylandı", "Paydaş sunumu yapıldı"]
      }
  }}
  ```
- **D-07:** Continuous/Kanban mode behavior: return **400 Bad Request** with `"Phase Gate not applicable for this workflow mode"`. Check is against `workflow.mode` (not deprecated `Project.methodology`).
- **D-08:** Audit log detail: full transition envelope in `audit_log.metadata` JSON column:
  ```json
  { "source_phase_id": "nd_abc", "source_phase_name": "Tasarım",
    "target_phase_id": "nd_xyz", "target_phase_name": "Kodlama",
    "workflow_mode": "flexible",
    "criteria_snapshot": { "auto": {...}, "manual": [...] },
    "unmet_criteria": [...],
    "override_used": false,
    "open_tasks_action": "move_to_next",
    "exceptions": [],
    "moved_task_count": 3,
    "note": "..." }
  ```
  Activity feed (API-02) reads from this.
- **D-09:** Permission: **Admin + Project Manager + Team Leader** (whose team works on this project). See Team Leader decisions below.
- **D-10:** Transaction scope: **single atomic tx** — advisory lock acquisition → criteria check → task moves → audit log insert all in same AsyncSession. Advisory lock via `pg_advisory_xact_lock` releases automatically at commit/rollback. Any failure rolls everything back.
- **D-11:** PhaseReport coupling: **independent endpoint** (API-09). Transition writes audit log only. PhaseReport CRUD is a separate flow triggered from Lifecycle > Geçmiş card "Rapor" button.
- **D-12:** Cycle counter (×N badge on canvas nodes): **derived from audit_log** via `COUNT(action='phase_transition' AND source_phase_id=X)`. No separate column/table. Frontend queries `GET /projects/{id}/phase-transitions?group_by=phase_id` (or similar aggregation endpoint).

### Team Leader Role Infrastructure (scope addition)
- **D-13:** Team Leader is **organizational**, NOT project-level. Teams are organization-scoped entities (TeamMembers + TeamProjects already exist). Add `Team.leader_id` nullable FK → users(id).
- **D-14:** Permission scope is **project-scoped via TeamProjects join**: "Does user lead any team that works on this project?" — `EXISTS(Teams t JOIN TeamProjects tp ON t.id=tp.team_id WHERE t.leader_id=:user_id AND tp.project_id=:project_id)`. NOT a system-wide super-user (Model A from discussion).
- **D-15:** New DI helper: `require_project_transition_authority(project_id, current_user, ...)` — passes if Admin OR `project.manager_id == user.id` OR `user_leads_any_team_on_project(user.id, project_id)`. Used by Phase Gate, Milestone/Artifact/PhaseReport POST/DELETE endpoints.
- **D-16:** New `ITeamRepository` methods: `user_leads_any_team_on_project(user_id, project_id) -> bool`, `get_teams_led_by(user_id) -> list[Team]`.
- **D-17:** New endpoints:
  - `PATCH /teams/{id}` to set/clear `leader_id` (Admin only)
  - `GET /users/me/led-teams` returns teams user leads + their project memberships (frontend uses this to decide whether to show Phase Gate/Milestone action buttons)
- **D-18:** **Frontend note (Phase 10-12):** Users see Phase Gate / Milestone create / Artifact create+delete / PhaseReport CRUD buttons only when their membership satisfies `require_project_transition_authority`. Team members without leader scope see read-only views. Phase 10-12 discussion must resolve how client-side detects this (via `/users/me/led-teams` or per-endpoint 403 retry).

### Phase ID Cross-Entity References
- **D-19:** Phase ID references (Task.phase_id, Artifact.linked_phase_id, Milestone.linked_phase_ids[], PhaseReport.phase_id) are **validated on create/update** against `project.process_config.workflow.nodes`. If node doesn't exist OR `node.is_archived==true`, return **400 Bad Request** with validation detail.
- **D-20:** Validation scope is **project-local only**. Cross-project references (task in Project A referencing Project B's node) are rejected. Scope: `project_id` of the owning entity determines which workflow to check against.
- **D-21:** Node deletion from workflow: **soft-delete via `node.is_archived: true`** on the node object inside `process_config.workflow.nodes`. Hard deletion is NOT supported. Archived nodes:
  - Cannot be assigned to new tasks/artifacts/milestones/reports (validation rejects them)
  - Existing references are preserved (no cascade, no orphans)
  - Canvas renders in gray with "archived" indicator (frontend concern)
  - Can be restored by setting `is_archived: false`
- **D-22:** Node ID format: `nd_` + `nanoid(10)` = 13-char URL-safe string (e.g., `"nd_V1StGXR8_Z"`). Generated **client-side** in workflow editor. Stable — survives name changes, reposition, and archive/unarchive. Backend does NOT generate node IDs.
- **D-23:** Node display name (`node.name`) is user-editable and separate from `node.id`. Example: Scrum sprint lifecycle node might have `id="nd_abc"` but `name="Mart 2026 Sprint"`. Frontend always shows `node.name`; `node.id` is internal only.
- **D-24:** `Milestone.linked_phase_ids`: array of node IDs. Each ID validated individually. Empty array `[]` is valid (milestone not bound to any phase, e.g., "Beta Launch" project-wide milestone). Backend dedupes duplicates on write.
- **D-25:** `PhaseReport` uniqueness: `UNIQUE (project_id, phase_id, cycle_number)` constraint. Spiral/cyclic models can have multiple reports per node (cycle_number=1,2,3...). `cycle_number` auto-calculated on POST from `COUNT(audit_log WHERE action='phase_transition' AND source_phase_id=X) + 1` unless explicitly provided. `revision` field **auto-increments on each PATCH** (in-place update, not a new record). Audit log captures field-level diffs.
- **D-26:** `Artifact.linked_phase_id`: **nullable**. Artifact can be project-scoped (not bound to any phase, e.g., "Proje Charter"). Settings > Artefaktlar UI allows null selection.

### Artifact Auto-Seed Mechanism
- **D-27:** Default artifact list storage: new JSON column `process_templates.default_artifacts` — list of `{ name, linked_phase_id_suggestion: string|null, description: string|null }`. Admin editable via `PATCH /process-templates/{id}`. Empty array is valid (template with no defaults). Unlimited entries.
- **D-28:** Seed timing: inside `CreateProjectUseCase.execute()` in the **same atomic transaction** as Project creation. Read `ProcessTemplate.default_artifacts`, create Artifact records for each. Delegate to `ArtifactSeeder` helper class to keep use case clean. If any step fails, full rollback (no orphan Project without seeded artifacts, no orphan artifacts without Project).
- **D-29:** Methodology change (Project's process_template_id PATCH): **no-op on existing artifacts**. User manages additions/removals manually. Audit log records the change.
- **D-30:** Custom workflow (no ProcessTemplate selected — PM defined workflow from scratch in wizard): **empty seed**, zero artifacts. User adds artifacts manually via Settings > Artefaktlar.

### Backend Infra Restructure
- **D-31:** `dependencies.py` split strategy: **by-entity** sub-modules under `Backend/app/api/deps/`:
  - `deps/__init__.py` re-exports all legacy symbols (backward compat for existing routers)
  - `deps/auth.py` — `oauth2_scheme`, `get_current_user`, `require_admin`, `require_project_transition_authority`
  - `deps/project.py` — `get_project_repo`, `get_project_member`
  - `deps/task.py` — `get_task_repo`, `get_task_project_member`, `get_dependency_repo`
  - `deps/team.py` — `get_team_repo`
  - `deps/milestone.py` — `get_milestone_repo` (new)
  - `deps/artifact.py` — `get_artifact_repo` (new)
  - `deps/phase_report.py` — `get_phase_report_repo` (new)
  - `deps/audit.py` — `get_audit_repo`
  - `deps/sprint.py`, `deps/comment.py`, `deps/notification.py`, etc. — one per existing entity
  - Existing `dependencies.py` becomes a thin re-export shim (legacy import path preserved).
- **D-32:** `process_config` schema_version normalizer: **domain entity pure method** — `Project._normalize_process_config()` on the Pydantic entity, wired via `@model_validator(mode='before')`. Invoked automatically on every read/validation. Framework-independent, testable in isolation. Also callable from application layer for explicit migration batch jobs.
- **D-33:** schema_version semantic: **integer (v1, v2, v3...)** with on-read lazy migration. `process_config.schema_version: int` (default 1). Normalizer chain: if `version < current`, run `migrate_v{n}_to_v{n+1}()` sequentially until current. Current version for Phase 9: **v1** (canonical fields: `methodology_legacy?`, `workflow: {mode, nodes, edges, groups}`, `phase_completion_criteria: {}`, `enable_phase_assignment: bool`, `enforce_sequential_dependencies: bool`, `enforce_wip_limits: bool`, `restrict_expired_sprints: bool`). Write-back to DB is lazy (happens on next PATCH), not eager.
- **D-34:** Alembic migration: **single idempotent file** `Backend/alembic/versions/005_phase9_schema.py`. Uses existing `_table_exists()` / `_column_exists()` helper pattern (from `004_phase5_schema.py`). Contents:
  - `ALTER TABLE projects ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'`
  - `ALTER TABLE projects ADD COLUMN process_template_id INTEGER NULL REFERENCES process_templates(id)` + backfill UPDATE mapping existing methodology → template
  - `ALTER TABLE tasks ADD COLUMN phase_id VARCHAR(20) NULL`
  - `ALTER TABLE teams ADD COLUMN leader_id INTEGER NULL REFERENCES users(id)`
  - `ALTER TABLE process_templates ADD COLUMN default_artifacts JSONB, default_phase_criteria JSONB, default_workflow JSONB, cycle_label_tr VARCHAR(50), cycle_label_en VARCHAR(50)`
  - `CREATE TABLE milestones` (id, project_id FK, name, target_date, description, status VARCHAR(20) DEFAULT 'pending', linked_phase_ids JSONB DEFAULT '[]', created_at, updated_at)
  - `CREATE TABLE artifacts` (id, project_id FK, name, status VARCHAR(20) DEFAULT 'not_created', assignee_id FK users, linked_phase_id VARCHAR(20) NULL, note, file_id FK files NULL, created_at, updated_at)
  - `CREATE TABLE phase_reports` (id, project_id FK, phase_id VARCHAR(20), cycle_number INTEGER DEFAULT 1, revision INTEGER DEFAULT 1, summary_task_count, summary_done_count, summary_moved_count, summary_duration_days, completed_tasks_notes JSONB DEFAULT '{}', issues TEXT, lessons TEXT, recommendations TEXT, created_by FK users, created_at, updated_at, UNIQUE(project_id, phase_id, cycle_number))
  - Data backfill: `UPDATE projects SET process_config = jsonb_set(process_config, '{schema_version}', '1')` for NULL entries
  - `methodology` column **NOT dropped in this migration** — deferred to phase 10 or later (006_drop_methodology) for safer rollback window.

### Milestone/Artifact/PhaseReport CRUD Permissions
- **D-35:** Milestone permissions: `GET` accessible to all project members. `POST/PATCH/DELETE` gated by `require_project_transition_authority` (Admin + PM + Team Leader).
- **D-36:** Artifact permissions: `GET` all members. `POST/DELETE` require `require_project_transition_authority`. `PATCH` additionally permitted for `artifact.assignee_id == current_user.id` (assignee can update status, note, attach file on their own artifact). Assignee **cannot** reassign (`assignee_id` field is Admin+PM+TL only — enforced at use-case level by splitting into `update_artifact_by_assignee` vs `update_artifact_by_manager`).
- **D-37:** PhaseReport permissions: `GET` all members. `POST/PATCH/DELETE` Admin+PM+TL only. No assignee/author override — reports are management documents.

### JSON vs Relational Storage
- **D-38:** `Milestone.linked_phase_ids`: **JSONB column** (array of node ID strings). Many-to-many with workflow nodes (which live in project's process_config JSON, no nodes table). GIN index for `@> '[\"nd_abc\"]'` queries. No junction table.
- **D-39:** `PhaseReport.summary_*` fields: **explicit SQL columns** (`summary_task_count INT`, `summary_done_count INT`, `summary_moved_count INT`, `summary_duration_days INT`). Queryable for cross-project analytics.
- **D-40:** `PhaseReport.completed_tasks_notes`: **JSONB column** (`{ "task_123": "note...", "task_124": "note..." }`). Report-local metadata, not cross-queried.
- **D-41:** `Artifact.file_id`: **nullable FK to existing `files` table** (Backend/app/domain/entities/file.py — already exists from v1.0 for task attachments). Reuses upload/download/soft-delete machinery. One file per artifact in v2.0; multi-file support deferred.

### Methodology Cleanup
- **D-42:** Drop `Project.methodology` enum field. Replace with `Project.process_template_id` nullable FK to `process_templates(id)`. ProcessTemplate.name serves as methodology display label.
- **D-43:** Cycle i18n labels move to `ProcessTemplate.cycle_label_tr` and `ProcessTemplate.cycle_label_en` columns. Frontend reads from template, not from project.methodology.
- **D-44:** Apply-to-projects flow: `POST /process-templates/{id}/apply` with body `{ project_ids: [], require_pm_approval: bool }`. When PM approval required, backend creates approval requests (notification + pending state). Admin initiates, PM(s) accept per-project. Each target project acquires Phase Gate per-project advisory lock before applying — if active transition detected, wait up to 5s then return 409 for that project (partial success reported).
- **D-45:** Migration path for existing methodology: two-step:
  - **Phase 9 (005 migration):** Add `projects.process_template_id` FK + backfill `UPDATE projects p SET process_template_id=(SELECT id FROM process_templates WHERE UPPER(name)=p.methodology)`. Both columns coexist temporarily.
  - **Phase 10+ (006 migration):** After frontend fully uses template_id, drop `methodology` column. Safe rollback window between phases.

### Activity + Profile API
- **D-46:** `GET /projects/{id}/activity` filter parameters: `?type[]=...&user_id=X&date_from=Y&date_to=Z&limit=30&offset=0`. `type` is multi-value from audit_log.action values: `task_created`, `status_changed`, `assigned`, `comment_added`, `phase_transition`, `task_deleted`, `milestone_created`, `artifact_updated`, `phase_report_created` (extend as audit_log grows). Response: `{ items: [EnrichedActivityItem], total: int }`.
- **D-47:** Activity response denormalization: **backend JOINs users table** and entity labels (task title, milestone name, etc.). Each item: `{ id, action, entity_type, entity_id, entity_label, user_id, user_name, user_avatar, old_value, new_value, timestamp, metadata }`. Frontend renders list without N+1 lookups.
- **D-48:** `GET /users/{id}/summary` uses `asyncio.gather()` for parallel SQL: (1) stats aggregation (active tasks count, completed-30d count, project count), (2) project list, (3) recent activity (limit 5). Single endpoint, rich response.
- **D-49:** User profile projects list filter: user is member via Team → TeamProjects → Project, AND `project.status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD')`. Archived projects hidden by default. `?include_archived=true` query param allows including them.

### Rate Limiting + Idempotency
- **D-50:** Phase Gate endpoint `POST /projects/{id}/phase-transitions`:
  - **Rate limit:** 10 seconds per (user_id, project_id) pair. Second request within window → 429 Too Many Requests.
  - **Idempotency:** accepts `Idempotency-Key: <uuid>` header. Cache response for 10 minutes keyed by (user_id, project_id, idempotency_key). Duplicate key within window returns cached response without re-executing.
- **D-51:** PDF export `GET /phase-reports/{id}/pdf`: rate limit 30 seconds per user (CPU-heavy sync rendering).
- **D-52:** Other CRUD endpoints (Milestone/Artifact/PhaseReport POST/PATCH/DELETE): rely on existing API-wide rate limiter (SEC-01 from v1.0). Idempotency optional via `Idempotency-Key` header on POST.
- **D-53:** Idempotency cache backing store: **in-memory for Phase 9** (reusing existing in-memory pattern from lockout store). Acknowledged limitation: cache clears on app restart. Redis upgrade deferred (tracked in v3.0 backlog, ADV-04).

### Workflow JSON Validation (API-10)
- **D-54:** Backend-side validation using Pydantic nested models:
  ```python
  class WorkflowNode(BaseModel):
      id: str  # nd_xxx format
      name: str
      x: float
      y: float
      color: str
      is_archived: bool = False
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
  class WorkflowConfig(BaseModel):
      mode: Literal["flexible", "sequential-locked", "continuous", "sequential-flexible"]
      nodes: list[WorkflowNode]
      edges: list[WorkflowEdge]
      groups: list[WorkflowGroup] = []
  ```
  Invalid shape → 422 with Pydantic error detail. Strict validation prevents malformed data.
- **D-55:** Business-rule validation:
  - Node IDs unique within workflow
  - Edge source/target must reference existing non-archived nodes
  - Sequential-flexible mode: flow edges must not form cycles (topological sort check); feedback edges exempt
  - Group bounds: width/height > 0, x/y >= 0

### Task Parent-Child Phase Inheritance
- **D-56:** **No inheritance enforcement**. Parent and child tasks are independent in phase_id assignment. Backend accepts any combination: parent null + child set, parent set + child different, parent set + child null, etc. Matches tasarım.md L2: "Ana görev faz ataması yok veya genel, alt görevleri farklı fazlara atanabilir."
- **D-57:** Parent "phase summary" mini-stepper (shown in task detail sidebar): derived **frontend-side** from `DISTINCT child.phase_id` query — backend just returns children with their phase_ids, frontend computes the stepper state (✓/●/○ per phase).

### PhaseReport PDF Export
- **D-58:** Library: **fpdf2** (per PROJECT.md decision — pure Python, no system lib dependencies). Reuse existing report generation patterns from v1.0.
- **D-59:** Template approach: **programmatic composition** in `Backend/app/application/services/phase_report_pdf.py`. No HTML/Jinja2 intermediate. Functions like `render_header(pdf, report)`, `render_summary(pdf, report)`, `render_tasks_section(pdf, report)`, `render_reflection(pdf, report)` compose the document.
- **D-60:** Rendering mode: **sync** (request thread). Typical report <2MB, <500ms render time. Job queue deferred (future phase, if reports grow).

### Claude's Discretion (to be resolved during execution)

The following details were not explicitly decided in discussion — Claude decides during plan/execute, documents decisions in PLAN.md / commit messages / code comments for next-phase reference:

- **Enum placement strategy:** Each entity's enum (ProjectStatus, MilestoneStatus, ArtifactStatus, PhaseReportStatus) lives in the entity file vs. a shared `Backend/app/domain/enums.py` module. Convention: follow existing pattern (Methodology lives in project.py, TaskPriority in task.py) — keep enums co-located with entity they describe.
- **DTO naming:** Follow existing CreateDTO/UpdateDTO/ResponseDTO split convention for all new entities. camelCase aliases for JSON output if prior endpoints use them; otherwise snake_case.
- **Testing strategy:** Unit tests for use cases (mock repositories), integration tests for repositories (real Postgres via docker-compose.yaml). Match existing pytest-asyncio pattern. New test files: `tests/unit/test_phase_gate_use_case.py`, `tests/integration/test_milestone_repo.py`, etc.
- **Error code taxonomy:** Custom error codes in addition to HTTP status — e.g., `{ "error_code": "PHASE_GATE_LOCKED", "detail": "..." }`. Decide during API-01 implementation whether to standardize or leave per-endpoint. Document in PLAN.md; carry forward to Phase 10-13.
- **Deployment/migration coordination:** Migration and API deploy ordering (DB migration must run before API that uses new columns/tables). Document in PLAN.md deployment notes. Downtime impact: Alembic 005 adds nullable columns and new tables — should be zero-downtime on rolling deploy. Verify during execution.
- **Logging conventions:** New endpoints follow existing logging pattern (console/print). Structured logging (structlog) deferred. Metrics collection deferred.

**Action for plan-phase:** Treat these as open questions. When the planner hits one, make a concrete decision, note the rationale in PLAN.md's Decision Log, and ensure subsequent phases can read those decisions (commit messages + PROJECT.md Key Decisions update).

### Folded Todos
None — no pre-existing todos were folded into this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Source Documents (intent)
- `tasarım.md` §Lego Mimari (lines 722-1073) — **Methodology-agnostic architecture, 4 independent dimensions (Phase/Status/Cycle/Hierarchy), workflow.mode-driven behavior, NOT Project.methodology-driven.** Critical context for all Phase 9 decisions.
- `tasarım.md` §Ortak Bileşenler (lines 667-720) — Shared UI components (PhaseMetrics, PhaseCard, ActivityTimeline, CompletionChecklist, MiniStatCard) that consume Phase 9 API output shapes.
- `UI-Tasarim-Backend.md` — Backend spec reference for schema/entity changes. **This doc is NOT verbatim** — comprehensive review done, decisions in this CONTEXT.md supersede where they differ.
  - §1 Proje Durumu (BACK-01 Project.status enum)
  - §2 Cycle Genelleştirmesi (no backend change, frontend i18n)
  - §3 Görev-Faz Ataması (BACK-02 Task.phase_id)
  - §4 Graph Traversal (backend helper for Phase Gate)
  - §5 Workflow Veri Yapısı (API-10 extensions)
  - §6 Faz Geçişi (API-01 Phase Gate)
  - §7 Milestone Entity (BACK-04)
  - §8 Artefakt Entity (BACK-05)
  - §9 Değerlendirme Raporu (BACK-06 PhaseReport)
  - §10 Proje Aktivite API (API-02)
  - §11 Kullanıcı Profili API (API-03)
- `UI-TASARIM-PLANI.md` — UI spec referenced for endpoint response shape matching:
  - §4 Phase Gate Inline Expand (lines 193-212) — Phase Gate UX behavior
  - §5 Faz Tamamlanma Kriterleri (lines 216-226) — Settings > Lifecycle criteria config
  - §Metodoloji Davranış Özeti (lines 660-675) — Per-methodology lifecycle visibility rules (CONFIRM: methodology-agnostic architecture supersedes per-methodology hardcoding)

### Prototype Source Files (implementation references)
- `New_Frontend/src/pages/lifecycle-tab.jsx:408-498` — `PhaseGateExpand` component showing request body shape (open_tasks SegmentedControl, manual/auto criteria checkboxes, transition note)
- `New_Frontend/src/pages/settings.jsx` — Settings > Lifecycle phase criteria editor (will consume API-06 endpoint)
- `New_Frontend/src/pages/workflow-editor.jsx` — WorkflowCanvas + editor (consumes API-10 workflow data structure)

### Existing Code (patterns to follow)
- `Backend/app/api/dependencies.py` — Current DI container (220 lines, being split per D-31)
- `Backend/app/domain/entities/project.py` — Existing Project entity, reference for entity expansion
- `Backend/app/domain/entities/task.py` — Existing Task entity, reference for phase_id addition
- `Backend/app/domain/entities/team.py` — Existing Team entity, reference for leader_id addition
- `Backend/app/infrastructure/database/repositories/user_repo.py` — Existing async repo pattern (`_to_entity`, `_to_model`, `create → flush → get_by_id`)
- `Backend/app/application/use_cases/manage_projects.py` — Existing CreateProjectUseCase (will be extended with Artifact auto-seed per D-28)
- `Backend/alembic/versions/004_phase5_schema.py` — Existing idempotent migration pattern (`_table_exists`, `_column_exists` helpers) to replicate in 005_phase9_schema
- `Backend/app/domain/exceptions.py` — Existing domain exception hierarchy (add PhaseGateError, PhaseTransitionLockedError, CriteriaUnmetError, ArchivedNodeReferenceError)

### Project Context
- `.planning/REQUIREMENTS.md` — BACK-01..08, API-01..10 formal requirements for this phase
- `.planning/codebase/ARCHITECTURE.md` — Clean Architecture layer rules
- `.planning/codebase/CONVENTIONS.md` — Naming conventions (snake_case files, PascalCase classes, I-prefix interfaces, DTO suffix)
- `.planning/codebase/STACK.md` — Tech stack baseline (FastAPI, SQLAlchemy async, Pydantic v2, asyncpg)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **File entity (Backend/app/domain/entities/file.py)** — Existing attachment system from v1.0 for task comments/attachments. Reuse for Artifact.file_id (D-41) — no new upload/download machinery needed.
- **Team + TeamMembers + TeamProjects tables** — Organizational team structure already exists. Only `Team.leader_id` field missing (D-13). Permission join `user_leads_any_team_on_project` builds on existing joins.
- **audit_log table** — Existing from v1.0. Activity feed (API-02) reads from it; phase transitions write to it. Add JSON `metadata` column (already exists?) for rich phase transition envelopes.
- **Alembic idempotent helpers** — `_table_exists()`, `_column_exists()` in `004_phase5_schema.py` will be copied into `005_phase9_schema.py` for safe re-runs.
- **ProcessTemplate table** — Existing from v1.0 (Scrum/Kanban/Waterfall/Iterative seeded). Extends with 5 new columns (D-27 default_artifacts, default_phase_criteria, default_workflow + cycle_label_tr/en).
- **fpdf2 library** — Already a project dependency (PROJECT.md decision). Reuse for PhaseReport PDF export (D-58).
- **pg_advisory_xact_lock** — PostgreSQL native feature, no external dependency. Used for Phase Gate per-project lock (D-02, D-10).

### Established Patterns
- **Use case class per action** — One `ExecuteUseCase` class per business operation, single `async def execute(dto, ...)` method. Pattern continues for `ExecutePhaseTransitionUseCase`, `CreateMilestoneUseCase`, `SeedArtifactsUseCase`, etc.
- **Repository interface + SqlAlchemy implementation** — ABC in `domain/repositories/`, impl in `infrastructure/database/repositories/`. Replicate for IMilestoneRepository/SqlAlchemyMilestoneRepository, IArtifactRepository, IPhaseReportRepository.
- **DTO naming: CreateDTO / UpdateDTO / ResponseDTO** — All new entities follow this split. CreateDTO required fields; UpdateDTO all `Optional`; ResponseDTO with `model_config = ConfigDict(from_attributes=True)`.
- **FastAPI Depends() DI** — Routers inject repos/services via `Depends(get_xxx_repo)`. Extends to new helpers: `get_milestone_repo`, `require_project_transition_authority`.
- **Domain exceptions → HTTPException in API layer** — Never raise HTTPException from domain/application. Add to `domain/exceptions.py`: `PhaseGateLockedError`, `CriteriaUnmetError`, `ArchivedNodeReferenceError`, `CrossProjectPhaseReferenceError`.
- **Timestamps** — All entities use `created_at: Optional[datetime] = None`, `updated_at: Optional[datetime] = None`, DB columns with `server_default=func.now()` and ORM events for update.
- **Soft-delete at repo layer** — Repository `delete` methods typically set `is_deleted=True` rather than hard DELETE. Apply to Milestone/Artifact/PhaseReport repos (Claude's discretion to align with existing patterns).

### Integration Points
- **Routers under `Backend/app/api/v1/`** — New: `phase_transitions.py`, `milestones.py`, `artifacts.py`, `phase_reports.py`, `activity.py` (or extend `projects.py` for `/projects/{id}/activity`). Modify: `projects.py` (adds `?status=` filter, wires process_template_id), `tasks.py` (adds `?phase_id=` filter, accepts phase_id in Create/Update), `users.py` (adds `/users/{id}/summary`, `/users/me/led-teams`), `teams.py` (adds leader_id PATCH).
- **main.py router registration** — Mount new routers at `/api/v1/phase-transitions`, `/api/v1/milestones`, `/api/v1/artifacts`, `/api/v1/phase-reports`, `/api/v1/users/me/led-teams`, etc.
- **Existing `get_current_user` dependency** — Continues unchanged. New `require_project_transition_authority` wraps it.
- **CreateProjectUseCase** — Extended to invoke `ArtifactSeeder` in same transaction (D-28). Keep original behavior; new step added after Project insert.
- **ProcessConfig in Project entity** — Schema_version normalizer (D-32) is a Pydantic validator, transparent to existing callers. Repositories continue calling `Project.model_validate(orm_model)` without changes.

</code_context>

<specifics>
## Specific Ideas

- "Mart 2026 Sprint" / custom sprint labels via `node.name` field (user-editable), independent of `node.id` UUID — from user's discussion about methodology-agnostic naming.
- "Lego Mimari" philosophy (tasarım.md §722): Each decision must serve composable building blocks, not rigid methodology silos. When tempted to write `if methodology == 'SCRUM'` in backend code, stop — use workflow.mode / feature toggles instead.
- Team Leader concept from user: "bir ekibin liderinin çalıştığı projelerde yetkisi olması, o projenin faz geçişlerini yapabilmesi, diğer farklı ekiplerden bir üyenin (ekip lideri olmayan) yönetimi için iyi bir şey" — cross-team member management authority limited to project scope.
- "Override her durumda izin verilmeli, yoksa override'ın ne anlamı var? belki waterfall'da adam görevi yanlış fazda açtı, bir sonraki faza doğru faza taşımak istiyor" — `allow_override=true` must work even in sequential-locked mode. Real-world escape hatch for correcting mistakes.
- Jira duplicate-work pain point: testers submitting same tasks to both team board and system board. Resolution: tasks belong to one project, team-based views derived via JOIN(Task → User → TeamMembers → Team). Organizational team structure already supports this.
- "Revizyon numarası iterate etmeli" + UNIQUE on (project_id, phase_id, cycle_number): PhaseReport mutable with revision field auto-increment on PATCH; cycle_number separates Spiral/cyclic re-entries, revision tracks in-cycle edits.
- fpdf2 chosen over WeasyPrint for pure-Python / no system dep reasons — preserve that choice; no HTML/Jinja2 for PDF generation.

</specifics>

<deferred>
## Deferred Ideas

### Out of Phase 9 scope (tracked for future)
- **v3.0 ADV-04 Redis for idempotency cache** — Phase 9 uses in-memory cache (limitation: cleared on restart). Redis upgrade when persistent cross-instance cache needed.
- **v3.0 ADV-06 Isolated test database** — Integration tests still use main spms_db (pre-existing blocker from v1.0, not introduced by Phase 9).
- **Multi-file artifact attachments** — v2.0 supports one file per artifact. Multi-file (SRS.pdf + appendix.xlsx) deferred.
- **Async PDF job queue** — Sync rendering sufficient for v2.0 report sizes. When reports grow >5MB or >2s render, move to asyncio task queue.
- **Approval workflow for template apply-to-projects** — Phase 9 backend accepts `require_pm_approval` flag but frontend approval UI lives in later phase (Settings > Admin > Templates).
- **Drop `Project.methodology` column** — Phase 9 adds `process_template_id` + backfill. Column drop migration (006) runs after Phase 10+ ensures no remaining methodology reads. Avoids irreversible change during active v2.0 rollout.

### Reviewed Todos (not folded)
None — cross_reference_todos found no matching pending todos for Phase 9.

### Cross-phase scope flags (frontend phases must address)
- **Phase 10-13:** All CRUD UIs (Milestone/Artifact/PhaseReport create/edit buttons) must hide for users lacking `require_project_transition_authority`. Client detects via `GET /users/me/led-teams` + project manager_id check + admin role check.
- **Phase 10-13:** Cycle label i18n migrations (Sprint/Dönem/İterasyon/Artım) must read from `project.process_template.cycle_label_tr/en` (new) instead of `project.methodology` (deprecated/dropped).
- **Phase 11 (Task Features):** Task form phase_id dropdown must filter archived nodes (display as disabled/grayed) but show active nodes.
- **Phase 12 (Workflow Editor):** Node delete UI must call new archive endpoint (soft-delete) not hard-delete. Archived node restoration UX required.
- **Phase 12 (Lifecycle):** Phase Gate UI must handle 422 criteria-unmet response → render per-criterion failure list inline. Handle 409 lock-contention → show "Another transition in progress" toast. Handle 429 rate-limit → show retry countdown.

</deferred>

---

*Phase: 09-backend-schema-entities-apis*
*Context gathered: 2026-04-21*

# Phase 9: Backend Schema, Entities & APIs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 09-backend-schema-entities-apis
**Areas discussed:** Phase Gate API, Phase ID Cross-Entity References, Artifact Auto-Seed Mechanism, Backend Infra Restructure, Milestone/Artifact/PhaseReport Permissions, JSON vs Relational Storage, Methodology Cleanup, Activity/Profile API, Rate Limiting + Idempotency, Workflow JSON Validation, Task Parent-Child Inheritance, PDF Export

---

## Phase Gate API

### Q1: When two users attempt a phase transition on the same project simultaneously, what should happen?
| Option | Description | Selected |
|--------|-------------|----------|
| Return 409 Conflict (Recommended) | First acquires lock, second immediately 409, frontend retries manually | ✓ |
| Wait-and-serialize | Second request blocks until first completes | |
| Return 423 Locked with retry-after | Reject with 423 + 'Retry-After: 2s', auto-retry | |

**User's choice:** 409 Conflict

### Q2: What scope should the advisory lock cover?
| Option | Description | Selected |
|--------|-------------|----------|
| Per-project (Recommended) | pg_advisory_xact_lock(hash(project_id)) | ✓ |
| Per phase-transition pair | Lock by hash(project_id + source + target) | |
| No lock, use optimistic concurrency | Read-verify-apply cycle | |

**User's choice:** Per-project

### Q3: When Phase Gate finds unmet auto-criteria, what should the API return?
| Option | Description | Selected |
|--------|-------------|----------|
| 422 Unprocessable with per-criterion detail (Recommended) | Per-criterion status list in body | ✓ |
| 200 OK with 'blocked' flag | Always 200, body contains blockers | |
| 400 Bad Request with generic message | Generic blocking message | |

**User's choice:** 422 with detail

### Q4: Open tasks action model
| Option | Description | Selected |
|--------|-------------|----------|
| Single action, applied to all (Recommended) | Bulk SegmentedControl style | |
| Action + optional per-task override list | Bulk + exceptions | ✓ |
| Raw open_tasks diff | Per-task explicit state | |

**User's choice:** Bulk + exceptions list

**Notes:** User redirected me mid-discussion with "Sen New_Frontend deki faz kapat tuşunun içeriğine baktın mı?" — I re-read `New_Frontend/src/pages/lifecycle-tab.jsx:408-498` (PhaseGateExpand) and `UI-TASARIM-PLANI.md` §4 to align with prototype UX. User picked bulk+exceptions for flexibility.

### Q5: Mode override semantics (criteria fail)
| Option | Description | Selected |
|--------|-------------|----------|
| Backend checks mode, no frontend flag | sequential-locked+fail=422, else 200+warnings | |
| Frontend allow_override flag + backend respects it | Request includes flag | ✓ |
| Always 422 | Block every unmet-criteria transition | |

**User's choice:** Frontend flag + backend respects it

**Notes:** User explicitly said "her durumda override'a izin verilmeli, yoksa override'ın ne anlamı var? belki waterfallda adam görevi yanlış fazda açtı, bir sonraki faza doğru faza taşımak istiyor." So allow_override=true works even in sequential-locked mode.

### Q6: Criteria storage
| Option | Description | Selected |
|--------|-------------|----------|
| process_config JSON (Recommended) | Project-local, per-phase | ✓ |
| Separate phase_criteria table | Normalized | |
| ProcessTemplate default + project override | Two-level | |

**User's choice:** process_config JSON

**Notes:** User added "biz aslında metodoloji bazlı değil, metodoloji agnostik bir tasarım yapmaya çalışıyoruz" — pointed me to `tasarım.md` 667+ (Lego Mimari). Re-read that section; methodology-agnostic principle shapes downstream decisions.

### Q7: Continuous/Kanban mode behavior
| Option | Description | Selected |
|--------|-------------|----------|
| 400 Bad Request 'Phase Gate not applicable' (Recommended) | Backend checks workflow.mode not Project.methodology | ✓ |
| Accept as no-op | Return 200, do nothing | |
| Always run criteria check | Ignore mode | |

**User's choice:** 400 not applicable

### Q8: Audit log detail level
| Option | Description | Selected |
|--------|-------------|----------|
| Full transition envelope (Recommended) | source/target/mode/criteria/override/tasks/note in metadata JSON | ✓ |
| Simple source->target only | Basic columns | |
| Transition + per-task audit records | N+1 rows per transition | |

**User's choice:** Full envelope

### Q9: Who can trigger phase transition
| Option | Description | Selected |
|--------|-------------|----------|
| Project member + PM + Admin (Recommended) | Any member, admins | |
| PM + Admin only | Stricter | |
| process_config configurable | Per-project permission | |

**User's choice:** Introduced new role — "Team Leader" (Admin + PM + Team Leader)

**Notes:** Scope expansion. User: "yeni bir rol doğuyor: Team Leader, frontendde de bu rolün gereklilikleri eklenmeli".

### Q10: Team Leader assignment model
| Option | Description | Selected |
|--------|-------------|----------|
| Project-based role (different per project) | TeamMembers.project_role field | |
| System-wide role | User.role_id = 'team_leader' | |
| Hybrid system-wide + project-level | Two-tier | |

**User's choice:** Concerned about real-world team structure — triggered deeper discussion

**Notes:** User raised Jira use case: testing team cross-project, duplicate work problem. Led to organizational Team concept.

### Q11: Team Leader scope (authority reach)
| Option | Description | Selected |
|--------|-------------|----------|
| Model A: authority in projects where their team works (Recommended) | Team.leader_id + TeamProjects join | ✓ |
| Model B: authority in ALL projects | Organization-wide super-user | |
| Other | User-specified alternative | |

**User's choice:** Model A

### Q12: Transaction scope for phase transition
| Option | Description | Selected |
|--------|-------------|----------|
| Single atomic tx (Recommended) | Criteria+moves+audit in one AsyncSession | ✓ |
| Two txs (read then write) | Separate criteria check | |
| Saga/compensate | Per-step rollback | |

**User's choice:** Single atomic tx

### Q13: PhaseReport coupling with transition
| Option | Description | Selected |
|--------|-------------|----------|
| Separate endpoint (Recommended) | Phase transition only writes audit log | ✓ |
| Auto-stub PhaseReport on transition | Every transition creates draft report | |
| Optional report in transition request | Combined in one endpoint | |

**User's choice:** Separate endpoint

### Q14: Cycle counter (×N badge) tracking
| Option | Description | Selected |
|--------|-------------|----------|
| Derived from audit_log (Recommended) | COUNT queries, no extra storage | ✓ |
| Separate phase_cycle_count column | Denormalized counter | |
| Frontend calculates | Client-side loop | |

**User's choice:** Derived from audit_log

---

## Phase ID Cross-Entity References

### Q15: Should node ID references be validated on create/update?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, validate (400 if invalid) (Recommended) | Check against project workflow.nodes | ✓ |
| No, accept free-form string | Trust client | |
| Optional flag config-driven | Env-based | |

**User's choice:** Yes, validate

### Q16: Workflow node deletion policy
| Option | Description | Selected |
|--------|-------------|----------|
| Block deletion if refs exist | Safe, user must clean up first | |
| Soft-delete (is_archived=true) (Recommended) | Preserve refs, render as gray | ✓ |
| Cascade nullify | Destructive | |

**User's choice:** Soft-delete

**Notes:** User initially unsure — asked "realiteye baktığımızda, bir proje başladıktan sonra modellerde köklü değişiklik oluyor mu da böyle bir seçenek ekleyleim. ne dersin?" — I provided the reality analysis (rare in real world) and proposed soft-delete as the middle ground between data preservation and user flexibility. User accepted.

### Q17: Node ID format
| Option | Description | Selected |
|--------|-------------|----------|
| nanoid 21 char URL-safe (Recommended) | 'nd_V1StGXR8_Z' | ✓ |
| UUID v4 (36 char) | Standard format | |
| Prefixed short numeric (nd_1/nd_2) | Prototype style | |

**User's choice:** nanoid

**Notes:** User added important clarification: "bu fazların bir adı da olmalı. agile scrum sprint gibi tekrarlı fazlarda kullanıcı 'Mart 2026 Sprint' girebilmeli ve asıl isim o gözükmeli frontendde." — captured as D-23 (separate node.id UUID vs node.name editable).

### Q18: Cross-project reference protection
| Option | Description | Selected |
|--------|-------------|----------|
| Validate project-local only (Recommended) | Task refers only to its project's workflow | ✓ |
| System-wide unique IDs | UUID collision-free | |
| No cross-project validation | Trust frontend | |

**User's choice:** Project-local (implicit — user confused, I explained, moved on as recommended default)

**Notes:** User asked "tam anlamadım ama uuid kullanıcaz zaten, bir görevin farklı phase e atanmasını mı kastediyorsun?" — I clarified: cross-project refers to a Task in Project A referencing a node in Project B (bug case, not normal phase-change). User accepted Recommended.

### Q19: Milestone.linked_phase_ids validation
| Option | Description | Selected |
|--------|-------------|----------|
| Per-ID validate + reject archived (Recommended) | Each ID checked | ✓ |
| Min one ID required, all active | Stricter | |
| No validation | Free-form | |

**User's choice:** Per-ID validate + reject archived

### Q20: PhaseReport uniqueness
| Option | Description | Selected |
|--------|-------------|----------|
| UNIQUE (project_id, phase_id, cycle_number) (Recommended) | Per-cycle report | ✓ (with revision addition) |
| UNIQUE (project_id, phase_id) | One report per phase | |
| No unique constraint | Free-form | |

**User's choice:** UNIQUE + added "revizyon numarası iterate etmeli"

**Notes:** User wanted both cycle_number (Spiral re-entries) AND revision (in-cycle edits). Captured as mutable record, revision auto-increments on PATCH.

### Q21: Node ID format (duplicate — refined)
Consolidated into Q17 answer above.

### Q22: Artifact.linked_phase_id nullability
| Option | Description | Selected |
|--------|-------------|----------|
| Nullable (Recommended) | Project-wide artifacts allowed | ✓ |
| Required | Every artifact bound to phase | |
| Methodology-based default | Waterfall required, others optional | |

**User's choice:** Nullable

---

## Artifact Auto-Seed Mechanism

### Q23: Default artifact list storage
| Option | Description | Selected |
|--------|-------------|----------|
| ProcessTemplate.default_artifacts JSON (Recommended) | Single source, admin editable | ✓ |
| Code constant Python module | Static dict | |
| Separate methodology_artifact_defaults table | Normalized | |

**User's choice:** ProcessTemplate JSON (after clarification)

**Notes:** User first answered "burası flex olmalı, hiç doküman olmayadabilir. bir sürü alakalı alakasız oladabilir" — needed re-ask after explaining what Artifact is (user also asked "artefaktlardan kastımız nedir"). I provided full explanation with examples (SRS, SDD, Product Backlog, etc.) + tasarım.md reference, then re-asked.

### Q24: Auto-seed timing
| Option | Description | Selected |
|--------|-------------|----------|
| CreateProjectUseCase same atomic tx (Recommended) | Single transaction | ✓ |
| Event-driven listener | ProjectCreated event | |
| Lazy (first artifact tab visit) | On-demand | |

**User's choice:** Atomic tx in CreateProjectUseCase

### Q25: Methodology change artifact handling
| Option | Description | Selected |
|--------|-------------|----------|
| No-op (Recommended) | Existing artifacts preserved | ✓ |
| Confirm dialog to re-seed | Optional | |
| Auto-merge | Silent | |

**User's choice:** No-op

### Q26: Custom workflow artifact seed
| Option | Description | Selected |
|--------|-------------|----------|
| Empty seed (Recommended) | User adds manually | ✓ |
| Last-selected ProcessTemplate defaults | Fallback | |
| User picks template in wizard | Extra step | |

**User's choice:** Empty seed

---

## Backend Infra Restructure

### Q27: dependencies.py split shape
| Option | Description | Selected |
|--------|-------------|----------|
| By-entity (deps/project.py, deps/task.py, ...) (Recommended) | Co-located entity deps | ✓ |
| By-layer (deps/repos.py, deps/services.py, deps/auth.py) | Grouped by type | |
| By-concern vertical slice | Feature-based | |

**User's choice:** By-entity

### Q28: process_config normalizer placement
| Option | Description | Selected |
|--------|-------------|----------|
| Domain entity pure method (Recommended) | Pydantic @model_validator | ✓ |
| Repository layer _to_entity | DB-coupled | |
| Application service | Separate class | |

**User's choice:** Domain entity pure method

### Q29: schema_version semantics
| Option | Description | Selected |
|--------|-------------|----------|
| Integer v1/v2 + on-read lazy (Recommended) | Migrator chain | ✓ |
| Semver with explicit migration | 1.0.0 / 1.1.0 | |
| No version, defensive read | Try/except everywhere | |

**User's choice:** Integer + lazy

### Q30: Alembic migration strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Single 005_phase9 with idempotent helpers (Recommended) | One file, one migration | ✓ |
| Entity-based split migrations | 005/006/007/... | |
| Two migrations: schema + seed | Separate concerns | |

**User's choice:** Single migration

---

## Milestone/Artifact/PhaseReport Permissions

### Q31: Milestone CRUD permissions
| Option | Description | Selected |
|--------|-------------|----------|
| GET all, POST/PATCH/DELETE Admin+PM+TL (Recommended) | Tiered access | ✓ |
| GET/POST/PATCH/DELETE Admin+PM+TL | Hidden from members | |
| All members full CRUD | Maximum flexibility | |

**User's choice:** Tiered (Recommended)

### Q32: Artifact CRUD permissions
| Option | Description | Selected |
|--------|-------------|----------|
| GET all, POST/DELETE Admin+PM+TL, PATCH +assignee (Recommended) | Assignee can update own | ✓ |
| GET all, POST/PATCH/DELETE Admin+PM+TL | Full management only | |
| GET all, POST/PATCH members, DELETE Admin+PM+TL | Looser create | |

**User's choice:** With assignee PATCH

### Q33: PhaseReport CRUD permissions
| Option | Description | Selected |
|--------|-------------|----------|
| GET all, POST/PATCH/DELETE Admin+PM+TL (Recommended) | Management docs | ✓ |
| GET all, POST/PATCH author-based | report_author field | |
| All members CRUD | Open | |

**User's choice:** Management-only

---

## JSON vs Relational Storage

### Q34: Milestone.linked_phase_ids storage
| Option | Description | Selected |
|--------|-------------|----------|
| JSONB column (Recommended) | Array of strings, GIN index | ✓ |
| milestone_phases junction table | Normalized | |
| Single nullable FK | Simplify model | |

**User's choice:** JSONB

### Q35: PhaseReport.summary field storage
| Option | Description | Selected |
|--------|-------------|----------|
| Explicit SQL columns (Recommended) | 4 integer cols | ✓ |
| summary JSONB | Single col | |
| phase_report_metrics junction table | Over-normalized | |

**User's choice:** Explicit columns

### Q36: PhaseReport.completed_tasks_notes storage
| Option | Description | Selected |
|--------|-------------|----------|
| JSONB column (Recommended) | Report-local metadata | ✓ |
| phase_report_task_notes table | Queryable | |

**User's choice:** JSONB

### Q37: Artifact file attachment
| Option | Description | Selected |
|--------|-------------|----------|
| Existing File entity FK (Recommended) | Reuse v1.0 files table | ✓ |
| file_url string column | Path-based | |
| Many-to-many files | Multi-file support | |

**User's choice:** Existing File FK

---

## Methodology Cleanup

### Q38: Project.methodology approach
| Option | Description | Selected |
|--------|-------------|----------|
| Drop, use ProcessTemplate FK (Recommended) | Single source of truth | ✓ |
| Expand enum + CUSTOM | 10 values | |
| Hybrid: new uses FK, old methodology read-only | Dual path | |

**User's choice:** Drop field + ProcessTemplate FK

**Notes:** User: "project methodolojy fieldı yeni method agnostic düzende çok anlamlı değil gibi, ne yapabiliriz?" — I laid out the three options with full impact analysis, user picked the cleanest.

### Q39: Apply-to-projects permission model
| Option | Description | Selected |
|--------|-------------|----------|
| Admin initiates + PM approval optional (Recommended) | Two-mode | ✓ |
| Admin only no approval | Fast | |
| Defer to future phase | Scope reduction | |

**User's choice:** Admin + optional PM approval (with Phase Gate handling)

**Notes:** User explicit: "TABİKİ PHASE GATE HANDLING YAPILARAK" — per-project advisory lock during apply.

### Q40: ProcessTemplate fields to add
| Option | Description | Selected |
|--------|-------------|----------|
| default_artifacts + default_phase_criteria + default_workflow JSON (Recommended) | Full template | ✓ |
| default_artifacts + default_workflow only | Criteria project-level | |
| default_workflow only | Minimal template | |

**User's choice:** All three JSONs

### Q41: methodology migration strategy
| Option | Description | Selected |
|--------|-------------|----------|
| 005 adds FK + backfill, 006 drops methodology (Recommended) | Two-step safe | ✓ |
| Single migration add+drop+backfill | Atomic | |
| Add FK only, deprecate methodology indefinitely | Dual permanent | |

**User's choice:** Two-step

---

## Activity + User Profile API

### Q42: Activity filter semantics
| Option | Description | Selected |
|--------|-------------|----------|
| type[], user_id, date_from/to, limit, offset (Recommended) | Expressive | ✓ |
| Just limit/offset, client-side filter | Simple | |
| Type + cursor pagination | No total | |

**User's choice:** Expressive filters

### Q43: Activity denormalization
| Option | Description | Selected |
|--------|-------------|----------|
| Backend JOINs user/entity details (Recommended) | Rich response | ✓ |
| ID-only, frontend N+1 | Minimal payload | |
| Hybrid ?include= param | Configurable | |

**User's choice:** Backend JOINs

### Q44: User summary aggregation strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Parallel SQL in single endpoint (Recommended) | asyncio.gather 3 queries | ✓ |
| Multiple small endpoints | Reusable | |
| Materialize view caching | Premature opt | |

**User's choice:** Parallel SQL

### Q45: User profile project inclusion
| Option | Description | Selected |
|--------|-------------|----------|
| Active+completed, archive hidden (Recommended) | Default filter | ✓ |
| All projects including archive | Full history | |
| Only projects with active tasks | Narrow | |

**User's choice:** Active+completed

---

## Rate Limiting + Idempotency

### Q46: Rate limit and idempotency strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Phase Gate 10s + idempotency key, PDF 30s (Recommended) | Tailored | ✓ |
| No rate limits, API-wide only | Minimal | |
| Only idempotency, no rate limit | Retry safety only | |
| With Redis store | Persistent | |
| None | Bare minimum | |

**User's choice:** Tailored (after clarification)

**Notes:** User first said "tam anlamadım detaylandır lütfen" — I provided detailed explanation of rate limiting vs idempotency with concrete examples (double-click scenario for rate limit, network retry for idempotency). User picked the full option.

---

## Workflow JSON Validation

### Q47: Workflow schema validation strictness
| Option | Description | Selected |
|--------|-------------|----------|
| Pydantic nested models (Recommended) | Full schema + Literal enums | ✓ |
| Top-level type check only | Loose | |
| JSON schema file + jsonschema library | Separate validator | |

**User's choice:** Pydantic nested models

---

## Task Parent-Child Inheritance

### Q48: Phase inheritance semantics
| Option | Description | Selected |
|--------|-------------|----------|
| Free: each task independent (Recommended) | No inheritance | ✓ |
| Child inherits parent default | Override allowed | |
| Child MUST match parent | Strict | |

**User's choice:** Free (no inheritance)

---

## PDF Export

### Q49: PDF library and template approach
| Option | Description | Selected |
|--------|-------------|----------|
| fpdf2 + programmatic + sync (Recommended) | Pure Python | ✓ |
| WeasyPrint + Jinja2 HTML | HTML→PDF | |
| reportlab + XML template | Feature-rich | |

**User's choice:** fpdf2 programmatic

---

## Claude's Discretion

Explicitly deferred to plan/execute phase — Claude decides with documented rationale in PLAN.md:

- Enum placement (per-entity files vs shared module)
- DTO naming conventions (CreateDTO/UpdateDTO/ResponseDTO + field naming)
- Testing strategy (unit + integration mix, fixtures)
- Error code taxonomy (custom codes beyond HTTP status)
- Deployment/migration coordination notes
- Logging/observability additions

---

## Deferred Ideas (out of Phase 9 scope)

- v3.0 ADV-04 Redis for idempotency cache
- v3.0 ADV-06 Isolated test database (pre-existing v1.0 blocker)
- Multi-file artifact attachments
- Async PDF job queue
- Template apply-to-projects approval UI (frontend in later phase)
- Drop Project.methodology column (deferred to 006 migration, after Phase 10+)

---

*Log generated: 2026-04-21*

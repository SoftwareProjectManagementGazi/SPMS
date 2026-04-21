---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Frontend Overhaul & Backend Expansion
status: executing
stopped_at: Completed 10-01-PLAN.md
last_updated: "2026-04-21T19:04:14.741Z"
last_activity: 2026-04-21
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 24
  completed_plans: 15
  percent: 63
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Ekiplerin farklI proje yonetim metodolojilerine uygun sekilde projelerini ve gorevlerini tek platformda takip edebilmesi.
**Current focus:** Phase 10 — shell-pages-project-features

## Current Position

Phase: 10 (shell-pages-project-features) — EXECUTING
Plan: 2 of 10
Status: Ready to execute
Last activity: 2026-04-21

Progress: [██████░░░░] 63%

## Performance Metrics

**Velocity:**

- Total plans completed: 14 (v2.0) / 43 (v1.0 lifetime)
- Average duration: 7 min (v2.0)
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total   | Avg/Plan |
|-------|-------|---------|----------|
| 08    | 4     | 28 min  | 7 min    |
| 09 | 10 | - | - |

**Recent Trend:**

- Last 5 plans: 08-01 (6 min, 2 tasks, 9 files), 08-02 (2 min, 2 tasks, 8 files), 08-03 (3 min, 2 tasks, 9 files), 08-04 (17 min, 3 tasks incl. blocking checkpoint, 12 files)
- Trend: Phase 8 complete; 08-04 took longer than the rest because Task 3 is a blocking human-verify checkpoint with a post-checkpoint fix round

*Updated after each plan completion*
| Phase 08 P02 | 2min  | 2 tasks | 8 files  |
| Phase 08 P03 | 3min  | 2 tasks | 9 files  |
| Phase 08 P04 | 17min | 3 tasks | 12 files |
| Phase 09 P01 | 5min  | 2 tasks | 4 files  |
| Phase 09 P02 | 5 | 2 tasks | 23 files |
| Phase 09 P03 | 4 | 2 tasks | 11 files |
| Phase 09 P04 | 7 | 2 tasks | 22 files |
| Phase 09 P05 | 7min | 2 tasks | 11 files |
| Phase 09 P06 | 6 | 2 tasks | 15 files |
| Phase 09 P07 | 12 | 2 tasks | 16 files |
| Phase 09 P08 | 7 | 2 tasks | 13 files |
| Phase 09 P09 | 8min | 2 tasks | 21 files |
| Phase 09 P10 | 6min | 2 tasks | 14 files |
| Phase 10-shell-pages-project-features P01 | 5 | 3 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
v1.0 decisions carried forward -- see PROJECT.md for full history.

Key constraints for v2.0:

- [v2.0]: Tasarim freeze -- donusum sirasinda gorsel degisiklik yok
- [v2.0]: UI-Tasarim-Backend.md aynen kodlanmayacak -- kapsamli tasarim review sonrasi
- [v2.0]: Frontend/ DOKUNULMAZ -- hicbir sey kopyalanmaz, degistirilmez, referans alinmaz
- [v2.0]: Frontend2/ sifirdan insa edilir -- New_Frontend/ prototipi baz alinir
- [v2.0]: shadcn/ui KULLANILMAZ -- tum UI %100 prototipe birebir sadik kalir
- [v2.0]: Tum frontend fazlari bitince Frontend2/ -> Frontend olarak yeniden adlandirilir, eski silinir
- [v2.0]: 16 UI eksiklik prototype design system'a sadik kalarak entegre edilecek
- [08-01]: Prototype CSS token names used directly (no shadcn --background/--card/--foreground mapping) per D-02
- [08-01]: create-next-app scaffolded with lowercase 'frontend2', then renamed to 'Frontend2' (npm name restriction); on-disk folder matches CONTEXT.md
- [08-01]: Tailwind v4 @custom-variant dark used to target [data-mode="dark"] for dark mode
- [08-01]: next/font Inter + Geist_Mono exposed as --font-sans / --font-mono CSS variables via body className
- [08-01]: Theme runtime module (lib/theme.ts) guards applyTokens/applyMode/applyRadius with `typeof document` for SSR import safety
- [08-01]: Local git identity supplied via `git -c user.*` per commit (GSD rule prohibits `git config --global`)
- [08-02]: AvatarStackUser extends AvatarUser with an explicit id field so TS consumers get a precise error on missing keys (prototype used u.id implicitly)
- [08-02]: cn() applied only to Kbd where .mono utility merges with caller className; other primitives are style-driven and accept className directly without tailwind-merge overhead
- [08-02]: Tone/size maps hoisted to module scope as Record<Union,...> constants so they allocate once per module load rather than per render
- [08-02]: Badge color-mix(in oklch,...) and Button inset-shadow tokens retained as inline style -- not lowered to Tailwind arbitrary values per CONVERSION RULE 8
- [08-03]: PriorityChip token bridge -- level='medium' maps to --priority-med at token level while public API keeps 'medium' string (prototype CSS uses shortened name)
- [08-03]: StatusDot uses direct var(--status-${status}) substitution instead of prototype's nested ternary since every union value is a legal token suffix (simpler + adds new statuses with zero body changes)
- [08-03]: AlertBanner TONE_VARS hoisted to module-level Record<AlertTone,string> for once-per-module allocation; defensive fallback retained for runtime JS callers outside the union
- [08-03]: Barrel index.ts uses explicit export { X } from ./x and export type { ... } for every primitive so consumers import components and their type unions symmetrically from @/components/primitives
- [08-03]: Collapsible guards optional badge with badge != null (not truthy) so numeric 0 still renders -- matches prototype semantics where 0 is a legal count
- [08-04]: Next.js route group (shell) in app/(shell)/layout.tsx wraps every authenticated page with AppShell without adding /shell/ to URLs; placeholder pages under the group are server components (no use client, no hooks) so they tree-shake cleanly
- [08-04]: Single source of collapse control -- only the Header renders a sidebar-toggle button; Sidebar reads sidebarCollapsed from useApp() but never writes to it. Removed the prototype's duplicate footer collapse button per user checkpoint feedback
- [08-04]: Phase-8 header shows only wired controls (sidebar toggle, search Input, Moon/Sun theme, TR/EN language). Create/Notifications/Help buttons from the prototype are deferred to the phases that introduce their handlers (Create -> Phase 10 project-create wizard, Notifications -> later phase, Help -> later phase) -- avoids rendering inert buttons that look interactive in Next.js
- [08-04]: Breadcrumb parts derived from usePathname() via a small switch over known routes instead of a route-metadata convention; unknown routes fall back to capitalizing the first segment. Non-last parts render as next/link so clicking navigates without full reload
- [08-04]: SidebarUserMenu click-outside dismiss uses a document 'mousedown' listener attached inside a React.useEffect with open as dep (exact prototype pattern from shell.jsx lines 104-107)
- [08-04]: Root app/page.tsx uses next/navigation redirect() to send / -> /dashboard so the bare domain always lands on the canonical authenticated landing page
- [09-01]: extra_metadata Python attribute maps to DB column 'metadata' via Column("metadata", JSONB) alias trick — avoids SQLAlchemy Base.metadata reserved name clash (Pitfall 7)
- [09-01]: projects.methodology NOT dropped in migration 005 — deferred to 006 per D-45 for safe rollback window after Phase 10+ frontend switches to process_template_id
- [09-01]: All migration 005 integration tests skip gracefully when DB not migrated via alembic upgrade head (conftest uses create_all not Alembic — Pitfall 1 documented)
- [09-01]: _index_exists() added as new idempotent helper using pg_indexes WHERE schemaname='public' — consistent with existing _table_exists/_column_exists pattern
- [09-02] dependencies.py split by-entity into deps/ sub-modules; identity-preserving shim at old location preserves all legacy import paths (D-31 / BACK-07)
- [09-02] auth.py cross-imports get_user_repo from deps.user (get_current_user needs it); milestone/artifact/phase_report are empty stubs for plans 09-05/06/07
- EmailStr rejects .local TLD — use @testexample.com for test-generated emails in factories and fixtures
- authenticated_client fixture uses module-level app import (not fixture param) consistent with existing client fixture pattern
- ProjectStatus enum co-located in project.py (follows existing pattern: Methodology in project.py, TaskPriority in task.py)
- Normalizer dual-input: @model_validator(mode='before') handles dict and SQLAlchemy ORM object via __table__ attribute check (Pitfall 5 resolved)
- Team.leader_id is organizational (D-13), NOT project-level — project scope via TeamProjects JOIN in user_leads_any_team_on_project
- require_project_transition_authority wired in deps/auth.py + re-exported from dependencies.py shim for backward compat
- MilestoneStatus enum co-located in milestone.py per Claude's Discretion (follows project convention)
- linked_phase_ids dedupe uses list(dict.fromkeys(...)) — preserves insertion order, O(n) time
- Validation split: format regex in DTO @field_validator, existence check in use case (requires project lookup)
- Integration tests use db_session fixture (not async_session); skip when migration 005 not applied
- Split-by-role DTO strategy: ArtifactUpdateByAssigneeDTO excludes assignee_id at field level (first defense); use case PermissionError check is second defense (D-36 / T-09-06-01)
- ArtifactSeeder integrated into CreateProjectUseCase with artifact_repo=None default for backward compat; seeder failure rolls back Project atomically (D-28)
- D-29 methodology-change no-op on artifacts: seeder only runs on CREATE, not PATCH — documented to prevent Phase 10-12 cascade-on-template-change additions
- cycle_number auto-calc rule: count(audit_log WHERE action='phase_transition' AND entity_id=project_id AND extra_metadata->>'source_phase_id'=phase_id) + 1, unless explicit override in DTO (D-25)
- revision auto-increment: PATCH always does existing.revision += 1; UpdateDTO omits revision field (T-09-07-01 tamper mitigation)
- PDF font fallback: macOS Arial Unicode -> Linux DejaVu -> Windows ArialUni -> Helvetica with _safe() Latin-1 encoding guard (no crash, degraded diacritics visual on Helvetica)
- multi_cell uses pdf.epw not 0 — fpdf2 2.8.7 raises FPDFException with w=0 at small font sizes
- Error code taxonomy: error_code key added alongside HTTP status in detail body (e.g. {error_code: PHASE_GATE_LOCKED}). Carry forward to Phase 10-13 for all domain exception translations.
- Rate-limit + idempotency order: check_rate_limit -> lookup -> record_request -> use case -> store. Double-click returns cached response without consuming rate quota.
- Advisory lock semantics: pg_try_advisory_xact_lock non-blocking; auto-releases on tx commit/rollback. D-10 single-atomic-session satisfied by FastAPI session lifecycle.
- Integration test raw SQL uses bindparams (CAST(:pc AS jsonb)) not f-string JSON embedding to avoid text() colon-parse error with JSONB literals.
- type[] query alias: FastAPI Query(default=None, alias='type[]') for multi-value activity feed filter (D-46)
- asyncio.gather 3-query parallelism in GetUserSummaryUseCase; default return_exceptions=False accepted for v2.0 (D-48/T-09-09-08)
- PATCH /teams/{id}/leader sub-path avoids conflict with future PATCH /teams/{id} general update
- user_summary no own-profile gate in v2.0 (T-09-09-02 accepted); hardening deferred
- Inline RPTA authorization: POST endpoints with body project_id use _authorize_transition inline helper (4-line) instead of require_project_transition_authority Depends() — avoids path-param DI mismatch. Refactor candidate Phase 10+
- Artifact PATCH split URLs: /artifacts/{id}/mine (assignee) vs /artifacts/{id} (manager). URL encodes permission scope. Frontend selects based on user.id == artifact.assignee_id
- PDF rate limit isolation: _pdf_last_request dict in phase_reports.py separate from idempotency_cache. 30s per-user window per D-51
- AUTH_TOKEN_KEY='auth_token' matches legacy Frontend/lib/constants.ts exactly (D-02)
- AuthProvider placed INSIDE AppProvider in root layout — auth context available to all app contexts
- test_activity.py stub at integration root level (not api/ subdirectory) — Nyquist file existence check satisfied

### Pending Todos

None.

### Blockers/Concerns

- Note: tests/integration/conftest.py uses main spms_db directly (not a test DB) -- DB must be running before integration tests

## Deferred Items

Carried from v1.0:

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 04: 04-VERIFICATION.md | human_needed (UI overhaul will address) |
| verification | Phase 06: 06-VERIFICATION.md | human_needed (UI overhaul will address) |

## Session Continuity

Last session: 2026-04-21T19:04:14.734Z
Stopped at: Completed 10-01-PLAN.md
Resume file: None

**Next Phase:** 10 (Shell Pages & Project Features) — ready to plan

---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Frontend Overhaul & Backend Expansion
current_phase: 12
status: executing
stopped_at: Phase 12 Plan 12-05 complete
last_updated: "2026-04-25T14:35:00.000Z"
last_activity: 2026-04-25 -- Phase 12 Plan 12-05 complete (LIFE-05 MilestonesSubTab CRUD + chip picker + ConfirmDialog + Timeline Gantt vertical flag-line layer + popover)
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 44
  completed_plans: 39
  percent: 89
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Ekiplerin farklI proje yonetim metodolojilerine uygun sekilde projelerini ve gorevlerini tek platformda takip edebilmesi.
**Current focus:** Phase 12 — lifecycle-phase-gate-workflow-editor

## Current Position

Phase: 12 (lifecycle-phase-gate-workflow-editor) — EXECUTING
Plan: 6 of 10 (12-05 complete)
Status: Executing Phase 12
Last activity: 2026-04-25 -- Phase 12 Plan 12-05 complete

Progress: [█████████░] 89%

## Performance Metrics

**Velocity:**

- Total plans completed: 34 (v2.0) / 43 (v1.0 lifetime)
- Average duration: 7 min (v2.0)
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total   | Avg/Plan |
|-------|-------|---------|----------|
| 08    | 4     | 28 min  | 7 min    |
| 09 | 10 | - | - |
| 10 | 10 | - | - |
| 11 | 10 | - | - |

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
| Phase 10-shell-pages-project-features P02 | 4min | 2 tasks | 6 files |
| Phase 10-shell-pages-project-features P03 | 262 | 2 tasks | 10 files |
| Phase 10-shell-pages-project-features P04 | 166 | 2 tasks | 5 files |
| Phase 10-shell-pages-project-features P05 | 171 | 2 tasks | 6 files |
| Phase 10-shell-pages-project-features P06 | 169 | 2 tasks | 1 files |
| Phase 10 P07 | 112 | 1 tasks | 1 files |
| Phase 10-shell-pages-project-features P08 | 2 | 1 tasks | 2 files |
| Phase 10-shell-pages-project-features P09 | 60 | 2 tasks | 12 files |
| Phase 10-shell-pages-project-features P10 | 8 | 1 task  | 1 file   |
| Phase 11 P01 | 16min | 3 tasks | 26 files |
| Phase Phase 11 P02 P9 | 2 | 8 tasks | - files |
| Phase Phase 11 PP03 | 6 | 2 tasks tasks | 10 files files |
| Phase Phase 11 P04 P4 | 32min | 2 tasks tasks | 14 files files |
| Phase Phase 11 PP05 | 6min | 2 tasks tasks | 11 files files |
| Phase 11 P08 | 8min | 2 tasks | 11 files |
| Phase 11 P06 | 5min | 1 tasks | 7 files |
| Phase Phase 11 PP09 | 8 | 2 tasks | 8 files |
| Phase 11 P07 | 15 min | 2 tasks | 7 files |
| Phase 11 P10 | 8min | 2 tasks | 13 files |
| Phase 12 P01 | 18min | 3 tasks | 47 files |
| Phase 12 P02 | 12min | 2 tasks | 8 files  |
| Phase 12 P03 | 6min  | 2 tasks | 6 files  |
| Phase 12 P04 | 9min  | 2 tasks | 8 files  |
| Phase 12 P05 | 8min  | 2 tasks | 7 files  |

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
- [10-02] GET /activity placed before /projects/{project_id}/activity in router — global route registered first, no ambiguity since project route uses /projects/ prefix
- [10-02] seed_teams() adds one team per project; leader_id = manager user (deterministic) — ensures require_project_transition_authority checks work in Phase 10 UI
- [10-02] MilestoneModel uses name + target_date fields (not title/due_date as plan suggested) — adapted to actual BACK-04 model schema
- Middleware matcher uses real URL paths — (shell) route group name is invisible in URLs (Pitfall 1)
- QueryClient at module scope in shell layout — prevents cache recreation on ShellLayout re-render (Pitfall 2)
- getTaskStats derives open/in_progress/done counts client-side from GET /tasks — no dedicated stats endpoint needed for D-26
- Input primitive extended with required/disabled/name/id/autoComplete props (Rule 2 fix — form validation correctness)
- StatCard TONE_BG uses transparent not var(--surface) — matches prototype color-mix with transparent exactly
- PortfolioTable team column renders empty AvatarStack — Project shape lacks member list; Phase 11 project detail will populate it
- ActivityFeed normalizes both {items:[]} and [] backend response shapes via useMemo in dashboard page
- SegmentedControl options use id not value — SegmentedOption interface uses {id,label}; STATUS_SEGMENTS adapted with id field as filter value
- ToastProvider placed inside QueryClientProvider outside AppShell — toast available to all shell pages including modal/overlay layers
- Both AppearanceSection and NotificationsSection implemented fully in Task 1 (not as stubs) — avoids two-pass edit cycle; all Task 2 acceptance criteria met in single commit
- Inline SVG icons for settings tab sidebar — avoids unestablished icons/ module import path in Frontend2
- LabeledField uses controlled inputs (value+onChange) not uncontrolled (defaultValue) — required for profile pre-population from useAuth().user
- Güvenlik tab omits 2FA and sessions — D-32 scope limit strictly respected
- Project key client enforcement: uppercase alphanumeric max 8 chars in wizard (T-10-07-01)
- Step 3 lifecycle preview: read-only chip arrows — no WorkflowCanvas until Phase 12
- methodology enum mapped from template name (scrum→SCRUM, etc.) for POST /projects until migration 006 drops the field
- ArchiveBanner owns its own ConfirmDialog state — keeps reactivation flow self-contained; page only passes projectId + projectName
- isArchived boolean derived live from project.status (not local state) — TanStack Query invalidation auto-re-enables buttons after reactivation
- NaN guard for [id] route: Number(params.id) returns NaN for non-numeric params; enabled: !!projectId in useProject prevents API call (T-10-08-02)
- [11-01] TaskModalProvider lives in shell layout (not root) — needs QueryClient/Toast/Auth contexts and must NOT mount on auth-free routes (RESEARCH Provider Tree Ordering)
- [11-01] lib/methodology-matrix.ts is the single source of truth for BACKLOG_DEFINITION_BY_METHODOLOGY, CYCLE_LABEL_BY_METHODOLOGY, and CYCLE_FIELD_ENABLED_IN_PHASE_11 — downstream plans must NOT duplicate these tables
- [11-01] resolveBacklogFilter returns the Axios params object directly (cycle_id:null, status:leftmost, phase_id:null, in_backlog:true) so callers spread it into apiClient.get params
- [11-01] resolveCycleLabel returns null to signal the entire cycle row is hidden (Kanban); empty/whitespace overrides fall back to methodology default
- [11-01] Backend _migrate_v0_to_v1 adds backlog_definition and cycle_label via setdefault — idempotent, preserves attacker- or user-set values (T-11-01-01 Tampering mitigation)
- [11-01] @testing-library/react bumped 16.0.0→16.3.2 for React 19 peer; @playwright/test bumped 1.45.0→1.51.1 for next@16.2.4 peerOptional (Rule 3 blocking-issue auto-fixes)
- [11-01] vitest 1.6 + jsdom 24 on Windows/Node 25 returns an empty window.localStorage object (no methods); test/setup.ts shim now checks method presence, not just object identity, and installs a full LocalStorage + sessionStorage replacement with getItem/setItem/removeItem/clear/key/length
- [11-01] vitest.config.ts sets environmentOptions.jsdom.url='http://localhost/' so origin is non-opaque (avoids SecurityError on localStorage access)
- [11-01] useUpdateTask (properties sidebar inline edit) and useMoveTask (board DnD) both implement cancelQueries → setQueryData → rollback → invalidate pattern for optimistic UX (D-38)
- [11-01] labelService.create catches 409 Conflict, re-fetches project labels, and returns the matching existing label (Pitfall 7 auto-create race mitigation)
- [11-02] TaskCreateModal mounted inside TaskModalProvider as sibling of children; single overlay for all (shell) routes — no duplicate mounts (D-01)
- [11-02] Role gate uses case-insensitive compare plus project_manager snake_case spelling to tolerate backend casing drift — T-11-02-01 defense-in-depth; backend still enforces
- [11-02] Collapsible primitive exposes defaultOpen + internal state (plan's open/onToggle draft API does not exist); Recurring section uses defaultOpen={false} with inner Toggle to gate freq/end controls
- [11-02] Assignee dropdown ships project manager + current user only (documented stub); real per-project member picker lands in Plan 11-04 per D-32
- [11-02] Cycle select ships empty options for Scrum in Phase 11; /api/v1/sprints wiring deferred to Plan 11-05 per D-44 — Cycle field hidden for Kanban/Waterfall (D-45), disabled w/ helper for Iterative/Incremental/Evolutionary/RAD (D-44)
- [11-02] Toast API: plan's showToast standalone import does not exist; codebase exports useToast() hook returning { showToast } — used the real hook
- [11-03] Inline membership check for POST /labels (not Depends(get_project_member)) — body-scoped project_id uses IProjectRepository.get_by_id_and_user + _is_admin bypass (T-11-03-01 IDOR mitigation, board_columns pattern)
- [11-03] labels router prefix=/api/v1 (not /api/v1/labels) — single APIRouter mounts /projects/{id}/labels AND /labels; narrower prefix would double-prefix one route
- [11-03] AST-based DIP test (ast.walk for Import/ImportFrom) replaces source-grep approach — docstrings mentioning 'SQLAlchemy' no longer trigger false-positive CLAUDE.md §4.2 violations; canonical for future app-layer modules
- [11-03] usage_count denormalized via task_labels LEFT JOIN + COUNT subquery in list_by_project only; get_by_name_in_project returns usage_count=0 (uniqueness check callers don't need stats)
- [11-04] ProjectDetailContext exposes searchQuery/densityMode/phaseFilter for downstream Board toolbar + List filter consumers (RESEARCH §640-670) — throws outside ProjectDetailProvider matching useApp/useAuth/useTaskModal pattern
- [11-04] Density mode persists per-project in spms.board.density.{projectId} localStorage per D-21 — ProjectDetailProvider owns the read/write in its React.useCallback setter
- [11-04] SettingsTab lazy-imports via React.lazy + Suspense — users who never click Ayarlar skip the 4-sub-tab bundle cost
- [11-04] Rule 2 fix — Backend UpdateColumnDTO + UpdateColumnUseCase extended with optional wip_limit so Kolonlar sub-tab WIP edits actually persist (was silently dropped by Pydantic default extra=ignore before this plan)
- [11-04] Native input/textarea + onBlur replaced a failed setTimeout-debounce approach — the debounce leaked timers across multiple vitest renders and OOM'd the worker. Rule 3 scope boundary: Input primitive not forked in this plan, extended to forward onBlur in a follow-up
- [11-04] Stable-string dep pattern for useEffect sync off useQuery arrays: serialize the data shape (id:name:value | ...) and dep on the string, not the array reference — avoids OOM from fresh-reference loops
- [11-05] D-20 Warn+Allow authoritative: handleBoardDragEnd returns moved:true + wipExceeded:true when over limit — drop ALWAYS commits, UI shows banner+toast; roadmap criterion 5 'prevents dropping' superseded
- [11-05] BoardCard priority token bridge: left-border uses same 'medium' → 'med' CSS var mapping that PriorityChip established (priorityTokenVar helper)
- [11-05] Scrum-gated useQuery for /sprints — non-Scrum methodologies never fetch, keeping toolbar API cost zero
- [11-05] Column grouping fallback: unmatched task.status lands in first column (not hidden) — protects against backend column-name drift mid-migration
- [11-08] InlineEdit generic wrapper uses its own centralized useMutation (single-task cache key ['tasks', taskId]) rather than reusing useUpdateTask from 11-01 — keeps optimistic cache write / rollback / invalidation co-located with the component that does the rendering
- [11-08] TipTap SSR pattern is belt-and-suspenders: next/dynamic({ssr:false}) at the call site AND immediatelyRender:false on useEditor — required per RESEARCH Pitfall 2, omitting either produces Next.js hydration errors
- [11-08] spms.description.mode hydration pattern: useState defaults to 'plain' + useEffect([]) upgrades to localStorage value — prevents hydration mismatch between SSR ('plain') and client hydration (stored value)
- [11-08] WatcherToggle initial state placeholder: backend has no per-user is_watching flag on Task DTO in Phase 11; page seeds false and local onChange callback syncs after POST/DELETE succeeds — session-accurate, documented for 11-09 follow-up
- [11-08] StarterKit v3 bundles underline + link + all 24 internal extensions (verified in installed package.json dependencies) — no separate @tiptap/extension-underline or extension-link npm install required
- [11-06] ProjectDnDProvider lifted from BoardTab to ProjectDetailShell — Backlog + Board now share one DnD context; cross-container drop (backlog row → board column) works via BACKLOG_COLUMN_ID='__backlog__' sentinel in useDraggable data + shared onTaskDropped handler at shell level
- [11-06] useBacklogOpenState exposes open (user intent, persisted) AND effectiveOpen (computed visibility, narrow=false) split — narrow viewport <1280px auto-closes via effectiveOpen but preserves open so growing the viewport re-opens without another click (D-54)
- [11-06] Cross-container invalidation at shell level: useMoveTask.onSettled invalidates ['tasks','project',id] but backlog uses sibling key ['tasks','backlog',id,filter] that must be invalidated separately. Shell handleDropped issues qc.invalidateQueries({queryKey:['tasks','backlog',project.id]}) unconditionally on every drop (idempotent)
- [11-06] D-15 bulk-ops regression guards via node:fs source read in vitest — backlog-panel.test.tsx reads backlog-panel.tsx + backlog-task-row.tsx via fs.readFileSync and asserts bulkSelect|bulk-action|selectAll|Toplu işlem markers absent. Future developer adding bulk UI trips the test locally before PR
- [11-09] audit-formatter is a pure (no-React) module in Frontend2/lib — unit-testable with 8 vitest cases; exports formatAuditEntry + relativeTime
- [11-09] CommentsSection strips HTML on render via /<[^>]*>/g + whiteSpace:pre-wrap — T-11-09-01 XSS mitigation; DOMPurify is the documented future upgrade path
- [11-09] DependenciesSection offers 2 directions (blocks/blocked_by) not 3 — backend ListDependenciesUseCase groups by edge direction only; relates_to row would never round-trip through the list endpoint
- [11-09] taskService.addDependency sends {type} but backend DTO expects {dependency_type} — Plan 01 service bug; works today only because we always pass the default value 'blocks'. Logged in deferred-items.md; fix required before any non-default dependency_type is sent
- [11-09] Task Detail projectMembers sourced from project.managerId only — Phase 11 has no GET /projects/{id}/members; audit-formatter degrades to 'Bilinmeyen kullanıcı' for unresolved user_ids
- Custom SVG Gantt chosen over wx-react-gantt (GPLv3) and all other candidates (stale React-18 peers) for license safety + React 19 native compatibility + 0 KB bundle add (Plan 11-07 D-27)
- Calendar Ctrl+wheel scroll-zoom clamped [60, 160] px with 300 ms debounced localStorage persistence (spms.calendar.zoom.{projectId}) — Outlook pattern, Pitfall 5 mitigation (Plan 11-07 D-30)
- List/Timeline/Calendar share the same useTasks(project.id) query as Board — single fetch dedupes across tabs via TanStack Query cache keys (Plan 11-07)
- [11-10] MyTasksExperience componentized per D-32 (6 files in components/my-tasks/ + smartSort/dueBucket/useMyTasksStore in lib+hooks); /my-tasks and Dashboard Member view both compose the same component via props, no duplicated logic
- [11-10] SearchAutocomplete inlines a styled raw input rather than forking the Input primitive — tokens mirror the primitive's look while exposing ref + onFocus/onBlur/onKeyDown which the primitive does not forward. Decision keeps Input stable for all existing callers
- [11-10] D-54 responsive via CSS classes in globals.css (.task-detail-grid collapses to 1fr at ≤1024px; .pd-tabs-wrap uses overflow-x:auto with hidden scrollbar at ≤1024px). Pure CSS — no useMediaQuery, no hydration mismatch risk
- [11-10] E2E specs ship with defensive skip-guards — both specs are playwright --list-visible today but skip gracefully when auth/seed data unavailable. Phase 11 does not include e2e test-DB seeding; follow-up plan will remove the guards once a seeder lands
- [12-01] @xyflow/react pinned to exact 12.10.2 (no caret) per RESEARCH RESOLVED Q2 — caret-range later upgrades silently risk Pitfall 1/2 reintroduction
- [12-01] Convex-hull-plus-padding baseline shipped per UI-SPEC line 1262; concaveman + d3-shape NOT installed (saved ~50 KB transitive dep). Smoothing implemented inline via quadratic-bezier midpoint emit (~10 LOC in cloud-hull.ts)
- [12-01] Bench files (graph-traversal.bench.ts + cloud-hull.bench.ts) excluded from `npm test` include pattern — vitest's `bench()` API is mode-gated. expect.toBeLessThan backstops remain in source for grep acceptance and run via `npx vitest bench --run`. Measured: BFS 100-node mean 0.023 ms (>2000× headroom under 50 ms budget); cloud-hull 50-node mean 0.038 ms (>400× headroom under 16 ms budget)
- [12-01] use-editor-history is ref-mirrored — undo/redo callers need synchronous return values. React 19 StrictMode double-invoke broke the original setPast(callback-with-side-effect) approach. Replaced with single useRef + setVersion bumper so callbacks stay pure
- [12-01] Idempotency-Key REQUIRED positional parameter on phase-gate-service.execute (T-09-08 mitigation, no default) — every call site is visible in code review
- [12-01] use-transition-authority returns false while ledTeams is undefined (Pitfall 17) — backend re-checks every action so transient false is safe; consumed by Phase Gate / Milestone POST/PATCH/DELETE / Artifact POST/DELETE / PhaseReport CRUD / Editor Save
- [12-01] Module-top NODE_TYPES + EDGE_TYPES constants in workflow-canvas-inner.tsx (Pitfall 1 — verified by node:fs source-position assertion test)
- [12-01] PhaseNode handles use visibility:hidden NOT display:none (Pitfall 4) so React Flow can still hit-test on hover
- [12-01] CycleCounterBadge returns null when count < 2 (Pitfall 16 — DOM-absent under threshold so single-cycle Scrum/Waterfall projects stay clean)
- [12-02] PhaseGateExpand uses usePhaseTransition hook from Plan 12-01 — Idempotency-Key state lives in the hook, reused across mutation.mutate calls within a panel-open session, fresh UUID on remount. Verified by RTL Test 7 (3 retries with sequential UUID mock all share uuid-1) + Test 8 (unmount+remount produces uuid-1 then uuid-2)
- [12-02] 5-error matrix CONTEXT D-41 implemented inline in phase-gate-expand.tsx onError handler: 409 → AlertBanner warning + Tekrar Dene button (re-fires same key); 422 → AlertBanner danger + per-criterion <ul> from response unmet[]; 429 → countdown toast + submit disabled until decrement past 0; 400 → safety-net banner; network → error toast
- [12-02] LIFE-03 Phase-Gate side: phaseStats.total === 0 → auto-criteria render Uygulanamaz prefix + grey Circle + info AlertBanner above panel. Submit accepts manual+note only when zero-task. MiniMetric --- mono-zero summary-strip rendering deferred to Plan 12-04
- [12-02] Override flow CONTEXT D-39: sequential-locked + unmet → checkbox visible → primary button relabels Zorla Geç (variant=danger) + DTO carries allow_override:true. Audit override_used logged backend-side
- [12-02] No backend DTO adaptation needed for exceptions[] — Phase 9 D-04 PhaseTransitionDTO already accepts default_action + exceptions[] + allow_override + note
- [12-02] Mode-chip localization via two MODE_LABEL_TR + MODE_LABEL_EN Records<WorkflowMode,string> in summary-strip.tsx (kept co-located; lift into lib/methodology-matrix.ts only when a second consumer needs them)
- [12-02] LifecycleTab synthesizes empty phaseTransitions[] for BFS. Live transitions wire-up lands in Plan 12-04 (useLifecycleProject composite hook). BFS gracefully falls back to first-isInitial=active when transitions empty
- [12-02] lifecycle-stub-tab.tsx kept as 3-line re-export of LifecycleTab — avoids breaking out-of-tree consumers; orderly Phase 13 cleanup deferred
- [12-02] project-detail-shell.test.tsx mocks next/navigation (useRouter/usePathname/useSearchParams) so SummaryStrip's useRouter().push works under jsdom; existing useToast/useApp providers come from renderWithProviders
- [12-02] Test 4 (429 countdown) does NOT use vi.useFakeTimers — fake timers + userEvent + TanStack mutations create ordering issues. Test asserts (a) toast fired with "saniye bekleyin" message and (b) submit disabled while countdown active
- [12-03] CriteriaEditorPanel uses stable-string useMemo dep (rawNodes.map(n=>n.id).join('|') + JSON.stringify(initialCriteria)) when seeding drafts — Phase 11 D-44 OOM-loop pattern reused for safety against fresh-array references from useQuery-driven re-renders
- [12-03] enable_phase_assignment Toggle PATCHes inside its own onChange handler (not the bottom Save button) and explicitly preserves project.processConfig?.phase_completion_criteria so toggling EPA never overwrites unsaved per-phase criteria drafts (Test 6 independent-persist contract)
- [12-03] Deep-link auto-scroll uses 50ms-deferred scrollIntoView so the picker's React render attaches scrollAnchorRef to the active row before the smooth-scroll fires; handler bails out if the deep-link phase id is not in the workflow.nodes list
- [12-03] Methodology read-only D-60 — METHODOLOGY_LABEL_TR/EN maps in settings-general-subtab.tsx (kept co-located, lift to lib/methodology-matrix.ts only when a second consumer needs them — same strategy as the SummaryStrip mode-chip maps)
- [12-03] T-12-03-02 mitigation: the editable methodology input is REMOVED from the DOM entirely; backend Phase 9 D-29 no-op behavior (Phase 9 P05) remains as defense-in-depth, not re-verified in Plan 12-03 since no new UI path PATCHes methodology
- [12-03] settings-tab.tsx AlertBanner import dropped after the lifecycle stub swap — only the lifecycle branch used it; TypeScript flagged the unused import. Trivial cleanup with no behavioral change
- [12-05] MilestoneInlineAddRow chip picker built INLINE (no shared chip-picker primitive yet) — Phase 11 D-51 label picker is itself co-located inside task-create-modal.tsx; lifting to a shared primitive would be premature abstraction with only 2 consumers. Pattern documented in 12-05-SUMMARY for future lift
- [12-05] Milestones data flow = ProjectDetailShell calls useMilestones once and forwards as `<TimelineTab milestones={milestones}/>` prop. Choice over "timeline-tab calls useMilestones internally" because it matches Phase 11 D-09 shell-fetches pattern + makes the prop explicit at the test boundary
- [12-05] Page-level useMilestones prefetch (Plan 12-04 cache-priming side effect) REMOVED — shell-level fetch is now the single source of truth. TanStack Query de-dup means MilestonesSubTab and TimelineTab both hit cache via shared queryKey ['milestones', 'project', projectId]
- [12-05] Project-wide milestone progress (linkedPhaseIds === []) renders em-dash "—" not "0%" — em-dash signals "not phase-anchored" without misleading the user. ProgressBar still renders at 0 width for legibility. When linkedPhaseIds non-empty, status-driven heuristic (COMPLETED→100, IN_PROGRESS→50, else 0); Plan 12-06 replaces with real per-phase task counts
- [12-05] Timeline flag-line uses the SAME formula as the today-line: `((target - min) / MS_PER_DAY) * DAY_WIDTH[view]`. Each flag wrapped in its own `<g onClick={...}>` for individual click targeting; outer `<g aria-label="milestones-layer">` is layout-only
- [12-05] formatDateShort co-located inside timeline-tab.tsx (used 2x — flag label + popover date row). Lift to lib/ only when a third consumer needs it (matches the SummaryStrip mode-chip co-located strategy)
- [12-05] Click-outside dismiss for both milestone popover AND chip-picker dropdown uses `mousedown` (not `click`) — fires before React click handlers, avoids racing the toggle event that opened them
- [12-05] ConfirmDialog `confirmTone="danger"` prop NOT passed — current Phase 10 D-25 ConfirmDialog primitive does not accept it. UI-SPEC mentioned the prop, but no consumer uses it (`grep confirmTone` returns 0 hits). Future hardening (red-tone Sil) deferred to a primitive enhancement plan; not Plan 12-05 scope

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

Last session: 2026-04-25T14:35:00Z
Stopped at: Phase 12 Plan 12-05 complete
Resume file: --resume-file

**Current Phase:** 12

**Next Plan:** 12-06 — Artifacts sub-tab (row table + inline expand + single-file upload + soft-warning delete) + EvaluationReportCard (auto-prefill + PDF download with 30s rate limit) — LIFE-06 + LIFE-07

**Planned Phase:** 12 (lifecycle-phase-gate-workflow-editor) — 10 plans — 2026-04-25

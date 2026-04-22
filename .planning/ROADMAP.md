# Roadmap: SPMS

## Milestones

- SHIPPED **v1.0 MVP** -- Phases 1-7 (shipped 2026-04-20)
- IN PROGRESS **v2.0 Frontend Overhaul & Backend Expansion** -- Phases 8-13

## Phases

<details>
<summary>v1.0 MVP (Phases 1-7) -- SHIPPED 2026-04-20</summary>

- [x] Phase 1: Foundation & Security Hardening (6/6 plans) -- completed 2026-03-11
- [x] Phase 2: Authentication & Team Management (8/8 plans) -- completed 2026-03-12
- [x] Phase 3: Project & Task Completion (8/8 plans) -- completed 2026-03-14
- [x] Phase 4: Views & UI (5/5 plans) -- completed 2026-03-15
- [x] Phase 5: Notifications (7/7 plans) -- completed 2026-03-16
- [x] Phase 6: Reporting & Analytics (4/4 plans) -- completed 2026-04-09
- [x] Phase 7: Process Models, Adaptation & Integrations (5/5 plans) -- completed 2026-04-11

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v2.0 Frontend Overhaul & Backend Expansion

**Milestone Goal:** Mevcut HTML prototype'i Next.js'e component-based olarak donusturmek (tasarima dokunmadan), tum UI eksikliklerini mevcut design system'a kusursuz sekilde entegre etmek, ve backend'i kapsamli tasarim review'i ile genisletmek.

**CRITICAL BUILD RULES (all frontend phases):**
- `Frontend/` DOKUNULMAZ — eski frontend uzerine yazilmaz, kopyalanmaz, degistirilmez
- `Frontend2/` sifirdan insa edilir — `New_Frontend/` prototipi baz alinir
- shadcn/ui KULLANILMAZ — tum UI %100 prototipe birebir sadik kalir
- Tum frontend fazlari tamamlaninca `Frontend2/` → `Frontend` olarak yeniden adlandirilir, eski silinir

**Phase Numbering:**
- Integer phases (8, 9, ...): Planned milestone work
- Decimal phases (8.1, 8.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 8: Foundation & Design System** - Theme tokens, primitive components, i18n, App Shell conversion -- the base everything depends on
- [x] **Phase 9: Backend Schema, Entities & APIs** - All new entities, DI restructure, migration, and API endpoints -- completed 2026-04-21
- [x] **Phase 10: Shell Pages & Project Features** - Core page conversions (Dashboard, Login, Projects, Settings) plus project status management and create wizard (completed 2026-04-21)
- [ ] **Phase 11: Task Features & Board Enhancements** - Backlog panel, task create modal, phase assignment, board/list enhancements, remaining page conversions
- [ ] **Phase 12: Lifecycle, Phase Gate & Workflow Editor** - Phase gate mechanics, milestone/artifact/report UI, workflow editor enhancements
- [ ] **Phase 13: Reporting, Activity & User Profile** - CFD/Lead-Cycle/Iteration charts, phase reports section, activity tab, user profile page

## Phase Details

### Phase 8: Foundation & Design System
**Goal**: Developers have a working Next.js shell with design tokens, primitive components, and i18n -- enabling all subsequent frontend work
**Depends on**: Nothing (first v2.0 phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. App Shell (Sidebar, Header, Layout) renders in Next.js identical to the HTML prototype -- no visual difference
  2. Theme tokens from prototype (oklch variables) are active in Frontend2/app/globals.css — prototype token system used directly
  3. ProgressBar, SegmentedControl, Collapsible, and AlertBanner components render correctly with TypeScript props
  4. T() function returns Turkish or English strings based on useApp().language setting
  5. status-todo and status-blocked color tokens are available in theme presets
**Plans**: 4 plans
Plans:
- [x] 08-01-PLAN.md -- Theme tokens, theme system, i18n foundation, AppContext provider (completed 2026-04-21, 6 min)
- [x] 08-02-PLAN.md -- Primitive components batch 1 (Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section) (completed 2026-04-21, 2 min)
- [x] 08-03-PLAN.md -- Primitive components batch 2 (PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle) + barrel export (completed 2026-04-21, 3 min)
- [x] 08-04-PLAN.md -- App Shell conversion (Sidebar, Header, Breadcrumb, AppShell + (shell) route group + placeholder pages) with post-checkpoint cleanup of redundant sidebar footer toggle and non-functional header buttons (completed 2026-04-21, 17 min)
**UI hint**: yes

### Phase 9: Backend Schema, Entities & APIs
**Goal**: Backend has all new entities, schema changes, and API endpoints ready for frontend consumption
**Depends on**: Phase 8 (foundation must exist for integration testing context, but backend work itself is independent)
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, BACK-06, BACK-07, BACK-08, API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10
**Success Criteria** (what must be TRUE):
  1. GET /projects?status=ACTIVE returns only active projects; project status transitions (ACTIVE/COMPLETED/ON_HOLD/ARCHIVED) persist correctly
  2. Milestone, Artifact, and PhaseReport CRUD endpoints return proper responses and new records appear in database
  3. Phase Gate endpoint evaluates completion criteria and prevents concurrent transitions via advisory lock
  4. GET /projects/{id}/activity returns paginated, filterable activity feed; GET /users/{id}/summary returns user stats
  5. Workflow data structure accepts edge types, groups, and sequential-flexible mode; process_config reads/writes with schema_version normalization
**Plans**: 10 plans
Plans:
- [x] 09-01-PLAN.md -- Alembic migration 005 + audit_log.metadata ORM alias (BACK-08)
- [x] 09-02-PLAN.md -- DI split into deps/ package + backward-compat shim (BACK-07)
- [x] 09-03-PLAN.md -- Phase 9 domain exceptions + test factories + authenticated_client fixture
- [x] 09-04-PLAN.md -- Project/Task/Team entity extensions + schema_version normalizer + team leader permission helper (BACK-01, BACK-02, BACK-03)
- [x] 09-05-PLAN.md -- Milestone vertical slice with GIN-backed JSONB queries (BACK-04)
- [x] 09-06-PLAN.md -- Artifact vertical slice + ArtifactSeeder in CreateProjectUseCase + split-by-role use cases (BACK-05)
- [x] 09-07-PLAN.md -- PhaseReport vertical slice + fpdf2 programmatic PDF service (BACK-06)
- [x] 09-08-PLAN.md -- Phase Gate endpoint (advisory lock, idempotency, rate limit) + WorkflowConfig Pydantic validation (API-01, API-10)
- [x] 09-09-PLAN.md -- Activity feed + User summary (asyncio.gather) + Team Leader endpoints (API-02, API-03)
- [x] 09-10-PLAN.md -- Milestone/Artifact/PhaseReport CRUD routers + filters + criteria CRUD + apply template (API-04..09)

### Phase 10: Shell Pages & Project Features
**Goal**: Users can navigate all core pages in the new Next.js frontend and manage project lifecycle (create, status, archive)
**Depends on**: Phase 8 (App Shell), Phase 9 (project status API, project APIs)
**Requirements**: PAGE-01, PAGE-02, PAGE-05, PAGE-06, PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05
**Success Criteria** (what must be TRUE):
  1. Dashboard, Projects list, Settings, and Login/Register pages render in Next.js visually identical to prototype
  2. User can create a new project through the 4-step wizard (Temel Bilgiler, Metodoloji, Yasam Dongusu, Yapilandirma)
  3. User can change project status via dropdown actions (Complete/Hold/Archive) and sees dynamic status badge in header
  4. Archived projects show AlertBanner with "Aktif Et" button and content editing is blocked
  5. Project cards display status badges with correct colors; SegmentedControl filters projects by status
**Plans**: 10 plans
Plans:
- [x] 10-01-PLAN.md -- npm install + API infrastructure (constants, axios api-client, auth-service, AuthContext, root layout wiring)
- [x] 10-02-PLAN.md -- Backend: GET /api/v1/activity global endpoint (D-28) + seeder update with D-36 fields (varied statuses, process_template_id, process_config, leader_id)
- [x] 10-03-PLAN.md -- Next.js middleware auth guard + (auth) route group (login/session-expired/forgot-password) + LogoMark + (shell) layout QueryClientProvider + project-service + use-projects hooks
- [x] 10-04-PLAN.md -- Dashboard page: StatCards, PortfolioTable, ActivityFeed, MethodologyCard, Manager/Member view toggle wired to live API (PAGE-01)
- [x] 10-05-PLAN.md -- Projects list page: 3-column grid, SegmentedControl status filter, ProjectCard with status strip/badge/overflow menu, ConfirmDialog, ToastProvider (PAGE-02, PROJ-02, PROJ-04, PROJ-05)
- [x] 10-06-PLAN.md -- Settings page: all 5 tabs (Profil, Tercihler, Görünüm, Bildirimler, Güvenlik) — language+density wired, password change form, avatar upload (PAGE-05)
- [x] 10-07-PLAN.md -- Create Project wizard: 4-step URL-param tracking, sessionStorage draft, process template fetch, lifecycle preview, board columns, POST /projects + redirect (PROJ-01)
- [x] 10-08-PLAN.md -- ArchiveBanner component + projects/[id] stub page showing banner for ARCHIVED projects, Aktif Et reactivation (PROJ-03)
- [x] 10-09-PLAN.md -- Wire Header Create button to /projects/new + human-verify checkpoint for all Phase 10 deliverables (completed 2026-04-21)
- [x] 10-10-PLAN.md -- Backend integration tests (GET /activity) + apply checkpoint fixes + final build verification (all 9 requirements) (completed 2026-04-21)
**UI hint**: yes

### Phase 11: Task Features & Board Enhancements
**Goal**: Users can create tasks via modal, manage backlog, assign tasks to phases, and view project detail with all tabs
**Depends on**: Phase 10 (project pages exist to host task features)
**Requirements**: PAGE-03, PAGE-04, PAGE-07, TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06
**Success Criteria** (what must be TRUE):
  1. User can create a task via overlay modal with all fields (project, type, title, description, priority, assignee, points, dates, cycle, phase, labels, recurrence)
  2. Backlog panel toggles open on project detail left side (300px), supports search/filter/sort, drag-drop to board (bulk operations explicitly deferred per D-15)
  3. When enable_phase_assignment is on, task form shows phase dropdown and board cards display phase badge; board toolbar has "Filter by Phase" and list tab has "Phase" column
  4. ProjectDetail page renders with 8 tabs (Board/List/Timeline/Calendar/Activity/Lifecycle/Members/Settings) and MyTasks page shows filtered task list
  5. WIP violation triggers column background color change + AlertBanner; drop still succeeds per D-20 Warn+Allow (authoritative over original roadmap wording)
**Plans**: 10 plans
Plans:
- [x] 11-01-PLAN.md — Wave 0 infra: npm install (dnd-kit/TipTap/TanStack Table/Vitest/Playwright), TaskModalContext, methodology-matrix, task/label/comment/attachment services + hooks, process_config normalizer extension (completed 2026-04-22, 16 min, 3 tasks, 22 created + 4 modified = 26 files)
- [x] 11-02-PLAN.md — Task Create Modal (15 fields) + Header Create button rewire per D-07 + Yeni Proje permission gate per D-08 (completed 2026-04-22, 9 min, 2 tasks, 4 created + 4 modified = 8 files)
- [x] 11-03-PLAN.md — Backend labels slice (Clean Architecture): Label entity + ILabelRepository + SqlAlchemy impl + use cases + router + DI wiring + integration tests (completed 2026-04-22, 6 min, 2 tasks, 7 created + 4 modified = 11 files)
- [x] 11-04-PLAN.md — ProjectDetail 8-tab shell + Settings sub-tabs (General/Columns/Workflow/Lifecycle stub) + Members tab + Activity/Lifecycle stubs (completed 2026-04-22, 32 min, 2 tasks, 10 created + 4 modified = 14 files)
- [x] 11-05-PLAN.md — Board tab with @dnd-kit + BoardCard/BoardColumn/BoardToolbar + WIP Warn+Allow (D-20) + density toggle + phase filter (completed 2026-04-22, 6 min, 2 tasks, 9 created + 2 modified = 11 files)
- [ ] 11-06-PLAN.md — Backlog Panel fixed column + cross-container DnD (lifts DnDContext to shell) + methodology-matrix driven query + filters + responsive
- [ ] 11-07-PLAN.md — List tab (TanStack Table) + Timeline tab (custom SVG Gantt, license-clean) + Calendar tab (6x7 grid with Ctrl+wheel zoom)
- [x] 11-08-PLAN.md — Task Detail page route + Parent link + InlineEdit wrapper + PropertiesSidebar + PhaseStepper (TASK-04) + Sub-tasks + TipTap description editor + Watcher toggle (completed 2026-04-22, 8 min, 2 tasks, 11 created + 0 modified = 11 files)
- [ ] 11-09-PLAN.md — Task Detail remaining sections: Activity (Yorumlar + Geçmiş sub-tabs) + Attachments (drag-drop + links) + Dependencies CRUD + audit-formatter utility
- [ ] 11-10-PLAN.md — MyTasks (full + Dashboard Member compact) + Header search autocomplete (Cmd/Ctrl+K) + responsive breakpoints + E2E smoke tests
**UI hint**: yes

### Phase 12: Lifecycle, Phase Gate & Workflow Editor
**Goal**: Users can manage project lifecycle phases with gate criteria, milestones, artifacts, and reports; workflow editor supports advanced graph features
**Depends on**: Phase 9 (Phase Gate API, Milestone/Artifact/PhaseReport APIs), Phase 11 (ProjectDetail Lifecycle tab exists)
**Requirements**: LIFE-01, LIFE-02, LIFE-03, LIFE-04, LIFE-05, LIFE-06, LIFE-07, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07
**Success Criteria** (what must be TRUE):
  1. User can define auto and manual completion criteria per phase in Settings > Lifecycle and trigger phase transitions via Phase Gate with criteria checks
  2. Zero-task phases show dash metrics and "Not Applicable" gate criteria; past phase cards expand to show task details via Collapsible
  3. Milestone sub-tab lists milestones with status badges and ProgressBar; Artifact sub-tab shows methodology-default artifacts with status tracking and file attachment
  4. Evaluation Report expands inline on past phase cards with metrics, issues, lessons, recommendations, and PDF download
  5. Workflow editor supports edge types (flow/verification/feedback), swimlane grouping, sequential-flexible mode, BFS-based active phase calculation, parallel active phases, cycle counter badges, and Incremental/Evolutionary/RAD preset templates
**Plans**: 10 plans
Plans:
- [ ] 12-01-PLAN.md (not yet planned)
- [ ] 12-02-PLAN.md (not yet planned)
- [ ] 12-03-PLAN.md (not yet planned)
- [ ] 12-04-PLAN.md (not yet planned)
- [ ] 12-05-PLAN.md (not yet planned)
- [ ] 12-06-PLAN.md (not yet planned)
- [ ] 12-07-PLAN.md (not yet planned)
- [ ] 12-08-PLAN.md (not yet planned)
- [ ] 12-09-PLAN.md (not yet planned)
- [ ] 12-10-PLAN.md (not yet planned)
**UI hint**: yes

### Phase 13: Reporting, Activity & User Profile
**Goal**: Users can view advanced analytics charts, browse project activity feeds, and access personal profile pages
**Depends on**: Phase 9 (activity API, profile API, PhaseReport API), Phase 10 (pages framework)
**Requirements**: REPT-01, REPT-02, REPT-03, REPT-04, PROF-01, PROF-02, PROF-03, PROF-04
**Success Criteria** (what must be TRUE):
  1. Kanban projects display CFD (stacked area) instead of burndown with 7/30/90-day filter; all projects show Lead/Cycle Time histogram with P50/P85/P95 markers
  2. Scrum/Iterative projects display Iteration Comparison grouped bar chart (planned/completed/carried) and Reports page has "Phase Reports" section with project+phase selector
  3. Project detail Activity tab shows vertical timeline with event icons, date grouping, type/user filters, and pagination
  4. User Profile page displays header, 3 StatCards, and Tasks/Projects/Activity tabs using MTTaskRow component for task lists
  5. Header avatar dropdown shows Profilim/Ayarlar/Cikis Yap menu linking to correct pages
**Plans**: 10 plans
Plans:
- [ ] 13-01-PLAN.md (not yet planned)
- [ ] 13-02-PLAN.md (not yet planned)
- [ ] 13-03-PLAN.md (not yet planned)
- [ ] 13-04-PLAN.md (not yet planned)
- [ ] 13-05-PLAN.md (not yet planned)
- [ ] 13-06-PLAN.md (not yet planned)
- [ ] 13-07-PLAN.md (not yet planned)
- [ ] 13-08-PLAN.md (not yet planned)
- [ ] 13-09-PLAN.md (not yet planned)
- [ ] 13-10-PLAN.md (not yet planned)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 8 -> 8.1 -> 9 -> 9.1 -> ... -> 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Security Hardening | v1.0 | 6/6 | Complete | 2026-03-11 |
| 2. Authentication & Team Management | v1.0 | 8/8 | Complete | 2026-03-12 |
| 3. Project & Task Completion | v1.0 | 8/8 | Complete | 2026-03-14 |
| 4. Views & UI | v1.0 | 5/5 | Complete | 2026-03-15 |
| 5. Notifications | v1.0 | 7/7 | Complete | 2026-03-16 |
| 6. Reporting & Analytics | v1.0 | 4/4 | Complete | 2026-04-09 |
| 7. Process Models, Adaptation & Integrations | v1.0 | 5/5 | Complete | 2026-04-11 |
| 8. Foundation & Design System | v2.0 | 4/4 | Plans executed (phase verification pending) | - |
| 9. Backend Schema, Entities & APIs | v2.0 | 10/10 | Complete | 2026-04-21 |
| 10. Shell Pages & Project Features | v2.0 | 10/10 | Complete    | 2026-04-21 |
| 11. Task Features & Board Enhancements | v2.0 | 3/10 | In Progress | - |
| 12. Lifecycle, Phase Gate & Workflow Editor | v2.0 | 0/0 | Not started | - |
| 13. Reporting, Activity & User Profile | v2.0 | 0/0 | Not started | - |
</content>

# Roadmap: SPMS

## Overview

SPMS is a brownfield project with a Clean Architecture backend already in place. The roadmap starts by fixing what is broken — architecture violations, a critical authorization bug, and missing data infrastructure — before building the remaining feature set. Phases proceed from foundation to extensibility: foundation and security hardening, then user and team management, then the full task/project module, then visual views, then notifications, then reporting, and finally process model customization and external integrations.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Security Hardening** - Fix architecture violations, patch the critical RBAC bug, and establish data infrastructure (soft delete, indexes, versioning, audit trail)
- [x] **Phase 2: Authentication & Team Management** - User profile editing, team creation, password reset, account lockout, and remaining security/safety hardening (completed 2026-03-12)
- [ ] **Phase 3: Project & Task Completion** - Sprint endpoints, comments, file attachments, task dependencies, recurring tasks, similar-task warnings, pagination, and task logs
- [ ] **Phase 4: Views & UI** - Kanban board with drag-and-drop, calendar module, Gantt/timeline view, and modular project boards
- [ ] **Phase 5: Notifications** - Real-time in-app notifications, event-triggered alerts, email notifications, messaging permissions, and notification preferences
- [ ] **Phase 6: Reporting & Analytics** - Graphical progress dashboards, filterable reports, PDF/Excel export, and user performance metrics
- [ ] **Phase 7: Process Models, Adaptation & Integrations** - Scrum/Kanban/Waterfall/Iterative model support, template customization, adaptive configuration panel, and external service integrations

## Phase Details

### Phase 1: Foundation & Security Hardening
**Goal**: The codebase is clean, the critical authorization bug is patched, and the database has the infrastructure required for all subsequent features
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, ARCH-07, ARCH-08, ARCH-09, ARCH-10, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, SEC-02, SEC-03, SAFE-02, SAFE-03
**Success Criteria** (what must be TRUE):
  1. Any authenticated user who is not a member of a project receives HTTP 403 when attempting to read, update, or delete that project's tasks
  2. Dashboard, Settings page, and Task Activity feed show live data from the API — no mock data remains
  3. Application refuses to start if JWT_SECRET or DB_PASSWORD are absent from the environment; SQLAlchemy query logging is off in production
  4. All task and project list endpoints return consistent HTTP error codes (400, 401, 403, 404, 500); CORS policy rejects requests from non-allowlisted origins
  5. Database tables include soft-delete flags, version/updated_at fields, audit trail records, indexes on tasks.project_id / tasks.assignee_id / tasks.parent_task_id / projects.manager_id, and a recurring-task schema
**Plans**: 6 plans

Plans:
- [ ] 01-01-PLAN.md — Wave 0 test scaffolds: fix broken test, create 7 new test stub files (Nyquist compliance)
- [ ] 01-02-PLAN.md — DB schema foundation: TimestampedMixin, AuditLogModel, Alembic migration with all Phase 1 schema changes
- [ ] 01-03-PLAN.md — Security hardening: RBAC membership dependency, startup secret validation, CORS env var, error code consistency
- [ ] 01-04-PLAN.md — Repository data infrastructure: soft delete + audit diff wiring in task/project/user repos
- [ ] 01-05-PLAN.md — Backend architecture cleanup: DTO migration, duplicate method merge, double round-trip elimination, nested manager DTO
- [ ] 01-06-PLAN.md — Frontend wiring + session expiry + logging: settings/dashboard live data, 401 intercept, structured log middleware

### Phase 2: Authentication & Team Management
**Goal**: Users can manage their own profiles, create and join teams, reset forgotten passwords, and the system locks accounts after repeated failed logins
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, SEC-01, SEC-04, SAFE-01
**Success Criteria** (what must be TRUE):
  1. User can update their name, email, and avatar from the Settings page and the change persists after page reload
  2. User can create a team and invite another registered user; the invited user appears as a team member
  3. User can request a password reset and receives an email with a single-use link valid for 30 minutes; clicking the link allows setting a new password
  4. After 5 consecutive failed login attempts the account is locked; further attempts are rejected without a valid unlock mechanism
  5. Auth endpoints (login, register) reject requests beyond the rate limit; a confirmation dialog appears before critical destructive actions in the UI
**Plans**: 8 plans

Plans:
- [ ] 02-01-PLAN.md — Wave 0 test scaffolds: 6 xfail stub files for AUTH-01/02/03/04 and SEC-01 (Nyquist compliance)
- [ ] 02-02-PLAN.md — DB schema + domain contracts: teams/team_members/team_projects/password_reset_tokens migration, domain entities, repository interfaces, DTOs
- [ ] 02-03-PLAN.md — Profile editing backend: PUT /auth/me, POST /auth/me/avatar (authenticated), GET /auth/avatar/{filename}
- [ ] 02-04-PLAN.md — Team management backend: CreateTeam/AddMember/RemoveMember use cases, SqlAlchemyTeamRepository, /teams router
- [ ] 02-05-PLAN.md — Password reset + account lockout + rate limiting: RequestPasswordReset/ConfirmPasswordReset use cases, in-memory lockout module, slowapi on /login and /register
- [ ] 02-06-PLAN.md — Settings frontend save wiring + confirmation dialogs: PUT /auth/me form, avatar upload, ConfirmDialog/TypeToConfirmDialog components
- [ ] 02-07-PLAN.md — Teams frontend: /teams list page, /teams/[id] detail with member management, team-service.ts
- [ ] 02-08-PLAN.md — Password reset UI + GDPR/KVKK note: /forgot-password and /reset-password pages, sdd_revizyon.md compliance section

### Phase 3: Project & Task Completion
**Goal**: The project and task module is fully functional — managers can assign members to projects, tasks have dependencies and recurrence, comments and file attachments work, sprints are manageable via API, and list endpoints paginate
**Depends on**: Phase 2 (team membership needed for TASK-01), Phase 1 (DATA-03 schema needed for TASK-03/04/05)
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
**Success Criteria** (what must be TRUE):
  1. Project manager can add and remove team members from a project via the UI; only project members can access that project's tasks
  2. User can create a recurring task with daily/weekly/monthly recurrence and an end criterion (date or count); editing the task asks whether to apply the change to all instances or only this one
  3. User can define a finish-to-start or start-to-start dependency between two tasks and the dependency is visible in the task detail
  4. User can add a comment to a task and upload a file attachment; both are retrievable from the task detail page
  5. Sprint list, create, and management endpoints respond; all task and project list endpoints accept pagination parameters and return a subset of results with total count
**Plans**: 8 plans

Plans:
- [ ] 03-01-PLAN.md — Wave 0 test scaffolds: 9 xfail stub files for all TASK requirements (Nyquist compliance)
- [ ] 03-02-PLAN.md — DB schema + domain contracts: migration 003 (task_dependencies table, task_key/series_id/task_seq/file_size columns), TaskDependency entity, sprint/comment/attachment repo interfaces and DTOs
- [ ] 03-03-PLAN.md — Sprint CRUD backend + project member management: Sprint use cases + router, AddProjectMember/RemoveProjectMember use cases + /projects/{id}/members endpoints
- [ ] 03-04-PLAN.md — Comment CRUD backend + attachment upload/download: comment use cases + router, attachment use cases + router with 25MB limit and extension blocking
- [ ] 03-05-PLAN.md — Task enhancements backend: pagination on task list, task key generation, similarity search endpoint, audit history endpoint, dependency use cases + endpoints, recurring task generation on completion
- [ ] 03-06-PLAN.md — Task detail frontend wiring: Comments tab + History tab + Attachments section wired to real APIs; comment-service.ts + attachment-service.ts
- [ ] 03-07-PLAN.md — Task sidebar new cards + project members tab: Dependencies card, Recurrence card, Sprint dropdown in sidebar; Members tab in project detail page
- [ ] 03-08-PLAN.md — Create task modal + pagination UI: recurring config panel, similar-task warning, Load more button on task list

### Phase 4: Views & UI
**Goal**: Users can interact with project work through a drag-and-drop Kanban board, a calendar showing tasks and events, a Gantt timeline showing dependencies, and can switch between view modes per project
**Depends on**: Phase 3 (needs real tasks, sprints, dependencies)
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04
**Success Criteria** (what must be TRUE):
  1. User can drag a task card from one Kanban column to another and the task's status updates in the database without a page reload
  2. User can open the Calendar view and see tasks with due dates and recurring events plotted on the correct dates
  3. User can open the Gantt/Timeline view and see tasks rendered as bars; tasks with finish-to-start dependencies are visually linked
  4. User can switch a project between Kanban, Gantt, and List/Calendar view modes; the chosen view persists across sessions
**Plans**: TBD

### Phase 5: Notifications
**Goal**: Users receive timely in-app and email notifications about task and project events, can configure their notification preferences, and message history is durably stored
**Depends on**: Phase 3 (task events must exist), Phase 2 (user roles for messaging permissions)
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06
**Success Criteria** (what must be TRUE):
  1. When a task is assigned to a user or its status changes, the assignee sees an in-app notification without refreshing the page
  2. Deadline-approaching, comment-added, and task-assigned events each trigger a notification; role-based permissions prevent members from sending messages beyond their allowed scope
  3. User can enable email notifications and receives an email when assigned to a task or when a comment is added
  4. User can mute notifications or set "important events only" mode; preference is saved and respected on subsequent events
  5. Comments and messages remain accessible in their history even after the associated project is archived or deleted
**Plans**: TBD

### Phase 6: Reporting & Analytics
**Goal**: Managers and project owners can view graphical progress summaries, filter reports by user/task/project, export data, and see individual performance metrics
**Depends on**: Phase 3 (real task data), Phase 5 (audit trail data for performance metrics)
**Requirements**: REPT-01, REPT-02, REPT-03, REPT-04, REPT-05
**Success Criteria** (what must be TRUE):
  1. Reports page displays task completion rate and sprint progress as charts using live data, replacing the current "coming soon" stubs
  2. User can filter the report view by project, assignee, or date range and the charts update to reflect the selection
  3. User can export a report as a PDF or Excel file that downloads to their machine
  4. Manager dashboard shows each team member's completed task count and on-time delivery rate for the current project
**Plans**: TBD

### Phase 7: Process Models, Adaptation & Integrations
**Goal**: Admins can define and customize process model templates, organizations can configure system-wide settings without restarting, and the system integrates with at least one external service
**Depends on**: Phase 4 (views must support process-driven board structures), Phase 3 (projects must exist to assign models)
**Requirements**: PROC-01, PROC-02, PROC-03, PROC-04, PROC-05, ADAPT-01, ADAPT-02, ADAPT-03, ADAPT-04, ADAPT-05, ADAPT-06, EXT-01, EXT-02, EXT-03, EXT-04, EXT-05
**Success Criteria** (what must be TRUE):
  1. User can select Scrum, Waterfall, Kanban, or Iterative when creating a project; the board columns and default recurring events are created automatically from the template
  2. Admin can create a new process model template or edit an existing one; a project using the custom template reflects the customized board structure
  3. Admin can change system parameters (sprint duration, task limits, notification frequency) from the configuration panel; changes take effect immediately without restarting the server
  4. Modules (e.g., reporting) can be toggled off per installation; toggling a module off removes it from the UI without requiring a code change
  5. The system sends at least one event (task assigned or project created) to an external service (Slack, Teams, or Google Calendar) via a dedicated integration service layer; adding a new integration does not require changing existing module code
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Security Hardening | 6/6 | In Progress (awaiting verification) | - |
| 2. Authentication & Team Management | 8/8 | Complete   | 2026-03-12 |
| 3. Project & Task Completion | 7/8 | In Progress|  |
| 4. Views & UI | 0/TBD | Not started | - |
| 5. Notifications | 0/TBD | Not started | - |
| 6. Reporting & Analytics | 0/TBD | Not started | - |
| 7. Process Models, Adaptation & Integrations | 0/TBD | Not started | - |

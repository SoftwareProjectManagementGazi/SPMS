# Phase 14: Admin Panel - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the `/admin` route — a system-wide administration console accessible only to users with system-admin role, ported verbatim from `New_Frontend/src/pages/admin.jsx` into Frontend2 and made **fully functional** end-to-end. The route is currently 404 (Phase 13 D-D2 wired the avatar-dropdown link to `/admin` but never built the destination).

Eight sub-tabs delivered as **sub-routes** under `app/(shell)/admin/`:

1. **`/admin`** (Genel / Overview) — 5 StatCards (Users / Active Projects / Pending / Templates / Storage) + Pending Project Join Requests panel (top 5 + "Tümünü gör" modal) + Role distribution chart + Recent admin events list.
2. **`/admin/users`** (Kullanıcılar) — Filterable user table with role/status badges, search, role filter SegmentedControl, bulk-select checkboxes + bulk operations, "Kullanıcı ekle" modal (email-invite flow), "Toplu davet" CSV upload modal, "CSV indir" export, per-row MoreH menu (Deactivate / Reset password / Role change / Delete).
3. **`/admin/roles`** (Roller) — 4 visual role cards (Admin/PM/Member/Guest) + 1 "Yeni rol oluştur" disabled placeholder. **Functional placeholder** for the deferred RBAC subsystem (see decisions D-A2..A4).
4. **`/admin/permissions`** (İzin Matrisi) — Permission Matrix grid: 14 permissions × 4 roles. **Visual placeholder** with toggles disabled and "v3.0" badge in card header (RBAC enforcement deferred).
5. **`/admin/projects`** (Projeler) — Admin-wide project listing with key/name/methodology/lead/tasks/progress/created. Real CRUD via existing endpoints + per-row MoreH (Archive — Phase 10 endpoint, Delete — soft-delete via existing endpoint).
6. **`/admin/workflows`** (Şablonlar) — Process template grid reading `GET /api/v1/process_templates`. Per-card MoreH redirects to `/workflow-editor?templateId=…` for Edit; Clone calls existing endpoint; Delete calls existing endpoint with ConfirmDialog.
7. **`/admin/audit`** (Audit) — Full audit log table consuming a NEW admin-wide audit endpoint. Replaces prototype's `risk` column with **`Detay` column** (Jira-style human-readable rendering driven by enriched `extra_metadata`). Filter modal (date range, actor, action prefix), real JSON export endpoint.
8. **`/admin/stats`** (İstatistik) — Active users trend (30-day line chart), Methodology usage (% bars), Velocity per project (mini bar charts). Reads NEW `/api/v1/admin/stats` endpoint.

**Backend (NEW work in this phase):**

- **`ProjectJoinRequest` entity** — Full Clean Architecture vertical slice (Domain entity, Repository interface, SQLAlchemy model, repo impl, mapper, use cases, DTOs, router, integration tests). States: `pending → approved | rejected`. Triggered when a PM (or self-service candidate, scope TBD by planner) requests to add a user to a project. Approval action calls existing TeamProjects join logic.
- **Admin user-management endpoints** — `POST /api/v1/admin/users` (email invite), `PATCH /api/v1/admin/users/{id}/role` (Admin↔Member toggle on existing enum), `PATCH /api/v1/admin/users/{id}/deactivate` (toggle `is_active`), `POST /api/v1/admin/users/{id}/password-reset` (triggers Phase 2 PasswordResetToken + Phase 5 email), `POST /api/v1/admin/users/bulk-invite` (CSV-driven multi-create), `GET /api/v1/admin/users.csv` (export).
- **`/api/v1/admin/audit` endpoint** — Admin-wide audit log retrieval (no project-membership privacy filter; admin sees everything). Reuses Phase 9 `IAuditRepository` with new method `get_global_audit(filters, limit, offset)`. JSON export endpoint `/api/v1/admin/audit.json` honors current filter.
- **`/api/v1/admin/stats` endpoint** — Composite stats: active users trend (audit_log compute, see D-X8), methodology distribution (`SELECT methodology, COUNT(*) FROM projects GROUP BY methodology`), per-project velocity (reuses Phase 13 GetProjectIterationUseCase aggregation logic but admin-wide).
- **Audit-log enrichment (cross-cutting)** — Backend audit_log writes in `task_repo.py`, `project_repo.py`, `comment` use cases, milestone/artifact/phase_report use cases get `extra_metadata` JSONB enriched with: `task_title`, `task_key`, `project_name`, `project_key`, `old_value_label`, `new_value_label`, `comment_excerpt` (160-char). NO migration needed (`extra_metadata` JSONB already exists from Phase 9 D-09).

**Frontend (NEW work in this phase):**

- **8 sub-route pages** under `app/(shell)/admin/` + shared `layout.tsx` (Tabs primitive Link-tabanlı, `usePathname()` ile active tab detection).
- **Audit-event-mapper extension** — New semantic types (`task_field_updated`, `project_archived`, `project_status_changed`, `user_invited`, `user_deactivated`, `user_role_changed`, `comment_edited`); rich verb formatter consuming enriched metadata.
- **`activity-row.tsx` Jira-style rendering** — Field-change-pair render, project-archive render, user-lifecycle render. Existing status-pair / assign-target / comment-block renders preserved.
- **Admin-only route guard** — `app/(shell)/admin/layout.tsx` reads `useAuth().user.role` and redirects to `/dashboard` (or `/auth/login` if unauthenticated) when not Admin. Server-side companion: every admin endpoint uses `Depends(require_admin)`.
- **`ProjectJoinRequest` services + hooks** — `Frontend2/services/admin-join-request-service.ts`, `hooks/use-pending-join-requests.ts`, `hooks/use-approve-join-request.ts`.
- **Admin user-management UI** — `add-user-modal.tsx`, `bulk-invite-modal.tsx` (CSV parse client-side + API submit), `user-row-actions.tsx` (MoreH menu).

**NOT in scope (deferred to v3.0 / future phase):**

- **Role entity, Permission entity, RolePermission junction** — RBAC infrastructure DEFERRED per user decision (D-A2). Existing `users.role` enum (`Admin`/`Project Manager`/`Member`) preserved unchanged. Permission Matrix tab is a visual placeholder.
- **Custom roles ("Guest" / "Yeni rol oluştur")** — Disabled placeholder cards with "v3.0" badge.
- **Permission Matrix toggle enforcement** — Toggles disabled. No backend permission DSL.
- **SSO / MFA / login-event audit logs** — Not implemented (no SSO/MFA in v2.0). Prototype's `auth.sso.update` / `auth.mfa.reset` rows do NOT appear in audit.
- **Risk classifier** — Skipped per user decision (D-Z1). No `risk` column. Replaced with enriched `Detay` column.
- **Project ownership transfer** — No project-level `lead_id` field added (per-project PM via Team.leader_id; managed in project Settings > Üyeler). MoreH menu has no "Transfer ownership" item.
- **Active users daily snapshot table** — On-the-fly audit_log compute in v2.0; daily snapshot cron deferred to v2.1 (D-X8 scaling cliff documented).
- **Phase-level milestone change reporting** — Existing audit log captures, but no new aggregate report.
- **Email template editor** for invite/reset emails — Reuses Phase 5 default templates.
- **Mobile <640px specific layouts** for admin (admin = desktop-first per industry convention).

**Cross-phase contracts:**

- REUSES Phase 2 `PasswordResetToken` entity for both admin "Reset password" and admin-invite-flow ("Set your password" link in invite email).
- REUSES Phase 5 email infrastructure for invite/reset emails.
- REUSES Phase 8 primitives (Tabs, Card, Button, Badge, Input, Avatar, AvatarStack, SegmentedControl, ConfirmDialog).
- REUSES Phase 10 `ProjectCard` for the Projects tab table cells (or build new admin-specific row component if richer columns needed).
- REUSES Phase 12 `EvaluationReportCard` — N/A (admin doesn't show reports inline).
- REUSES Phase 13 `<DataState/>` primitive for loading/error/empty across all 8 tabs.
- REUSES Phase 13 `<AvatarDropdown/>` (already wired with admin-conditional Admin Paneli link → `/admin`).
- REUSES Phase 13 `audit-event-mapper.ts` + `activity-row.tsx` and EXTENDS them (new semantic types, Jira-style metadata rendering).
- REUSES Phase 13 `chart-service.ts` infrastructure (recharts already installed) for stats charts.
- REUSES Phase 9 `IAuditRepository` + extends with `get_global_audit` method.
- REUSES existing `process_templates.py` router for /admin/workflows tab.
- REUSES existing `users.py` router + extends with admin-scoped endpoints (or new `admin/users.py` router — planner picks).

</domain>

<decisions>
## Implementation Decisions

### Quality Bar (META — applies to every plan)

- **D-00:** [informational] **Prototype-first execution; deliberate-improvement-only deviations.** Every Phase 14 surface MUST port the prototype's elements verbatim into TypeScript + i18n + token-driven styles. Allowed deviations are improvements made for genuine prototype gaps (empty/error states, accessibility, edge cases) — each must be (a) called out by name in PLAN.md as an intentional improvement, (b) justified ("prototype shows X but lacks Y because…"), and (c) reviewed before merge. **No silent re-derivations.** Prototype source: `New_Frontend/src/pages/admin.jsx` (482 lines, all 8 tab renderers + AdminPage outer). User-stated quality bar carrying forward from Phase 13 D-00: "I don't want any sloppy plan or execution, need this done CAREFULLY. Use prototypes all elements in related pages. AND improve design when [it] didn't [meet] enough."

### Plan Decomposition & Build Order

- **D-01:** [informational] **Sub-route + vertical-slice plan structure — ~14-17 plans target.** Strawman ordering (planner refines):
  1. **Plan 14-01 — Wave 0 shared infra (fat plan, Phase 12 D-02 / Phase 13 D-01 pattern):** Backend `ProjectJoinRequest` entity (full vertical slice) + admin user-mgmt endpoints + `/api/v1/admin/audit` + `/api/v1/admin/stats` + DTOs + integration tests. Frontend `admin-join-request-service.ts`, `admin-user-service.ts`, `admin-stats-service.ts`, `admin-audit-service.ts`, hooks, `lib/admin/permissions-static.ts` (placeholder map). Audit-log enrichment in 4-5 backend write sites + audit-event-mapper extension. ~30-35 files.
  2. **Plan 14-02 — `/admin` shell + layout + Genel (Overview) tab:** `app/(shell)/admin/layout.tsx` (admin-only route guard + Tabs primitive Link-tabanlı), `app/(shell)/admin/page.tsx` (Overview content). 5 StatCards + Pending Join Requests panel (top 5 + "Tümünü gör" modal) + Role distribution + Recent admin events. ~8-10 files.
  3. **Plan 14-03 — `/admin/users` (Kullanıcılar tab):** Full table + search + role filter SegmentedControl + bulk select + Add User modal (email-invite) + Bulk Invite modal (CSV parse + multi-API call) + CSV export + per-row MoreH (Deactivate / Role change / Reset password / Delete) + ConfirmDialogs. ~10-12 files.
  4. **Plan 14-04 — `/admin/roles` + `/admin/permissions` (placeholder tabs):** 4 role cards (Admin/PM/Member/Guest) with **clarified semantics** in card descriptions (Admin=global system role, PM/Member=project-scoped via Team.leader_id and Settings > Üyeler) + "Yeni rol oluştur" disabled card. Permission Matrix grid with disabled toggles + "v3.0" badge. CONTEXT.md gerekçesi linklenir. ~4-6 files.
  5. **Plan 14-05 — `/admin/projects` (Projeler tab):** Project listing reading `GET /projects?include_archived=true` (or extend filter). Per-row MoreH = Archive + Delete (existing endpoints). "Yeni proje" → redirect `/projects/new`. CSV export server-side. ~5-7 files.
  6. **Plan 14-06 — `/admin/workflows` (Şablonlar tab):** Template card grid reading `GET /api/v1/process_templates`. Per-card MoreH = Edit (redirect `/workflow-editor?templateId=…`), Clone (existing endpoint), Delete (existing endpoint + ConfirmDialog). ~4-5 files.
  7. **Plan 14-07 — `/admin/audit` (Audit tab):** Full audit log table consuming `/api/v1/admin/audit`. Filter modal (date range, actor, action prefix) — opens via `Filtre` button. JSON export downloads via `/api/v1/admin/audit.json` honoring current filter. **Detay column** renders Jira-style human-readable lines from enriched `extra_metadata` via the extended `audit-event-mapper` + `activity-row` (`variant="admin-table"`). Pagination via offset (D-Z2). ~8-10 files.
  8. **Plan 14-08 — `/admin/stats` (İstatistik tab):** 3 charts using recharts (already installed Phase 13). Active users trend (30d line, audit_log on-the-fly compute), Methodology distribution (bar), Velocity per project (mini bars). Reads `/api/v1/admin/stats`. ~6-8 files.
  9. **Plan 14-09 — Audit-log enrichment cross-cutting (BACKEND):** `extra_metadata` enrichment in `task_repo.py` (5+ field-change sites), `project_repo.py` (status, archive, methodology change), `create_comment` / `update_comment` / `delete_comment` use cases, milestone/artifact/phase_report use cases. ~7-9 files.
  10. **Plan 14-10 — Audit/Activity Jira-style rendering cross-cutting (FRONTEND):** `audit-event-mapper.ts` extension (new SemanticEventType union members), `event-meta.ts` rich verb formatter, `activity-row.tsx` field-change-pair render + project-archive render + user-lifecycle render. **Affects** /admin/audit + ProjectDetail Activity tab + Profile Activity tab + Dashboard ActivityFeed. RTL tests for each new render path. ~6-8 files.
  11. **Plan 14-11 — Avatar dropdown verification + Header "Rapor al" / "Denetim günlüğü" buttons:** `Frontend2/components/header/avatar-dropdown.tsx` — verify Admin Paneli link works on /admin route post-implementation. Wire `Rapor al` (admin overview PDF export — admin-summary endpoint or client-side jspdf composition) and `Denetim günlüğü` (next-router push to `/admin/audit`). ~3-4 files.
  12. **Plan 14-12 — E2E smoke + UAT artifact (Phase 11 D-50 / Phase 13 13-10 pattern):** Playwright smoke specs for each tab (skip-guarded per Phase 11 D-50). `14-UAT-CHECKLIST.md` manual UAT checklist (~25-30 rows for all 8 tabs + admin-only route guard + invite email delivery + bulk CSV happy/error paths). ~4-5 files.

  Optional 14-13/14-14 for backend hardening: cron job for active-users daily snapshot, audit-retention policy, Sentry-style audit alerting. Planner picks based on capacity.

### Backend Scope (Area 1)

- **D-A1:** **`ProjectJoinRequest` entity = full Clean Architecture vertical slice.** Domain entity (`Backend/app/domain/entities/project_join_request.py`), repository interface (`IProjectJoinRequestRepository`), SQLAlchemy ORM model + alembic migration **006** (idempotent), repo impl + mapper, use cases (`CreateJoinRequestUseCase`, `ApproveJoinRequestUseCase`, `RejectJoinRequestUseCase`, `ListPendingJoinRequestsUseCase`), DTOs, API router (`/api/v1/admin/join-requests` for admin list + admin approve/reject; `/api/v1/projects/{id}/join-requests` for PM-side request creation). State machine: `pending → approved | rejected | cancelled`. Approval triggers existing TeamProjects join logic. Audit entries written for create/approve/reject (uses Plan 14-09 enriched metadata).
- **D-A2:** **Role entity, Permission entity, RolePermission junction = DEFERRED to v3.0.** Existing `users.role` enum (`Admin`/`Project Manager`/`Member`) preserved. No migration. No backend code changes for RBAC infrastructure. The `Roller` and `İzin Matrisi` tabs are visual placeholders. **Rationale:** User explicitly chose "rbac alt yapısını deffer edelim, şuan place holder kalsın, önceki role entity kararını da full entegrasyon olucak şekilde deffer edelim" during discussion — full RBAC integration belongs in v3.0 phase.
- **D-A3:** **Permission Matrix toggles = visually disabled placeholder.** Frontend renders the prototype's grid (14 permissions × 4 roles) but every toggle has `disabled` attribute + `aria-disabled="true"` + tooltip "RBAC altyapısı v3.0'da gelecek". Card header shows a small "v3.0" Badge (warning tone). Page-level AlertBanner explains: "Bu sayfa demo amaçlıdır. Granüler izin yönetimi v3.0 sürümünde gelecek; şu an yetkilendirme `Admin/Project Manager/Member` rolü ve proje üyeliği üzerinden çalışıyor."
- **D-A4:** **"Yeni rol oluştur" kartı = disabled placeholder.** Same dashed-border card style as prototype but with `cursor: not-allowed`, click-handler no-op + tooltip "v3.0'da gelecek". Card content updated: "Yeni rol oluşturma — v3.0".
- **D-A5:** **Roller tab card semantics clarified.** Each role card description is rewritten to reflect reality (replacing prototype's misleading "all roles are global" implication):
  - **Admin:** "Sistem geneli — tüm projelerde tam yetkili. Sadece admin invite edebilir, user role değiştirebilir, proje silebilir."
  - **Project Manager:** "Proje bazlı — her projede ayrı atanır (Settings > Üyeler). Bir kullanıcı bir projede PM, başka projede Üye olabilir."
  - **Member:** "Proje bazlı — atandığı projelerde görev yönetir."
  - **Guest:** Disabled card. "Yalnızca salt-okuma. v3.0'da gelecek."
- **D-A6:** **User admin CRUD = full implementation on existing role enum.** `POST /api/v1/admin/users` (email-invite), `PATCH /api/v1/admin/users/{id}/role` (Admin↔PM↔Member, system-wide enum change), `PATCH /api/v1/admin/users/{id}/deactivate` (toggles `users.is_active`), `POST /api/v1/admin/users/{id}/password-reset` (Phase 2 token + Phase 5 email), `POST /api/v1/admin/users/bulk-invite`, `GET /api/v1/admin/users.csv`. **Note:** Role change here flips the GLOBAL role enum field; per-project PM-ness is managed via Team.leader_id in Settings > Üyeler (unchanged Phase 9 flow).
- **D-A7:** **`/api/v1/admin/stats` endpoint = composite payload.** Single endpoint returns:
  ```json
  {
    "active_users_trend": [{"date": "2026-04-01", "count": 24}, ...],
    "methodology_distribution": {"scrum": 12, "kanban": 8, "waterfall": 4, "iterative": 2},
    "project_velocities": [{"project_id": 1, "key": "BANK", "name": "...", "progress": 0.45, "velocity_history": [0.3, 0.4, 0.5, ...]}]
  }
  ```
  Use case `GetAdminStatsUseCase` aggregates from `IAuditRepository` + `IProjectRepository`. Admin-only (`Depends(require_admin)`).
- **D-A8:** **Audit log enrichment = cross-cutting backend change (Plan 14-09).** All audit_log write sites get `extra_metadata` JSONB enriched with the entity's natural-language-relevant fields (task_title, task_key, project_name, project_key, old/new value labels for status changes, comment excerpt for comment events). The `extra_metadata` column already exists from Phase 9 D-09 — NO migration. Affects: `task_repo.py` (5+ sites), `project_repo.py` (status / archive / methodology change), comment use cases, milestone/artifact/phase_report use cases. Coverage matrix in PLAN.md.

### CRUD Actions (Area 2)

- **D-B1:** **All ~15 prototype actions = functional ("tümü çalışan" max scope).** Every button + MoreH item that is not RBAC-deferred has a real backend endpoint and a working UI flow. RBAC-deferred items (Permission toggle, "Yeni rol oluştur", role card "Düzenle") remain placeholders per D-A3..A5.
- **D-B2:** **Add user flow = email invite (recommended path).** `POST /api/v1/admin/users` accepts `{email, role, name?, team_id?}`, creates user with `is_active=false` + random password + Phase 2 PasswordResetToken (extended TTL: 7 days for invites), sends invite email via Phase 5 ("Hoş geldiniz — şifrenizi belirleyin" CTA → `/auth/set-password?token=…`). User clicks link → sets password via existing Phase 2 reset endpoint → `is_active` flips to true on first password set. **Reuses Phase 2 PasswordResetToken infrastructure.**
- **D-B3:** **Reset password flow = email reset link.** Admin clicks "Şifre sıfırla" in user MoreH → backend creates fresh PasswordResetToken (24h TTL) + sends Phase 5 reset email. Identical to user-initiated `/auth/forgot-password` flow but admin-triggered. Audit row written: `auth.password_reset_requested` with `extra_metadata.requested_by_admin_id`.
- **D-B4:** **Bulk invite CSV format = `email,name,role` (3 columns).** Header row optional (auto-detected). Validation per row: email format (RFC 5322 lax), role ∈ {Admin, Project Manager, Member} (case-insensitive normalization), name 1-100 chars (defaults to email local part if empty). Errors collected per-row; commit-or-skip strategy: invalid rows are SKIPPED, valid rows COMMITTED. Response includes `{successful: [...], failed: [{row_number, email, errors}]}`. UI shows summary modal post-upload. Max 500 rows per upload (DoS guard). **Format choice rationale:** name column adds invite-email personalization without significantly raising CSV-prep burden.
- **D-B5:** **Project transfer ownership = SKIPPED.** No `lead_id` field on Project entity. Per-project PM-ship is managed via `Team.leader_id` (Phase 9 D-17, existing PATCH endpoint) accessible from project Settings > Üyeler tab. Admin's Projects tab MoreH has only `Arşivle` + `Sil` (existing endpoints). **Rationale (user-stated):** "sahiplik değişimine ihtiyaç yok, yönetim işleri o projedeki pmlere ait, roller proje based olucak, bir projede pm olan öbüründe üye olabilir. Sadece adminlik sistem geneli olucak."
- **D-B6:** **Header buttons "Rapor al" + "Denetim günlüğü" = wired (Plan 14-11).**
  - **Rapor al:** Generates an admin-summary PDF (last 30 days: user count delta, project count, top 5 most-active projects, top 5 audit risk events). Reuses Phase 12 fpdf2 PDF service — new use case `GenerateAdminSummaryPDFUseCase`. Endpoint `GET /api/v1/admin/summary.pdf`. Rate-limited 30s same as Phase 12 D-58.
  - **Denetim günlüğü:** Pure client-side `router.push('/admin/audit')`. No new backend.
- **D-B7:** **Bulk operations on Users tab = real bulk endpoint.** Checkbox selection + bulk-deactivate / bulk-role-change. Endpoint `POST /api/v1/admin/users/bulk-action` accepts `{user_ids: [], action: 'deactivate' | 'role_change', payload: {role?: ...}}`. Atomic — all-or-none transaction; audit log writes one entry per user.
- **D-B8:** **Audit JSON export endpoint = honor current filter.** `GET /api/v1/admin/audit.json` accepts the same query params as `GET /api/v1/admin/audit` (date range, actor, action prefix). Returns NDJSON or JSON-array (planner picks based on payload size; recommend JSON-array for ≤10k rows, NDJSON streaming for larger). Max 50k rows hard cap (DoS).

### Routing Architecture (Area 3)

- **D-C1:** **8 sub-route'lar, NOT `?tab=` query param.** Diverges from Phase 11 ProjectDetail (`?tab=board|list|...`) and Phase 13 Profile (`?tab=tasks|projects|activity`) patterns. **Rationale (locked-in user discussion):**
  - Admin tab'lar fonksiyonel olarak BAĞIMSIZ (Audit ↔ Stats ↔ Users — paylaşılan context yok). ProjectDetail tab'ları ise paylaşılan project state üstüne kuruluydu.
  - Admin tool bookmark/share UX kritik (admin'in audit log linkini ekibe atması gerçek senaryo).
  - Server Component upgrade path Audit + Stats için değerli (admin paneli performance-sensitive).
  - "Major nav = sub-route, filter/modal/ephemeral = query param" endüstri standardı (Jira, GitHub, Linear, Atlassian Admin Console hepsi sub-route kullanıyor).
- **D-C2:** **Route shape:**
  - `app/(shell)/admin/layout.tsx` — admin-only guard + Tabs primitive (Link tabanlı, `usePathname()` ile active detection)
  - `app/(shell)/admin/page.tsx` — Overview (default sub-tab)
  - `app/(shell)/admin/users/page.tsx`
  - `app/(shell)/admin/roles/page.tsx`
  - `app/(shell)/admin/permissions/page.tsx`
  - `app/(shell)/admin/projects/page.tsx`
  - `app/(shell)/admin/workflows/page.tsx` (Templates)
  - `app/(shell)/admin/audit/page.tsx`
  - `app/(shell)/admin/stats/page.tsx`
- **D-C3:** **Admin-only route guard.** `app/(shell)/admin/layout.tsx` reads `useAuth().user.role` and:
  - If unauthenticated → redirect `/auth/login?next=/admin`.
  - If authenticated but `role !== 'Admin'` → redirect `/dashboard` + Toast notification "Bu sayfaya erişim yetkiniz yok".
  - If admin → render children.
  - Server-side companion: every admin endpoint uses `Depends(require_admin)`. Frontend guard is UX; backend guard is security.
- **D-C4:** **Tabs primitive Link tabanlı render.** Existing `Tabs` primitive from Phase 8 supports `onChange` callback only. **Decision:** Extend or wrap `Tabs` to accept `as="link"` prop that renders each tab as `<Link href={tabHref}>` instead of button + onChange. OR build a thin `<NavTabs/>` wrapper specifically for sub-route tabs. Planner picks. Critical: keyboard nav (Tab/Arrow) preserved.
- **D-C5:** **State preservation across tab switches.** Tab unmount + remount default kaybolan state (filters, scroll, draft inputs):
  - **URL-driven state** for filters that should be bookmarklenebilir (Audit filter date range → query params, e.g., `/admin/audit?from=2026-04-01&actor=u1`).
  - **localStorage** for ephemeral state per Phase 11 D-21 pattern (e.g., Users tab role filter `spms.admin.users.filter`).
  - **Lost on switch** for transient state (open modals, scroll position) — acceptable.
- **D-C6:** **Lazy loading.** Audit + Stats are network-heavy. Their `page.tsx` files use Next.js dynamic imports for the chart components and table rendering, ensuring `/admin` overview JS bundle stays small. Audit tab fetches first 50 rows server-side (Server Component) when possible, hydrates filter UI on client. Stats tab same pattern.

### Audit Log Detail Enhancement (Area 4)

- **D-D1:** **Cross-cutting Jira-style audit detail.** Backend audit_log writes are enriched with extra_metadata; frontend audit-event-mapper + activity-row are extended to render Jira-level human-readable lines. Affects 4 surfaces: `/admin/audit` (new), ProjectDetail Activity tab (Phase 13), Profile Activity tab (Phase 13), Dashboard ActivityFeed (Phase 10). **Single shared improvement, multiple surface uplift.**
- **D-D2:** **Backend enrichment scope (Plan 14-09).** Each audit_log write site is updated to populate `extra_metadata` with:
  - **Task field changes** (`task_repo.py`): `{task_id, task_key, task_title, project_id, project_key, project_name, field_name, old_value_label, new_value_label}`. For `column_id` changes, label resolution via `BoardColumn.name` lookup at write time (avoids stale snapshot); fallback: numeric column_id if column deleted.
  - **Project field changes** (`project_repo.py`): `{project_id, project_key, project_name, methodology, field_name, old_value_label, new_value_label}`. For `status` changes (ACTIVE → ARCHIVED), label is the enum value.
  - **Comment events**: `{task_id, task_key, task_title, comment_id, comment_excerpt (160-char with ellipsis if longer)}`. NEVER store the full comment body in audit_log to avoid PII leak; comment table remains source of truth.
  - **Milestone events** (`create/update milestone use cases`): `{milestone_id, milestone_title, project_id, project_key, status_old?, status_new?}`.
  - **Artifact events**: `{artifact_id, artifact_name, project_id, project_key, status_old?, status_new?}`.
  - **Phase report events**: `{report_id, project_id, project_key, source_phase_id, source_phase_name}`.
  - **User lifecycle events** (Phase 14 NEW): `{user_id, user_email, target_role?, source_role?, requested_by_admin_id?}`.
- **D-D3:** **Frontend audit-event-mapper extension (Plan 14-10).** New `SemanticEventType` union members:
  - `task_field_updated` (catch-all for non-status field changes — due_date, priority, story_points, description, etc.)
  - `project_archived`
  - `project_status_changed`
  - `comment_edited`, `comment_deleted`
  - `user_invited`, `user_deactivated`, `user_activated`, `user_role_changed`, `user_password_reset_requested`
  - `project_join_request_created`, `project_join_request_approved`, `project_join_request_rejected`
- **D-D4:** **Frontend `activity-row.tsx` rich rendering.** New conditional render branches:
  - **`task_field_updated`:** "Yusuf değiştirdi **'{task_title}'** {field_name_localized}: {old_value_label} → {new_value_label}". Localized field names (TR/EN) via small `lib/admin/audit-field-labels.ts` map (e.g., `due_date` → "son tarih" / "due date").
  - **`project_archived` / `project_status_changed`:** "Yusuf arşivledi **'{project_name}'** projesini" / "Yusuf değiştirdi **'{project_name}'** projesinin durumunu: {old} → {new}".
  - **`comment_edited` / `comment_deleted`:** "Yusuf düzenledi yorumunu **'{task_title}'** üzerinde" + optional excerpt.
  - **`user_*` lifecycle:** "Admin Ayşe davet etti **mehmet@example.com**" / "Admin Ayşe rolünü değiştirdi **kullanici_adi**: Member → Project Manager" / etc.
  - **`project_join_request_*`:** "Ayşe (PM) talep etti **kullanici_adi**'ı **'Bankacılık'** projesine eklemek için" / "Admin Yusuf onayladı **kullanici_adi**'ın **'Bankacılık'** projesine katılım talebini".
- **D-D5:** **Audit tab `Detay` column renders the same formatter.** `/admin/audit` table uses `<ActivityRow variant="admin-table"/>` (a new variant of the existing component) which renders compactly in a table cell — single line, no avatar bubble, time on the right. The same metadata-driven Jira formatter feeds it.
- **D-D6:** **Backward compatibility — old audit rows (pre-enrichment) still render.** Frontend formatter checks for missing metadata fields and falls back to the existing minimal rendering. NO migration / backfill of old rows. Rationale: backfill requires re-deriving titles/labels which is impossible for deleted entities; graceful degradation acceptable.

### Stats Data Sources (Sub-section of Area 1)

- **D-X1:** **`/api/v1/admin/stats` composite payload.** Single endpoint, see D-A7 for shape.
- **D-X2:** **Active users trend = on-the-fly audit_log compute.** SQL: `SELECT date_trunc('day', timestamp) AS day, COUNT(DISTINCT user_id) FROM audit_log WHERE timestamp >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`. Definition of "active": user with at least one audit_log entry on that day (any action). **NOT** login-based (no login event written today; could be added v2.1). Daily snapshot table (cron) is v2.1 candidate per scaling cliff (~10k events/day breaks query perf — researcher to validate).
- **D-X3:** **Methodology distribution = direct project query.** `SELECT methodology, COUNT(*) FROM projects WHERE status != 'ARCHIVED' GROUP BY methodology`. Cheap. No caching needed.
- **D-X4:** **Velocity per project = aggregate of GetProjectIterationUseCase.** Reuses Phase 13's iteration aggregation but admin-wide (loop or batch query). Returns `{project_id, key, name, progress, velocity_history: [floats]}` for each non-archived project. Cap at top 30 by recent activity (DoS).

### Roles Tab Display (Area 1 sub-decision)

- **D-Y1:** **Roles tab = display-only with reality-reflected card descriptions.** No CRUD on this tab in v2.0. Card user counts come from `GET /admin/users` aggregate. Cards rendered in 3-column grid (Admin / PM / Member as "system roles", Guest as "v3.0" disabled card, "Yeni rol oluştur" as disabled placeholder card). **Not a frequently-changed surface; cheap to render.**

### Risk Classifier (Area 4 sub-decision)

- **D-Z1:** **Risk classifier = SKIPPED.** No `risk` column in audit table. Rationale: enterprise security convention without functional value in this thesis-project scope (no security incident response workflow, no compliance audit). Audit table column layout: `Time | Actor | Action | Detay | (no risk)`. The `Detay` column carries Jira-style human-readable description (D-D5) — orders of magnitude more useful than a risk badge.

### Audit Pagination (Plan 14-07 sub-decision)

- **D-Z2:** **Audit table pagination via offset.** `GET /api/v1/admin/audit?limit=50&offset=N`. Page size 50 default (configurable 25/50/100 in toolbar). Total count returned in response for "Sayfa N / M" display. Hard cap 50k visible rows (older = exported only via JSON). Filter changes reset offset to 0.

### Cross-cutting Frontend Hardening

- **D-W1:** **Tab unmount semantics (D-C5 follow-up).** Each sub-route uses `<DataState/>` (Phase 13 D-F2) with TanStack Query — query data persists in cache across tab switches (`staleTime: 30s` typical for admin data). Avoids redundant refetch when user toggles between Users and Audit then back to Users.
- **D-W2:** **Optimistic updates limited to bulk actions.** Approve/Reject join requests and bulk-deactivate use optimistic updates (server confirmed within 500ms typical) for snappy UX. Failure → revert + Toast with retry. Single-user actions (Add user, Reset password) use confirmation toast on success — no optimism needed.
- **D-W3:** **CSV export via server-side endpoint, NOT client-side.** Both Users CSV and Audit JSON downloads are server-rendered (`Content-Disposition: attachment`) — avoids browser memory cap on large datasets and ensures consistent encoding (UTF-8 BOM for Excel-friendliness).

### Claude's Discretion

- **`Tümünü gör` pending requests button behavior** — modal vs separate page. Recommend: modal with full pagination (consistent with prototype's "view all" pattern; no need for new route).
- **Stats chart libraries** — recharts already installed (Phase 13). Reuse. No new lib eval.
- **`Rapor al` PDF content & template** — admin summary content (KPIs to include) is open. Recommend: 1-page summary (user count + delta, active project count, top 5 most-active projects, top 5 most-active users). Reuse Phase 12 fpdf2.
- **Tabs primitive Link wrapper** — extend existing primitive vs build `<NavTabs/>`. Planner picks based on Tabs API surface.
- **Audit `Filtre` modal exact UX** — sheet vs popover vs full modal. Default: anchored popover (consistent with Phase 13 D-A5 SegmentedControl pattern).
- **Bulk invite progress feedback** — submit button "spinner" vs progress bar. Default: spinner + "{N} davet gönderiliyor..." text + final summary modal.
- **Active users trend tooltip** — hover shows daily count + active users list (top 5). Default: just the daily count + date.
- **Email invite link expiry** — 7 days for first-time invites (vs 24h for password reset). Configurable in `app/core/config.py`.
- **`/admin/users` table density** — compact (table density toggle if Phase 11 supports it) vs default. Default: comfortable density, no toggle.
- **Audit row click behavior** — expand inline vs modal vs no-op. Default: no-op (Detay column already shows everything; deep-link to entity from refLabel is sufficient).
- **Stats refresh policy** — `refetchOnWindowFocus: true` per Phase 13 D-B3, plus `staleTime: 60s` to avoid aggressive backend hammering.

### Folded Todos

None — `gsd-sdk todo.match-phase` was not invoked (Phase 14 just created; no pre-existing matched todos in this snapshot). If todos surface during planning, fold via `/gsd-add-todo` or note in PLAN.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prototype Source Files (design authority — port verbatim per D-00)

- `New_Frontend/src/pages/admin.jsx` (full file, 482 lines) — **Authoritative for AdminPage + 8 sub-tab visuals + interactions.** AdminPage outer (Tabs + sub-tab dispatch + header w/ Shield icon + Rapor al / Denetim günlüğü buttons), AdminOverview (5 StatCards row + Pending Project Join Requests panel + Role distribution + Recent admin events), AdminUsers (search + role filter + bulk select + table grid template + add/bulk-invite/CSV buttons + per-row MoreH), AdminRoles (4 cards + dashed-border "Yeni rol" placeholder), AdminPermissions (Permission Matrix grid + toggle visuals), AdminProjects (project listing grid template), AdminWorkflows (template card grid), AdminAudit (audit log table grid template + filter buttons + JSON export), AdminStats (active users trend SVG + methodology bars + velocity per project mini bars). Phase 14 ports verbatim into TypeScript + i18n + token styles.
- `New_Frontend/src/shell.jsx` lines 100-155 — **Authoritative for AvatarDropdown** (already implemented in Phase 13). Phase 14 verifies the Admin Paneli link routes correctly to `/admin`.
- `New_Frontend/src/primitives.jsx`, `theme.jsx`, `icons.jsx` — Visual reference for any prototype primitive used by admin.jsx that must be reproduced in Frontend2 (already covered by Phase 8 primitives, no new ones expected).

### Frontend2 Existing Code (build on top of)

- `Frontend2/components/header/avatar-dropdown.tsx` (Phase 13) — Phase 14 VERIFIES the Admin Paneli link works post-implementation. No code changes expected unless guard logic needs hardening.
- `Frontend2/components/header.tsx` — Phase 14 may wire `Rapor al` / `Denetim günlüğü` buttons here (Plan 14-11). Currently Phase 13's AvatarDropdown sits top-right; admin Rapor al / Denetim günlüğü move into the page-header of `/admin/layout.tsx` per prototype, NOT global header.
- `Frontend2/components/primitives/tabs.tsx` (Phase 8) — Phase 14 EXTENDS or wraps to support Link-based render (D-C4). Critical: keyboard nav preserved.
- `Frontend2/components/primitives/data-state.tsx` (Phase 13 D-F2) — REUSED on every admin tab.
- `Frontend2/components/primitives/avatar.tsx` + AvatarStack (Phase 8 + Phase 13 D-D4 href extension) — REUSED on Users tab + Pending Requests + Audit + Stats.
- `Frontend2/components/primitives/{badge,button,input,segmented-control,confirm-dialog,toast}.tsx` — REUSED.
- `Frontend2/components/dashboard/stat-card.tsx` — REUSED for Overview's 5 StatCards.
- `Frontend2/components/activity/activity-row.tsx` (Phase 13) — Phase 14 EXTENDS with new variant `admin-table` + new render branches for the new SemanticEventType members (Plan 14-10).
- `Frontend2/lib/audit-event-mapper.ts` (Phase 13) — Phase 14 EXTENDS the SemanticEventType union (Plan 14-10).
- `Frontend2/lib/activity/event-meta.ts` (Phase 13) — Phase 14 EXTENDS the verb formatter to consume enriched metadata (Plan 14-10).
- `Frontend2/services/profile-service.ts` (Phase 13) — Reference for service-layer pattern. Phase 14 creates 4 new services following same shape.
- `Frontend2/hooks/` (Phase 13) — Reference for hooks pattern. Phase 14 creates ~8 new hooks.
- `Frontend2/context/auth-context.tsx` `useAuth()` (Phase 10) — Provides `currentUser` + `role` for admin guard + `logout()`.
- `Frontend2/context/app-context.tsx` `useApp()` — Language for i18n.

### Frontend2 New Files (non-exhaustive — planner may add)

- `Frontend2/app/(shell)/admin/layout.tsx` — admin route guard + Tabs.
- `Frontend2/app/(shell)/admin/page.tsx` (Overview), `users/page.tsx`, `roles/page.tsx`, `permissions/page.tsx`, `projects/page.tsx`, `workflows/page.tsx`, `audit/page.tsx`, `stats/page.tsx`.
- `Frontend2/components/admin/{overview,users,roles,permissions,projects,workflows,audit,stats}/` per-tab components (~30+ files total).
- `Frontend2/components/admin/add-user-modal.tsx`, `bulk-invite-modal.tsx`, `audit-filter-modal.tsx`, `pending-requests-modal.tsx`.
- `Frontend2/services/{admin-join-request,admin-user,admin-stats,admin-audit}-service.ts`.
- `Frontend2/hooks/{use-pending-join-requests,use-approve-join-request,use-admin-users,use-admin-stats,use-admin-audit,use-bulk-invite}.ts`.
- `Frontend2/lib/admin/permissions-static.ts` — placeholder permission map (read-only display).
- `Frontend2/lib/admin/audit-field-labels.ts` — TR/EN field name localization (D-D4).

### Backend Existing (Phase 9 + Phase 12 + Phase 13 — already wired)

- `Backend/app/api/v1/users.py` — Phase 9 user endpoints (GET, summary). Phase 14 EXTENDS with admin-scoped CRUD endpoints (or builds new `Backend/app/api/v1/admin/` package).
- `Backend/app/api/v1/admin_settings.py` — already exists (system config). Phase 14 ADDS new admin routers next to it.
- `Backend/app/api/v1/activity.py` — Phase 9 audit log read endpoints. Phase 14 ADDS admin-wide read.
- `Backend/app/api/v1/process_templates.py` — Workflows tab READS from this. Phase 14 doesn't modify.
- `Backend/app/api/v1/projects.py` — Projects tab READS from this. Phase 14 doesn't modify.
- `Backend/app/api/deps/auth.py` `require_admin` — REUSED on all admin endpoints (already exists).
- `Backend/app/domain/repositories/audit_repository.py` — Phase 14 EXTENDS with `get_global_audit(filters, ...)` method.
- `Backend/app/infrastructure/database/repositories/{task,project}_repo.py` — Phase 14 ENRICHES `extra_metadata` JSONB on audit writes (Plan 14-09).
- `Backend/app/application/use_cases/manage_system_config.py` — pattern reference for admin-scoped use cases.

### Backend NEW Files (Phase 14 scope)

- `Backend/app/domain/entities/project_join_request.py` — domain entity.
- `Backend/app/domain/repositories/project_join_request_repository.py` — repo interface.
- `Backend/app/infrastructure/database/models/project_join_request.py` — SQLAlchemy model.
- `Backend/app/infrastructure/database/repositories/project_join_request_repo.py` — repo impl + mapper.
- `Backend/app/application/use_cases/{create,approve,reject,list_pending}_join_request.py`.
- `Backend/app/application/dtos/project_join_request_dtos.py`, `admin_user_dtos.py`, `admin_stats_dtos.py`, `admin_audit_dtos.py`.
- `Backend/app/application/use_cases/{invite,deactivate,bulk_invite,reset_password,bulk_action}_user.py`.
- `Backend/app/application/use_cases/get_admin_stats.py`, `get_global_audit.py`, `generate_admin_summary_pdf.py`.
- `Backend/app/api/v1/admin_join_requests.py`, `admin_users.py`, `admin_audit.py`, `admin_stats.py` (or single `admin/__init__.py` aggregator router).
- `Backend/alembic/versions/006_admin_panel.py` — migration for `project_join_requests` table only (no other schema changes; RBAC tables deferred per D-A2).
- `Backend/tests/integration/admin/` — integration tests for all new admin endpoints.

### Project Context

- `.planning/PROJECT.md` — v2.0 milestone goal, design freeze, prototype-fidelity rule, Out of Scope.
- `.planning/REQUIREMENTS.md` — v2.0 requirements (Phase 14 has NO formal requirement; user-driven addition).
- `.planning/STATE.md` — Phase 13 complete; Phase 14 added 2026-04-26.
- `.planning/codebase/ARCHITECTURE.md` — Clean Architecture layer rules (Domain → Application → Infrastructure → API).
- `.planning/codebase/CONVENTIONS.md` — Naming (snake_case files / PascalCase classes / I-prefix interfaces / DTO suffix).
- `.planning/codebase/STACK.md` — FastAPI / SQLAlchemy async / Next.js / React 19 / TanStack Query v5 / Tailwind.
- `.planning/codebase/TESTING.md` — Pytest + integration test conventions.
- `.planning/phases/09-backend-schema-entities-apis/09-CONTEXT.md` — Phase 9 audit_log structure, error taxonomy, vertical-slice pattern. **Phase 14 mirrors these.**
- `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-CONTEXT.md` — Phase 12 D-02 fat infra plan pattern, D-09 in-memory fakes for backend integration tests, D-58 PDF rate-limit + download pattern. **Phase 14 reuses.**
- `.planning/phases/13-reporting-activity-user-profile/13-CONTEXT.md` — Phase 13 D-00 quality bar, D-D2 avatar-dropdown admin link, D-F2 DataState primitive, audit-event-mapper structure. **Phase 14 extends.**
- `Frontend2/CLAUDE.md` + `Frontend2/AGENTS.md` — "This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing code." Phase 14 creates new sub-routes + extends primitives — researcher MUST verify Next.js current API for nested routing + parallel routes (if any) + admin guard placement.
- `Backend/CLAUDE.md` (root `CLAUDE.md`) — Clean Architecture + SOLID + DI rules. Every new entity follows the strict workflow.

### Research Items (for gsd-phase-researcher)

- **Active users daily trend SQL strategy** — on-the-fly compute scaling cliff. Run EXPLAIN on the query; document threshold where materialized view becomes necessary. v2.1 candidate.
- **Permission Matrix UI / RBAC primer for v3.0** — Survey common RBAC implementations (Casbin, oso, Casdoor, OpenFGA) for v3.0 phase. Phase 14 doesn't implement, but findings file useful.
- **CSV parsing in browser (Bulk Invite)** — RFC 4180 compliance, encoding detection (UTF-8 BOM), max-rows guard. Recommend papaparse vs hand-rolled. Pinned version.
- **fpdf2 admin summary PDF — Phase 12 pattern reuse** — confirm fpdf2 still works for admin summary; design 1-page layout.
- **Email invite token TTL choice** — 7d for invite vs 24h for reset — research industry defaults (Auth0 / Clerk / Okta default to 24h-7d range; document choice).
- **Audit detail rendering edge cases** — old audit rows with no enrichment (D-D6 fallback paths). Test with seeded pre-Phase-14 audit_log rows to validate graceful degradation.
- **Bulk action atomicity** — single transaction vs per-user transaction (rollback semantics on partial failure). Recommend per-user with status reporting.
- **Admin route guard SSR vs CSR** — server-component check vs client-side useAuth() check vs middleware. Phase 13 used client-side check; Phase 14 may benefit from middleware for consistent UX during page-load redirect.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **All 16+ Frontend2 primitives** — All admin tabs use them (Tabs, Card, Button, Badge, Input, Avatar, AvatarStack, SegmentedControl, ConfirmDialog, Toggle, Kbd, etc.). No new primitive expected.
- **`<DataState/>` primitive (Phase 13)** — REUSED on every tab for loading/error/empty.
- **`<AvatarDropdown/>` (Phase 13)** — Already wired with admin link.
- **`<StatCard/>` (Phase 10 dashboard)** — REUSED for Overview's 5 StatCards.
- **`<ActivityRow/>` (Phase 13)** — REUSED + EXTENDED with `admin-table` variant + new SemanticEventType branches.
- **`<ConfirmDialog/>` (Phase 10 D-25)** — Used for delete user, deactivate user, delete template, archive project confirmations.
- **`<ToastProvider/>` (Phase 10 D-07)** — Used for action success/failure feedback.
- **`useAuth()` (Phase 10)** — `currentUser` + `role` + `logout()`.
- **`useApp()` (Phase 8)** — Language for i18n.
- **TanStack Query v5** — All admin fetches; `refetchOnWindowFocus`.
- **fpdf2 (Phase 12)** — REUSED for admin summary PDF.
- **Phase 2 PasswordResetToken entity + use cases** — REUSED for invite flow + reset password flow.
- **Phase 5 email infrastructure** — REUSED for invite + reset emails.
- **Phase 9 `IAuditRepository` + `audit_log.extra_metadata` JSONB** — REUSED + extended.
- **`require_admin` Depends (Phase 9)** — REUSED on every admin endpoint.

### Established Patterns

- **`"use client"` directive** on every interactive component.
- **Named exports** (`export function X`).
- **`@/` path alias**.
- **Inline styles with CSS tokens** (oklch + var(--*) — preserved everywhere).
- **Service layer + hooks layer** (Phase 10/11/12/13 pattern).
- **Optimistic updates** — Phase 14 uses for bulk actions and approve/reject join requests (D-W2).
- **Error code taxonomy** — Phase 9 convention reused for all new admin endpoints.
- **Phase 11 D-21 localStorage per-project pattern** — applied to per-tab filter persistence (e.g., `spms.admin.users.filter`).
- **Phase 12 D-02 fat infra plan pattern** — applied to Plan 14-01.
- **Phase 12 D-04 unit + RTL test pattern** — applied to all Phase 14 plans except 14-12 (E2E).
- **Phase 13 D-00 quality bar** — carried forward verbatim (D-00 in this CONTEXT.md).

### Integration Points

- **`Frontend2/app/(shell)/layout.tsx`** — Phase 14 admin layout sits inside this; no changes to outer shell.
- **`Frontend2/components/header/avatar-dropdown.tsx`** — Phase 13 already wired; Phase 14 verifies post-implementation.
- **`Frontend2/components/activity/activity-row.tsx`** — EXTENDED with new variants + render branches (Plan 14-10).
- **`Frontend2/lib/audit-event-mapper.ts`** — EXTENDED with new SemanticEventType union members (Plan 14-10).
- **`Frontend2/lib/activity/event-meta.ts`** — EXTENDED verb formatter (Plan 14-10).
- **Backend `Backend/app/infrastructure/database/repositories/{task,project}_repo.py`** — ENRICHED audit_log writes (Plan 14-09).
- **Backend `Backend/app/api/v1/users.py`** — Phase 9 user CRUD; Phase 14 does NOT modify (admin endpoints in separate router).
- **Backend `Backend/app/api/v1/process_templates.py`** — Workflows tab reads; Phase 14 does NOT modify.
- **Backend NEW `Backend/app/api/v1/admin_*.py`** routers — wired in `Backend/app/api/v1/__init__.py`.
- **Backend NEW `Backend/alembic/versions/006_admin_panel.py`** — migration adds `project_join_requests` table only.

### Cross-File Dependency Rules

- All new admin endpoints MUST honor `Depends(require_admin)` — security gate.
- Admin route guard MUST be both client-side (UX) AND server-side (security) — neither alone is sufficient.
- Audit-log enrichment in `task_repo.py` / `project_repo.py` MUST not break existing Phase 13 ActivityTab rendering — frontend gracefully degrades on missing metadata fields (D-D6).
- New SemanticEventType union members MUST be exhaustive — both `mapAuditToSemantic` and `semanticToFilterChip` updated together (TypeScript enforces).
- `ProjectJoinRequest` approval MUST trigger existing TeamProjects join logic atomically — no separate side effect tracks.
- Bulk invite CSV upload MUST be size-capped (500 rows) and validated row-by-row before any database write.
- Email invite + reset flows MUST reuse existing Phase 2 PasswordResetToken machinery — no new token entity.
- Stats endpoint MUST cache aggregations (TanStack Query staleTime 60s) to avoid hammering audit_log COUNT queries.
- Permission Matrix toggles MUST be `disabled` AND `aria-disabled="true"` AND have visible "v3.0" badge — multiple defenses against accidental click handlers in v3.0 implementation.
- Admin layout MUST NOT mount sub-tab pages — each sub-tab is a separate Next.js route segment with its own bundle.

</code_context>

<specifics>
## Specific Ideas

- **"birebir aynısını tamamen işlevsel"** (user-stated phase description): Every prototype element MUST be ported pixel-for-pixel; every action MUST be functional except RBAC-deferred items. RBAC defer was a separate, explicit user decision during discussion.
- **"rbac alt yapısını deffer edelim, şuan place holder kalsın, önceki role entity kararını da full entegrasyon olucak şekilde deffer edelim"** (D-A2..A4): Roles + Permissions tabs are visual placeholders. Role entity, Permission entity, RolePermission junction = NOT BUILT in v2.0. Existing `users.role` enum preserved.
- **"sahiplik değişimine ihtiyaç yok, yönetim işleri o projedeki pmlere ait, roller proje based olucak, bir projede pm olan öbüründe üye olabilir. Sadece adminlik sistem geneli olucak"** (D-A5, D-B5): Per-project PM-ship via Team.leader_id (Phase 9 D-17), system-wide Admin only. Roles tab card descriptions reflect this reality (replaces prototype's misleading "all roles are global" implication).
- **"audit logun şuanki durumundan memnun değilim, son aktiviteler tabından da memnun değilim, yusuf oluşturdu yazıyor, yusuf neyi oluşturdu ne yaptı? açıklama olarak ne yazdı bunların hiçbiri yok, jira gibi detaylı bir loglama istiyorum"** (D-D1..D6): Cross-cutting Jira-style audit detail. Backend `extra_metadata` enrichment + frontend audit-event-mapper extension + activity-row rich rendering. Affects /admin/audit + ProjectDetail Activity tab + Profile Activity tab + Dashboard ActivityFeed (single improvement, multiple surface uplift).
- **"risk seviyesinden kasıt nedir? ne için buna ihtiyacımız var?"** (D-Z1): User questioned the value. Honest answer given: enterprise security convention with no functional value in this thesis-project scope. SKIPPED. Detay column replaces it.
- **"sub-route yapalım, zaten componentlere ayırıcağız, 8 9 sayfa yapmak çok yormaz"** (D-C1): Sub-route'lar locked; rationale captured in CONTEXT for cross-phase consistency justification.
- **"jira nasıl yapıyor?"** (during D-C1 discussion): Industry-best-practice rationale documented inline. Major nav = sub-route, filter/modal/ephemeral = query param.
- **3 columns CSV format** (D-B4): `email,name,role` with header optional. Lower friction for invite-email personalization.
- **Email invite expiry 7 days** (D-W3 / Discretion): More forgiving than password-reset 24h since invites are typically processed asynchronously by the recipient.
- **Audit `Detay` column = single-line Jira render** (D-D5): Compact, table-friendly variant of the same component used in Activity tabs. One source of truth for the human-readable formatter.

</specifics>

<deferred>
## Deferred Ideas

### Pushed to v3.0 (RBAC overhaul phase)

- **Role entity, Permission entity, RolePermission junction** — full RBAC infrastructure (D-A2). Custom roles, dynamic permission grants, granular per-action authorization. Phase 14 builds visual placeholder.
- **Permission Matrix toggle enforcement** — backend permission DSL + endpoint refactor. Phase 14 toggles disabled.
- **"Yeni rol oluştur"** — custom role creation flow.
- **Per-project role overrides** — currently only Team.leader_id distinguishes PM from Member at project level. v3.0 could add granular per-project permission grants.
- **SSO / SAML / OIDC integration** — `auth.sso.update` audit type. Out of v2.0 scope (PROJECT.md Out of Scope).
- **MFA / TOTP enrollment** — `auth.mfa.reset` audit type. Out of v2.0 scope.
- **Audit log retention policy + archival** — currently audit_log grows unbounded. v3.0 candidate: monthly archival cron + S3 cold storage.
- **Audit log streaming export (NDJSON)** — for very large exports. v2.1 candidate if usage demands.
- **Real-time audit alerts** — Slack/email triggers on high-risk actions. Out of scope.

### Pushed to v2.1

- **Active users daily snapshot table + cron** — replaces on-the-fly compute when query times exceed threshold (~10k events/day).
- **Materialized view for methodology distribution** — only if query performance degrades.
- **Per-card filter override on `/admin/stats`** — currently 30-day fixed window for active users. v2.1: configurable.
- **Login event audit_log write** — current "active user" definition uses any audit row; v2.1 could write explicit `auth.login_success` rows for cleaner semantics.
- **Admin email template editor** — Phase 5 default templates used in v2.0; v2.1 could expose admin-editable templates.
- **Mobile <640px specific layouts for admin** — admin is desktop-first per industry convention. v2.1 if mobile usage emerges.
- **Audit row click → entity deep-link** — currently admin audit row click does nothing (Detay column has refLabel which is clickable already). v2.1: full row click → entity navigation.

### Pushed to /gsd-verify-work pass

- Manual UAT click-through against `14-UAT-CHECKLIST.md` (Plan 14-12 artifact, ~25-30 rows for all 8 tabs + invite/reset email delivery + bulk CSV happy/error paths + admin route guard). To be picked up after Phase 14 plans complete.
- Email delivery testing end-to-end (requires SMTP test setup) — deferred to UAT environment.

### Out of Scope (per PROJECT.md / REQUIREMENTS.md)

- Real-time admin event streaming (WebSocket).
- Mobile native push notifications.
- HttpOnly cookie JWT migration (v3.0 ADV-02).
- GraphQL API for admin (v3.0 ADV-03).
- AI-powered admin insights / anomaly detection (v3.0 candidate).

### Reviewed Todos (not folded)

None — gsd-sdk todo system not invoked for Phase 14 (just-created phase).

### Cross-phase scope flags (Phase 14+ may surface)

- **Test DB seeder** — Phase 11/12/13 deferred. Phase 14 E2E (Plan 14-12) ships with skip-guards (Phase 13 13-10 pattern).
- **Audit retention** — unbounded growth could affect audit table query perf at year-end of v2.0 usage. v2.1 archival cron.
- **`role` enum vs Role entity** — full integration in v3.0 will require a multi-phase migration (data backfill + endpoint refactor + frontend role-check refactor). Document the migration path before v3.0 starts.
- **Active users compute scaling cliff** — researcher to validate threshold; document before Phase 14 ships.

</deferred>

---

*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Context gathered: 2026-04-26*

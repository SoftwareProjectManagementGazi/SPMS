# Phase 14: Admin Panel — Research

**Researched:** 2026-04-27
**Domain:** Next.js 16 App Router nested route group + admin-only guard + 8 sub-route admin console + Clean-Architecture FastAPI extension (`ProjectJoinRequest` vertical slice + 4 admin router groups + audit-log enrichment cross-cutting) + Frontend2 primitive reuse (17 → 18 after `NavTabs`) + Jira-style audit detail rendering on extended `audit-event-mapper`
**Confidence:** HIGH (prototype contract, reuse map, backend router shape, recharts/Clean-Arch reuse, runtime state) — MEDIUM (active-users SQL scaling cliff, exact bundle delta from papaparse install, NavTabs vs Tabs-extension trade)

## Summary

Phase 14 ports `New_Frontend/src/pages/admin.jsx` (482 lines, 8 sub-tabs + AdminPage outer + AdminOverview/Users/Roles/Permissions/Projects/Workflows/Audit/Stats children) into Frontend2 as **eight Next.js 16 sub-routes** under `app/(shell)/admin/` plus a shared `layout.tsx` carrying the admin-only route guard, page header, and a NEW `<NavTabs/>` Link-based tab strip. Every interactive surface that is **not** RBAC-deferred is wired to a real backend endpoint — most reuse Phase 9/10/11/12/13 plumbing, but Phase 14 ships **one new entity** (`ProjectJoinRequest` — full vertical slice), **four new router groups** (`admin/users`, `admin/audit`, `admin/stats`, `admin/join-requests`), one **PDF endpoint** (`/admin/summary.pdf` reusing Phase 12 fpdf2), and one **cross-cutting backend change** — `extra_metadata` JSONB enrichment in 5+ audit_log write sites (D-D2). RBAC tabs (Roller / İzin Matrisi) are **visual placeholders** with disabled toggles + clarified copy + page-level info AlertBanner per CONTEXT D-A2..A5.

The frontend reuse story is favorable: **0 new primitives** beyond NavTabs, **0 new chart libraries** (recharts@3.8.1 already shipped Phase 13), **1 primitive extension** (ConfirmDialog gains `tone?: "primary" | "danger" | "warning"` per UI-SPEC §Color), **all 17 existing primitives reused as-shipped**, all hooks/services/context layers reused, and the AvatarDropdown's Admin Paneli link is already wired (Phase 13 D-D2). The audit-event-mapper extension (10 → 23 SemanticEventTypes) and ActivityRow `variant="admin-table"` are cross-cutting (D-D1) — the same Jira render lights up `/admin/audit` + ProjectDetail Activity tab + Profile Activity tab + Dashboard ActivityFeed in one shot. **One new dependency** is required: `papaparse@^5.5.3` for client-side bulk-invite CSV parsing (~45 KB gz, MIT, RFC-4180-compliant) — `[VERIFIED: npmjs.com latest 5.5.3, Frontend2/node_modules/papaparse missing]`.

The backend story is heavier but bounded: ~30-35 files in the Wave 0 fat infra plan (D-01 / Plan 14-01) using the Phase 12 D-02 pattern, then ~6-8 files per surface plan, plus a single Alembic migration **006** that adds **only** the `project_join_requests` table (no RBAC tables — D-A2). The `users.role` enum stays untouched. `require_admin` already exists in `Backend/app/api/deps/auth.py` — every new admin endpoint reuses it verbatim. The `extra_metadata` JSONB column already exists from Phase 9 D-09 (migration 005) — no schema change needed for D-D2 enrichment.

**Estimated plan count: 12 plans (~95-110 file touches) — fits standard mode (no chunking required).**

**Primary recommendations:**
1. **Build a thin `<NavTabs/>` wrapper** (NEW primitive, ~50 LOC) over Next.js `<Link>` rather than extending the existing `Tabs` primitive with an `as="link"` mode discriminator — preserves backward compat for Phase 11/12/13 callers and keeps the existing `onChange` API clean. The wrapper uses `usePathname()` for active detection and renders `<Link href>` per tab; styling stays identical to `Tabs` (verbatim copy of PAD/FONT maps + bottom-border treatment). Add to barrel export.
2. **Plan 14-01 (Wave 0 fat infra) MUST install `papaparse@^5.5.3` + `@types/papaparse`** alongside the backend `ProjectJoinRequest` slice. CSV parsing for bulk invite is non-trivial (RFC-4180 quoting, encoding detection, header autodetect, max-rows guard) — rolling our own would burn 6-8h with no upside. `[VERIFIED: papaparse zero-dep, MIT, RFC-4180 compliant]`.
3. **Reuse Phase 13 D-F2 `<DataState/>` primitive on every async surface** — Overview StatCards, Pending Requests panel, Users table, Projects table, Templates grid, Audit table, Stats charts. 9 consumer sites total. Avoids inconsistent loading/error/empty states across the 8 tabs. Pattern reference: `Frontend2/components/dashboard/activity-feed.tsx` lines 74-86 retro-adoption.
4. **Audit-event-mapper extension (Plan 14-10) MUST stay backward-compatible** — D-D6 graceful degradation: any audit row missing the new `extra_metadata` keys (e.g., pre-Phase-14 rows that lack `task_title`, `project_name`) falls through to the existing minimal render. No backfill migration. This is a hard contract: `/admin/audit` must never render a blank cell from a missing key.
5. **Admin-only route guard MUST be both client (`useAuth().user.role`) AND middleware (cookie-presence + role check)** — middleware adds `/admin/:path*` to `Frontend2/middleware.ts` matcher; client guard in `app/(shell)/admin/layout.tsx` provides Toast-aware redirect UX. Backend `Depends(require_admin)` is the authoritative third defense layer. Three layers; only the backend is the security boundary, the others are UX. `[VERIFIED: Frontend2/middleware.ts:14-22 currently lacks /admin in matcher]`.
6. **Cap audit/stats payloads server-side** — `/api/v1/admin/audit?limit=50&offset=N` (D-Z2 — 50k hard cap), `/api/v1/admin/stats` velocity array capped at top-30-by-recent-activity (D-X4 — DoS guard). Both rules already locked in CONTEXT.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Admin route guard (UX redirect + toast) | Browser / Client | Frontend Server (middleware cookie check) | `useAuth()` lives client-side; pathname/role checks happen at the layout level. Middleware enforces `/admin/:path*` requires the auth-session cookie before SSR even renders. |
| Admin route guard (security) | API / Backend | — | `Depends(require_admin)` on every admin endpoint is the only authoritative gate. Frontend defenses are bypassable. |
| ProjectJoinRequest CRUD (entity, repo, use cases, router, migration) | API / Backend | Database (PostgreSQL `project_join_requests` table + FK to projects, users, teams) | New entity; full Clean Architecture vertical slice. Domain service for state machine `pending → approved | rejected | cancelled`. |
| Admin user CRUD (invite/role/deactivate/reset/bulk) | API / Backend | Database (`users` table — existing role enum + is_active flag) | Reuses existing `users.role` enum (D-A2 — no new role entity). Reuses Phase 2 PasswordResetToken for invite + reset flows. Reuses Phase 5 email infra. |
| Audit log enrichment (`extra_metadata`) | API / Backend | Database (`audit_log.metadata` JSONB column — already exists Phase 9 D-09) | Cross-cutting backend change — 5+ write sites (`task_repo`, `project_repo`, comment use cases, milestone/artifact/phase_report use cases) populate JSONB with task_title, project_name, old_value_label, new_value_label, comment_excerpt. |
| Audit log Jira-style render | Browser / Client | — | `audit-event-mapper.ts` extension (10 → 23 SemanticEventTypes) + `event-meta.ts` verb formatter + `activity-row.tsx` variant `admin-table`. Single source of truth feeds 4 surfaces (Activity Tab, Profile Activity, Dashboard ActivityFeed, /admin/audit). |
| Active users trend SQL aggregation | API / Backend | Database (`audit_log` + `date_trunc('day', timestamp)`) | On-the-fly compute v2.0 (D-X2). Daily snapshot table is v2.1 candidate at scaling cliff (~10k events/day — researcher to validate). |
| Methodology distribution + velocity | API / Backend | Database (`projects` GROUP BY + per-project iteration aggregation) | Cheap GROUP BY; per-project velocity reuses Phase 13 GetProjectIterationUseCase. Top-30 cap (D-X4). |
| Active users trend chart render | Browser / Client | — | recharts `<LineChart/>` + `<AreaChart/>` overlay. `"use client"` directive required. |
| Methodology bars / Velocity mini-bars | Browser / Client | — | Pure CSS `<div>` bars driven by `var(--*)` percentages — NO recharts geometry needed (UI-SPEC §Spacing line 38). |
| Pending Requests panel (top-5 + modal) | Browser / Client | API / Backend (`GET /api/v1/admin/join-requests?status=pending&limit=5`) | Modal opens "Tümünü gör" — inline modal with full pagination per Discretion. |
| Bulk invite CSV parsing | Browser / Client | API / Backend (`POST /api/v1/admin/users/bulk-invite` validates server-side too) | papaparse client-side parse + per-row backend validation + commit-or-skip strategy (D-B4). Max 500 rows DoS guard. |
| Bulk action atomicity (deactivate / role change) | API / Backend | Database (per-user transaction with status reporting) | Per-user transaction recommended (researcher pattern from canonical_refs). Per-user audit log write. |
| Tab navigation across sub-routes | Browser / Client | Frontend Server (Next.js routing) | NavTabs + Next.js `<Link>` + `usePathname()`. Each sub-route is a separate Next.js route segment with its own bundle. |
| State preservation (filter/scroll across tabs) | Browser / Client | — | URL-driven filters (Audit date range → query params) + localStorage per-tab (`spms.admin.users.filter`). Modals + scroll lost on switch — acceptable. |
| CSV export (Users) / JSON export (Audit) | API / Backend | — | Server-rendered (`Content-Disposition: attachment`) per D-W3 — avoids browser memory cap, ensures UTF-8 BOM consistency for Excel. |
| Admin summary PDF (`Rapor al`) | API / Backend | — | Reuses Phase 12 fpdf2 PDF service. New use case `GenerateAdminSummaryPDFUseCase`. Endpoint `GET /api/v1/admin/summary.pdf`. Rate-limited 30s per Phase 12 D-58. |

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Quality Bar (META — applies to every plan):**
- **D-00:** Prototype-first execution; deliberate-improvement-only deviations. Every Phase 14 surface MUST port the prototype's elements verbatim into TypeScript + i18n + token-driven styles. Improvements over prototype are explicitly tagged `[IMPROVEMENT]` with justification. No silent re-derivations. Source: `New_Frontend/src/pages/admin.jsx` (482 lines).

**Plan Decomposition & Build Order:**
- **D-01:** Sub-route + vertical-slice plan structure — ~14-17 plans target. Strawman ordering: 14-01 Wave 0 shared infra (fat plan) → 14-02 layout + Overview → 14-03 Users → 14-04 Roles + Permissions placeholders → 14-05 Projects → 14-06 Workflows → 14-07 Audit → 14-08 Stats → 14-09 audit-log enrichment cross-cutting (BACKEND) → 14-10 Jira render cross-cutting (FRONTEND) → 14-11 Header buttons + AvatarDropdown verify → 14-12 E2E + UAT artifact.

**Backend Scope (Area 1):**
- **D-A1:** `ProjectJoinRequest` entity = full Clean Architecture vertical slice. Migration 006. State `pending → approved | rejected | cancelled`. Approval triggers existing TeamProjects join logic. Audit entries for create/approve/reject.
- **D-A2:** Role entity, Permission entity, RolePermission junction = DEFERRED to v3.0. Existing `users.role` enum (`Admin`/`Project Manager`/`Member`) preserved. NO migration. NO RBAC backend code.
- **D-A3:** Permission Matrix toggles = visually disabled placeholder. `disabled` + `aria-disabled="true"` + tooltip "RBAC altyapısı v3.0'da gelecek". Card header "v3.0" Badge (warning). Page-level AlertBanner per UI-SPEC §Surface E.
- **D-A4:** "Yeni rol oluştur" kartı = disabled placeholder. `cursor: not-allowed`, click-handler no-op + tooltip "v3.0'da gelecek".
- **D-A5:** Roller tab card semantics clarified — Admin (system-wide), PM (project-scoped via Team.leader_id), Member (project-scoped task work), Guest (v3.0 disabled).
- **D-A6:** User admin CRUD = full implementation on existing role enum. POST/PATCH/POST/POST/POST/GET endpoints per UI-SPEC §Surface C.
- **D-A7:** `/api/v1/admin/stats` = composite endpoint with `active_users_trend`, `methodology_distribution`, `project_velocities` payload.
- **D-A8:** Audit log enrichment = cross-cutting backend change (Plan 14-09). All audit_log write sites get `extra_metadata` JSONB enriched. NO migration (column already exists Phase 9 D-09).

**CRUD Actions (Area 2):**
- **D-B1:** All ~15 prototype actions = functional except RBAC-deferred (D-A3..A5).
- **D-B2:** Add user = email-invite flow (POST /api/v1/admin/users → Phase 2 PasswordResetToken + Phase 5 email).
- **D-B3:** Reset password = admin-triggered Phase 2 reset email.
- **D-B4:** Bulk invite CSV format = `email,name,role` (3 columns). Max 500 rows. Skip invalid rows; commit valid rows.
- **D-B5:** Project transfer ownership = SKIPPED. No `lead_id` field on Project.
- **D-B6:** Header `Rapor al` = admin summary PDF (fpdf2). `Denetim günlüğü` = `router.push('/admin/audit')`.
- **D-B7:** Bulk operations on Users tab = real bulk endpoint `POST /api/v1/admin/users/bulk-action`. Atomic.
- **D-B8:** Audit JSON export endpoint = honor current filter. Max 50k rows hard cap.

**Routing Architecture (Area 3):**
- **D-C1:** 8 sub-route'lar, NOT `?tab=` query param. Diverges from Phase 11/13 patterns.
- **D-C2:** Route shape = `app/(shell)/admin/{layout,page,users,roles,permissions,projects,workflows,audit,stats}/page.tsx`.
- **D-C3:** Admin-only route guard. Client redirect to `/dashboard` (Toast) if not admin; `/auth/login?next=/admin` if unauthenticated. Server-side `Depends(require_admin)` on every endpoint.
- **D-C4:** Tabs primitive Link-tabanlı render. Extend Tabs OR build `<NavTabs/>` wrapper (planner picks). Keyboard nav preserved.
- **D-C5:** State preservation — URL-driven filters (Audit query params), localStorage per-tab (`spms.admin.users.filter`), lost-on-switch acceptable for modals/scroll.
- **D-C6:** Lazy loading on Audit + Stats. Audit Server Component first 50 rows; client hydrates filter UI.

**Audit Log Detail Enhancement (Area 4):**
- **D-D1:** Cross-cutting Jira-style audit detail. Affects 4 surfaces: `/admin/audit` + ProjectDetail Activity tab + Profile Activity tab + Dashboard ActivityFeed.
- **D-D2:** Backend enrichment scope — task field changes, project field changes, comment events (160-char excerpt), milestone events, artifact events, phase report events, user lifecycle events. Comment table remains source of truth — never store full body in audit_log.
- **D-D3:** Frontend audit-event-mapper extension — 13 NEW SemanticEventType members (task_field_updated, project_archived, project_status_changed, comment_edited, comment_deleted, user_invited, user_deactivated, user_activated, user_role_changed, user_password_reset_requested, project_join_request_created, project_join_request_approved, project_join_request_rejected). Note: 13 NEW + 10 existing = 23 total.
- **D-D4:** Frontend `activity-row.tsx` rich rendering — task_field_updated, project_archived/status_changed, comment_edited/deleted, user_* lifecycle, project_join_request_*. Localized field-name map (`lib/admin/audit-field-labels.ts`).
- **D-D5:** Audit tab `Detay` column renders the same formatter via `<ActivityRow variant="admin-table"/>`.
- **D-D6:** Backward compatibility — old audit rows (pre-enrichment) still render via graceful fallback. NO migration / backfill.

**Stats Data Sources (Sub-section of Area 1):**
- **D-X1..X4:** `/api/v1/admin/stats` composite payload. Active users = on-the-fly audit_log compute. Methodology = direct project query. Velocity = aggregate of GetProjectIterationUseCase, top-30 cap.

**Roles Tab (Area 1 sub-decision):**
- **D-Y1:** Roles tab = display-only with reality-reflected card descriptions. No CRUD. Card user counts from `GET /admin/users` aggregate.

**Risk Classifier (Area 4 sub-decision):**
- **D-Z1:** Risk classifier = SKIPPED. No `risk` column. Audit table column layout: `Time | Actor | Action | Detay | (no risk)` — `Detay` carries Jira-style rendering.

**Audit Pagination (Plan 14-07 sub-decision):**
- **D-Z2:** Audit table pagination via offset (`?limit=50&offset=N`). Page size 25/50/100. Filter changes reset offset to 0. 50k hard cap.

**Cross-cutting Frontend Hardening:**
- **D-W1:** Tab unmount semantics — `<DataState/>` + TanStack Query `staleTime: 30s` typical for admin data.
- **D-W2:** Optimistic updates limited to bulk actions + approve/reject join requests.
- **D-W3:** CSV export via server-side endpoint, NOT client-side. UTF-8 BOM for Excel.

### Claude's Discretion

- "Tümünü gör" pending requests button — modal vs separate page. **Recommend:** modal with full pagination (consistent with prototype's pattern; no need for new route).
- Stats chart libraries — **recharts already installed Phase 13. Reuse. No new lib eval.**
- "Rapor al" PDF content & template — **Recommend:** 1-page summary (user count + delta, active project count, top 5 most-active projects, top 5 most-active users). Reuse Phase 12 fpdf2.
- Tabs primitive Link wrapper — extend existing primitive vs build `<NavTabs/>`. **Planner picks.** This research recommends `<NavTabs/>` (see Pattern 1 below).
- Audit `Filtre` modal exact UX — sheet vs popover vs full modal. **Default:** anchored popover (consistent with Phase 13 D-A5 pattern).
- Bulk invite progress feedback — spinner vs progress bar. **Default:** spinner + "{N} davet gönderiliyor..." + final summary modal.
- Active users trend tooltip — hover shows daily count + active users list (top 5). **Default:** just daily count + date.
- Email invite link expiry — 7 days for first-time invites (vs 24h for password reset). Configurable in `app/core/config.py`.
- `/admin/users` table density — compact vs default. **Default:** comfortable density, no toggle.
- Audit row click behavior — expand inline vs modal vs no-op. **Default:** no-op (Detay column already shows everything).
- Stats refresh policy — `refetchOnWindowFocus: true` + `staleTime: 60s`.

### Deferred Ideas (OUT OF SCOPE)

**Pushed to v3.0 (RBAC overhaul phase):**
- Role entity, Permission entity, RolePermission junction — full RBAC infrastructure (D-A2).
- Permission Matrix toggle enforcement — backend permission DSL.
- "Yeni rol oluştur" — custom role creation flow.
- Per-project role overrides.
- SSO / SAML / OIDC integration (`auth.sso.update` audit type).
- MFA / TOTP enrollment (`auth.mfa.reset` audit type).
- Audit log retention policy + archival.
- Audit log streaming export (NDJSON).
- Real-time audit alerts (Slack/email triggers).

**Pushed to v2.1:**
- Active users daily snapshot table + cron — replaces on-the-fly compute at ~10k events/day.
- Materialized view for methodology distribution.
- Per-card filter override on `/admin/stats`.
- Login event audit_log write (currently any audit row counts as "active user").
- Admin email template editor.
- Mobile <640px specific layouts for admin (admin = desktop-first).
- Audit row click → entity deep-link.

**Pushed to /gsd-verify-work pass:**
- Manual UAT click-through against `14-UAT-CHECKLIST.md` (Plan 14-12 artifact).
- Email delivery testing end-to-end (requires SMTP test setup).

**Out of Scope (per PROJECT.md / REQUIREMENTS.md):**
- Real-time admin event streaming (WebSocket).
- Mobile native push notifications.
- HttpOnly cookie JWT migration (v3.0 ADV-02).
- GraphQL API for admin (v3.0 ADV-03).
- AI-powered admin insights / anomaly detection.

## Phase Requirements

No formal requirement IDs were assigned to Phase 14 (user-driven addition; the requirements document does not have an admin-panel cluster). The phase scope is locked entirely by CONTEXT.md `<decisions>` and UI-SPEC.md. Below is the implicit requirement → research mapping derived from the prototype:

| Implicit Requirement | Description | Research Support |
|----------------------|-------------|------------------|
| ADM-01 | Admin-only route guard | Reuses `Depends(require_admin)` (`Backend/app/api/deps/auth.py:53`). Client gate via `useAuth().user.role`. Middleware extension to `Frontend2/middleware.ts` matcher. |
| ADM-02 | 8 sub-route admin shell | Next.js 16 nested route group `app/(shell)/admin/{...}/page.tsx`. New `<NavTabs/>` primitive. |
| ADM-03 | Overview (Genel) tab — 5 StatCards + Pending Requests + Role distribution + Recent admin events | Reuse `<StatCard/>` (Phase 10), Pending Requests = NEW component reading `GET /api/v1/admin/join-requests`, Role distribution = pure CSS bars from `/admin/users` aggregate, Recent admin events = small `ActivityFeed` variant. |
| ADM-04 | Users (Kullanıcılar) tab — table + search + role filter + bulk select + Add/Bulk-invite/CSV/MoreH | Reuse Phase 11 table primitives (TanStack Table or custom grid per prototype line 170 verbatim grid). Add modal pattern from prototype. papaparse for CSV. |
| ADM-05 | Roles (Roller) placeholder tab | Static 4-card grid + dashed-border "Yeni rol" disabled card. AlertBanner. |
| ADM-06 | Permissions (İzin Matrisi) placeholder tab | Static grid 14 perms × 4 roles, all toggles disabled. AlertBanner. |
| ADM-07 | Projects (Projeler) tab — admin-wide listing | Read `GET /projects?include_archived=true`. Per-row MoreH (Archive + Delete). Reuse existing endpoints. |
| ADM-08 | Workflows (Şablonlar) tab — template grid | Read `GET /api/v1/process-templates`. Per-card MoreH (Edit redirect / Clone / Delete with ConfirmDialog). |
| ADM-09 | Audit tab — full log table | NEW `GET /api/v1/admin/audit` admin-wide endpoint extending `IAuditRepository`. Filter modal. JSON export. Pagination via offset. Detay column = Jira render. |
| ADM-10 | Stats (İstatistik) tab — 3 charts | NEW `GET /api/v1/admin/stats` composite endpoint. recharts LineChart for trend; CSS bars for methodology + velocity. |
| ADM-11 | Audit-log enrichment (cross-cutting backend) | Plan 14-09. `extra_metadata` JSONB writes in 5+ sites. |
| ADM-12 | Jira-style audit detail (cross-cutting frontend) | Plan 14-10. 13 NEW SemanticEventTypes. ActivityRow variant `admin-table`. Affects /admin/audit + 3 existing surfaces. |
| ADM-13 | Header buttons (Rapor al + Denetim günlüğü) | Plan 14-11. PDF endpoint reuses Phase 12 fpdf2. Audit log button = router push. |
| ADM-14 | E2E + UAT | Plan 14-12. Playwright skip-guarded specs. UAT checklist artifact. |

## Project Constraints (from CLAUDE.md)

The project's CLAUDE.md is **Backend-focused** (Python/FastAPI Clean Architecture rules). All directives apply to the Backend portion of Phase 14 (Plans 14-01 backend track + 14-09):

| Constraint | Source | Phase 14 Application |
|------------|--------|---------------------|
| Domain layer ZERO dependencies (pure Python) | §2 Layer 1 | `Backend/app/domain/entities/project_join_request.py` and the new `IProjectJoinRequestRepository` ABC must NOT import SQLAlchemy or any infra package. |
| Application layer depends ONLY on Domain | §2 Layer 2 | New use cases (`CreateJoinRequestUseCase`, `ApproveJoinRequestUseCase`, `RejectJoinRequestUseCase`, `ListPendingJoinRequestsUseCase`, `InviteUserUseCase`, `BulkInviteUserUseCase`, `DeactivateUserUseCase`, `ResetPasswordUseCase`, `BulkActionUseCase`, `GetGlobalAuditUseCase`, `GetAdminStatsUseCase`, `GenerateAdminSummaryPDFUseCase`) must inject Domain interfaces only. **No `import sqlalchemy` in `app/application/`.** |
| OCP — no `if project.type == 'SCRUM':` switches | §4.1 OCP | Existing pattern. Phase 14 doesn't add methodology switches; the velocity aggregation reuses Phase 13's GetProjectIterationUseCase which already honors strategy pattern. |
| LSP — repository implementations interchangeable | §4.1 LSP | Tests use in-memory fakes per Phase 12 D-09. Plan 14-01 backend tests follow `Backend/tests/integration/test_user_activity.py:31-60` `FakePrivacyFilteredAuditRepo` pattern. |
| ISP — small interfaces | §4.1 ISP | If `IProjectJoinRequestRepository` only needs read for listing, planner may split read vs write methods. For v2.0 a single interface with all CRUD methods is acceptable (matches Phase 9 patterns). |
| DIP — Use Cases depend on abstractions | §4.1 DIP | Strict — every new use case takes interface params, NO concrete repo imports. |
| Repository → Mapper → Entity pattern | §6 Workflow Step 2 | New `SqlAlchemyProjectJoinRequestRepository` uses `_to_entity()` / `_entity_to_model()` mappers. |
| `Depends(require_admin)` on admin endpoints | §6 + Backend dep | Already in `app/api/deps/auth.py:53` — every new admin router uses it verbatim. |
| Audit Trail — every state change logged | §5C | ProjectJoinRequest create/approve/reject MUST write audit_log entries. Bulk invite MUST write one audit entry per user (not one for the batch). |

**Frontend2 has its OWN guidance (`Frontend2/CLAUDE.md` + `AGENTS.md`):**
- "This is NOT the Next.js you know" — Phase 14 creates **8 NEW sub-routes** in App Router; researcher MUST reference `Frontend2/node_modules/next/dist/docs/01-app/` for nested layout + middleware patterns. Verified path exists. **NEVER write Next.js code from training memory — always check the local docs first.**
- No shadcn/ui (per `.planning/PROJECT.md` v2.0 constraint and Frontend2 user memory).
- Frontend2 = source of truth, prototype = design authority. Port verbatim, deliberate-improve only.

## Standard Stack

### Core (REUSED from earlier phases — NO new install except papaparse)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.2.4` | App Router with nested layouts, middleware, sub-route pages | `[VERIFIED: Frontend2/package.json:31]` |
| `react` / `react-dom` | `19.2.4` | Client components, hooks | `[VERIFIED: Frontend2/package.json:32-33]` |
| `@tanstack/react-query` | `^5.99.2` | Every admin fetch (users, audit, stats, join requests). `staleTime: 30-60s` for admin data per D-W1. | `[VERIFIED: Frontend2/package.json:20]` |
| `recharts` | `3.8.1` (exact pin) | Active users trend chart on /admin/stats. Methodology + velocity bars use plain `<div>` per UI-SPEC §Spacing line 38 — no recharts geometry needed. | `[VERIFIED: Frontend2/node_modules/recharts/package.json version 3.8.1]` — ALREADY installed Phase 13 D-A2 |
| `lucide-react` | `^1.8.0` | All icons used by admin (Shield, Download, Mail, Plus, Search, Filter, Calendar, MoreHorizontal, Lock, Folder, Workflow, Chart, ArrowRight, Check, ChevronLeft/Right) | `[VERIFIED: Frontend2/package.json:30]` |
| `axios` | `^1.15.1` | All admin service-layer HTTP calls — reuses `apiClient` (`Frontend2/lib/api-client.ts`) | `[VERIFIED: Frontend2/package.json:27]` |
| `clsx` | `^2.1.1` | Conditional className composition (NavTabs active state, MoreH menu items) | `[VERIFIED: Frontend2/package.json:28]` |

### Supporting — NEW install required (Plan 14-01)

| Library | Version | Purpose | Use Case |
|---------|---------|---------|----------|
| `papaparse` | `^5.5.3` | Client-side bulk-invite CSV parsing — RFC-4180 compliant, encoding-safe (UTF-8 BOM detection), header row autodetect, malformed row reporting | Bulk Invite modal (D-B4) — 500-row guard, per-row validation, commit-or-skip strategy. Latest 5.5.3. Zero runtime dependencies. MIT license. `[VERIFIED: npmjs.com latest 5.5.3]` `[CITED: papaparse.com/docs]` |
| `@types/papaparse` | `^5.3.16` | TypeScript types | dev dependency only |

**Backend Core (REUSED — no new install):**

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fastapi` | latest | All admin routers | Existing |
| `sqlalchemy` (async) | latest | New `ProjectJoinRequestModel` + repo. JSONB enrichment in existing repos. | Existing — async engine via asyncpg |
| `pydantic` v2 | latest | New DTOs (CreateJoinRequestDTO, ApproveJoinRequestDTO, AdminUserCreateDTO, AdminUserBulkInviteDTO, AdminUserBulkActionDTO, AdminAuditFilterDTO, AdminStatsResponseDTO, AdminSummaryPDFRequestDTO) | Existing |
| `alembic` | latest | Migration 006 (project_join_requests table only) | Existing — last migration is 005_phase9_schema.py |
| `python-jose` | latest | JWT decoding for `require_admin` | Existing |
| `passlib[bcrypt]` | latest | Password hashing for admin-invited users | Existing |
| `fpdf2` | latest | Admin summary PDF (Plan 14-11 reuses Phase 12 fpdf2 service) | Existing — Phase 9 D-50 / Phase 12 D-58 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **papaparse 5.5.3** | csv-parse (Node-flavored) | csv-parse has Node Stream API not browser-friendly — would require a Browserify-style polyfill or building our own ReadableStream wrapper. papaparse is browser-first and handles File input natively. **REJECTED.** |
| **papaparse 5.5.3** | Hand-rolled split-on-comma | RFC-4180 quoting (`"a,b","c,d"`) is non-trivial; encoding detection (UTF-8 BOM, CP1252 fallback for Excel exports) is even worse. 6-8h of work + ongoing maintenance. **REJECTED.** |
| **`<NavTabs/>` new primitive** | Extend existing `Tabs` with `as="link"` discriminator | Extending Tabs requires a discriminated union prop (`{ as: "button"; onChange } | { as: "link"; href }`) which makes the existing API noisier for Phase 11/12/13 callers. **REJECTED for primitive cleanliness.** **PICK: `<NavTabs/>` thin wrapper (~50 LOC, copies Tabs styling verbatim).** Researcher recommends. |
| **In-memory fakes (Phase 12 D-09)** | Real SQLite test DB | In-memory fakes are 10x faster, give exact control over edge cases (privacy filter contract). Real test DB only useful for end-to-end pgsql JSON queries (`extra_metadata->>'task_title'` etc). Plan 14-01 follows in-memory fakes; Plan 14-09 audit enrichment may add a few real-DB tests for the JSON extract paths. |
| **Admin endpoint colocated in `users.py`** | Separate `admin/users.py` router | Separating into `admin/` keeps the Backend file structure mirroring the Frontend2 admin routes. Easier to spot-check `Depends(require_admin)` is on every endpoint. **PICK: separate `Backend/app/api/v1/admin_users.py` (or aggregator `Backend/app/api/v1/admin/__init__.py`).** Planner picks shape. |

**Installation:**

```bash
# Frontend2 — Plan 14-01 Wave 0 fat infra
cd Frontend2 && npm install [email protected] && npm install --save-dev @types/[email protected]

# Backend — no new package install for v2.0 (Phase 12 fpdf2 reused for PDF; Phase 5 email reused for invite/reset)

# Backend — Alembic migration
alembic revision --autogenerate -m "phase14_admin_panel — project_join_requests table"
# Edit the generated file; ensure idempotent (CREATE TABLE IF NOT EXISTS not supported in alembic but ensure no destructive ops)
alembic upgrade head
```

**Version verification:** `npm view papaparse version` → 5.5.3 published 2025-09-12 (`[VERIFIED 2026-04-27]`). `npm view recharts version` → 3.8.1 (already installed).

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (CSR + middleware-protected)        │
│                                                                          │
│  /admin (any sub-route)                                                  │
│   ↓ Frontend2/middleware.ts checks auth_session cookie                   │
│   ↓ app/(shell)/admin/layout.tsx — useAuth().role check + Toast redirect │
│                                                                          │
│  layout.tsx renders:                                                     │
│    PageHeader (Shield icon + "Yönetim Konsolu" + Rapor al / Denetim günlüğü)│
│    NavTabs (8 tabs, Link-based, usePathname active detection)            │
│    {children} — routed via Next.js                                       │
│                                                                          │
│  Sub-route pages:                                                        │
│    /admin           → page.tsx (Overview content)                        │
│    /admin/users     → users/page.tsx                                     │
│    /admin/roles     → roles/page.tsx (RBAC placeholder)                  │
│    /admin/permissions → permissions/page.tsx (RBAC placeholder)          │
│    /admin/projects  → projects/page.tsx                                  │
│    /admin/workflows → workflows/page.tsx                                 │
│    /admin/audit     → audit/page.tsx                                     │
│    /admin/stats     → stats/page.tsx                                     │
│                                                                          │
│  Each sub-route uses TanStack Query hooks:                              │
│    useAdminUsers()       → GET /api/v1/admin/users                       │
│    usePendingJoinReqs()  → GET /api/v1/admin/join-requests?status=pending│
│    useAdminAudit(filter) → GET /api/v1/admin/audit?from&to&actor&action  │
│    useAdminStats()       → GET /api/v1/admin/stats                       │
│    useAdminProjects()    → GET /api/v1/projects?include_archived=true    │
│    useProcessTemplates() → GET /api/v1/process-templates (REUSED)        │
│                                                                          │
│  Mutations:                                                              │
│    useInviteUser, useBulkInvite, useDeactivateUser, useResetPassword,   │
│    useChangeRole, useBulkAction, useApproveJoinReq, useRejectJoinReq,   │
│    useDeleteTemplate, useCloneTemplate, useArchiveProject, useDeleteProj │
│                                                                          │
│  Audit row render = <ActivityRow variant="admin-table" event={e}/>      │
│    consumes audit-event-mapper (extended) + event-meta (extended)        │
│    Renders Detay column with Jira-style line                             │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │ HTTP (axios + JWT Bearer + Depends(require_admin))
                       ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                         FastAPI BACKEND                                  │
│                                                                          │
│  ProjectJoinRequest VERTICAL SLICE (NEW):                                │
│    Domain entity → IProjectJoinRequestRepository ABC                     │
│    Use Cases: Create / Approve / Reject / ListPending                    │
│    DTOs: CreateJoinRequestDTO, ApproveJoinRequestDTO, ...                │
│    Router: /api/v1/admin/join-requests + /api/v1/projects/{id}/join-req  │
│    Repo Impl: SqlAlchemyProjectJoinRequestRepository (mapper)            │
│    Migration: 006_phase14_admin_panel — project_join_requests table     │
│                                                                          │
│  ADMIN USER ENDPOINTS (NEW — extends existing users router):             │
│    POST   /api/v1/admin/users              — InviteUserUseCase           │
│    PATCH  /api/v1/admin/users/{id}/role    — ChangeRoleUseCase           │
│    PATCH  /api/v1/admin/users/{id}/deactivate — DeactivateUserUseCase    │
│    POST   /api/v1/admin/users/{id}/password-reset — ResetPasswordUseCase │
│    POST   /api/v1/admin/users/bulk-invite  — BulkInviteUserUseCase       │
│    POST   /api/v1/admin/users/bulk-action  — BulkActionUseCase           │
│    GET    /api/v1/admin/users.csv          — CSV export                  │
│                                                                          │
│  ADMIN AUDIT ENDPOINT (NEW — extends IAuditRepository):                  │
│    GET    /api/v1/admin/audit              — GetGlobalAuditUseCase       │
│    GET    /api/v1/admin/audit.json         — JSON export (filter-aware)  │
│      ↓ NEW IAuditRepository.get_global_audit(filters, limit, offset)     │
│                                                                          │
│  ADMIN STATS ENDPOINT (NEW — composite):                                 │
│    GET    /api/v1/admin/stats              — GetAdminStatsUseCase        │
│      ↓ active_users_trend (audit_log GROUP BY day, on-the-fly compute)   │
│      ↓ methodology_distribution (projects GROUP BY methodology)          │
│      ↓ project_velocities (top 30 — reuses GetProjectIterationUseCase)   │
│                                                                          │
│  ADMIN SUMMARY PDF (NEW — reuses Phase 12 fpdf2):                        │
│    GET    /api/v1/admin/summary.pdf        — GenerateAdminSummaryPDFUC   │
│      ↓ 1-page summary (last 30 days: user delta, project count, top 5)   │
│      ↓ rate-limited 30s (Phase 12 D-58 pattern)                          │
│                                                                          │
│  AUDIT LOG ENRICHMENT (CROSS-CUTTING — Plan 14-09):                      │
│    task_repo.py            — 5+ field-change sites populate metadata     │
│    project_repo.py         — status / archive / methodology change       │
│    create_comment / update_comment / delete_comment use cases            │
│    create / update milestone use cases                                   │
│    create / update artifact use cases                                    │
│    create phase_report use case                                          │
│    NEW user lifecycle audit writes (invite/deactivate/role/reset/...)    │
│                                                                          │
│  SECURITY GATE (existing, REUSED on every endpoint):                     │
│    Depends(require_admin) — Backend/app/api/deps/auth.py:53              │
│      ↓ JWT decode + role.name.lower() == "admin" check                   │
│      ↓ HTTP 403 otherwise                                                │
└──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
Frontend2/
├── app/(shell)/admin/
│   ├── layout.tsx                # admin guard + page header + NavTabs
│   ├── page.tsx                  # Overview (default — /admin)
│   ├── users/page.tsx            # Kullanıcılar
│   ├── roles/page.tsx            # Roller (RBAC placeholder)
│   ├── permissions/page.tsx      # İzin Matrisi (RBAC placeholder)
│   ├── projects/page.tsx         # Projeler
│   ├── workflows/page.tsx        # Şablonlar
│   ├── audit/page.tsx            # Audit
│   └── stats/page.tsx            # İstatistik
├── components/
│   ├── admin/
│   │   ├── overview/             # OverviewStatCards, PendingRequestsCard, RoleDistribution, RecentAdminEvents
│   │   ├── users/                # UsersTable, UsersToolbar, UserRow, UserBulkBar, AddUserModal, BulkInviteModal, UserRowActions
│   │   ├── roles/                # RoleCardsGrid, RoleCard, NewRolePlaceholderCard, RolesPageBanner
│   │   ├── permissions/          # PermissionMatrixCard, PermissionGroupRow, PermissionRow, PermissionToggle (disabled)
│   │   ├── projects/             # AdminProjectsTable, AdminProjectRow, AdminProjectRowActions
│   │   ├── workflows/            # AdminTemplatesGrid, AdminTemplateCard, TemplateRowActions
│   │   ├── audit/                # AdminAuditTable, AdminAuditRow, AuditFilterModal, AuditFilterChips, AuditPagination
│   │   └── stats/                # ActiveUsersTrendChart, MethodologyBars, VelocityCardsGrid, VelocityMiniBar
│   └── primitives/
│       ├── nav-tabs.tsx          # NEW — Link-based tab strip (D-C4)
│       ├── modal.tsx             # NEW — base Modal primitive (overlay + panel + header/body/footer slots)
│       └── (existing 17 primitives reused as-shipped)
├── services/
│   ├── admin-join-request-service.ts    # NEW
│   ├── admin-user-service.ts            # NEW
│   ├── admin-audit-service.ts           # NEW
│   ├── admin-stats-service.ts           # NEW
│   └── (existing services reused: project-service, process-template-service via project-service)
├── hooks/
│   ├── use-pending-join-requests.ts     # NEW
│   ├── use-approve-join-request.ts      # NEW
│   ├── use-reject-join-request.ts       # NEW
│   ├── use-admin-users.ts               # NEW
│   ├── use-invite-user.ts               # NEW
│   ├── use-bulk-invite.ts               # NEW
│   ├── use-deactivate-user.ts           # NEW
│   ├── use-reset-password.ts            # NEW
│   ├── use-change-role.ts               # NEW
│   ├── use-bulk-action.ts               # NEW
│   ├── use-admin-audit.ts               # NEW
│   ├── use-admin-stats.ts               # NEW
│   └── (existing hooks reused: use-projects, use-process-templates via use-projects)
├── lib/
│   ├── admin/
│   │   ├── permissions-static.ts        # NEW — placeholder permission map
│   │   ├── audit-field-labels.ts        # NEW — TR/EN field name localization
│   │   ├── csv-parse.ts                 # NEW — papaparse wrapper + validators
│   │   └── csv-export.ts                # NEW — server endpoint download trigger (anchor + Content-Disposition)
│   ├── audit-event-mapper.ts            # EXTEND — 13 NEW SemanticEventTypes (Plan 14-10)
│   └── activity/
│       └── event-meta.ts                # EXTEND — 13 NEW verb formatters (Plan 14-10)
├── components/activity/
│   └── activity-row.tsx                 # EXTEND — variant="admin-table" + 5 NEW render branches (Plan 14-10)
├── components/projects/
│   └── confirm-dialog.tsx               # EXTEND — tone?: "primary" | "danger" | "warning" (Plan 14-01)
├── middleware.ts                        # EXTEND — add /admin/:path* to matcher (Plan 14-02)
└── e2e/
    ├── admin-route-guard.spec.ts        # NEW (Plan 14-12)
    ├── admin-overview.spec.ts           # NEW
    ├── admin-users-crud.spec.ts         # NEW
    ├── admin-audit-filter.spec.ts       # NEW
    └── admin-stats-render.spec.ts       # NEW

Backend/
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── project_join_request.py            # NEW
│   │   └── repositories/
│   │       ├── audit_repository.py                # EXTEND — add get_global_audit method
│   │       └── project_join_request_repository.py # NEW (ABC)
│   ├── application/
│   │   ├── dtos/
│   │   │   ├── project_join_request_dtos.py       # NEW
│   │   │   ├── admin_user_dtos.py                 # NEW
│   │   │   ├── admin_audit_dtos.py                # NEW
│   │   │   ├── admin_stats_dtos.py                # NEW
│   │   │   └── admin_summary_pdf_dtos.py          # NEW
│   │   └── use_cases/
│   │       ├── create_join_request.py             # NEW
│   │       ├── approve_join_request.py            # NEW
│   │       ├── reject_join_request.py             # NEW
│   │       ├── list_pending_join_requests.py      # NEW
│   │       ├── invite_user.py                     # NEW
│   │       ├── bulk_invite_user.py                # NEW
│   │       ├── deactivate_user.py                 # NEW
│   │       ├── reset_user_password.py             # NEW
│   │       ├── change_user_role.py                # NEW
│   │       ├── bulk_action_user.py                # NEW
│   │       ├── get_global_audit.py                # NEW
│   │       ├── get_admin_stats.py                 # NEW
│   │       └── generate_admin_summary_pdf.py      # NEW
│   ├── infrastructure/
│   │   └── database/
│   │       ├── models/
│   │       │   └── project_join_request.py        # NEW
│   │       └── repositories/
│   │           ├── audit_repo.py                  # EXTEND — get_global_audit impl + audit-log enrichment in callers
│   │           ├── task_repo.py                   # PATCH — extra_metadata enrichment (Plan 14-09)
│   │           ├── project_repo.py                # PATCH — extra_metadata enrichment (Plan 14-09)
│   │           └── project_join_request_repo.py   # NEW (impl + mapper)
│   └── api/
│       ├── deps/
│       │   └── project_join_request.py            # NEW (DI)
│       └── v1/
│           ├── admin_join_requests.py             # NEW (router)
│           ├── admin_users.py                     # NEW (router)
│           ├── admin_audit.py                     # NEW (router)
│           ├── admin_stats.py                     # NEW (router)
│           ├── admin_summary.py                   # NEW (router — PDF endpoint)
│           └── main.py                             # EXTEND — register 5 new admin routers
├── alembic/versions/
│   └── 006_phase14_admin_panel.py                 # NEW — project_join_requests table only
└── tests/
    ├── integration/
    │   ├── test_create_join_request.py            # NEW
    │   ├── test_approve_join_request.py           # NEW
    │   ├── test_admin_users_crud.py               # NEW
    │   ├── test_admin_audit_get_global.py         # NEW
    │   ├── test_admin_stats.py                    # NEW
    │   ├── test_audit_log_enrichment.py           # NEW (Plan 14-09)
    │   └── test_generate_admin_summary_pdf.py     # NEW
    └── (test_user_activity.py, test_charts.py — REUSED as fake-pattern reference)
```

### Pattern 1: Link-based NavTabs primitive (D-C4 — researcher recommendation)

**What:** Thin wrapper over Next.js `<Link>` that mirrors the existing `Tabs` primitive's visual API but renders each tab as a navigable URL instead of a click handler.

**When to use:** Sub-route navigation (admin tabs). Phase 11/12/13 still use the existing `Tabs` primitive for in-page state (e.g., ProjectDetail tabs that share project context).

**Example (proposed implementation, ~50 LOC):**
```typescript
// Source: Frontend2/components/primitives/nav-tabs.tsx (NEW)
"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "./badge"

export interface NavTabItem {
  id: string
  href: string                  // Full path: "/admin", "/admin/users", ...
  label: string
  icon?: React.ReactNode
  badge?: number | string
}

export interface NavTabsProps {
  tabs: NavTabItem[]
  size?: "sm" | "md" | "lg"
}

const PAD_MAP = { sm: "6px 10px", md: "8px 14px", lg: "10px 16px" }
const FONT_MAP = { sm: 12, md: 13, lg: 14 }

export function NavTabs({ tabs, size = "md" }: NavTabsProps) {
  const pathname = usePathname()
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)" }}>
      {tabs.map((tab) => {
        // Active = exact match OR (this is /admin AND pathname is /admin/* with no other tab matching)
        const isActive = pathname === tab.href ||
          (tab.href === "/admin" && pathname.startsWith("/admin/") &&
           !tabs.some(t => t.href !== "/admin" && pathname.startsWith(t.href)))
        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              padding: PAD_MAP[size],
              fontSize: FONT_MAP[size],
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--fg)" : "var(--fg-muted)",
              borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              transition: "color 0.12s",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && (
              <Badge size="xs" tone={isActive ? "primary" : "neutral"}>{tab.badge}</Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}
```

**Active detection edge case:** When user is at `/admin/users`, the `/admin` (Overview) tab must NOT show as active. The `!tabs.some(...)` guard handles this. Document with a unit test:
- `/admin` → Overview active
- `/admin/users` → Users active, Overview inactive
- `/admin/users/whatever` (defensive) → Users active

### Pattern 2: Modal primitive (NEW — UI-SPEC §Spacing line 88-90)

**What:** A reusable Modal primitive with overlay + panel + header/body/footer slots. Used by AddUserModal, BulkInviteModal, AuditFilterModal, PendingRequestsModal.

**When to use:** Any modal in admin (4 sites). Other Frontend2 modals exist as bespoke (`task-modal/`, `confirm-dialog.tsx`) — Phase 14 introduces the first general-purpose modal primitive.

**Example skeleton:**
```typescript
// Source: Frontend2/components/primitives/modal.tsx (NEW)
// Mirrors ConfirmDialog overlay style (Frontend2/components/projects/confirm-dialog.tsx:21-28)
"use client"
import * as React from "react"

export interface ModalProps {
  open: boolean
  onClose: () => void
  width?: number  // default 480
  children: React.ReactNode
}

export function Modal({ open, onClose, width = 480, children }: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "oklch(0 0 0 / 0.5)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--surface)", borderRadius: "var(--radius)",
          width, maxWidth: "calc(100% - 32px)", maxHeight: "calc(100% - 32px)",
          boxShadow: "var(--shadow-xl)", overflow: "hidden",
          display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// Recommended slot sub-components:
export function ModalHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20, borderBottom: "1px solid var(--border)",
    fontSize: 15, fontWeight: 600 }}>{children}</div>
}
export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>{children}</div>
}
export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 12, borderTop: "1px solid var(--border)",
    display: "flex", gap: 8, justifyContent: "flex-end" }}>{children}</div>
}
```

**Why a primitive vs ad-hoc:** 4 modals share the same overlay + panel chrome. Without a primitive, each plan re-spawns the same boilerplate (and risks divergence — wrong z-index, wrong backdrop opacity, missing ESC handler). One primitive, four call sites.

### Pattern 3: ConfirmDialog tone extension (Plan 14-01 Task 1 — UI-SPEC §Color line 234-271)

**What:** Add `tone?: "primary" | "danger" | "warning"` prop to existing ConfirmDialog — backward-compat default `"primary"`.

**When to use:** Destructive admin actions (Deactivate user, Delete user, Delete template, Delete project, Reject join request, Bulk deactivate). Non-destructive (Reset password, Role change, Bulk role change) skip ConfirmDialog entirely per UI-SPEC.

**Example diff (existing file `Frontend2/components/projects/confirm-dialog.tsx:1-38`):**
```typescript
// BEFORE (current): hardcoded variant="primary" on confirm Button
// AFTER: variant switches on tone
import { AlertTriangle, AlertCircle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "primary" | "danger" | "warning"  // NEW
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Onayla",
  cancelLabel = "İptal", tone = "primary", onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  const TitleIcon = tone === "danger" ? AlertTriangle :
                    tone === "warning" ? AlertCircle : null
  const titleColor = tone === "danger" ? "var(--priority-critical)" :
                     tone === "warning" ? "var(--status-review)" : "var(--fg)"
  return (
    <div style={{ /* overlay (existing) */ }} onClick={onCancel}>
      <div style={{ /* panel (existing) */ }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)",
          display: "flex", alignItems: "center", gap: 6 }}>
          {TitleIcon && <TitleIcon size={14} color={titleColor} />}
          {title}
        </div>
        <div style={{ /* body (existing) */ }}>{body}</div>
        <div style={{ /* footer (existing) */ }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"}
            size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
```

**Backward compat verified:** Plan 10/11/12 callers use `<ConfirmDialog open=... title=... body=... onConfirm=... onCancel=.../>` without `tone` prop → defaults to `"primary"` → renders identically to current behavior.

### Pattern 4: Vertical-slice service+hook layer (Phase 13 D-X1 reference)

**What:** Each admin entity gets a service file (HTTP layer) + hook file (TanStack Query wrapper). Snake_case → camelCase mapping happens in the service layer.

**When to use:** Every new backend endpoint Phase 14 ships. Reference: `Frontend2/services/profile-service.ts` (read-only) for query-only endpoints; `Frontend2/hooks/use-projects.ts:44-58` (`useUpdateProjectStatus`) for mutation pattern with cache invalidation.

**Example (admin user invite mutation):**
```typescript
// Source: Frontend2/services/admin-user-service.ts (NEW)
import { apiClient } from "@/lib/api-client"

export interface InviteUserRequest {
  email: string
  role: "Admin" | "Project Manager" | "Member"
  name?: string
  team_id?: number
}

export interface InviteUserResponse {
  user_id: number
  email: string
  invite_token_expires_at: string
}

interface InviteUserResponseDTO {
  user_id: number
  email: string
  invite_token_expires_at: string
}

function mapInvite(d: InviteUserResponseDTO): InviteUserResponse {
  return { user_id: d.user_id, email: d.email,
    invite_token_expires_at: d.invite_token_expires_at }
}

export const adminUserService = {
  invite: async (req: InviteUserRequest): Promise<InviteUserResponse> => {
    const resp = await apiClient.post<InviteUserResponseDTO>("/admin/users", req)
    return mapInvite(resp.data)
  },
  // ... bulkInvite, deactivate, resetPassword, changeRole, bulkAction, list, exportCsv
}
```

```typescript
// Source: Frontend2/hooks/use-invite-user.ts (NEW)
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUserService } from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useInviteUser() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: adminUserService.invite,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      showToast({ tone: "success",
        message: `Davet gönderildi: ${data.email}` })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Davet gönderilemedi"
      showToast({ tone: "danger", message: msg })
    },
  })
}
```

### Pattern 5: Backend admin endpoint + use case + repository extension (Phase 9 D-46 reference)

**What:** New router file → `Depends(require_admin)` on every handler → use case orchestrates → repository interface (extend existing `IAuditRepository` or create new `IProjectJoinRequestRepository`) → SqlAlchemy impl uses async session.

**When to use:** All Phase 14 backend endpoints.

**Example (admin audit endpoint):**
```python
# Source: Backend/app/api/v1/admin_audit.py (NEW)
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.api.deps.auth import require_admin
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.get_global_audit import GetGlobalAuditUseCase
from app.application.dtos.admin_audit_dtos import AdminAuditResponseDTO
from app.domain.entities.user import User

router = APIRouter()


@router.get("/admin/audit", response_model=AdminAuditResponseDTO)
async def get_admin_audit(
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    actor_id: Optional[int] = Query(default=None),
    action_prefix: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(require_admin),
    audit_repo=Depends(get_audit_repo),
) -> AdminAuditResponseDTO:
    """D-Z2 — admin-wide audit retrieval. No project-membership privacy filter
    (admin sees everything). Uses the new IAuditRepository.get_global_audit method."""
    uc = GetGlobalAuditUseCase(audit_repo)
    return await uc.execute(
        date_from=date_from, date_to=date_to,
        actor_id=actor_id, action_prefix=action_prefix,
        limit=limit, offset=offset,
    )


@router.get("/admin/audit.json")
async def export_admin_audit_json(
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    actor_id: Optional[int] = Query(default=None),
    action_prefix: Optional[str] = Query(default=None),
    admin: User = Depends(require_admin),
    audit_repo=Depends(get_audit_repo),
) -> StreamingResponse:
    """D-B8 — JSON-array export honoring current filter. 50k row hard cap."""
    # ... implementation: iterate audit_repo.get_global_audit in chunks,
    # stream JSON-array response with Content-Disposition header
    ...
```

### Anti-Patterns to Avoid

- **Don't put `?tab=` query params on /admin** — locked decision D-C1; sub-routes diverge from Phase 11/13 patterns intentionally. If a planner adds `?tab=`, the AvatarDropdown's `/admin` link breaks active-detection logic.
- **Don't forget `Depends(require_admin)` on a new admin endpoint** — easy to copy-paste an existing endpoint and forget the dependency. Add a Plan 14-12 E2E spec that hits each admin endpoint as a non-admin user and asserts 403.
- **Don't create a new role entity** — D-A2 deferred to v3.0. Adding a `roles` table now would force a multi-phase migration later (data backfill + endpoint refactor + frontend role-check refactor). Resist any "well, while we're here…" temptation.
- **Don't backfill old audit_log rows with enriched metadata** — D-D6. Backfill is impossible for deleted entities (task title can't be recovered). Frontend gracefully degrades.
- **Don't store full comment body in audit_log** — D-D2. Use a 160-char excerpt with ellipsis. PII / privacy concern. Comment table remains source of truth.
- **Don't put `import sqlalchemy` in the application layer** — CLAUDE.md DIP rule. Use cases inject `IProjectJoinRequestRepository` interface; the repo impl is wired in `Backend/app/api/dependencies.py`.
- **Don't bypass the 500-row CSV bulk-invite cap server-side** — D-B4. Even if the frontend already enforces it, the backend MUST validate (defense in depth — DoS guard).
- **Don't render audit-row cells from missing keys without a fallback** — D-D6. Every `extra_metadata` lookup in `activity-row.tsx` must use optional chaining + `??` fallback.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing for bulk invite | Hand-rolled split-on-comma | `papaparse@^5.5.3` | RFC-4180 quoting (`"a,b","c,d"`), encoding detection (UTF-8 BOM for Excel), header autodetect, malformed row reporting — papaparse is zero-dep, MIT, browser-first. `[VERIFIED]` |
| Active users daily aggregation | Iterating Python dict + counting | PostgreSQL `date_trunc('day', timestamp) GROUP BY day` | Database does it in one query; iterating in Python loops over the entire audit_log table. Scaling cliff documented (D-X2). |
| Audit log enrichment field-name → label localization | Hardcoded if/elif chain in `activity-row.tsx` | Static map in `lib/admin/audit-field-labels.ts` (TR/EN dict) | Tested via small unit test; OCP — extend map without touching renderer. |
| Tab state preservation across sub-routes | URL state machine library (xstate) | URL search params + localStorage per Phase 11 D-21 pattern | Existing Frontend2 pattern; shipping a state machine for 8 tabs is overkill. |
| Modal accessibility (focus trap, escape, click-outside) | Custom focus-trap implementation | Build the Modal primitive (Pattern 2) with `<dialog>` semantics OR consume existing primitives' patterns | The 4-modal admin needs a unified shape. Avoid a per-modal trap loop. |
| PDF generation (Rapor al) | Client-side jspdf assembly | Phase 12 fpdf2 service + new use case | Phase 12 D-58 already shipped fpdf2 with rate limiting; reuse the same pattern. Server-side PDF is consistent with Audit JSON / Users CSV exports. |
| MoreH dropdown menu (per-row actions) | Building a fresh dropdown each plan | Build `Frontend2/components/admin/more-menu.tsx` once, reuse 5 places (Users row, Projects row, Templates card, Pending request, Audit row if added) | Pattern reference: `Frontend2/components/projects/project-card.tsx:175-196`. Existing pattern can be lifted into a shared component to avoid drift. |
| Bulk invite per-row validation | Inline if/elif in handler | Pydantic validators on `BulkInviteRowDTO` | DRY with single-user invite. Reuse `EmailStr` from existing User entity. |
| Bulk action transaction semantics | Inline try/except per user | Use case method `execute_per_user` returns `[(user_id, status, error?)]` | Per-user transaction acceptable per researcher recommendation in canonical_refs. |

**Key insight:** Phase 14 is heavy on **infrastructure reuse**. The temptation to "while we're here, let's improve X" or "let's hand-roll a custom MoreH menu for this one" must be resisted. Plan 14-01 (Wave 0 fat infra) is the right place to centralize all primitives + services + hooks + libs; later plans consume.

## Runtime State Inventory

> Phase 14 is **net-new code** (not a rename/refactor). However, it touches existing audit_log rows + adds a new entity. The inventory below documents what exists already vs what's new.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **Audit log rows (existing)** — `audit_log` table has rows from Phases 9-13 written via `IAuditRepository.create()` (no `extra_metadata`) and `create_with_metadata()` (limited metadata). Phase 14 enrichment in Plan 14-09 extends NEW writes only. | **D-D6 — frontend graceful degradation.** No data migration. Old rows render via fallback path in `activity-row.tsx`. Verified by seeded pre-Phase-14 audit_log rows in integration tests (Plan 14-09 Task: backward-compat test). |
| Stored data | **users.role values** — existing enum stored as strings ("Admin", "Project Manager", "Member") in `users.role_id` → `roles.name` join. | **None.** No rename, no migration. RBAC deferred (D-A2). |
| Stored data | **PasswordResetToken rows (Phase 2)** — existing table reused for admin-invite + admin-reset flows. | **None.** Reuse the entity verbatim. Consider extending TTL via existing `app/core/config.py` (Discretion: 7 days for invites vs 24h for reset). |
| Stored data | **NEW `project_join_requests` table** — Plan 14-01 Alembic migration 006. Columns: id, project_id, requested_by_user_id, target_user_id, status (enum: pending/approved/rejected/cancelled), note (Text), reviewed_by_admin_id, reviewed_at, created_at, updated_at. FK ON DELETE CASCADE for project_id; SET NULL for users (preserve historical record). | **NEW migration 006 — must be idempotent.** No existing data to migrate. |
| Live service config | **None.** No external service config holds admin-related state. | None. |
| OS-registered state | **None.** No OS-level registrations involved. | None. |
| Secrets and env vars | **JWT secret (existing)** — `Backend/app/infrastructure/config.py` `JWT_SECRET`. Used by `require_admin` for token decoding. | **None.** No new secret. |
| Secrets and env vars | **Email SMTP config (existing Phase 5)** — used by invite + reset flows. | **None.** Reuse Phase 5 templates and SMTP settings. |
| Secrets and env vars | **NEW config — `INVITE_TOKEN_TTL_DAYS = 7`** (Discretion). Add to `app/core/config.py`. | **NEW env var with default.** Document in Backend `.env.example` if exists. |
| Build artifacts | **`Frontend2/node_modules/papaparse/`** — does NOT exist today. | **NEW install during Plan 14-01.** Verify post-install via `node_modules/papaparse/package.json` exists. |
| Build artifacts | **`Frontend2/node_modules/recharts/`** — version 3.8.1 already installed (Phase 13). | **None.** Already verified. |
| Frontend2 middleware matcher | `Frontend2/middleware.ts:14-22` does NOT include `/admin/:path*` today. | **EDIT during Plan 14-02.** Add `'/admin/:path*'` to matcher array. |

**The canonical question:** *After every Phase 14 plan lands, what runtime state is touched?*

- New table `project_join_requests` — must run `alembic upgrade head` in the deploy pipeline.
- New env var `INVITE_TOKEN_TTL_DAYS=7` — document in `.env.example`; without it falls back to default in `app/core/config.py`.
- npm install `papaparse@^5.5.3 @types/papaparse@^5.3.16` — `package.json` + `package-lock.json` updated.
- audit_log rows written from Plan 14-09 onwards have richer `extra_metadata` than older rows — frontend backward-compat documented (D-D6).
- Frontend middleware matcher list grows by one entry — without it, `/admin/*` is not redirected to login when unauthenticated.

## Common Pitfalls

### Pitfall 1: Audit-log enrichment breaks existing Phase 13 ActivityTab rendering

**What goes wrong:** Plan 14-10 extends `mapAuditToSemantic` with 13 new SemanticEventType members. If the new branches accidentally claim audit shapes that existing branches handle, Phase 13's Activity Tab (already in production) starts misclassifying events.

**Why it happens:** The mapper is order-dependent (see `Frontend2/lib/audit-event-mapper.ts:47-85` — phase_transition check is FIRST). Adding new branches in the wrong order can shadow existing ones.

**How to avoid:** Plan 14-10 MUST add new branches AFTER existing ones. Each new mapping must specify a unique combo (entity_type, action, field_name) that doesn't overlap. Add unit tests for every NEW SemanticEventType + RTL test that EXISTING SemanticEventTypes (especially `task_status_changed`) still resolve correctly with non-extended payloads.

**Warning signs:** Phase 13 Activity Tab renders different events after Plan 14-10 lands (e.g., a status change suddenly renders as "task field updated"). E2E `activity-tab.spec.ts` regression.

### Pitfall 2: Snake_case backend payload → camelCase frontend mapping drift

**What goes wrong:** Backend ships `extra_metadata.task_title` (snake_case). Frontend reads `event.metadata.taskTitle` (camelCase) and gets `undefined`. The Detay column renders blank.

**Why it happens:** `Frontend2/services/profile-service.ts:56-71` shows the canonical mapper pattern (snake → camel), but `audit-event-mapper.ts` and `activity-row.tsx` read raw payload via `(event.metadata ?? {}) as Record<string, unknown>` — they DON'T go through a mapper.

**How to avoid:** **Decision needed:** either (a) extend `activity-service.ts` mapper to camelCase the metadata keys before reaching the renderer (cleaner), or (b) read snake_case keys directly in `activity-row.tsx` (simpler — matches existing Phase 13 D-D4 `taskKey = md.task_key as string` pattern). Researcher recommends (b) for consistency with existing `activity-row.tsx:74-76` reads.

**Warning signs:** Detay cells show empty in `/admin/audit` despite backend returning enriched metadata. Phase 13 Activity Tab doesn't show task titles after enrichment.

### Pitfall 3: Admin-only route guard race condition

**What goes wrong:** User navigates to `/admin/users` while `useAuth().isLoading === true`. Layout's `useAuth().user.role` check sees `null` and redirects to `/dashboard` even though the user IS an admin.

**Why it happens:** `Frontend2/context/auth-context.tsx:23-42` initializes `user` from `localStorage` async. Initial render has `user = null, isLoading = true`.

**How to avoid:** Layout must check `isLoading` first and render a loading state (spinner / skeleton) while auth is hydrating. Only after `isLoading === false` should the role check fire. Pattern reference: `Frontend2/components/dashboard/activity-feed.tsx:74-86` uses `<DataState/>`. Add similar guard in `app/(shell)/admin/layout.tsx`.

**Warning signs:** Direct navigation to `/admin/users` (e.g., bookmarked) bounces to `/dashboard` for an admin user. Reproducible via clearing TanStack Query cache + hard refresh.

### Pitfall 4: NavTabs active detection misfires for /admin (Overview)

**What goes wrong:** When pathname is `/admin/users`, the `/admin` (Overview) tab incorrectly renders as active because `pathname.startsWith("/admin")` is true.

**Why it happens:** Overview's href is `/admin` — every other admin sub-route also starts with `/admin/`.

**How to avoid:** Active-detection logic in `<NavTabs/>` (Pattern 1 above) MUST handle the special case: `/admin` is active only when no other tab matches. Add unit tests for all 8 paths. Researcher's NavTabs proposal already addresses this (Pattern 1 line 68).

**Warning signs:** Two tabs visually active simultaneously. Overview tab "stuck" active while user is on /admin/users.

### Pitfall 5: Bulk invite client-side parse vs backend validate divergence

**What goes wrong:** papaparse on the client accepts a row that the backend Pydantic validator rejects (e.g., empty name → client defaults to email-local-part, backend strict-mode rejects). UX: row appears valid in the modal preview, then fails post-submit.

**Why it happens:** Two separate validation paths (client = papaparse + custom validators in `lib/admin/csv-parse.ts`; backend = Pydantic `BulkInviteRowDTO` validators).

**How to avoid:** Plan 14-03 Task contract: client-side validation rules MUST mirror backend exactly (defined in shared spec — UI-SPEC §Surface C / D-B4). Single source of truth = Pydantic DTO; client validator imitates. Test: feed the same bad CSV to both paths and assert they reject the same rows.

**Warning signs:** UAT report: "I uploaded a CSV with 50 rows; the modal said 50 valid; submit said 47 succeeded, 3 failed" — when client preview should have caught the 3.

### Pitfall 6: Audit table 50k cap measured wrong

**What goes wrong:** D-Z2 says "50k visible rows hard cap; older rows JSON-export only". If the backend returns total > 50k, the frontend pagination UI displays "Sayfa 1 / 50000" — confusing UX.

**Why it happens:** Backend `total` count returns the unfiltered count, not the post-cap count. Frontend uses `total` for pagination math.

**How to avoid:** Backend `GetGlobalAuditUseCase` returns `total = min(actual_count, 50000)` AND `truncated = (actual_count > 50000)` boolean. Frontend renders an AlertBanner above the table when `truncated === true` (UI-SPEC §Surface H "50k cap warning AlertBanner"). Pagination math uses the capped total.

**Warning signs:** Pagination shows nonsense pages (Sayfa 1000 / 50000) when no AlertBanner is visible. JSON export downloads partial data without warning.

### Pitfall 7: PostgreSQL `extra_metadata` JSONB query syntax confusion

**What goes wrong:** Plan 14-09 audit-log enrichment writes `{"task_title": "X"}`. Plan 14-07 audit query needs to filter by action prefix `task.` — if the planner mixes JSONB extract syntax (`extra_metadata->>'task_title'`) with column syntax (`extra_metadata.task_title`) the query fails silently or returns empty.

**Why it happens:** SQLAlchemy's async JSONB API is not the same as raw psql; mixing `.astext` accessor (correct) with attribute access (wrong) produces no SQL error but no rows.

**How to avoid:** Reference `Backend/app/infrastructure/database/repositories/audit_repo.py:71` — `AuditLogModel.extra_metadata["source_phase_id"].astext == source_phase_id`. ALWAYS use `["key"].astext` for string compares. Add an integration test that filters by `extra_metadata.project_id` and asserts non-zero hit count.

**Warning signs:** `/admin/audit` filter modal returns empty results when filter is non-empty. SQL EXPLAIN shows the WHERE clause references the JSONB column but never matches.

### Pitfall 8: `extra_metadata` column name mismatch (Python attr vs DB column)

**What goes wrong:** SQLAlchemy `Base.metadata` is reserved (the registry). `Backend/app/infrastructure/database/models/audit_log.py:33` uses `extra_metadata = Column("metadata", JSONB, ...)` — Python attribute name `extra_metadata`, DB column literally named `metadata`.

**Why it happens:** Pitfall 7 from Phase 9 RESEARCH.md explicitly documents this. New developers read `metadata` in SQL and get confused, or call `row.metadata` in Python and get the SQLAlchemy registry instead of the JSONB.

**How to avoid:** Plan 14-09 and 14-10 callers MUST use `row.extra_metadata` (Python). DTOs MUST serialize as `metadata` field (matches existing Phase 9 D-09 Pydantic). Verify via existing `Backend/app/application/dtos/activity_dtos.py` (search for `metadata` field).

**Warning signs:** Backend integration tests fail with "AttributeError: 'AuditLogModel' object has no attribute 'metadata'" when reading. Or DTO field is `extra_metadata` (wrong) and frontend expects `metadata`.

### Pitfall 9: Cross-phase regression — Phase 13 ActivityTab in /projects/[id] breaks after audit-event-mapper extension

**What goes wrong:** Plan 14-10 extends `audit-event-mapper.ts` SemanticEventType union from 10 → 23. The `semanticToFilterChip` function (`Frontend2/lib/audit-event-mapper.ts:91-108`) doesn't have branches for the 13 NEW types. New events fall into the `"all"` chip — Activity Tab filter "Lifecycle" no longer captures user_role_changed events.

**Why it happens:** Adding to the union without updating the chip function. TypeScript exhaustiveness check on `semanticToFilterChip` would catch this if the function used `assertNever(...)` exhaustiveness, but it currently uses `return "all"` as fallback.

**How to avoid:** Plan 14-10 MUST update `semanticToFilterChip` for every new type. Add a "user" chip and a "join-request" chip OR fold all new admin-side types under a new "admin" chip OR document them as falling into `"all"` deliberately. Researcher recommends a NEW chip `"admin"` (covers all 7 user_* + 3 project_join_request_* + comment_edited/deleted = 12 of 13). `task_field_updated` and `project_archived/status_changed` fold into `"status"` chip.

**Warning signs:** Activity Tab `Lifecycle` filter chip shows fewer events after Plan 14-10. RTL test on `semanticToFilterChip` for new types fails.

### Pitfall 10: Frontend middleware NOT updated → /admin accessible without login

**What goes wrong:** Plan 14-02 ships the admin layout with client-side `useAuth()` redirect, but FORGETS to extend `Frontend2/middleware.ts:14-22` matcher. Unauthenticated users navigating to `/admin/users` see a flash of admin content while the layout hydrates and redirects.

**Why it happens:** Two separate gates (middleware + layout); easy to land one without the other.

**How to avoid:** Plan 14-02 acceptance criteria includes "verify `Frontend2/middleware.ts` matcher contains `/admin/:path*`". E2E `admin-route-guard.spec.ts` (Plan 14-12) hits `/admin/users` with no cookie and asserts redirect to `/auth/login`.

**Warning signs:** Brief flash of admin content for unauthenticated users (visible in slow-network mode). E2E test fails.

## Code Examples

### Common Operation 1: Read Pending Join Requests (Overview tab top-5)

```typescript
// Source: Frontend2/services/admin-join-request-service.ts (NEW)
import { apiClient } from "@/lib/api-client"

export interface PendingJoinRequest {
  id: number
  project: { id: number; key: string; name: string }
  requestedBy: { id: number; full_name: string; avatar_url: string | null }
  targetUser: { id: number; full_name: string; avatar_url: string | null }
  note: string | null
  created_at: string
}

interface PendingJoinRequestDTO {
  id: number
  project: { id: number; key: string; name: string }
  requested_by: { id: number; full_name: string; avatar_url: string | null }
  target_user: { id: number; full_name: string; avatar_url: string | null }
  note: string | null
  created_at: string
}

interface PendingResponseDTO {
  items: PendingJoinRequestDTO[]
  total: number
}

function mapPending(d: PendingJoinRequestDTO): PendingJoinRequest {
  return {
    id: d.id,
    project: d.project,
    requestedBy: d.requested_by,
    targetUser: d.target_user,
    note: d.note,
    created_at: d.created_at,
  }
}

export const adminJoinRequestService = {
  listPending: async (limit = 5, offset = 0): Promise<{ items: PendingJoinRequest[]; total: number }> => {
    const resp = await apiClient.get<PendingResponseDTO>(
      "/admin/join-requests", { params: { status: "pending", limit, offset } }
    )
    return { items: resp.data.items.map(mapPending), total: resp.data.total }
  },
  approve: async (id: number) => apiClient.post(`/admin/join-requests/${id}/approve`),
  reject: async (id: number) => apiClient.post(`/admin/join-requests/${id}/reject`),
}
```

```typescript
// Source: Frontend2/hooks/use-pending-join-requests.ts (NEW)
import { useQuery } from "@tanstack/react-query"
import { adminJoinRequestService } from "@/services/admin-join-request-service"

export function usePendingJoinRequests(limit = 5) {
  return useQuery({
    queryKey: ["admin", "join-requests", "pending", { limit }],
    queryFn: () => adminJoinRequestService.listPending(limit, 0),
    staleTime: 30 * 1000,  // D-W1 — 30s typical for admin data
    refetchOnWindowFocus: true,
  })
}
```

### Common Operation 2: Backend ProjectJoinRequest entity + repository interface

```python
# Source: Backend/app/domain/entities/project_join_request.py (NEW)
from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime

JoinRequestStatus = Literal["pending", "approved", "rejected", "cancelled"]


class ProjectJoinRequest(BaseModel):
    id: Optional[int] = None
    project_id: int
    requested_by_user_id: int
    target_user_id: int
    status: JoinRequestStatus = "pending"
    note: Optional[str] = None
    reviewed_by_admin_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
```

```python
# Source: Backend/app/domain/repositories/project_join_request_repository.py (NEW)
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from app.domain.entities.project_join_request import ProjectJoinRequest, JoinRequestStatus


class IProjectJoinRequestRepository(ABC):
    @abstractmethod
    async def create(self, request: ProjectJoinRequest) -> ProjectJoinRequest: ...

    @abstractmethod
    async def get_by_id(self, request_id: int) -> Optional[ProjectJoinRequest]: ...

    @abstractmethod
    async def list_by_status(
        self, status: JoinRequestStatus, limit: int = 50, offset: int = 0
    ) -> Tuple[List[ProjectJoinRequest], int]: ...

    @abstractmethod
    async def update_status(
        self, request_id: int, status: JoinRequestStatus,
        reviewed_by_admin_id: Optional[int] = None,
    ) -> Optional[ProjectJoinRequest]: ...
```

### Common Operation 3: Audit-event-mapper extension (Plan 14-10)

```typescript
// Source: Frontend2/lib/audit-event-mapper.ts (EXTEND — adds 13 NEW members)
export type SemanticEventType =
  // Existing 10 (Phase 13)
  | "task_created"
  | "task_status_changed"
  | "task_assigned"
  | "comment_created"
  | "task_deleted"
  | "phase_transition"
  | "milestone_created"
  | "milestone_updated"
  | "artifact_status_changed"
  | "phase_report_created"
  // NEW Phase 14 (D-D3) — 13 additions
  | "task_field_updated"
  | "project_archived"
  | "project_status_changed"
  | "comment_edited"
  | "comment_deleted"
  | "user_invited"
  | "user_deactivated"
  | "user_activated"
  | "user_role_changed"
  | "user_password_reset_requested"
  | "project_join_request_created"
  | "project_join_request_approved"
  | "project_join_request_rejected"

// EXTEND mapAuditToSemantic — add new branches AFTER existing ones (Pitfall 1)
export function mapAuditToSemantic(item: ActivityItem): SemanticEventType | null {
  // ... existing branches preserved verbatim ...

  // NEW Phase 14 — task field updates (catch-all for non-status field changes)
  if (item.entity_type === "task" && item.action === "updated") {
    const f = item.field_name
    if (f === "column_id") return "task_status_changed"        // existing
    if (f === "assignee_id") return "task_assigned"            // existing
    if (f != null && f !== "")                                  // NEW catch-all
      return "task_field_updated"
  }
  if (item.entity_type === "project" && item.action === "archived") return "project_archived"
  if (item.entity_type === "project" && item.action === "updated" && item.field_name === "status")
    return "project_status_changed"
  if (item.entity_type === "comment" && item.action === "updated") return "comment_edited"
  if (item.entity_type === "comment" && item.action === "deleted") return "comment_deleted"
  if (item.entity_type === "user") {
    if (item.action === "invited") return "user_invited"
    if (item.action === "deactivated") return "user_deactivated"
    if (item.action === "activated") return "user_activated"
    if (item.action === "role_changed") return "user_role_changed"
    if (item.action === "password_reset_requested") return "user_password_reset_requested"
  }
  if (item.entity_type === "project_join_request") {
    if (item.action === "created") return "project_join_request_created"
    if (item.action === "approved") return "project_join_request_approved"
    if (item.action === "rejected") return "project_join_request_rejected"
  }

  return null
}

// EXTEND semanticToFilterChip (Pitfall 9 — must update for every new type)
export type ActivityFilterChip = "create" | "status" | "assign" | "comment" | "lifecycle" | "admin" | "all"

export function semanticToFilterChip(t: SemanticEventType): ActivityFilterChip {
  // ... existing branches preserved ...

  // NEW Phase 14 — most user_* and project_join_request_* events fold into "admin" chip
  if (t === "user_invited" || t === "user_deactivated" || t === "user_activated" ||
      t === "user_role_changed" || t === "user_password_reset_requested" ||
      t === "project_join_request_created" || t === "project_join_request_approved" ||
      t === "project_join_request_rejected" ||
      t === "comment_edited" || t === "comment_deleted") return "admin"

  // task_field_updated + project_status_changed + project_archived → status chip
  if (t === "task_field_updated" || t === "project_status_changed" || t === "project_archived")
    return "status"

  return "all"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `Tabs` primitive for both in-page and sub-route navigation | `Tabs` (in-page state, `onChange`) + `NavTabs` (sub-route nav, Link-based) | Phase 14 (proposed) | Removes the discriminated-union prop hack from extending `Tabs`. NavTabs is ~50 LOC; cheap. |
| Audit log without enriched metadata (Phase 9 D-09 baseline) | `extra_metadata` JSONB enriched at write time with task_title, project_name, comment_excerpt | Phase 14 D-D2 | Activity surfaces render Jira-quality lines. Old rows degrade gracefully. |
| Activity rendering via simple verb formatter | Full Jira-style render with field-change pairs, project archive, user lifecycle, join request states | Phase 14 D-D4 | Dramatic UX improvement on /admin/audit + 3 existing surfaces. |
| Modal-less ConfirmDialog with hardcoded primary button | ConfirmDialog with `tone?: "primary" | "danger" | "warning"` + icon prefix | Phase 14 Plan 14-01 Task 1 | Destructive actions (Delete user, Delete project, Delete template) get correct visual affordance. Backward compat preserved. |
| Frontend2 had 17 primitives | 18 primitives after Phase 14 (NavTabs) — and a Modal primitive (NEW, building on Pattern 2) for the 4 admin modals | Phase 14 | Net +1 primitive (NavTabs); Modal recommended but optional (if planner picks ad-hoc per modal, that's allowed but discouraged). |
| Audit log filter via on-the-fly compute | Same approach for v2.0; daily snapshot table is v2.1 candidate at scaling cliff | Phase 14 D-X2 | No infrastructure change in v2.0. Document the cliff. |

**Deprecated/outdated:**
- "Risk" classifier in audit logs — explicitly skipped (D-Z1) as a thesis-scope security-theater anti-pattern.
- Custom roles ("Guest" / "Yeni rol") — placeholder only; full RBAC is v3.0.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | papaparse 5.5.3 is current latest stable | Standard Stack | Low — verified via npmjs.com latest. Could shift if 5.5.4 ships before Plan 14-01 lands; pin exact version OR use caret. |
| A2 | Bundle delta from papaparse install ~45 KB gz | Standard Stack | Low — papaparse is small + zero-deps. Could measure post-install via `next build` size report; not on critical path. |
| A3 | Active users on-the-fly compute scales to ~10k events/day before query latency degrades | Stats Data Sources / D-X2 | MEDIUM — not measured. Plan 14-09 Task should run EXPLAIN ANALYZE on the proposed `date_trunc('day', timestamp) GROUP BY day` query against a seeded dataset of 10k+ events to validate. v2.1 daily snapshot fallback documented. |
| A4 | NavTabs primitive (~50 LOC) is preferred over extending Tabs | Architecture Patterns Pattern 1 | Low — researcher recommendation; planner may pick the Tabs extension instead and the work is roughly equivalent. |
| A5 | Per-user transaction (vs all-or-none) for bulk-action endpoint is the right call | Don't Hand-Roll | MEDIUM — D-B7 says "Atomic — all-or-none transaction; audit log writes one entry per user". Researcher recommendation diverges (per-user with status reporting). **Discrepancy with locked decision.** Defer to D-B7 unless the planner re-opens the decision. |
| A6 | Modal primitive (Pattern 2) is preferred over per-modal ad-hoc | Architecture Patterns Pattern 2 | Low — researcher recommendation; if planner picks ad-hoc per-modal, code volume grows ~30% for the 4 admin modals but no functional regression. |
| A7 | All 4 admin modals fit the same Modal shell (header/body/footer slots) | Architecture Patterns Pattern 2 | Low — verified by reading prototype + UI-SPEC §Modal Anatomy. AddUserModal, BulkInviteModal, AuditFilterModal, PendingRequestsModal all have title + scrollable body + action footer. |
| A8 | papaparse client-side parse + per-row backend Pydantic validation is sufficient defense for malformed CSV | Pitfalls 5 | Low — papaparse handles RFC-4180 + encoding; backend handles schema. Two layers. |
| A9 | Audit table 50k cap is enforced at backend (not just frontend pagination math) | Pitfalls 6 | Low — D-Z2 explicitly says "Hard cap 50k visible rows" — must be server-side. Add Plan 14-07 acceptance test. |

**Note on A5 discrepancy:** D-B7 says atomic; canonical_refs §Research Items says "per-user with status reporting". Researcher's instinct is per-user (better DoS posture, partial-success reporting), but D-B7 is locked. **Planner: defer to D-B7 (atomic) unless user re-opens.**

## Open Questions

1. **Bulk action atomicity contradiction (D-B7 vs canonical_refs research item)**
   - What we know: D-B7 says atomic ("all-or-none transaction; audit log writes one entry per user"). canonical_refs says per-user with status reporting.
   - What's unclear: Which wins?
   - Recommendation: Default to D-B7 (atomic). If a UAT tester reports "I bulk-deactivated 50 users; one failed; all 50 reverted" as a frustration, re-open in v2.1.

2. **Admin route guard placement — middleware vs server component vs client layout**
   - What we know: Phase 13 used client-side check; D-C3 says client redirect; canonical_refs says "researcher to evaluate middleware". Researcher's recommendation: all three (middleware + client + backend `Depends`).
   - What's unclear: If middleware is added, does the layout's client check become redundant?
   - Recommendation: Keep both. Middleware redirects unauthenticated users (cookie missing) BEFORE SSR. Client layout handles role check after auth hydration (admin-only sub-set). Backend `Depends(require_admin)` is the only authoritative defense.

3. **Active users daily snapshot threshold**
   - What we know: D-X2 says ~10k events/day breaks query perf. Untested.
   - What's unclear: Real threshold — could be 50k/day with the right index.
   - Recommendation: Plan 14-09 Task includes an EXPLAIN ANALYZE on the GROUP BY day query against seeded 10k/50k/100k event datasets. Document threshold. Defer snapshot table to v2.1 unless performance demands it sooner.

4. **Email invite link expiry — 7 days vs 24h**
   - What we know: D-W3 / Discretion says 7 days for invite, 24h for reset. Auth0 / Clerk / Okta defaults vary.
   - What's unclear: Whether 7d is too long (security) or too short (recipient delays).
   - Recommendation: 7 days is industry norm for invite (matches Auth0 default). Config-driven (`INVITE_TOKEN_TTL_DAYS=7` in `.env`) so customers can tune.

5. **NavTabs primitive — extend Tabs vs new wrapper**
   - What we know: D-C4 says "planner picks based on Tabs API surface".
   - What's unclear: Whether the Tabs extension would force breaking changes for Phase 11/12/13 callers.
   - Recommendation: NEW NavTabs wrapper (Pattern 1). Researcher's call. Cleaner; no breaking.

6. **Bulk invite max-row cap (500)**
   - What we know: D-B4 says 500 row max.
   - What's unclear: Whether 500 is the right number for v2.0 (could be too low for org imports).
   - Recommendation: 500 is fine for v2.0 (typical org has < 200 users). Config-driven if expansion needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend2 build / dev | ✓ | (existing — used by Phase 13) | — |
| npm | Frontend2 dependency install (Plan 14-01 papaparse) | ✓ | (existing) | — |
| Python 3.x | Backend (existing) | ✓ | (existing) | — |
| FastAPI | Backend (existing) | ✓ | (existing) | — |
| PostgreSQL | Backend DB (existing) | ✓ | 15 (Backend/docker-compose.yaml) | — |
| asyncpg | Backend async PG driver (existing) | ✓ | (existing) | — |
| Alembic | Migration 006 (project_join_requests) | ✓ | (existing) | — |
| pytest | Backend tests (existing) | ✓ | (existing) | — |
| pytest-asyncio | Backend async tests (existing) | ✓ | (existing) | — |
| recharts | Stats trend chart (Plan 14-08) | ✓ | 3.8.1 (Frontend2/node_modules/recharts/) | — |
| `papaparse` | Bulk invite CSV parse (Plan 14-03) | ✗ | — | **MUST INSTALL** in Plan 14-01 — `npm install [email protected]` |
| `@types/papaparse` | TypeScript types | ✗ | — | **MUST INSTALL** in Plan 14-01 — `npm install --save-dev @types/[email protected]` |
| Phase 12 fpdf2 service | Admin summary PDF (Plan 14-11) | ✓ | (existing — shipped Phase 9 D-50 / Phase 12 D-58) | — |
| Phase 5 email infra (SMTP) | Invite + reset emails | ✓ | (existing) | — |
| Phase 2 PasswordResetToken entity | Invite + reset flows | ✓ | (existing — `Backend/app/domain/entities/password_reset_token.py`) | — |
| `Frontend2/middleware.ts` matcher slot for `/admin/:path*` | Route protection (Plan 14-02) | Missing entry | — | **MUST EDIT** Plan 14-02 — add `/admin/:path*` to matcher array |
| Playwright | E2E tests (Plan 14-12) | ✓ | (existing — `Frontend2/playwright.config.ts`) | — |
| Vitest + RTL | Unit + integration tests for Frontend2 | ✓ | (existing — `Frontend2/vitest.config.ts`) | — |

**Missing dependencies with no fallback:** None blocking — papaparse install is straightforward and has no alternative worth pursuing (see Don't Hand-Roll table).

**Missing dependencies with fallback:** None — papaparse install IS the action.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Frontend Framework | Vitest 1.6 + React Testing Library 16.3 + jsdom 24.1 |
| Frontend Config file | `Frontend2/vitest.config.ts` |
| Frontend Quick run command | `cd Frontend2 && npm test -- {file_path}` (single file) |
| Frontend Full suite command | `cd Frontend2 && npm test` |
| Frontend E2E framework | Playwright 1.51 |
| Frontend E2E config | `Frontend2/playwright.config.ts` |
| Frontend E2E command | `cd Frontend2 && npm run test:e2e` |
| Backend Framework | pytest + pytest-asyncio (asyncio_mode=auto) |
| Backend Config file | `Backend/pytest.ini` |
| Backend Quick run command | `cd Backend && pytest tests/integration/test_{module}.py::test_{name} -x` |
| Backend Full suite command | `cd Backend && pytest -q` |
| In-memory fakes pattern | `Backend/tests/integration/test_user_activity.py:31-60` (`FakePrivacyFilteredAuditRepo`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADM-01 | Non-admin user is redirected from /admin | E2E (Playwright) | `npm run test:e2e -- e2e/admin-route-guard.spec.ts` | ❌ Wave 0 (Plan 14-12) |
| ADM-01 | Backend rejects non-admin on `GET /api/v1/admin/users` with 403 | Backend integration | `pytest tests/integration/test_admin_users_crud.py::test_non_admin_403 -x` | ❌ Wave 0 (Plan 14-01) |
| ADM-02 | NavTabs Active detection — `/admin` shows Overview active when at `/admin`; not active when at `/admin/users` | RTL (Vitest) | `npm test -- components/primitives/nav-tabs.test.tsx` | ❌ Wave 0 (Plan 14-01) |
| ADM-02 | Layout renders the page header + 8 NavTabs + admin-only-content | RTL (Vitest) | `npm test -- app/(shell)/admin/layout.test.tsx` | ❌ Wave 0 (Plan 14-02) |
| ADM-03 | Overview displays 5 StatCards with values from `/admin/users` and `/admin/join-requests` aggregations | RTL (Vitest) | `npm test -- components/admin/overview/overview-stat-cards.test.tsx` | ❌ Wave 0 (Plan 14-02) |
| ADM-03 | Pending Requests panel shows top 5 + "Tümünü gör" opens modal | RTL (Vitest) | `npm test -- components/admin/overview/pending-requests-card.test.tsx` | ❌ Wave 0 (Plan 14-02) |
| ADM-04 | Add User modal — submit triggers `POST /admin/users` and shows success toast | RTL (Vitest) | `npm test -- components/admin/users/add-user-modal.test.tsx` | ❌ Wave 0 (Plan 14-03) |
| ADM-04 | Bulk Invite modal — papaparse parses CSV, shows valid/invalid summary, submit batch-invites | RTL (Vitest) | `npm test -- components/admin/users/bulk-invite-modal.test.tsx` | ❌ Wave 0 (Plan 14-03) |
| ADM-04 | Bulk action atomicity — `POST /admin/users/bulk-action` rolls back on partial failure | Backend integration | `pytest tests/integration/test_admin_users_crud.py::test_bulk_action_atomic -x` | ❌ Wave 0 (Plan 14-01) |
| ADM-04 | papaparse CSV parser handles RFC-4180 quoting + UTF-8 BOM + max 500 rows | RTL (Vitest) | `npm test -- lib/admin/csv-parse.test.ts` | ❌ Wave 0 (Plan 14-01) |
| ADM-05 | Roller cards render disabled "Düzenle" buttons + page-level AlertBanner with v3.0 explanation | RTL (Vitest) | `npm test -- components/admin/roles/role-cards-grid.test.tsx` | ❌ Wave 0 (Plan 14-04) |
| ADM-06 | Permissions Matrix grid renders 14 perms × 4 roles with all toggles `disabled` + `aria-disabled` + tooltip | RTL (Vitest) | `npm test -- components/admin/permissions/permission-matrix-card.test.tsx` | ❌ Wave 0 (Plan 14-04) |
| ADM-07 | Admin Projects table reads `GET /projects?include_archived=true` and shows MoreH menu | RTL (Vitest) | `npm test -- components/admin/projects/admin-projects-table.test.tsx` | ❌ Wave 0 (Plan 14-05) |
| ADM-08 | Templates grid reads `GET /api/v1/process-templates` and per-card MoreH provides Edit/Clone/Delete | RTL (Vitest) | `npm test -- components/admin/workflows/admin-templates-grid.test.tsx` | ❌ Wave 0 (Plan 14-06) |
| ADM-09 | `IAuditRepository.get_global_audit(filters, limit, offset)` returns paginated results | Backend integration | `pytest tests/integration/test_admin_audit_get_global.py -x` | ❌ Wave 0 (Plan 14-01) |
| ADM-09 | Audit table renders Detay column via ActivityRow `variant="admin-table"` | RTL (Vitest) | `npm test -- components/admin/audit/admin-audit-table.test.tsx` | ❌ Wave 0 (Plan 14-07) |
| ADM-09 | Audit JSON export honors current filter | Backend integration | `pytest tests/integration/test_admin_audit_get_global.py::test_json_export_filter -x` | ❌ Wave 0 (Plan 14-01) |
| ADM-09 | Audit 50k cap returns truncated boolean + capped total | Backend integration | `pytest tests/integration/test_admin_audit_get_global.py::test_50k_cap -x` | ❌ Wave 0 (Plan 14-01) |
| ADM-10 | `/api/v1/admin/stats` returns composite payload (active_users_trend + methodology + velocity top-30) | Backend integration | `pytest tests/integration/test_admin_stats.py -x` | ❌ Wave 0 (Plan 14-01) |
| ADM-10 | Active Users Trend chart renders recharts LineChart from stats payload | RTL (Vitest) | `npm test -- components/admin/stats/active-users-trend-chart.test.tsx` | ❌ Wave 0 (Plan 14-08) |
| ADM-10 | Methodology + Velocity bars render from CSS divs (no recharts) | RTL (Vitest) | `npm test -- components/admin/stats/methodology-bars.test.tsx` | ❌ Wave 0 (Plan 14-08) |
| ADM-11 | task_repo.py audit_log writes include extra_metadata.task_title + project_name | Backend integration | `pytest tests/integration/test_audit_log_enrichment.py -x` | ❌ Wave 0 (Plan 14-09) |
| ADM-11 | comment use cases write 160-char excerpt to extra_metadata, not full body | Backend integration | `pytest tests/integration/test_audit_log_enrichment.py::test_comment_excerpt -x` | ❌ Wave 0 (Plan 14-09) |
| ADM-12 | mapAuditToSemantic resolves all 23 SemanticEventTypes (10 existing + 13 NEW) | RTL (Vitest) | `npm test -- lib/audit-event-mapper.test.ts` | ❌ Wave 0 (Plan 14-10) — extends existing test |
| ADM-12 | Backward compat — Phase 13 task_status_changed still resolves correctly post-extension | RTL (Vitest) | `npm test -- lib/audit-event-mapper.test.ts::test_backward_compat` | ❌ Wave 0 (Plan 14-10) |
| ADM-12 | activity-row.tsx renders task_field_updated / project_archived / user_invited / project_join_request_* | RTL (Vitest) | `npm test -- components/activity/activity-row.test.tsx` | ❌ Wave 0 (Plan 14-10) — extends existing |
| ADM-12 | Old audit rows (no extra_metadata) render via fallback path (D-D6) | RTL (Vitest) | `npm test -- components/activity/activity-row.test.tsx::test_d_d_6_fallback` | ❌ Wave 0 (Plan 14-10) |
| ADM-13 | Header `Rapor al` triggers PDF download (rate-limited 30s) | RTL (Vitest) + Backend | `npm test -- components/admin/page-header.test.tsx`, `pytest tests/integration/test_generate_admin_summary_pdf.py -x` | ❌ Wave 0 (Plans 14-01 + 14-11) |
| ADM-13 | Header `Denetim günlüğü` button → `router.push('/admin/audit')` | RTL (Vitest) | `npm test -- components/admin/page-header.test.tsx::test_audit_button_nav` | ❌ Wave 0 (Plan 14-11) |
| ADM-14 | E2E happy path — Admin can complete each tab's primary flow | E2E (Playwright) | `npm run test:e2e -- e2e/admin-*.spec.ts` | ❌ Wave 0 (Plan 14-12) |
| ADM-14 | UAT checklist artifact exists with ~25-30 rows covering all 8 tabs | Manual review | (Plan 14-12 deliverable) | ❌ Wave 0 (Plan 14-12) |

### Sampling Rate

- **Per task commit:** `npm test -- {affected file}` (Frontend) or `pytest tests/integration/{affected test}.py -x` (Backend) — < 30 seconds typically.
- **Per wave merge:** Frontend `npm test` + Backend `pytest -q` — full suite < 5 minutes.
- **Phase gate:** Full suite green (Frontend Vitest + Backend pytest + Playwright E2E) before `/gsd-verify-work`. UAT checklist clicked through against running stack.

### Wave 0 Gaps

- [ ] `Frontend2/components/primitives/nav-tabs.tsx` + `nav-tabs.test.tsx` — covers ADM-02
- [ ] `Frontend2/components/primitives/modal.tsx` + `modal.test.tsx` — covers Pattern 2
- [ ] `Frontend2/components/projects/confirm-dialog.tsx` EXTEND — covers Pattern 3 (test added to existing test file)
- [ ] `Frontend2/lib/admin/csv-parse.ts` + `csv-parse.test.ts` — covers ADM-04 papaparse wrapper
- [ ] `Frontend2/lib/admin/audit-field-labels.ts` + (no test — pure const)
- [ ] `Frontend2/lib/admin/permissions-static.ts` + (no test — pure const)
- [ ] `Frontend2/services/admin-{join-request,user,audit,stats}-service.ts` (4 files)
- [ ] `Frontend2/hooks/use-{pending-join-requests,approve-join-request,reject-join-request,admin-users,invite-user,bulk-invite,deactivate-user,reset-password,change-role,bulk-action,admin-audit,admin-stats}.ts` (12 files)
- [ ] `Backend/app/domain/entities/project_join_request.py`
- [ ] `Backend/app/domain/repositories/project_join_request_repository.py` (ABC)
- [ ] `Backend/app/infrastructure/database/models/project_join_request.py`
- [ ] `Backend/app/infrastructure/database/repositories/project_join_request_repo.py`
- [ ] `Backend/app/application/dtos/project_join_request_dtos.py`, `admin_user_dtos.py`, `admin_audit_dtos.py`, `admin_stats_dtos.py`, `admin_summary_pdf_dtos.py` (5 files)
- [ ] `Backend/app/application/use_cases/{create,approve,reject,list_pending}_join_request.py` (4 files)
- [ ] `Backend/app/application/use_cases/{invite,deactivate,bulk_invite,reset,change_role,bulk_action}_user.py` (6 files)
- [ ] `Backend/app/application/use_cases/get_global_audit.py`, `get_admin_stats.py`, `generate_admin_summary_pdf.py` (3 files)
- [ ] `Backend/app/api/v1/admin_{join_requests,users,audit,stats,summary}.py` (5 routers)
- [ ] `Backend/alembic/versions/006_phase14_admin_panel.py` — project_join_requests table only
- [ ] `Backend/tests/integration/test_create_join_request.py`, `test_approve_join_request.py`, `test_admin_users_crud.py`, `test_admin_audit_get_global.py`, `test_admin_stats.py`, `test_audit_log_enrichment.py`, `test_generate_admin_summary_pdf.py` (7 files)
- [ ] Framework install: `cd Frontend2 && npm install [email protected] && npm install --save-dev @types/[email protected]`

## Implementation Strategy (Wave Hints)

| Plan | Files | Type | Wave | Parallelizable? | Notes |
|------|-------|------|------|-----------------|-------|
| 14-01 | ~30-35 | Backend + Frontend Wave 0 fat infra | W1 | NO — gates everything | Backend `ProjectJoinRequest` slice + 5 admin routers + DTOs + integration tests + audit-log enrichment scaffolding (without applying enrichment yet — that's 14-09). Frontend `admin-*-service.ts` (4) + `use-*` hooks (12) + `lib/admin/csv-parse.ts` + `nav-tabs.tsx` + Modal primitive + ConfirmDialog tone extension + papaparse install. Wave 1 of all subsequent plans. |
| 14-02 | ~8-10 | Frontend Layout + Overview tab | W2 | YES (with 14-04, 14-05, 14-06, 14-08) | Only depends on 14-01 services/hooks. `app/(shell)/admin/layout.tsx` + `app/(shell)/admin/page.tsx` + Overview components + middleware extension. |
| 14-03 | ~10-12 | Frontend Users tab | W2 | YES (parallel with 14-04..14-08) | Heavy plan — Add User modal + Bulk Invite modal + per-row MoreH + bulk-select. Depends on 14-01 services. |
| 14-04 | ~4-6 | Frontend Roles + Permissions placeholder tabs | W2 | YES | Static content only. Cheap. |
| 14-05 | ~5-7 | Frontend Projects tab | W2 | YES | Reuses existing project endpoints. |
| 14-06 | ~4-5 | Frontend Workflows tab | W2 | YES | Reuses process-templates endpoint. |
| 14-07 | ~8-10 | Frontend Audit tab | W2 | YES | Depends on 14-01 admin-audit-service. Detay column uses Plan 14-10 ActivityRow variant — partial overlap; can stub initially. |
| 14-08 | ~6-8 | Frontend Stats tab | W2 | YES | Depends on 14-01 admin-stats-service. Includes recharts ActiveUsersTrendChart. |
| 14-09 | ~7-9 | Backend audit-log enrichment cross-cutting | W3 | NO (gates 14-10's full-fidelity render) | Modifies 5+ existing files. Risk of regression — test backward compat. |
| 14-10 | ~6-8 | Frontend Jira render cross-cutting | W3 (after 14-09) | NO (depends on 14-09 metadata reaching frontend) | Extends audit-event-mapper + activity-row + event-meta. Affects 4 surfaces (Audit + 3 existing). Wave 3 because Wave 2 plans write the render shells but the metadata-driven enrichment lights up here. |
| 14-11 | ~3-4 | Frontend Header buttons + AvatarDropdown verify | W3 | YES (parallel with 14-10) | Wires `Rapor al` (PDF download) + `Denetim günlüğü` (router push). |
| 14-12 | ~4-5 | E2E + UAT artifact | W4 | NO (final phase gate) | Playwright skip-guarded specs. UAT checklist artifact for `/gsd-verify-work` pickup. |

**Wave summary:**
- **W1 (Wave 0 fat infra):** Plan 14-01 — single-thread, gates everything.
- **W2 (Surface plans):** Plans 14-02, 14-03, 14-04, 14-05, 14-06, 14-07, 14-08 — all parallel-eligible; 7 plans can run concurrently.
- **W3 (Cross-cutting):** Plan 14-09 (Backend) — single-thread, modifies live code; Plan 14-10 (Frontend Jira render) — depends on 14-09; Plan 14-11 (Header buttons) — parallel with 14-10.
- **W4 (Phase gate):** Plan 14-12 — E2E + UAT, runs against the merged stack.

**Total file touch estimate:** ~95-110 files (Phase 12 was 47 in fat plan + ~80 in subsequent plans = ~130; Phase 14 is comparable). **Standard mode applies — no chunking needed.**

## Pitfalls & Landmines

(Already enumerated in Common Pitfalls section above. Repeated here in checklist form for the planner:)

- [ ] Pitfall 1: Audit-event-mapper extension breaks Phase 13 ActivityTab — order branches AFTER existing.
- [ ] Pitfall 2: snake_case vs camelCase metadata read — pick (b) read snake_case directly in activity-row, document.
- [ ] Pitfall 3: Admin route guard race condition — layout MUST check `useAuth().isLoading` first.
- [ ] Pitfall 4: NavTabs `/admin` active detection misfires — explicit guard for sub-route active state.
- [ ] Pitfall 5: Bulk invite client-vs-backend validation divergence — single source of truth (Pydantic DTO).
- [ ] Pitfall 6: Audit table 50k cap measured wrong — backend returns capped `total` + `truncated` boolean.
- [ ] Pitfall 7: PostgreSQL JSONB syntax — always `["key"].astext` for string compares.
- [ ] Pitfall 8: `extra_metadata` Python attr vs `metadata` DB column — Pitfall 7 from Phase 9 RESEARCH.
- [ ] Pitfall 9: `semanticToFilterChip` not updated for new types — every new SemanticEventType MUST have a chip mapping.
- [ ] Pitfall 10: Frontend middleware NOT updated → /admin accessible without login — Plan 14-02 acceptance includes matcher edit.

## Sources

### Primary (HIGH confidence)
- `New_Frontend/src/pages/admin.jsx` (482 lines) — Authoritative for AdminPage outer + 8 sub-tab visuals + interactions. Read in full.
- `Frontend2/components/primitives/tabs.tsx` — Existing Tabs primitive structure for NavTabs wrapper.
- `Frontend2/components/projects/confirm-dialog.tsx` — Existing ConfirmDialog interface to extend with `tone` prop.
- `Frontend2/lib/audit-event-mapper.ts` — Existing 10 SemanticEventType union + `mapAuditToSemantic` order.
- `Frontend2/lib/activity/event-meta.ts` — Existing 10 verb formatter; pattern for 13 new entries.
- `Frontend2/components/activity/activity-row.tsx` — Existing render branches; pattern for 5 new branches.
- `Frontend2/components/shell/avatar-dropdown.tsx` — Existing /admin link wired (Phase 13 D-D2).
- `Frontend2/components/dashboard/activity-feed.tsx` — DataState retro-adoption pattern.
- `Frontend2/components/dashboard/stat-card.tsx` — StatCard reuse for Overview's 5 cards.
- `Frontend2/middleware.ts` — Current middleware matcher (missing /admin).
- `Frontend2/context/auth-context.tsx` — `useAuth()` shape, isLoading semantics.
- `Backend/app/api/deps/auth.py` — `require_admin` dependency.
- `Backend/app/domain/repositories/audit_repository.py` — IAuditRepository ABC for `get_global_audit` extension.
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — JSONB query pattern.
- `Backend/app/infrastructure/database/models/audit_log.py` — `extra_metadata = Column("metadata", JSONB, ...)` mapping.
- `Backend/app/api/v1/admin_settings.py` — Admin endpoint pattern with `Depends(require_admin)`.
- `Backend/app/api/v1/users.py` — User summary endpoint pattern (UserListDTO shape).
- `Backend/app/domain/entities/user.py` — User entity with role.
- `Backend/app/domain/entities/role.py` — Role entity (existing — NOT extended in v2.0).
- `.planning/phases/13-reporting-activity-user-profile/13-PATTERNS.md` lines 1-200 — Phase 13 file classification reference.
- `.planning/phases/14-.../14-CONTEXT.md` — All locked decisions (D-00..D-Z2).
- `.planning/phases/14-.../14-UI-SPEC.md` lines 1-500 — UI design contract.
- `Frontend2/package.json` — Verified versions: next 16.2.4, react 19.2.4, recharts 3.8.1, @tanstack/react-query 5.99.2, lucide-react 1.8.0, axios 1.15.1.
- `Frontend2/CLAUDE.md` + `Frontend2/AGENTS.md` — "This is NOT the Next.js you know" — local docs at `Frontend2/node_modules/next/dist/docs/` are authoritative.
- `c:\Users\yusti\Desktop\bitirme projesi\SPMS\CLAUDE.md` — Backend Clean Architecture rules (project root).

### Secondary (MEDIUM confidence)
- [Papa Parse npm](https://www.npmjs.com/package/papaparse) — Latest 5.5.3, zero dependencies, RFC-4180 compliant.
- [Papa Parse Documentation](https://www.papaparse.com/docs) — API for client-side CSV parsing.
- Phase 13 RESEARCH.md (`.planning/phases/13-reporting-activity-user-profile/13-RESEARCH.md`) — recharts pick justification, TanStack Query patterns.

### Tertiary (LOW confidence — flagged in Assumptions Log)
- A2 (papaparse bundle size ~45 KB gz) — estimated from zero-dep package; not measured via `next build` size report.
- A3 (~10k events/day scaling cliff for active users compute) — quoted in CONTEXT D-X2 without measurement; needs EXPLAIN ANALYZE in Plan 14-09.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every recommended library is already installed except papaparse, which is verified via npmjs.com.
- Architecture: HIGH — patterns 1-5 are direct extensions of existing Phase 11/12/13 code; verified against canonical reference files.
- Pitfalls: HIGH — 8 of 10 pitfalls trace directly to identified file references with line numbers; 2 (Pitfall 3, Pitfall 6) are inferred from the auth context shape and the 50k cap decision.
- Validation Architecture: HIGH — test commands verified against existing `Frontend2/vitest.config.ts` and `Backend/pytest.ini` conventions.
- Reuse map: HIGH — every primitive, hook, service, and context references existing file paths read during research.
- Backend slice pattern: HIGH — direct mirror of Phase 9/10/11/12/13 vertical slice patterns.
- Audit-log enrichment scope: MEDIUM — D-D2 lists the touch sites but Plan 14-09 must verify actual write-site count via grep on `audit_repo.create*`.

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days for stable; recharts/papaparse are mature; no fast-moving deps)

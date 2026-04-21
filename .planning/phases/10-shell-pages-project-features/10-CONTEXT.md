# Phase 10: Shell Pages & Project Features - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert 4 core page stubs (Dashboard, Login, Projects, Settings) from Phase 8 placeholders to fully functional Next.js pages visually identical to the HTML prototype. Add project lifecycle management: 4-step create wizard, status dropdown actions (Complete/Hold/Archive), archive AlertBanner, status badges on project cards, and SegmentedControl status filter.

**Scope:** PAGE-01 (Dashboard), PAGE-02 (Projects), PAGE-05 (Settings), PAGE-06 (Login/Auth), PROJ-01 (Create Wizard), PROJ-02 (Status Management), PROJ-03 (Archive Banner), PROJ-04 (Status Badges), PROJ-05 (Status Filter)

**NOT in scope:** ProjectDetail page (Phase 11), MyTasks (Phase 11), admin panel / user management (deferred), register page (closed system — admin adds users directly), Lifecycle/Workflow/Artefakt settings tabs (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### API Integration
- **D-01:** Real backend from day 1 — pages call actual Phase 9 API endpoints. No mock data layer. TanStack Query fetches live data with real error states visible during development.
- **D-02:** Auth token: **localStorage + Bearer header** — re-implement the exact same pattern from `Frontend/lib/api-client.ts` (axios instance, request interceptor attaches `Authorization: Bearer {token}`, response interceptor handles 401 → session-expired redirect). New file: `Frontend2/lib/api-client.ts`.
- **D-03:** **Dual storage for middleware:** On login success, store Bearer token in localStorage (for API calls) AND set a lightweight cookie `auth_session=1` (for Next.js middleware to read server-side). On logout/expire, clear both.
- **D-04:** **QueryClientProvider** lives in `Frontend2/app/(shell)/layout.tsx` — only authenticated pages need queries. Login page is unaffected.
- **D-05:** **Axios** for API client (not native fetch). Mirrors legacy Frontend pattern. Interceptors cleanly handle token injection and 401 redirect.
- **D-06:** **Service + hooks structure** mirrors legacy Frontend:
  - `Frontend2/lib/api-client.ts` — axios instance + interceptors
  - `Frontend2/lib/constants.ts` — `AUTH_TOKEN_KEY`, `NEXT_PUBLIC_API_URL`
  - `Frontend2/services/auth-service.ts` — login, logout, getCurrentUser, updateProfile, uploadAvatar
  - `Frontend2/services/project-service.ts` — CRUD, status change, activity
  - `Frontend2/hooks/use-projects.ts` — TanStack Query wrappers
  - (Etc. per-entity as needed for Phase 10 pages)
  - Re-implement from scratch using Phase 9 endpoint shapes — do NOT copy from `Frontend/`.
- **D-07:** API errors displayed as **toast notifications**. TanStack Query mutation `onError` callbacks trigger toasts. Non-blocking, dismissable.
- **D-08:** **Dedicated AuthContext** — separate `Frontend2/context/auth-context.tsx` stores `user`, `token`, `login()`, `logout()` functions. `AppContext` stays focused on UI state (theme, language). Both providers in root layout.
- **D-09:** **React Query DevTools** included in dev mode (`process.env.NODE_ENV === 'development'`). Zero prod cost.
- **D-10:** **Session-expired page** required at `Frontend2/app/(auth)/session-expired/page.tsx`. Triggered by 401 interceptor (same behavior as legacy). Clears token, shows friendly message, link back to login.

### Auth Routing
- **D-11:** Closed system — **no self-registration**. Admin adds users directly via backend or invite. No `/register` page.
- **D-12:** Auth pages live in separate route group `Frontend2/app/(auth)/` with no sidebar/header:
  - `(auth)/login/page.tsx`
  - `(auth)/session-expired/page.tsx`
  - `(auth)/forgot-password/page.tsx`
- **D-13:** **Next.js middleware** (`Frontend2/middleware.ts`) guards all `(shell)` routes. Reads `auth_session` cookie. If missing, redirects to `/login`.
- **D-14:** After successful login → redirect to `/dashboard`.

### Create Project Wizard (PROJ-01)
- **D-15:** **Separate full page** at `/projects/new` (`Frontend2/app/(shell)/projects/new/page.tsx`). Not a modal. Supports browser back/forward.
- **D-16:** Step tracked via **URL search params** (`?step=1`, `?step=2`, etc.). `useSearchParams()` reads current step. Back button navigates step-back.
- **D-17:** **Validate before advancing** — "Sonraki" button disabled until required fields filled. Step 1 requires: project name + team selection. Step 2 requires: template or "custom" selection.
- **D-18:** After successful creation → redirect to `/projects/{id}` (project detail).
- **D-19:** **Step 2 (Metodoloji):** Loads process templates from `GET /process-templates`. Dynamic, not hardcoded.
- **D-20:** **Step 3 (Yaşam Döngüsü):** Read-only preview of selected template's default workflow nodes. Full workflow editor is Phase 12. If template has no `default_workflow`, show empty state with note "Yaşam döngüsü daha sonra Settings'den yapılandırılabilir."
- **D-21:** **sessionStorage draft** — Wizard form state saved to sessionStorage on every step change (`spms_wizard_draft`). Restored on mount. Cleared on successful submit or explicit cancel.

### Projects Page (PAGE-02 + PROJ-02, PROJ-04, PROJ-05)
- **D-22:** **3-column responsive card grid** (matches prototype). Card shows: project name, key badge, process template/methodology badge, status badge (ACTIVE/COMPLETED/ON_HOLD/ARCHIVED), progress bar, lead avatar, team AvatarStack, end date.
- **D-23:** **Archived cards** render at `opacity: 0.6` (PROJ-04 requirement).
- **D-24:** **SegmentedControl filter** (Tümü / Aktif / Bitti / Arşiv) at top of projects page. Calls `GET /projects?status=X` with the selected status. "Tümü" omits status param.
- **D-25:** **Status change dropdown** in each project card's overflow menu (3-dot). Options: Tamamla, Askıya Al, Arşivle. **All three actions require a confirmation dialog** before executing. Dialog text: "Bu projeyi [Tamamlamak / Askıya almak / Arşivlemek] istediğinize emin misiniz?" with Onayla/İptal buttons.

### Dashboard Page (PAGE-01)
- **D-26:** All three widget groups pull **live data** from the backend:
  - **4 StatCards** — Projects count from `GET /projects`, task stats from `GET /tasks` with filters
  - **Portfolio Table** — Active projects from `GET /projects?status=ACTIVE` with expanded fields (lead, team, progress)
  - **Activity Feed** — From new `GET /activity?global=true` endpoint (Phase 10 backend addition — queries `audit_log` without project filter, returns recent 20 items)
- **D-27:** Dashboard shows **ManagerView / MemberView** toggle based on `currentUser.role`. Manager sees portfolio table + methodology breakdown. Member sees their assigned tasks.
- **D-28:** **New backend endpoint needed:** `GET /api/v1/activity?limit=20&offset=0` — global activity feed across all projects. Add to `Backend/app/api/v1/activity.py` as part of Phase 10 backend plan.

### Settings Page (PAGE-05)
- **D-29:** Implement all **5 prototype tabs** from `settings.jsx`: Profil, Tercihler, Görünüm, Bildirimler, Güvenlik.
- **D-30:** Lifecycle/Artefakt/Workflow settings tabs (from UI-TASARIM-PLANI.md) are **Phase 12** — not added in Phase 10.
- **D-31:** **Tercihler tab:** Language toggle + UI density (compact/cozy/comfortable) are wired to real AppContext state. Other prefs (default page, week start, keyboard shortcuts, command palette) render as visual-only — no behavior wired yet.
- **D-32:** **Güvenlik tab:** Password change form only (current + new + confirm). Calls `PUT /auth/me` with `current_password` + new password. No active sessions list.

### Archive AlertBanner (PROJ-03)
- **D-33:** Archived project pages show `AlertBanner` (variant="warning") at top of content area: "Bu proje arşivlenmiştir. İçerik düzenleme devre dışı." with "Aktif Et" button that calls status change API to set back to ACTIVE.
- **D-34:** While project is ARCHIVED, all edit actions (rename, task create, status drag) are **disabled** — buttons grayed, forms read-only.

### Claude's Discretion
- Exact toast library/component (re-implement from prototype or build minimal custom)
- Progress % calculation formula for project cards (may need task count aggregation or use existing `project.progress` field if backend returns it)
- Exact middleware matcher patterns (which paths are protected vs public)
- Confirmation dialog component implementation (built from prototype styles, not shadcn)
- sessionStorage key naming conventions for wizard draft

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prototype Source Files (design authority)
- `New_Frontend/src/pages/dashboard.jsx` — Dashboard layout: StatCard, PortfolioTable, MethodologyCard, ActivityFeed, MemberView components
- `New_Frontend/src/pages/projects.jsx` — Projects card grid, status filter SegmentedControl, project card structure (78 lines)
- `New_Frontend/src/pages/settings.jsx` — All 5 settings tabs: Profil, Tercihler, Görünüm (with theme picker + brand sliders), Bildirimler, Güvenlik (336 lines)
- `New_Frontend/src/pages/create-project.jsx` — Full 4-step wizard: step structure, field requirements, lifecycle preview, validation (393 lines)
- `New_Frontend/src/pages/misc.jsx` — Login, Register (visual only for reference), Forgot password, Session-expired auth pages
- `New_Frontend/src/primitives.jsx` — All primitive components including AlertBanner (used for PROJ-03 archive banner)
- `New_Frontend/src/shell.jsx` — AppContext, useApp() — reference for AppProvider shape before adding AuthContext

### Legacy Frontend (pattern reference — DO NOT COPY CODE)
- `Frontend/lib/api-client.ts` — axios interceptor pattern (Bearer token, 401 redirect) to re-implement in Frontend2
- `Frontend/services/auth-service.ts` — authService pattern (login, logout, getCurrentUser, setToken) to re-implement
- `Frontend/services/project-service.ts` — project API functions pattern
- `Frontend/hooks/use-projects.ts` — TanStack Query wrapper pattern

### Frontend2 Existing Code (build on top of)
- `Frontend2/app/(shell)/layout.tsx` — Add QueryClientProvider here
- `Frontend2/app/layout.tsx` — Add AuthProvider here alongside existing AppProvider
- `Frontend2/components/primitives/` — All 16 components ready: AlertBanner, SegmentedControl, Card, Badge, Avatar, AvatarStack, ProgressBar, Button, etc.
- `Frontend2/context/app-context.tsx` — Existing AppContext (theme + language) — extend UI density here

### Backend API Endpoints (Phase 9 — all implemented)
- `GET /api/v1/projects` — with `?status=ACTIVE|COMPLETED|ON_HOLD|ARCHIVED` filter
- `PATCH /api/v1/projects/{id}` — update project including status field
- `GET /api/v1/process-templates` — for wizard Step 2 template list
- `POST /api/v1/projects` — create project (wizard Step 4 submit)
- `GET /api/v1/tasks` — with filters for dashboard stats
- `GET /api/v1/auth/me` — current user for AuthContext init
- `POST /api/v1/auth/login` — login endpoint
- `PUT /api/v1/auth/me` — update profile + password change (Settings)
- `POST /api/v1/auth/me/avatar` — avatar upload (Settings > Profil)
- **NEW (Phase 10):** `GET /api/v1/activity?limit=20&offset=0` — global activity feed for dashboard

### Project Context
- `.planning/REQUIREMENTS.md` — PAGE-01, PAGE-02, PAGE-05, PAGE-06, PROJ-01 through PROJ-05 requirements
- `.planning/phases/08-foundation-design-system/08-CONTEXT.md` — D-01 through D-09 (design system decisions, token names, component conventions, i18n, App Shell)
- `.planning/phases/09-backend-schema-entities-apis/09-CONTEXT.md` — D-18 (Team Leader auth detection via `/users/me/led-teams`), D-42 to D-45 (process_template_id replacing methodology), D-49 (archived projects hidden by default)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets in Frontend2
- **AlertBanner component** (`Frontend2/components/primitives/alert-banner.tsx`) — Ready for PROJ-03 archive banner
- **SegmentedControl** (`Frontend2/components/primitives/segmented-control.tsx`) — Ready for PROJ-05 status filter
- **Card, Badge, Avatar, AvatarStack, ProgressBar, Button** — All ready for project cards (D-22)
- **AppContext + AppProvider** (`Frontend2/context/app-context.tsx`) — Extend to add `uiDensity` state (D-31)
- **Existing (shell) placeholder pages** — Dashboard, Projects, Settings, MyTasks, Reports, Teams at `Frontend2/app/(shell)/*/page.tsx` — replace content, don't recreate routes

### Established Patterns
- **`"use client"` directive** — All interactive components need this
- **Named exports** — `export function ComponentName` (not default exports for components)
- **`@/` path alias** — All imports use `@/components/...`, `@/lib/...`, etc.
- **Inline styles with CSS token vars** — Prototype uses `var(--bg)`, `var(--fg)`, `var(--primary)` via inline styles converted to Tailwind `className`

### Integration Points
- **`Frontend2/app/(shell)/layout.tsx`** — Add QueryClientProvider wrapping AppShell
- **`Frontend2/app/layout.tsx`** — Add AuthProvider next to AppProvider
- **New route group `(auth)/`** — Create at `Frontend2/app/(auth)/layout.tsx` (full-page, no shell) + login/session-expired/forgot-password pages
- **`Frontend2/middleware.ts`** — Create at project root, matches `/(shell)/**` paths, reads `auth_session` cookie
- **New `(shell)/projects/new/page.tsx`** — 4-step wizard page

</code_context>

<specifics>
## Specific Ideas

- Prototype Login page splits into 2 columns: left (form) + right (illustration/branding). Match this exactly.
- Prototype uses `LogoMark` component in Login header — ensure it's in Frontend2.
- Dashboard PortfolioTable shows project key as mono-font badge (e.g. `SPMS`) — match this exact styling.
- `spms_wizard_draft` as sessionStorage key for create wizard draft state.
- The `methodology` field on the legacy frontend has been replaced by `process_template_id` in Phase 9 — wizard Step 2 shows template names (Scrum, Kanban, Waterfall, etc.) not hardcoded methodology values.
- Auth session cookie: `document.cookie = 'auth_session=1; path=/; SameSite=Lax'` — not httpOnly (middleware reads it server-side as a presence flag only; actual token stays in localStorage).

</specifics>

<deferred>
## Deferred Ideas

- **Admin panel** (user management, team management, process template admin) — future phase or Phase 13
- **Register / self-signup page** — closed system, not needed
- **Teams page conversion** (`/teams` placeholder from Phase 8) — deferred, not in Phase 10 scope
- **Reports page** (`/reports` placeholder from Phase 8) — Phase 13
- **Lifecycle/Artefakt/Workflow settings tabs** — Phase 12
- **ProjectDetail page** (`/projects/{id}`) — Phase 11
- **Command palette (⌘K)** in Tercihler tab — visual-only toggle for now, wire behavior later
- **Default page / week start / keyboard shortcuts** preferences — visual-only in Tercihler, behavior deferred

### Reviewed Todos (not folded)
None — no pre-existing todos matched Phase 10 scope.

</deferred>

---

*Phase: 10-shell-pages-project-features*
*Context gathered: 2026-04-21*

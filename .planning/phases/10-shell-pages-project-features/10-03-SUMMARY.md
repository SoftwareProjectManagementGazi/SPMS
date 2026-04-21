---
phase: 10-shell-pages-project-features
plan: "03"
subsystem: frontend-auth-routing
tags: [nextjs-middleware, auth-routing, tanstack-query, project-service, login-page, cookie-guard]

dependency_graph:
  requires:
    - 10-01 (apiClient, authService, AUTH_TOKEN_KEY, AuthProvider + useAuth)
    - 10-02 (GET /api/v1/activity endpoint live in backend)
  provides:
    - Next.js middleware cookie guard (auth_session presence check)
    - (auth) route group: login, session-expired, forgot-password pages
    - LogoMark component
    - (shell)/layout.tsx with QueryClientProvider + ReactQueryDevtools
    - projectService: getAll, getById, create, updateStatus, getActivity, getProcessTemplates, getTaskStats
    - useProjects, useProject, useUpdateProjectStatus, useCreateProject, useGlobalActivity, useProcessTemplates, useTaskStats hooks
  affects:
    - 10-04 (dashboard page uses useProjects + useTaskStats)
    - 10-05 (projects page uses useProjects + useUpdateProjectStatus)
    - 10-06 through 10-10 (all shell pages are now QueryClient-enabled via shell layout)

tech-stack:
  added: []
  patterns:
    - "Next.js middleware reads auth_session cookie (presence flag) — actual JWT validated by FastAPI on each API request (T-10-03-01)"
    - "QueryClient at module scope in shell layout — not inside component to prevent cache recreation on re-render (Pitfall 2)"
    - "D-11: closed system — no register link, no Google OAuth, static Yönetici onayı message"
    - "T-10-03-02: generic login error message — never reveals email vs password mismatch"
    - "D-26: getTaskStats calls GET /tasks and derives open/in_progress/done counts client-side"

key-files:
  created:
    - Frontend2/middleware.ts
    - Frontend2/app/(auth)/layout.tsx
    - Frontend2/app/(auth)/login/page.tsx
    - Frontend2/app/(auth)/session-expired/page.tsx
    - Frontend2/app/(auth)/forgot-password/page.tsx
    - Frontend2/components/logo-mark.tsx
    - Frontend2/services/project-service.ts
    - Frontend2/hooks/use-projects.ts
  modified:
    - Frontend2/app/(shell)/layout.tsx (replaced with QueryClientProvider version)
    - Frontend2/components/primitives/input.tsx (added required/disabled/name/id/autoComplete props)

key-decisions:
  - "Middleware matcher uses real URL paths (/dashboard/:path*, /projects/:path*, etc.) — NOT (shell) group names which are invisible in URLs (Pitfall 1)"
  - "Login error is generic 'Giriş başarısız' (T-10-03-02) — no email/password disambiguation"
  - "session-expired page clears both localStorage AND auth_session cookie on mount (T-10-03-03 belt-and-suspenders alongside interceptor)"
  - "QueryClient at module scope — prevents cache loss on every ShellLayout re-render (Pitfall 2)"
  - "getTaskStats derives stats client-side from GET /tasks response — no dedicated stats endpoint needed for D-26"
  - "Input primitive extended with required/disabled/name/id/autoComplete — Rule 2 auto-fix for form validation correctness"

metrics:
  duration_seconds: 262
  duration_display: "~4 min"
  completed_date: "2026-04-21"
  tasks_completed: 2
  files_modified: 10
  files_created: 8
---

# Phase 10 Plan 03: Middleware + Auth Pages + Shell QueryClient + Project Service Summary

**Next.js middleware cookie guard, (auth) route group with 2-column login/session-expired/forgot-password pages, QueryClientProvider in shell layout, LogoMark component, projectService with 6 methods + useProjects family of 7 hooks — all TypeScript clean**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-21T19:13:20Z
- **Completed:** 2026-04-21T19:17:42Z
- **Tasks:** 2
- **Files modified:** 10 (8 created, 2 modified)

## Accomplishments

### Task 1 — Middleware + (auth) route group + LogoMark + shell QueryClient

- **Frontend2/middleware.ts** at project root: reads `auth_session` cookie via `request.cookies.get('auth_session')`, redirects to `/login?from={pathname}` when absent. Matcher covers all 6 shell URL prefixes using real paths (not route group names).
- **Frontend2/components/logo-mark.tsx**: `LogoMark` component — square P badge using `var(--primary)` token, configurable `size` prop (default 22).
- **Frontend2/app/(auth)/layout.tsx**: minimal passthrough — no AppShell, full-page for unauthenticated pages.
- **Frontend2/app/(auth)/login/page.tsx**: prototype-faithful 2-column layout (`1fr 1.1fr` grid). Left: LogoMark header + centered form (email/password inputs, remember checkbox, forgot-password link, submit button, "Yönetici onayı ile hesap açılır." closed-system note, footer). Right: radial gradient branding panel with v2.4 badge, headline, 2×2 stat grid. Calls `useAuth().login()`, redirects to `/dashboard` on success, shows generic inline error on failure (T-10-03-02). D-11 compliant: no Google OAuth, no "Kayıt olun".
- **Frontend2/app/(auth)/session-expired/page.tsx**: clears `localStorage` AUTH_TOKEN_KEY and `auth_session` cookie on mount — double-clear alongside apiClient interceptor (T-10-03-03). Shows centered message with link back to `/login`.
- **Frontend2/app/(auth)/forgot-password/page.tsx**: same 2-column layout as login. Email-only form with inline success state (no `requestPasswordReset` backend endpoint exists yet — shows confirmation message inline per plan spec).
- **Frontend2/app/(shell)/layout.tsx**: replaced with `"use client"` layout wrapping `<AppShell>` in `<QueryClientProvider>` using module-scope `queryClient`. `ReactQueryDevtools` conditionally rendered in development only.

### Task 2 — project-service.ts + use-projects.ts (D-26)

- **Frontend2/services/project-service.ts**: `projectService` with 6 methods: `getAll` (status filter param), `getById`, `create`, `updateStatus` (PATCH), `getActivity` (GET /activity), `getProcessTemplates` (GET /process-templates), `getTaskStats` (GET /tasks → derives open/in_progress/done counts for D-26 StatCard 4). `ProjectResponseDTO` → `Project` mapper with camelCase field normalization. Handles columns as `{id, name}` objects or strings.
- **Frontend2/hooks/use-projects.ts**: 7 exports — `useProjects` (status-filtered queryKey `['projects', {status}]`), `useProject`, `useUpdateProjectStatus` (invalidates `['projects']`), `useCreateProject`, `useGlobalActivity`, `useProcessTemplates` (5min stale), `useTaskStats` (30s stale — wires D-26 StatCard 4 data source).

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Middleware + (auth) route group + LogoMark + shell QueryClient | 27fb19c | middleware.ts, logo-mark.tsx, (auth)/layout.tsx, login/page.tsx, session-expired/page.tsx, forgot-password/page.tsx, (shell)/layout.tsx, primitives/input.tsx |
| 2 | project-service.ts + use-projects.ts hooks (D-26) | aa36d87 | project-service.ts, use-projects.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Input primitive missing required/disabled/name/id/autoComplete props**
- **Found during:** Task 1 — TypeScript error on login/page.tsx and forgot-password/page.tsx
- **Issue:** `InputProps` in `Frontend2/components/primitives/input.tsx` did not include `required`, `disabled`, `name`, `id`, or `autoComplete` — these are standard HTML form attributes needed for accessibility and HTML5 validation
- **Fix:** Added all 5 props to `InputProps` interface, destructured them in the component function, and passed them to the native `<input>` element
- **Files modified:** `Frontend2/components/primitives/input.tsx`
- **Commit:** 27fb19c

## Known Stubs

- **forgot-password/page.tsx**: `authService.requestPasswordReset` not yet implemented in backend or auth-service.ts. Page shows a simulated 600ms delay + success inline message instead. Will be wired when POST /auth/password-reset endpoint is added (deferred, not in Phase 10 scope per CONTEXT.md D-11 — closed system focuses on login/session management).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: authentication | `Frontend2/middleware.ts` | Cookie is a presence flag only — the actual JWT token is validated by FastAPI on every request. Client cannot forge a valid JWT without the private key (T-10-03-01 mitigated). |

## Self-Check: PASSED

Files exist:
- Frontend2/middleware.ts: FOUND
- Frontend2/app/(auth)/layout.tsx: FOUND
- Frontend2/app/(auth)/login/page.tsx: FOUND
- Frontend2/app/(auth)/session-expired/page.tsx: FOUND
- Frontend2/app/(auth)/forgot-password/page.tsx: FOUND
- Frontend2/components/logo-mark.tsx: FOUND
- Frontend2/app/(shell)/layout.tsx: FOUND (QueryClientProvider at module scope)
- Frontend2/services/project-service.ts: FOUND
- Frontend2/hooks/use-projects.ts: FOUND

Commits exist:
- 27fb19c: FOUND (Task 1)
- aa36d87: FOUND (Task 2)

TypeScript: npx tsc --noEmit exits 0 (confirmed twice)

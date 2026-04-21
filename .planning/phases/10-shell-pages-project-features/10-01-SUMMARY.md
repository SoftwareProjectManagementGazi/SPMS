---
phase: 10-shell-pages-project-features
plan: "01"
subsystem: auth
tags: [axios, tanstack-query, react-context, nextjs, jwt, localStorage, cookie]

requires:
  - phase: 08-foundation-design-system
    provides: AppProvider + AppContext shape (SSR-safe localStorage pattern)
  - phase: 09-backend-schema-entities-apis
    provides: /auth/login, /auth/me, /auth/me/avatar endpoints; audit_log table

provides:
  - axios apiClient instance with dual interceptors (Bearer token + 401 session-expired)
  - AUTH_TOKEN_KEY + SESSION_EXPIRED_KEY constants
  - authService with login/logout/getCurrentUser/updateProfile/uploadAvatar
  - AuthProvider + useAuth() hook available to all Frontend2 pages
  - test_activity.py Wave 0 stub (Nyquist compliance)
  - VALIDATION.md wave_0_complete=true + nyquist_compliant=true

affects:
  - 10-02 (login page uses useAuth().login)
  - 10-03 (projects page uses apiClient + useAuth)
  - 10-04 (wizard uses apiClient)
  - 10-05 through 10-10 (all pages depend on apiClient + AuthContext)

tech-stack:
  added:
    - "@tanstack/react-query-devtools ^5.99.2"
  patterns:
    - "D-02: quoted-token guard — token.startsWith('\"') ? JSON.parse(token) : token"
    - "D-03: dual storage — localStorage Bearer token + auth_session=1 cookie for Next.js middleware"
    - "SSR-safe localStorage — typeof window !== 'undefined' guard in interceptor + useEffect init"
    - "AuthContext useMemo value stabilization (prevents re-renders on unchanged state)"

key-files:
  created:
    - Frontend2/lib/constants.ts
    - Frontend2/lib/api-client.ts
    - Frontend2/services/auth-service.ts
    - Frontend2/context/auth-context.tsx
    - Backend/tests/integration/test_activity.py
  modified:
    - Frontend2/app/layout.tsx
    - Frontend2/package.json
    - .planning/phases/10-shell-pages-project-features/10-VALIDATION.md
    - .planning/phases/10-shell-pages-project-features/10-RESEARCH.md

key-decisions:
  - "AUTH_TOKEN_KEY='auth_token' (matches legacy Frontend/lib/constants.ts exactly — D-02)"
  - "AuthProvider placed INSIDE AppProvider in root layout — allows auth to access app context if ever needed"
  - "apiClient baseURL from NEXT_PUBLIC_API_URL env var with fallback to http://localhost:8000/api/v1"
  - "test_activity.py stub at integration root (not api/ subdirectory) — Nyquist file existence satisfied"

patterns-established:
  - "Pattern: All Frontend2 API calls go through apiClient — never raw fetch or separate axios instances"
  - "Pattern: useAuth() throws if called outside AuthProvider — same guard as useApp() in app-context"
  - "Pattern: login() in AuthContext sets both localStorage AND cookie atomically before resolving"

requirements-completed:
  - PAGE-06

duration: 5min
completed: 2026-04-21
---

# Phase 10 Plan 01: API Infrastructure + AuthContext + Wave 0 Summary

**axios apiClient with dual interceptors (D-02 quoted-token + D-03 dual-storage cookie), AuthProvider with SSR-safe useAuth() hook, and Wave 0 Nyquist stub — foundation unblocking all 9 subsequent plans**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-21T18:58:35Z
- **Completed:** 2026-04-21T19:03:02Z
- **Tasks:** 3
- **Files modified:** 8 (4 created in Frontend2, 1 created in Backend, 1 modified in Frontend2, 2 modified in planning)

## Accomplishments

- npm install (373 packages) + @tanstack/react-query-devtools installed; Frontend2 node_modules ready
- axios apiClient with quoted-token guard (D-02), 401 session-expired interceptor with cookie clear (D-03), and complete authService (5 methods)
- AuthProvider with SSR-safe useEffect init, memoized value, D-03 login/logout cookie management — wired into root layout inside AppProvider
- Wave 0 complete: test_activity.py stub (Nyquist), VALIDATION.md flags set true, RESEARCH.md Open Questions marked RESOLVED

## Task Commits

Each task was committed atomically:

1. **Task 1: npm install + constants + api-client + auth-service** - `3b165c1` (feat)
2. **Task 2: AuthContext + wire into root layout** - `26e082a` (feat)
3. **Task 3: Wave 0 finalization — test stub + VALIDATION flags + RESEARCH resolved** - `5345ba5` (chore)

## Files Created/Modified

- `Frontend2/lib/constants.ts` — AUTH_TOKEN_KEY + SESSION_EXPIRED_KEY constants
- `Frontend2/lib/api-client.ts` — axios instance with request interceptor (Bearer token, D-02 quoted-token guard) and response interceptor (401 → session-expired, D-03 cookie clear)
- `Frontend2/services/auth-service.ts` — login, logout, getCurrentUser, updateProfile, uploadAvatar; UserResponseDTO mapper; resolveAvatarUrl helper
- `Frontend2/context/auth-context.tsx` — AuthProvider + useAuth(); SSR-safe useEffect init; D-03 cookie set on login, clear on logout; value memoized
- `Frontend2/app/layout.tsx` — added AuthProvider import + wrapped children inside AppProvider
- `Frontend2/package.json` — added @tanstack/react-query-devtools ^5.99.2
- `Backend/tests/integration/test_activity.py` — Wave 0 stub with test_get_global_activity_returns_200 and test_get_global_activity_requires_auth (pass bodies)
- `.planning/phases/10-shell-pages-project-features/10-VALIDATION.md` — nyquist_compliant: true, wave_0_complete: true, 3 checklist items checked
- `.planning/phases/10-shell-pages-project-features/10-RESEARCH.md` — Open Questions heading → RESOLVED, resolution annotations added

## Decisions Made

- AuthProvider placed inside AppProvider (not outside) — allows AuthContext to read AppContext if needed in future plans
- test_activity.py created at integration root level (not in api/ subdirectory) — mirrors the plan spec; api/ subdirectory has test_activity_api.py for project-scoped activity tests
- baseURL defaults to `http://localhost:8000/api/v1` (not just port 8000) — matches the FastAPI router prefix so service calls don't need to include /api/v1 prefix

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. npm install ran automatically.

## Next Phase Readiness

- apiClient, AUTH_TOKEN_KEY, authService, and useAuth() are fully available — Plans 10-02 through 10-10 can all import from these files immediately
- AuthProvider wraps the entire app — useAuth() works on any page without additional setup
- Wave 0 complete — TypeScript type-checks pass, Python syntax OK, VALIDATION.md flags set

---

*Phase: 10-shell-pages-project-features*
*Completed: 2026-04-21*

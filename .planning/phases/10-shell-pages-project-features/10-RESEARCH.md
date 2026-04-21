# Phase 10: Shell Pages & Project Features — Research

**Researched:** 2026-04-21
**Domain:** Next.js 16 App Router / TanStack Query v5 / Axios / FastAPI global activity endpoint
**Confidence:** HIGH (all critical patterns verified against codebase + Context7 docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**API Integration**
- D-01: Real backend from day 1 — no mock data layer
- D-02: Auth token: localStorage + Bearer header — re-implement exact pattern from `Frontend/lib/api-client.ts` (axios instance, request interceptor attaches `Authorization: Bearer {token}`, response interceptor handles 401 → session-expired redirect). New file: `Frontend2/lib/api-client.ts`
- D-03: Dual storage for middleware — on login, store token in localStorage AND set cookie `auth_session=1` (SameSite=Lax, not httpOnly). On logout/expire, clear both.
- D-04: QueryClientProvider lives in `Frontend2/app/(shell)/layout.tsx` — only authenticated pages get it
- D-05: Axios (not native fetch) for API client
- D-06: Service + hooks structure mirrors legacy Frontend (re-implement from scratch, do NOT copy code): `lib/api-client.ts`, `lib/constants.ts`, `services/auth-service.ts`, `services/project-service.ts`, `hooks/use-projects.ts`
- D-07: API errors displayed as toast notifications via TanStack Query mutation `onError` callbacks
- D-08: Dedicated AuthContext at `Frontend2/context/auth-context.tsx` with `user`, `token`, `login()`, `logout()`. AppContext stays focused on UI state.
- D-09: React Query DevTools included in dev mode only
- D-10: Session-expired page at `Frontend2/app/(auth)/session-expired/page.tsx`

**Auth Routing**
- D-11: Closed system — no self-registration, no `/register` page
- D-12: Auth pages at `Frontend2/app/(auth)/` route group (no sidebar/header): login, session-expired, forgot-password
- D-13: Next.js middleware at `Frontend2/middleware.ts` guards all (shell) routes; reads `auth_session` cookie; if missing, redirects to `/login`
- D-14: After login → redirect to `/dashboard`

**Create Project Wizard (PROJ-01)**
- D-15: Separate full page at `/projects/new` — not a modal
- D-16: Step tracked via URL search params (`?step=1`, `?step=2`). `useSearchParams()` reads current step.
- D-17: Validate before advancing — "Sonraki" disabled until required fields filled. Step 1: name + team. Step 2: template or "custom".
- D-18: After creation → redirect to `/projects/{id}`
- D-19: Step 2 loads templates from `GET /process-templates`. Dynamic, not hardcoded.
- D-20: Step 3 (Yaşam Döngüsü): read-only preview of template's default workflow nodes. If none, show empty state message.
- D-21: sessionStorage draft key `spms_wizard_draft`, save on each step change, restore on mount, clear on submit/cancel

**Projects Page**
- D-22: 3-column responsive card grid. Card fields: name, key badge, process template badge, status badge, progress bar, lead avatar, AvatarStack, end date.
- D-23: Archived cards at `opacity: 0.6`
- D-24: SegmentedControl filter (Tümü / Aktif / Bitti / Arşiv). Calls `GET /projects?status=X`. "Tümü" omits status param.
- D-25: Status change dropdown in each card's overflow menu (3-dot). All three actions require confirmation dialog before executing.

**Dashboard Page**
- D-26: All widgets pull live data — 4 StatCards, Portfolio Table, Activity Feed
- D-27: ManagerView / MemberView toggle based on `currentUser.role`
- D-28: New backend endpoint `GET /api/v1/activity?limit=20&offset=0` — global activity feed across all projects (Phase 10 backend addition)

**Settings Page**
- D-29: Implement all 5 prototype tabs: Profil, Tercihler, Görünüm, Bildirimler, Güvenlik
- D-30: Lifecycle/Artefakt/Workflow tabs — Phase 12 (NOT in scope here)
- D-31: Tercihler tab: Language toggle + UI density wired to AppContext. Other prefs visual-only.
- D-32: Güvenlik tab: Password change form only. Calls `PUT /auth/me` with `current_password` + new password.

**Archive AlertBanner (PROJ-03)**
- D-33: Archived project pages show AlertBanner (variant="warning") with "Aktif Et" button → calls PATCH to set status ACTIVE
- D-34: While ARCHIVED, all edit actions disabled (buttons grayed, forms read-only)

**Page Fidelity**
- D-35: All converted pages 100% visually identical to prototype AND wired to real backend. No stubs pass.

**Seeder Update**
- D-36: Seeder updates required for varied project statuses, process_template_id links, process_config base structure, team.leader_id, Milestones, Artifacts, AuditLog metadata population

### Claude's Discretion
- Exact toast library/component (re-implement from prototype or build minimal custom)
- Progress % calculation formula for project cards
- Exact middleware matcher patterns (which paths are protected vs public)
- Confirmation dialog component implementation (built from prototype styles, not shadcn)
- sessionStorage key naming conventions for wizard draft (locked to `spms_wizard_draft` per D-21)

### Deferred Ideas (OUT OF SCOPE)
- Admin panel (user management, team management, process template admin) — Phase 13
- Register / self-signup page — closed system
- Teams page conversion — deferred
- Reports page — Phase 13
- Lifecycle/Artefakt/Workflow settings tabs — Phase 12
- ProjectDetail page (`/projects/{id}`) — Phase 11
- Command palette (⌘K) in Tercihler — visual-only toggle for now
- Default page / week start / keyboard shortcuts preferences — visual-only in Tercihler

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-01 | Dashboard page converted — StatCards, PortfolioTable, ActivityFeed, MemberView from prototype | AuthContext for role check, TanStack Query for data, new global activity endpoint |
| PAGE-02 | Projects page converted — card grid, status filter, new project button | SegmentedControl filter pattern, project card layout from prototype |
| PAGE-05 | Settings page converted — all 5 tabs implemented | AppContext extension for density, auth-service.updateProfile + uploadAvatar |
| PAGE-06 | Login/Auth pages converted — login, session-expired, forgot-password | (auth) route group layout, LogoMark component, axios 401 interceptor |
| PROJ-01 | Create Project Wizard — 4-step wizard at `/projects/new` | useSearchParams step tracking, sessionStorage draft, process-templates API |
| PROJ-02 | Project status management — status change dropdown with confirmation | useMutation PATCH /projects/{id}, confirmation dialog pattern |
| PROJ-03 | Archive AlertBanner — warning banner on archived projects | AlertBanner primitive already in Frontend2, disable-all-edits pattern |
| PROJ-04 | Status badges on project cards — 4 statuses with distinct colors and opacity | Badge tone mapping from UI-SPEC color table |
| PROJ-05 | Status filter on projects list — SegmentedControl + API status param | SegmentedControl primitive ready, query param filtering |

</phase_requirements>

---

## Summary

Phase 10 converts four stub pages (Dashboard, Login, Projects, Settings) into fully functional Next.js pages wired to the Phase 9 API, and adds the full project lifecycle feature set (create wizard, status management, archive banner, status filter). The frontend work spans: (1) infrastructure layer — AuthContext, QueryClientProvider, axios api-client, Next.js middleware; (2) page conversion — four pages matching the HTML prototype pixel-for-pixel; (3) feature additions — wizard, status dropdown, confirmation dialog, archive banner. The backend work is one new endpoint (`GET /api/v1/activity` without project_id filter) plus seeder updates for realistic test data.

The codebase is already well-prepared. Frontend2 has all 16 primitive components built in Phase 8 (AlertBanner, SegmentedControl, Badge, etc.), the AppContext has `density` already wired, and the Legacy Frontend has battle-tested patterns for axios interceptors and auth-service that can be re-implemented cleanly. The Backend has the `IAuditRepository` interface with `get_project_activity()` already defined — the global activity endpoint adds a variant without the `project_id` filter. Phase 9's router structure means adding one new method to the interface and one new GET route in `activity.py`.

**Primary recommendation:** Build the infrastructure layer first (api-client → auth-service → AuthContext → QueryClientProvider → middleware), then implement pages in dependency order: Login (simplest, unblocks auth testing) → Dashboard → Projects → Settings → Wizard (most complex).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth token storage | Browser / Client | — | localStorage is client-only; cookie set by client JS for middleware |
| Auth guard / redirect | Frontend Server (middleware) | — | Next.js middleware reads cookie server-side before rendering |
| API calls (Bearer token) | Browser / Client | — | axios interceptors run in the browser; SSR pages are server components |
| TanStack Query cache | Browser / Client | — | QueryClientProvider placed in (shell) layout, client-side only |
| AuthContext state | Browser / Client | — | Must be "use client"; localStorage reads are SSR-unsafe |
| Project status PATCH | API / Backend | — | FastAPI PATCH /projects/{id}, Clean Architecture use case |
| Global activity feed | API / Backend | — | New GET /activity endpoint reads audit_log without project_id filter |
| Page rendering | Frontend Server (SSR) | Browser (hydration) | Shell pages are server components by default; interactive parts "use client" |
| sessionStorage wizard draft | Browser / Client | — | sessionStorage is client-only; no SSR equivalent |
| Middleware cookie read | Frontend Server | — | NextRequest.cookies read server-side before response |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.4 | App Router, middleware, SSR | Already installed in Frontend2 [VERIFIED: package.json] |
| React | 19.2.4 | UI framework | Already installed [VERIFIED: package.json] |
| @tanstack/react-query | ^5.99.2 | Server state, caching, loading/error | Already installed [VERIFIED: package.json] |
| axios | ^1.15.1 | HTTP client with interceptors | Already installed, pattern established in legacy Frontend [VERIFIED: package.json] |
| @tanstack/react-query-devtools | (install in phase) | Dev-mode query inspector | Standard companion to react-query [CITED: tanstack/query devtools docs] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | ^2.1.1 | Conditional classNames | Already installed; use for conditional CSS classes [VERIFIED: package.json] |
| tailwind-merge | ^3.5.0 | Tailwind class deduplication | Already installed [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| axios | native fetch | fetch has no built-in interceptors — would require manual wrapper. D-05 locks axios. |
| @tanstack/react-query | swr | SWR lacks mutation onError + DevTools used here. D-04 locks TanStack. |
| sessionStorage draft | URL query string | sessionStorage survives refresh without polluting URL. D-21 locks sessionStorage. |

**Installation (missing package only):**
```bash
cd Frontend2
npm install @tanstack/react-query-devtools
```

**Version verification (npm registry):**
```bash
npm view @tanstack/react-query-devtools version
# Expected: 5.x matching @tanstack/react-query version
```
[ASSUMED] - DevTools version should match react-query version (5.x). Install exact matching minor.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─► Next.js middleware.ts
  │     reads auth_session cookie
  │     if missing → redirect /login
  │     if present → NextResponse.next()
  │
  ├─► (auth)/ route group        (no shell)
  │     login/page.tsx           ← AuthContext.login() → sets localStorage + cookie
  │     session-expired/page.tsx ← axios 401 interceptor redirects here
  │     forgot-password/page.tsx
  │
  └─► (shell)/ route group       (AppShell wraps all)
        QueryClientProvider        ← new in Phase 10, wraps AppShell
        AuthProvider               ← new in Phase 10, in root layout.tsx
          ├─► dashboard/page.tsx   ← useQuery([projects],[tasks],[activity])
          ├─► projects/page.tsx    ← useQuery([projects,{status}])
          │     projects/new/      ← useSearchParams step, sessionStorage draft
          ├─► settings/page.tsx    ← useMutation(updateProfile, uploadAvatar)
          └─► ...other stubs...

Frontend2/lib/
  api-client.ts              axios instance + request interceptor (Bearer) + response interceptor (401→/session-expired)
  constants.ts               AUTH_TOKEN_KEY, NEXT_PUBLIC_API_URL

Frontend2/services/
  auth-service.ts            login(), logout(), getCurrentUser(), updateProfile(), uploadAvatar()
  project-service.ts         getAll(status?), getById(), create(), updateStatus(), getActivity()

Frontend2/hooks/
  use-projects.ts            useProjects(status?), useProject(id), useCreateProject(), useUpdateProjectStatus()
  use-auth.ts                (or inline in AuthContext) useCurrentUser

Frontend2/context/
  auth-context.tsx           AuthContext: {user, token, login, logout} — new file
  app-context.tsx            (existing) — density/language/theme, already has density state

─────────────────────────────────────────────────────────
API Request Flow (authenticated page):
  Browser → axios (Bearer injected) → FastAPI → use case → repo → PostgreSQL
  FastAPI 401 → axios response interceptor → localStorage.removeItem → window.location = /session-expired

─────────────────────────────────────────────────────────
Backend (Phase 10 addition):
  GET /api/v1/activity?limit=20&offset=0
    activity.py router → GetGlobalActivityUseCase → IAuditRepository.get_global_activity()
    → audit_log JOIN users (LEFT) → returns {items, total}
```

### Recommended Project Structure (Frontend2 additions only)
```
Frontend2/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # full-page, no AppShell
│   │   ├── login/page.tsx          # 2-column layout from misc.jsx
│   │   ├── session-expired/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (shell)/
│   │   ├── layout.tsx              # ADD QueryClientProvider here
│   │   ├── dashboard/page.tsx      # REPLACE stub
│   │   ├── projects/
│   │   │   ├── page.tsx            # REPLACE stub
│   │   │   └── new/page.tsx        # NEW — wizard page
│   │   └── settings/page.tsx       # REPLACE stub
│   └── layout.tsx                  # ADD AuthProvider here
├── middleware.ts                   # NEW at Frontend2 root
├── lib/
│   ├── api-client.ts               # NEW — axios instance + interceptors
│   └── constants.ts                # NEW or extend existing
├── services/
│   ├── auth-service.ts             # NEW
│   └── project-service.ts          # NEW
├── hooks/
│   └── use-projects.ts             # NEW
└── context/
    └── auth-context.tsx            # NEW
```

### Pattern 1: Axios API Client with Dual Interceptors
**What:** Single axios instance with request interceptor (Bearer token) and response interceptor (401 → session-expired redirect). Cookie cleared alongside localStorage on 401.
**When to use:** Every API call in the application routes through this.

```typescript
// Frontend2/lib/api-client.ts — re-implement from Frontend/lib/api-client.ts pattern
// Source: Frontend/lib/api-client.ts (VERIFIED codebase read)
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST interceptor — attach Bearer token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      const cleanToken = token.startsWith('"') ? JSON.parse(token) : token;
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
  }
  return config;
});

// RESPONSE interceptor — 401 → session-expired
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/session-expired') &&
      !error.config?.url?.includes('/auth/login')
    ) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      // D-03: also clear the cookie that middleware reads
      document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/session-expired';
    }
    return Promise.reject(error);
  }
);
```

### Pattern 2: AuthContext with SSR-Safe Initialization
**What:** Context stores `user` and `token`. On mount, reads token from localStorage (guarded by `typeof window`), calls `GET /auth/me` to hydrate `user`. login() sets both localStorage and cookie. logout() clears both.
**When to use:** Root `app/layout.tsx` — wraps entire app.

```typescript
// Frontend2/context/auth-context.tsx (new file)
// Source: pattern from Frontend/services/auth-service.ts + D-08 decision
"use client"
import React from "react"
import { authService } from "@/services/auth-service"
import { AUTH_TOKEN_KEY } from "@/lib/constants"

export interface AuthUser {
  id: string; name: string; email: string; avatar?: string;
  role: { name: string }
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // SSR-safe token read
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_KEY) : null
    if (stored) {
      setToken(stored)
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => { /* expired — middleware will handle on next navigation */ })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const resp = await authService.login({ email, password })
    localStorage.setItem(AUTH_TOKEN_KEY, resp.access_token)
    // D-03: set lightweight presence cookie for middleware
    document.cookie = `auth_session=1; path=/; SameSite=Lax`
    setToken(resp.access_token)
    const me = await authService.getCurrentUser()
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    document.cookie = `auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    setUser(null); setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Pattern 3: Next.js Middleware (Cookie Guard)
**What:** Middleware reads `auth_session` cookie. If absent on a (shell) path, redirects to `/login`.
**When to use:** `Frontend2/middleware.ts` (at app root, not inside `app/`).

```typescript
// Frontend2/middleware.ts
// Source: CITED Next.js docs (Context7) — middleware redirect pattern
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('auth_session')
  if (!cookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  // Protect all (shell) paths. Login/session-expired are NOT protected.
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/my-tasks/:path*',
    '/reports/:path*',
    '/teams/:path*',
  ],
}
```

**CRITICAL PITFALL:** The middleware `matcher` does NOT use route group syntax `(shell)`. It must list actual URL paths. The `(shell)` folder name is a Next.js convention that disappears from URLs. [VERIFIED: Next.js docs, route group mechanics]

### Pattern 4: QueryClientProvider Placement (Shell Layout)
**What:** QueryClientProvider wraps AppShell in `(shell)/layout.tsx`. Only authenticated pages benefit from caching.

```typescript
// Frontend2/app/(shell)/layout.tsx
// Source: D-04 decision + CITED TanStack Query docs
"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppShell } from "@/components/app-shell"
import React from "react"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
})

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{children}</AppShell>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

**PITFALL:** `(shell)/layout.tsx` is currently a server component with no `"use client"`. Adding QueryClientProvider requires converting it to a client component because `QueryClient` uses React state internally. [VERIFIED: codebase read of current layout.tsx]

### Pattern 5: useSearchParams for Wizard Step Tracking
**What:** Wizard reads `?step=N` from URL. Browser back/forward navigate between steps. Step advances via `router.push`.
**When to use:** `Frontend2/app/(shell)/projects/new/page.tsx`

```typescript
// Frontend2/app/(shell)/projects/new/page.tsx
// Source: CITED Next.js docs — useSearchParams must be "use client" + Suspense boundary
"use client"
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function WizardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const step = Number(searchParams.get('step') ?? '1')

  const advanceStep = () => {
    router.push(`/projects/new?step=${step + 1}`)
  }
  const goBack = () => {
    if (step > 1) router.push(`/projects/new?step=${step - 1}`)
    else router.push('/projects')
  }
  // ... wizard content
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WizardContent />
    </Suspense>
  )
}
```

**CRITICAL:** `useSearchParams()` requires a `<Suspense>` boundary in the parent when used in a prerendered route. Without it, Next.js will throw a build error. [VERIFIED: Next.js docs via Context7]

### Pattern 6: sessionStorage Wizard Draft
**What:** Wizard form state serialized to sessionStorage on every step change. Restored on mount. Cleared on submit/cancel.
**When to use:** Inside `WizardContent` component.

```typescript
// Source: D-21 decision
const WIZARD_DRAFT_KEY = 'spms_wizard_draft'

interface WizardDraft {
  step: number
  name: string; key: string; desc: string; startDate: string; endDate: string
  templateId: string
  columns: string[]; fields: Record<string, boolean>
}

// Save on change
React.useEffect(() => {
  sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify({ step, name, key, templateId }))
}, [step, name, key, templateId])

// Restore on mount
React.useEffect(() => {
  const raw = sessionStorage.getItem(WIZARD_DRAFT_KEY)
  if (raw) {
    try {
      const draft: WizardDraft = JSON.parse(raw)
      setName(draft.name ?? '')
      setKey(draft.key ?? '')
      // ... restore other fields
    } catch { /* corrupt draft — ignore */ }
  }
}, [])

// Clear on success
const handleSubmit = async () => {
  await createProject(payload)
  sessionStorage.removeItem(WIZARD_DRAFT_KEY)
  router.push(`/projects/${newProject.id}`)
}
```

### Pattern 7: useMutation with onError Toast
**What:** TanStack Query mutation triggers toast on error. Status change, profile update, password change all follow this pattern.

```typescript
// Source: CITED TanStack Query docs — useMutation onError
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/project-service'

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      projectService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error) => {
      // D-07: trigger toast notification
      showToast({ message: 'Durum güncellenemedi', variant: 'error' })
    },
  })
}
```

### Pattern 8: Global Activity Feed (Backend)
**What:** New endpoint `GET /api/v1/activity?limit=20&offset=0` queries audit_log WITHOUT project_id filter. Adds `get_global_activity()` to `IAuditRepository` and implementation in `SqlAlchemyAuditRepository`.
**When to use:** Dashboard ActivityFeed widget.

**Backend changes required:**
1. Add `get_global_activity()` abstract method to `IAuditRepository` (`Backend/app/domain/repositories/audit_repository.py`)
2. Implement in `SqlAlchemyAuditRepository` — same query as `get_project_activity()` but without the `entity_id == project_id` condition
3. Add `GetGlobalActivityUseCase` in `Backend/app/application/use_cases/`
4. Add new route `GET /activity` to `Backend/app/api/v1/activity.py` — no auth requirement beyond `get_current_user`, no project membership check
5. Register in `app/api/main.py` — already included via `app.include_router(activity_router.router, prefix="/api/v1")`

**Response shape** (matches existing `ActivityResponseDTO`):
```json
{
  "items": [
    {
      "id": 1, "action": "task_created", "entity_type": "task",
      "entity_id": 42, "entity_label": null,
      "user_id": 2, "user_name": "Ayşe Öz", "user_avatar": "uploads/...",
      "timestamp": "2026-04-21T10:30:00", "metadata": {}
    }
  ],
  "total": 87
}
```

### Anti-Patterns to Avoid
- **Server component reading localStorage:** `localStorage` is undefined on the server. All token reads must be inside `typeof window !== 'undefined'` guards or `useEffect`. [VERIFIED: codebase — existing AppContext uses `typeof window` guard pattern]
- **Route group in middleware matcher:** `matcher: ['/(shell)/:path*']` does NOT work — `(shell)` is a Next.js convention that does not exist in the URL path. Enumerate real paths. [CITED: Next.js middleware docs]
- **QueryClient defined inside component:** Always define `QueryClient` outside the component (module scope or `useState` initial value) to prevent recreation on every render. [CITED: TanStack Query docs]
- **useSearchParams without Suspense:** Next.js throws a prerendering error if a component using `useSearchParams` is not wrapped in `<Suspense>`. [CITED: Next.js docs]
- **Adding "use client" to (shell)/layout.tsx without QueryClient stabilization:** If layout.tsx becomes a client component, React re-renders on navigation. Stabilize QueryClient with `useState` or module-level declaration.
- **Copying from Frontend/:** D-06 locks "re-implement from scratch." Do not `import` from `Frontend/` — it may be deleted later.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP interceptors | Custom fetch wrapper with retry | axios interceptors | Already in repo, handles 401, Bearer injection cleanly |
| Server state cache | Custom cache Map | @tanstack/react-query | Built-in stale time, invalidation, loading/error states |
| Query invalidation after mutation | manual re-fetch calls | `queryClient.invalidateQueries` | Handles all active subscriptions automatically |
| Cookie reading in middleware | `request.headers.get('cookie')` + parse | `request.cookies.get('auth_session')` | NextRequest.cookies is the typed, safe API |
| Progress bar custom implementation | custom SVG/div | existing `ProgressBar` primitive | `Frontend2/components/primitives/progress-bar.tsx` — Phase 8 built |
| Status badge | custom styled div | existing `Badge` primitive | Tone system already maps to correct colors |
| Avatar stack | custom overflow logic | existing `AvatarStack` primitive | Handles +N overflow, correct sizing |

**Key insight:** Frontend2's 16 primitive components eliminate all low-level UI construction. Phase 10 composes them, not re-builds them.

---

## Common Pitfalls

### Pitfall 1: Middleware Matcher vs Route Groups
**What goes wrong:** Planner writes `matcher: ['/(shell)/:path*']` which never matches any real URL because `(shell)` is invisible in URLs.
**Why it happens:** Confusing Next.js filesystem convention (route groups with parentheses) with actual URL paths.
**How to avoid:** List the actual URL segments that correspond to (shell) routes: `/dashboard`, `/projects`, `/settings`, `/my-tasks`, `/reports`, `/teams`.
**Warning signs:** Middleware never executes (no console log output) even on authenticated routes.

### Pitfall 2: QueryClient Recreation on Every Render
**What goes wrong:** `const queryClient = new QueryClient()` inside a component body → every render creates new client → cache is lost → infinite refetches.
**Why it happens:** Treating QueryClient like a simple object instead of a stable singleton.
**How to avoid:** Declare `queryClient` at module scope (outside component), or use `useState(() => new QueryClient())` for lazy initialization. The pattern in Pattern 4 above uses module scope.
**Warning signs:** Network tab shows constant refetches, React Query DevTools shows empty cache on every navigation.

### Pitfall 3: useSearchParams Prerendering Error
**What goes wrong:** Build fails with "useSearchParams() should be wrapped in a suspense boundary at page..." error.
**Why it happens:** Next.js statically prerenderes pages by default. `useSearchParams()` opts the component into dynamic rendering, which requires Suspense.
**How to avoid:** Wrap the component using `useSearchParams` in a `<Suspense>` boundary in its parent, as shown in Pattern 5.
**Warning signs:** `next build` succeeds but `next start` crashes on the wizard page, or build error during CI.

### Pitfall 4: auth_session Cookie Not Readable by Middleware
**What goes wrong:** Login sets the cookie with `httpOnly: true` — middleware cannot read it since it has no JS access; but if set via `document.cookie` without httpOnly, it IS readable both by middleware and client JS.
**Why it happens:** Confusion between cookie security flags. CONTEXT.md D-03 explicitly specifies NOT httpOnly for this presence-flag cookie.
**How to avoid:** Set via `document.cookie = 'auth_session=1; path=/; SameSite=Lax'` (no `httpOnly`, no `Secure` on dev). This is intentional — it's a presence flag only, not the actual token.
**Warning signs:** Middleware always redirects to login even after successful login.

### Pitfall 5: (shell)/layout.tsx "use client" vs Server Component
**What goes wrong:** After adding `"use client"` to `(shell)/layout.tsx` for QueryClientProvider, other server components inside that layout may lose their server rendering capabilities.
**Why it happens:** Client component boundaries propagate to children unless children are passed as `children` prop (which preserves server component status).
**How to avoid:** The AppShell receives `{children}` as a prop, so server page components inside (shell) remain server components even when the layout becomes a client component. This is the standard pattern. [CITED: Next.js docs on client/server composition]
**Warning signs:** Console warnings about unexpected "use server" inside client trees.

### Pitfall 6: SeederModel Import Missing for New Schema Fields
**What goes wrong:** Seeder.py uses `ProjectModel` to set `process_template_id` but that field may not be in the Python model if migration 005 added it at DB level only.
**Why it happens:** SQLAlchemy ORM models define Python attributes — if a new column was added via raw migration SQL without updating the ORM model, the seeder assignment fails silently or raises AttributeError.
**How to avoid:** Verify `Backend/app/infrastructure/database/models/project.py` has `process_template_id` as a mapped column before seeder update. Migration 005 context (STATE.md 09-01 note) confirms the field exists in the ORM already.
**Warning signs:** `AttributeError: 'ProjectModel' object has no attribute 'process_template_id'`

### Pitfall 7: "use client" Directive Missing on Interactive Components
**What goes wrong:** Components using `useState`, `useEffect`, `useRouter`, `useSearchParams`, `useAuth`, `useQuery` throw "You're importing a component that needs useState" in server context.
**Why it happens:** Next.js App Router defaults to server components. Interactive hooks require client context.
**How to avoid:** Every page or component that uses hooks must start with `"use client"`. The existing pattern in Frontend2 (app-context.tsx) shows this is already standard.
**Warning signs:** Build error: "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'".

---

## Code Examples

### Verified Pattern: Legacy axios api-client (source of truth)
```typescript
// Source: Frontend/lib/api-client.ts [VERIFIED: codebase read]
// This is the REFERENCE implementation — re-implement in Frontend2/lib/api-client.ts
// Key behaviors verified:
// 1. JSON.parse guard for quoted tokens: token.startsWith('"') ? JSON.parse(token) : token
// 2. 401 exclusions: /login path AND /session-expired path AND config.url includes /auth/login
// 3. SESSION_EXPIRED_KEY constant exported for use by session-expired page
```

### Verified Pattern: Legacy auth-service (source of truth)
```typescript
// Source: Frontend/services/auth-service.ts [VERIFIED: codebase read]
// Key methods: login(), logout(), getCurrentUser(), getToken(), setToken(), updateProfile(), uploadAvatar()
// updateProfile() uses PUT /auth/me — same endpoint for name/email AND password change (D-32)
// uploadAvatar() uses multipart/form-data POST /auth/me/avatar
// Mapper: UserResponseDTO → User (id.toString(), role.name from nested role object)
```

### Verified Pattern: useProjects hook (source of truth)
```typescript
// Source: Frontend/hooks/use-projects.ts [VERIFIED: codebase read]
// Shows: queryKey structure ['projects'], ['projects', id]
// enabled: !!id guard prevents fetching before ID is available
// Re-implement with status filter param: queryKey: ['projects', { status }]
```

### Dashboard StatCard from Prototype
```jsx
// Source: New_Frontend/src/pages/dashboard.jsx [VERIFIED: codebase read]
// StatCard props: label, value, delta, tone ("primary"|"info"|"success"|"danger"), icon
// tone maps to color-mix background on icon box
// delta text at fontSize 11.5, color var(--fg-subtle), marginTop 10
// value: fontSize 28, fontWeight 600, fontVariantNumeric tabular-nums
```

### Project Card Top Strip Color Logic
```jsx
// Source: New_Frontend/src/pages/projects.jsx:49 [VERIFIED: codebase read]
// status === "completed" → var(--status-done)
// status === "on_hold"   → var(--status-review)
// otherwise (active)     → var(--primary)
// ARCHIVED has no top strip color — entire card gets opacity 0.6
```

### Backend Activity Endpoint (existing pattern to extend)
```python
# Source: Backend/app/api/v1/activity.py [VERIFIED: codebase read]
# Existing route: GET /projects/{project_id}/activity
# New route to add: GET /activity?limit=20&offset=0
# Auth: requires get_current_user (any authenticated user — no project membership check)
# Use case: GetGlobalActivityUseCase (new) — calls audit_repo.get_global_activity()
# IAuditRepository: add get_global_activity() method — same signature as get_project_activity() minus project_id
```

---

## Runtime State Inventory

> This is NOT a rename/refactor phase. No runtime state inventory required.

Seeder updates (D-36) involve changing Python code, not existing stored data migration. The seeder skips if data already exists (`if result.scalars().first(): return`). Developers running fresh DB setup will get updated seed data automatically. No migration of existing records is needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend2 build | ✓ | v25.2.1 [VERIFIED: Bash] | — |
| Python / FastAPI backend | API calls | [ASSUMED] running | — | Run `uvicorn app.api.main:app` |
| PostgreSQL | Backend data | [ASSUMED] running | — | Check seeder note in STATE.md |
| @tanstack/react-query-devtools | DevTools (dev only) | ✗ — not in package.json | — | Install: `npm install @tanstack/react-query-devtools` |
| Frontend2 node_modules | All npm packages | ✗ — not installed [VERIFIED: ls] | — | Run `npm install` in Frontend2/ |

**Missing dependencies with no fallback:**
- `npm install` must be run in Frontend2/ before any dev server or build
- Backend must be running with migration 005 applied (`alembic upgrade head` or startup auto-migration)

**Missing dependencies with fallback:**
- `@tanstack/react-query-devtools` — can be deferred, zero functional impact in dev until installed

---

## Validation Architecture

> nyquist_validation is enabled (config.json `workflow.nyquist_validation: true`)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification + curl tests (no automated test framework detected in Frontend2) |
| Config file | none — Frontend2 has no jest/vitest config |
| Quick run command | `npm run dev` (start dev server, verify visually) |
| Full suite command | Backend: `pytest tests/` from Backend/ |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-06 | Login page renders 2-column layout, form submits, redirects /dashboard | manual | Browser: navigate to /login | ✓ page.tsx exists as stub |
| PAGE-06 | 401 response clears token + redirects /session-expired | manual | curl: make auth request with expired token | ✓ interceptor pattern |
| PAGE-06 | Middleware redirects unauthenticated /dashboard → /login | manual | Browser: visit /dashboard without cookie | ❌ middleware.ts Wave 0 |
| PAGE-01 | Dashboard StatCards show live counts from API | manual | Browser: check Network tab for GET /projects, /tasks | ✓ page.tsx exists as stub |
| PAGE-01 | ActivityFeed loads from GET /activity | manual | curl: `curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/activity?limit=20` | ❌ endpoint Wave 0 |
| PAGE-02 | Projects grid shows 3 columns, cards have status badges | manual | Browser: visual compare vs prototype screenshot | ✓ page.tsx exists as stub |
| PAGE-02 | SegmentedControl filter calls GET /projects?status=ACTIVE | manual | Browser: Network tab after filter click | ✓ API endpoint exists |
| PAGE-05 | Settings Tercihler tab wires density to AppContext | manual | Browser: change density, verify data-density attribute | ✓ density state in AppContext |
| PROJ-01 | Wizard URL step tracking — back/forward navigate between steps | manual | Browser: use browser back button on /projects/new?step=2 | ❌ page Wave 0 |
| PROJ-01 | sessionStorage draft survives page refresh | manual | Browser: fill step 1, refresh, check form repopulated | ❌ page Wave 0 |
| PROJ-02 | Status change dropdown shows confirmation dialog | manual | Browser: click 3-dot menu on project card | ❌ dialog component Wave 0 |
| PROJ-02 | Confirming status change calls PATCH /projects/{id} | manual | Browser: Network tab after confirm | ✓ PATCH endpoint exists |
| PROJ-04 | Archived card has opacity 0.6 | manual | Browser: DevTools inspect archived card opacity | ✓ CSS pattern from prototype |

### Sampling Rate
- **Per task commit:** Start dev server, visually verify the page/component being built
- **Per wave merge:** Full visual comparison against all prototype pages, verify all API calls in Network tab
- **Phase gate:** All pages visually match prototype, all API integrations work with live backend data

### Wave 0 Gaps
- [ ] `Frontend2/middleware.ts` — covers PAGE-06 middleware redirect
- [ ] `Backend/app/api/v1/activity.py` — add `GET /activity` route (covers PAGE-01 activity feed)
- [ ] `Backend/app/domain/repositories/audit_repository.py` — add `get_global_activity()` abstract method
- [ ] `Backend/app/infrastructure/database/repositories/audit_repo.py` — implement `get_global_activity()`
- [ ] `Frontend2/app/(auth)/layout.tsx` — (auth) route group layout (no AppShell)
- [ ] `Frontend2/app/(shell)/projects/new/page.tsx` — wizard page (covers PROJ-01)
- [ ] Confirmation dialog component for status change (covers PROJ-02)
- [ ] Install: `npm install @tanstack/react-query-devtools` in Frontend2/

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `methodology` field on Project | `process_template_id` FK to ProcessTemplate table | Phase 9 (migration 005) | Wizard Step 2 shows template names from API, not hardcoded enum values |
| Hardcoded template options | `GET /process-templates` dynamic list | Phase 9 | Step 2 must fetch templates, not import a static list |
| AppContext handles all state | AuthContext (auth) + AppContext (UI) | Phase 10 (D-08) | AuthContext is new; AppContext already has density state wired |

**Deprecated/outdated:**
- `methodology` enum on projects: Field still exists in DB (NOT dropped until migration 006 — STATE.md 09-01 note). Frontend should use `process_template_id` / template name for display, but `methodology` field still readable from API response.
- `window.SPMSData.*` from prototype: The HTML prototype uses a global data store. Next.js version uses TanStack Query + API calls. Never replicate this pattern.

---

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` apply to the backend portion of this phase:

| Directive | Impact on Phase 10 |
|-----------|-------------------|
| Clean Architecture — Dependency Rule | New `GET /activity` endpoint: route → use case → domain interface → infra implementation. No SQLAlchemy in application layer. |
| SOLID / Strategy Pattern | No `if project.type == 'SCRUM'` in use cases. Global activity use case has no methodology logic. |
| Dependency Injection via FastAPI `Depends` | New `GetGlobalActivityUseCase` receives `IAuditRepository` via `Depends(get_audit_repo)` |
| Implementation Workflow Order | Domain interface first → infra implementation → use case → API route |
| `app/application` must NEVER import `sqlalchemy` | `GetGlobalActivityUseCase` must not import from `app.infrastructure` |

Frontend portions (Next.js) are not under CLAUDE.md jurisdiction (CLAUDE.md governs Backend Python only).

---

## Open Questions (RESOLVED)

1. **Toast implementation detail**
   - What we know: D-07 specifies toast notifications for API errors. The prototype has no formal toast component in `primitives.jsx`.
   - What's unclear: Is there a toast in the prototype at all? If so, which file?
   - Recommendation: Planner marks toast as Claude's Discretion. A minimal custom toast (fixed position, auto-dismiss after 3s) built from prototype token system is the right approach. Do NOT import a toast library.
   - **Resolution:** Custom minimal toast component in Plan 05 (Claude's Discretion per CONTEXT.md).

2. **Progress % calculation for project cards**
   - What we know: The prototype shows `project.progress` as a 0–1 float. The backend `ProjectResponseDTO` may or may not compute this.
   - What's unclear: Does the backend return a `progress` field? If not, must the frontend derive it from task counts.
   - Recommendation: Check `Backend/app/application/dtos/project_dtos.py` — if `progress` exists and is populated, use it directly. If absent, use `completed_tasks / total_tasks` with a fallback of 0.
   - **Resolution:** Use project.progress field returned by backend ProjectResponseDTO (verified present).

3. **"Yeni proje" button in Header**
   - What we know: STATE.md 08-04 note says "Create button in header deferred to Phase 10."
   - What's unclear: Does Phase 10 wire this header button to navigate to `/projects/new`?
   - Recommendation: Yes — Phase 10 should wire the header Create button to `router.push('/projects/new')` since the wizard page now exists.
   - **Resolution:** Plan 09 Task 1 wires header Create button to router.push('/projects/new').

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend is running and accessible at `http://localhost:8000` during development | Environment Availability | All API integrations fail; dev cannot test live data |
| A2 | PostgreSQL has migration 005 applied (process_template_id, ProjectStatus enum exist) | Environment Availability | Seeder update crashes; frontend gets 500 errors from API |
| A3 | `@tanstack/react-query-devtools` v5.x (matching react-query v5.99.2) is available from npm | Standard Stack | Install may fail if package name or version mismatch |
| A4 | The `ProjectResponseDTO` returned by `GET /projects` includes all fields needed for project cards (name, key, methodology/template, status, manager_id, team members, end_date) | Code Examples | Missing fields require backend DTO update before frontend can display |
| A5 | No toast library exists in prototype — must build minimal custom | Open Questions | If prototype has a toast elsewhere, may duplicate UI patterns |

---

## Sources

### Primary (HIGH confidence)
- `Frontend/lib/api-client.ts` — axios interceptor pattern, 401 handling, token cleanup [VERIFIED: codebase read]
- `Frontend/services/auth-service.ts` — auth service pattern, API endpoint shapes [VERIFIED: codebase read]
- `Frontend/hooks/use-projects.ts` — TanStack Query hook pattern [VERIFIED: codebase read]
- `Frontend2/context/app-context.tsx` — existing AppContext shape, density state already present [VERIFIED: codebase read]
- `Frontend2/package.json` — exact installed versions: Next.js 16.2.4, React 19.2.4, TanStack Query 5.99.2, axios 1.15.1 [VERIFIED: codebase read]
- `Backend/app/api/v1/activity.py` — existing activity router structure to extend [VERIFIED: codebase read]
- `Backend/app/domain/repositories/audit_repository.py` — IAuditRepository interface [VERIFIED: codebase read]
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — SQL pattern for get_project_activity() [VERIFIED: codebase read]
- `Backend/app/api/main.py` — router registration pattern, existing activity router already included [VERIFIED: codebase read]
- `New_Frontend/src/pages/dashboard.jsx` — StatCard, PortfolioTable, ActivityFeed component structure [VERIFIED: codebase read]
- `New_Frontend/src/pages/projects.jsx` — ProjectCard, SegmentedControl filter, 3-column grid [VERIFIED: codebase read]
- `New_Frontend/src/pages/create-project.jsx` — 4-step wizard structure, step indicator, validation logic [VERIFIED: codebase read]
- `New_Frontend/src/pages/settings.jsx` — 5-tab settings layout, ProfileSection, PreferencesSection [VERIFIED: codebase read]
- `New_Frontend/src/pages/misc.jsx` — login 2-column layout, LogoMark component, auth page structure [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)
- Context7 / Next.js docs — middleware cookie pattern, useSearchParams + Suspense requirement, route group mechanics, useRouter push, redirect() [CITED: Context7 query via npx ctx7@latest docs /websites/nextjs]
- Context7 / TanStack Query v5 docs — QueryClientProvider setup, useQuery options, useMutation onError, invalidateQueries, ReactQueryDevtools floating mode [CITED: Context7 query via npx ctx7@latest docs /tanstack/query]

### Tertiary (LOW confidence)
- A3 (assumed): @tanstack/react-query-devtools v5 available from npm matching installed react-query version

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages verified in package.json
- Architecture: HIGH — patterns verified from legacy Frontend codebase + Context7 docs
- Pitfalls: HIGH — middleware matcher pitfall verified against Next.js docs; others from codebase inspection
- Backend (global activity endpoint): HIGH — existing interface and SQL patterns verified in codebase

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable stack — Next.js 16, TanStack Query 5.x are stable releases)

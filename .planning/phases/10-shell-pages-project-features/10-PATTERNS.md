# Phase 10: Shell Pages & Project Features - Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 21 new/modified files
**Analogs found:** 19 / 21

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `Frontend2/lib/constants.ts` | config | — | `Frontend/lib/constants.ts` | exact |
| `Frontend2/lib/api-client.ts` | utility | request-response | `Frontend/lib/api-client.ts` | exact |
| `Frontend2/services/auth-service.ts` | service | request-response | `Frontend/services/auth-service.ts` | exact |
| `Frontend2/services/project-service.ts` | service | CRUD | `Frontend/services/project-service.ts` | exact |
| `Frontend2/hooks/use-projects.ts` | hook | CRUD | `Frontend/hooks/use-projects.ts` | exact |
| `Frontend2/context/auth-context.tsx` | provider | event-driven | `Frontend2/context/app-context.tsx` | role-match |
| `Frontend2/middleware.ts` | middleware | request-response | — (Next.js convention) | no-analog |
| `Frontend2/app/(auth)/layout.tsx` | layout | — | `Frontend2/app/(shell)/layout.tsx` | role-match |
| `Frontend2/app/(auth)/login/page.tsx` | component | request-response | `New_Frontend/src/pages/misc.jsx` | role-match |
| `Frontend2/app/(auth)/session-expired/page.tsx` | component | — | `New_Frontend/src/pages/misc.jsx` | role-match |
| `Frontend2/app/(auth)/forgot-password/page.tsx` | component | request-response | `New_Frontend/src/pages/misc.jsx` | role-match |
| `Frontend2/app/(shell)/layout.tsx` | layout | — | `Frontend2/app/(shell)/layout.tsx` (self — extend) | exact |
| `Frontend2/app/layout.tsx` | layout | — | `Frontend2/app/layout.tsx` (self — extend) | exact |
| `Frontend2/context/app-context.tsx` | provider | event-driven | `Frontend2/context/app-context.tsx` (self — extend) | exact |
| `Frontend2/app/(shell)/dashboard/page.tsx` | component | CRUD | `Frontend2/app/(shell)/projects/page.tsx` (stub) | role-match |
| `Frontend2/app/(shell)/projects/page.tsx` | component | CRUD | `Frontend/services/project-service.ts` + primitives | role-match |
| `Frontend2/app/(shell)/projects/new/page.tsx` | component | CRUD | `New_Frontend/src/pages/create-project.jsx` | role-match |
| `Frontend2/app/(shell)/settings/page.tsx` | component | CRUD | `New_Frontend/src/pages/settings.jsx` | role-match |
| `Backend/app/api/v1/activity.py` | controller | request-response | `Backend/app/api/v1/activity.py` (self — extend) | exact |
| `Backend/app/domain/repositories/audit_repository.py` | model | CRUD | `Backend/app/domain/repositories/audit_repository.py` (self — extend) | exact |
| `Backend/app/infrastructure/database/repositories/audit_repo.py` | service | CRUD | `Backend/app/infrastructure/database/repositories/audit_repo.py` (self — extend) | exact |
| `Backend/app/infrastructure/database/seeder.py` | utility | batch | `Backend/app/infrastructure/database/seeder.py` (self — extend) | exact |

---

## Pattern Assignments

### `Frontend2/lib/constants.ts` (config)

**Analog:** `Frontend/lib/constants.ts`

**Full content of analog** (lines 1-1):
```typescript
export const AUTH_TOKEN_KEY = 'auth_token';
```

**New file pattern — add SESSION_EXPIRED_KEY alongside:**
```typescript
// Frontend2/lib/constants.ts
export const AUTH_TOKEN_KEY = 'auth_token';
export const SESSION_EXPIRED_KEY = 'session_expired';
// NEXT_PUBLIC_API_URL is read directly from process.env in api-client.ts — not needed here
```

---

### `Frontend2/lib/api-client.ts` (utility, request-response)

**Analog:** `Frontend/lib/api-client.ts`

**Full analog** (lines 1-56):
```typescript
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const SESSION_EXPIRED_KEY = 'session_expired';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Request interceptor pattern** (analog lines 16-32):
```typescript
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const cleanToken = token.startsWith('"') ? JSON.parse(token) : token;
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error.message);
    return Promise.reject(error);
  }
);
```

**Response interceptor pattern — 401 handling** (analog lines 38-56):
```typescript
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
      localStorage.setItem(SESSION_EXPIRED_KEY, 'true');
      window.location.href = '/session-expired';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

**D-03 addition — also clear cookie on 401 (not in analog, add to new file):**
```typescript
// After localStorage.removeItem, additionally clear the middleware cookie:
document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
```

---

### `Frontend2/services/auth-service.ts` (service, request-response)

**Analog:** `Frontend/services/auth-service.ts`

**Imports pattern** (analog lines 1-3):
```typescript
import { apiClient } from '@/lib/api-client';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
```

**Interface definitions** (analog lines 13-41):
```typescript
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface UserResponseDTO {
    id: number
    email: string
    full_name: string
    avatar?: string
    is_active: boolean
    role?: {
        name: string
        description?: string
    }
}

const mapUserResponseToUser = (data: UserResponseDTO): AuthUser => ({
    id: data.id.toString(),
    name: data.full_name,
    email: data.email,
    avatar: resolveAvatarUrl(data.avatar),
    role: data.role ? { name: data.role.name } : { name: "Member" },
});
```

**Core service object pattern** (analog lines 43-106):
```typescript
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await apiClient.get<UserResponseDTO>('/auth/me');
    return mapUserResponseToUser(response.data);
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  updateProfile: async (data: {
    full_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;        // D-32: add new_password for Güvenlik tab
  }): Promise<AuthUser> => {
    const response = await apiClient.put<UserResponseDTO>('/auth/me', data);
    return mapUserResponseToUser(response.data);
  },

  uploadAvatar: async (file: File): Promise<AuthUser> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UserResponseDTO>('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapUserResponseToUser(response.data);
  },
};
```

**resolveAvatarUrl helper** (analog lines 7-10):
```typescript
const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function resolveAvatarUrl(rawAvatar?: string | null): string {
  if (!rawAvatar) return '/placeholder.svg';
  if (rawAvatar.startsWith('uploads/')) return `${BACKEND_BASE}/static/${rawAvatar}`;
  return rawAvatar;
}
```

---

### `Frontend2/services/project-service.ts` (service, CRUD)

**Analog:** `Frontend/services/project-service.ts`

**Imports pattern** (analog line 1):
```typescript
import { apiClient } from '@/lib/api-client';
```

**Response/DTO interface pattern** (analog lines 12-38):
```typescript
// NOTE: Re-implement with Phase 9 field shapes. The analog uses old `methodology` field.
// New file must use process_template_id instead and include status field.
interface ProjectResponse {
  id: number;
  key: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: string;                    // Phase 9: ACTIVE | COMPLETED | ON_HOLD | ARCHIVED
  process_template_id: number | null; // Phase 9: replaces methodology
  methodology: string;               // Phase 9: kept for now (not dropped until migration 006)
  manager_id: number;
  progress?: number;                 // May be 0 if backend doesn't compute it
  created_at: string;
  process_config?: Record<string, unknown>;
}
```

**Mapper pattern** (analog lines 41-65):
```typescript
const mapProjectResponseToProject = (data: ProjectResponse): Project => {
  // ... map id.toString(), status badge, etc.
};
```

**Service object pattern with status method** (analog lines 67-113 + new):
```typescript
export const projectService = {
  getAll: async (status?: string): Promise<Project[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<ProjectResponse[]>('/projects', { params });
    return response.data.map(mapProjectResponseToProject);
  },

  getById: async (id: string | number): Promise<Project> => {
    const response = await apiClient.get<ProjectResponse>(`/projects/${id}`);
    return mapProjectResponseToProject(response.data);
  },

  create: async (data: CreateProjectDTO): Promise<Project> => {
    const response = await apiClient.post<ProjectResponse>('/projects/', data);
    return mapProjectResponseToProject(response.data);
  },

  updateStatus: async (id: number, status: string): Promise<Project> => {
    const response = await apiClient.patch<ProjectResponse>(`/projects/${id}`, { status });
    return mapProjectResponseToProject(response.data);
  },

  getActivity: async (limit = 20, offset = 0) => {
    const response = await apiClient.get(`/activity`, { params: { limit, offset } });
    return response.data;
  },

  getProcessTemplates: async () => {
    const response = await apiClient.get('/process-templates');
    return response.data;
  },
};
```

---

### `Frontend2/hooks/use-projects.ts` (hook, CRUD)

**Analog:** `Frontend/hooks/use-projects.ts`

**Full analog** (lines 1-18):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project-service';

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });
};
```

**Extended pattern with status filter + mutations** (add to new file):
```typescript
// Status-filtered list (D-24)
export const useProjects = (status?: string) => {
  return useQuery({
    queryKey: ['projects', { status }],
    queryFn: () => projectService.getAll(status),
  });
};

// Status update mutation (D-25, PROJ-02)
export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      projectService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      // D-07: trigger toast notification
      // showToast({ message: 'Durum güncellenemedi', variant: 'error' })
    },
  });
};

// Create wizard mutation (PROJ-01)
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
```

---

### `Frontend2/context/auth-context.tsx` (provider, event-driven)

**Analog:** `Frontend2/context/app-context.tsx`

**Context + hook export pattern** (analog lines 57-65):
```typescript
"use client"
import * as React from "react"

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
```

**localStorage helper pattern** (analog lines 69-86):
```typescript
// SSR-safe localStorage access — use this pattern for all reads in auth-context
function load<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def
  try {
    const v = window.localStorage.getItem("spms." + key)
    return v !== null ? (JSON.parse(v) as T) : def
  } catch {
    return def
  }
}
```

**Provider with lazy useState + useEffect pattern** (analog lines 88-231):
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // SSR-safe init on mount
  React.useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_KEY) : null
    if (stored) {
      setToken(stored)
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => { /* expired — interceptor handles */ })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  // value memoized (analog lines 188-229 pattern)
  const value = React.useMemo(() => ({ user, token, isLoading, login, logout }), [...])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

**login/logout pattern with D-03 cookie** (from RESEARCH.md Pattern 2):
```typescript
const login = async (email: string, password: string) => {
  const resp = await authService.login({ email, password })
  localStorage.setItem(AUTH_TOKEN_KEY, resp.access_token)
  document.cookie = `auth_session=1; path=/; SameSite=Lax`  // D-03: presence flag
  setToken(resp.access_token)
  const me = await authService.getCurrentUser()
  setUser(me)
}

const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  document.cookie = `auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  setUser(null); setToken(null)
}
```

---

### `Frontend2/middleware.ts` (middleware, request-response)

**Analog:** No existing analog in codebase (no-analog file).

**Pattern from RESEARCH.md Pattern 3 (Next.js docs pattern):**
```typescript
// Frontend2/middleware.ts — MUST be at Frontend2/ root, NOT inside app/
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
  // List ACTUAL URL paths — (shell) route group name does NOT appear in URLs
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

**CRITICAL:** Do NOT write `matcher: ['/(shell)/:path*']` — route group parentheses are invisible in URLs.

---

### `Frontend2/app/(auth)/layout.tsx` (layout)

**Analog:** `Frontend2/app/(shell)/layout.tsx` (inverted — no AppShell)

**Shell layout analog** (lines 1-14):
```typescript
import * as React from "react"
import { AppShell } from "@/components/app-shell"

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
```

**Auth layout pattern — omit AppShell entirely:**
```typescript
// Frontend2/app/(auth)/layout.tsx
// Server component — no "use client" needed (no interactivity in the layout itself)
import * as React from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

---

### `Frontend2/app/(shell)/layout.tsx` (layout, extend)

**Analog:** `Frontend2/app/(shell)/layout.tsx` (self — extend)

**Current content** (lines 1-14):
```typescript
import * as React from "react"
import { AppShell } from "@/components/app-shell"

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
```

**Extended pattern — add QueryClientProvider (D-04, RESEARCH.md Pattern 4):**
```typescript
"use client"  // Required for QueryClientProvider (uses React state internally)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppShell } from "@/components/app-shell"
import React from "react"

// Module-scope QueryClient — prevents recreation on every render (Pitfall 2 avoidance)
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

---

### `Frontend2/app/layout.tsx` (layout, extend)

**Analog:** `Frontend2/app/layout.tsx` (self — extend)

**Current content** (lines 1-35):
```typescript
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AppProvider } from "@/context/app-context"
import "./globals.css"
// ...
export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={...}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
```

**Extended pattern — add AuthProvider (D-08):**
```typescript
// Add import:
import { AuthProvider } from "@/context/auth-context"

// Wrap children with both providers — AuthProvider inside AppProvider
// so useAuth() can access app context if needed:
<AppProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</AppProvider>
```

---

### `Frontend2/context/app-context.tsx` (provider, extend)

**Analog:** `Frontend2/context/app-context.tsx` (self — already has density; D-31 requires uiDensity state but it already exists as `density`)

**Density state already present** (analog lines 38-40, 93, 134-139):
```typescript
// These already exist — NO change needed for density:
density: Density
setDensity: (d: Density) => void
// ...
const [density, setDensityState] = React.useState<Density>(() => load("density", "cozy"))
// ...
React.useEffect(() => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.density = density
  }
}, [density])
```

**D-31 note:** AppContext already has `density` + `setDensity` wired to localStorage and `data-density` DOM attribute. Settings > Tercihler tab only needs to read `useApp().density` and call `useApp().setDensity(value)` — no AppContext changes needed for density.

---

### `Frontend2/app/(auth)/login/page.tsx` (component, request-response)

**Analog:** `New_Frontend/src/pages/misc.jsx`

**2-column layout structure** (analog lines 9-80):
```jsx
// Left column (form) + Right column (illustration)
<div style={{ position: "fixed", inset: 0, display: "grid", gridTemplateColumns: "1fr 1.1fr",
  background: "var(--bg)", zIndex: 100 }}>
  {/* LEFT — form panel */}
  <div style={{ display: "flex", flexDirection: "column", padding: "40px 60px" }}>
    {/* Logo header */}
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <LogoMark/>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>PMS</div>
      <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>Proje Yönetim Sistemi</div>
    </div>
    {/* Centered form */}
    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Title */}
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginBottom: 8 }}>
          Tekrar hoş geldiniz
        </div>
        {/* Email + Password fields */}
        {/* Submit button — variant="primary" size="lg" style={{ width: "100%" }} */}
      </div>
    </div>
    {/* Footer */}
    <div style={{ fontSize: 11, color: "var(--fg-subtle)", display: "flex", gap: 16 }}>
      <span>© 2025 Acme Holding</span>
    </div>
  </div>
  {/* RIGHT — branding / illustration panel */}
</div>
```

**Auth pattern — login page calls AuthContext.login():**
```typescript
"use client"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      router.push('/dashboard')  // D-14
    } catch (err) {
      // show inline error
    }
  }
}
```

---

### `Frontend2/app/(auth)/session-expired/page.tsx` (component)

**Analog:** `New_Frontend/src/pages/misc.jsx` (same file has session-expired variant)

**Pattern — simple centered message + back to login link:**
```typescript
"use client"
// No auth check needed — this is the unauthenticated landing
// Clears localStorage token on mount (belt-and-suspenders alongside interceptor)
React.useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}, [])
// Link back to /login using next/navigation useRouter or <a href="/login">
```

---

### `Frontend2/app/(auth)/forgot-password/page.tsx` (component, request-response)

**Analog:** `New_Frontend/src/pages/misc.jsx` (mode="forgot" variant, lines 21-71)

**Same 2-column layout as login** — use identical outer structure. Form shows email field only. Button calls `authService.requestPasswordReset(email)` (already in legacy analog lines 96-98 of `Frontend/services/auth-service.ts`).

---

### `Frontend2/app/(shell)/dashboard/page.tsx` (component, CRUD)

**Analog:** `Frontend2/app/(shell)/dashboard/page.tsx` (current stub — replace entire content)

**Prototype source:** `New_Frontend/src/pages/dashboard.jsx`

**useQuery pattern for data loading:**
```typescript
"use client"
import { useQuery } from '@tanstack/react-query'
import { useAuth } from "@/context/auth-context"
import { projectService } from "@/services/project-service"

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: projects } = useQuery({
    queryKey: ['projects', { status: 'ACTIVE' }],
    queryFn: () => projectService.getAll('ACTIVE'),
  })

  const { data: activity } = useQuery({
    queryKey: ['activity'],
    queryFn: () => projectService.getActivity(20, 0),
  })

  // D-27: Manager vs Member view toggle
  const isManager = user?.role?.name === 'Project Manager' || user?.role?.name === 'Admin'
  // ... render StatCards, PortfolioTable (managers) or assigned tasks (members), ActivityFeed
}
```

**StatCard component props** (from RESEARCH.md Code Examples):
```typescript
// StatCard props: label, value, delta, tone ("primary"|"info"|"success"|"danger"), icon
// tone maps to color-mix background on icon box
// delta text at fontSize 11.5, color var(--fg-subtle), marginTop 10
// value: fontSize 28, fontWeight 600, fontVariantNumeric tabular-nums
```

---

### `Frontend2/app/(shell)/projects/page.tsx` (component, CRUD)

**Analog:** `Frontend2/app/(shell)/projects/page.tsx` (current stub — replace entire content)

**Prototype source:** `New_Frontend/src/pages/projects.jsx`

**SegmentedControl + useProjects pattern:**
```typescript
"use client"
import { useState } from "react"
import { useProjects } from "@/hooks/use-projects"
import { SegmentedControl } from "@/components/primitives/segmented-control"

const STATUS_OPTIONS = [
  { label: "Tümü",  value: "" },
  { label: "Aktif", value: "ACTIVE" },
  { label: "Bitti", value: "COMPLETED" },
  { label: "Arşiv", value: "ARCHIVED" },
]

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const { data: projects, isLoading } = useProjects(statusFilter || undefined)
  // ...
}
```

**Project card top-strip color** (RESEARCH.md Code Examples from projects.jsx line 49):
```typescript
// status === "completed" → var(--status-done)
// status === "on_hold"   → var(--status-review)
// otherwise (active)     → var(--primary)
// ARCHIVED: no top strip — card gets opacity: 0.6 (D-23)
const topStripColor =
  project.status === "COMPLETED" ? "var(--status-done)" :
  project.status === "ON_HOLD"   ? "var(--status-review)" :
  project.status === "ARCHIVED"  ? undefined :
  "var(--primary)"
```

**Status change dropdown confirmation dialog pattern (D-25):**
```typescript
// Overflow menu (3-dot) triggers confirmation state
const [pendingAction, setPendingAction] = useState<{id: number; status: string} | null>(null)
const { mutate: updateStatus } = useUpdateProjectStatus()

// ConfirmDialog built from prototype styles (not shadcn) — see Shared Patterns
const handleConfirm = () => {
  if (pendingAction) {
    updateStatus(pendingAction)
    setPendingAction(null)
  }
}
```

---

### `Frontend2/app/(shell)/projects/new/page.tsx` (component, CRUD)

**Analog:** `New_Frontend/src/pages/create-project.jsx` (prototype, 393 lines)

**useSearchParams step tracking with Suspense boundary (RESEARCH.md Pattern 5):**
```typescript
"use client"
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function WizardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const step = Number(searchParams.get('step') ?? '1')

  const advanceStep = () => router.push(`/projects/new?step=${step + 1}`)
  const goBack = () => step > 1 ? router.push(`/projects/new?step=${step - 1}`) : router.push('/projects')
}

// REQUIRED Suspense wrapper — without this, Next.js throws prerendering error (Pitfall 3)
export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WizardContent />
    </Suspense>
  )
}
```

**sessionStorage draft pattern (RESEARCH.md Pattern 6):**
```typescript
const WIZARD_DRAFT_KEY = 'spms_wizard_draft'

// Save on each step change
React.useEffect(() => {
  sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify({ step, name, key, templateId, /* ... */ }))
}, [step, name, key, templateId])

// Restore on mount
React.useEffect(() => {
  const raw = sessionStorage.getItem(WIZARD_DRAFT_KEY)
  if (raw) {
    try {
      const draft = JSON.parse(raw)
      setName(draft.name ?? '')
      setKey(draft.key ?? '')
    } catch { /* corrupt draft — ignore */ }
  }
}, [])

// Clear on success (D-21)
const handleSubmit = async () => {
  await createProject(payload)
  sessionStorage.removeItem(WIZARD_DRAFT_KEY)
  router.push(`/projects/${newProject.id}`)
}
```

**Validation gate pattern (D-17):**
```typescript
// Step 1 required: name + team selection
const step1Valid = name.trim().length > 0 && selectedTeamId !== null
// Step 2 required: template selection
const step2Valid = selectedTemplateId !== null || selectedCustom

<Button variant="primary" disabled={step === 1 && !step1Valid || step === 2 && !step2Valid}>
  Sonraki
</Button>
```

---

### `Frontend2/app/(shell)/settings/page.tsx` (component, CRUD)

**Analog:** `New_Frontend/src/pages/settings.jsx` (prototype, 336 lines)

**Tab state pattern:**
```typescript
"use client"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"

const TABS = ["Profil", "Tercihler", "Görünüm", "Bildirimler", "Güvenlik"]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profil")
  const { density, setDensity, language, setLanguage } = useApp()  // D-31
  const { user } = useAuth()
  // ...
}
```

**Profile update mutation (D-32):**
```typescript
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth-service'

const updateProfileMutation = useMutation({
  mutationFn: authService.updateProfile,
  onError: () => { /* D-07: show toast */ },
})

// Password change (D-32): same endpoint PUT /auth/me with current_password + new_password
const changePasswordMutation = useMutation({
  mutationFn: (data: { current_password: string; new_password: string }) =>
    authService.updateProfile(data),
})
```

**Avatar upload mutation:**
```typescript
const uploadAvatarMutation = useMutation({
  mutationFn: (file: File) => authService.uploadAvatar(file),
  onSuccess: (updatedUser) => { /* update auth context user */ },
})
```

---

### `Backend/app/api/v1/activity.py` (controller, request-response, extend)

**Analog:** `Backend/app/api/v1/activity.py` (self — add new route)

**Existing route pattern** (lines 18-52):
```python
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime

from app.api.deps.project import get_project_member
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.get_project_activity import GetProjectActivityUseCase
from app.application.dtos.activity_dtos import ActivityResponseDTO

router = APIRouter()

@router.get(
    "/projects/{project_id}/activity",
    response_model=ActivityResponseDTO,
)
async def get_project_activity(
    project_id: int,
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _member=Depends(get_project_member),
    audit_repo=Depends(get_audit_repo),
) -> ActivityResponseDTO:
    use_case = GetProjectActivityUseCase(audit_repo)
    return await use_case.execute(project_id=project_id, limit=limit, offset=offset)
```

**New global activity route to add (D-28):**
```python
# Add new import
from app.api.deps.auth import get_current_user
from app.application.use_cases.get_global_activity import GetGlobalActivityUseCase

@router.get(
    "/activity",
    response_model=ActivityResponseDTO,
)
async def get_global_activity(
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _user=Depends(get_current_user),          # Any authenticated user — no project membership check
    audit_repo=Depends(get_audit_repo),
) -> ActivityResponseDTO:
    """D-28: global activity feed across all projects for Dashboard ActivityFeed widget."""
    use_case = GetGlobalActivityUseCase(audit_repo)
    return await use_case.execute(limit=limit, offset=offset)
```

---

### `Backend/app/domain/repositories/audit_repository.py` (model, extend)

**Analog:** `Backend/app/domain/repositories/audit_repository.py` (self — add abstract method)

**Existing abstract method pattern** (lines 55-71):
```python
@abstractmethod
async def get_project_activity(
    self,
    project_id: int,
    types: Optional[List[str]] = None,
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 30,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    """D-46 / D-47: paginated, filtered activity feed for a project."""
    pass
```

**New abstract method to add (same signature minus project_id):**
```python
@abstractmethod
async def get_global_activity(
    self,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    """D-28: paginated global activity feed across all entities (no project_id filter).
    Returns (items, total) with user_name + user_avatar via LEFT JOIN on users.
    """
    pass
```

---

### `Backend/app/infrastructure/database/repositories/audit_repo.py` (service, CRUD, extend)

**Analog:** `Backend/app/infrastructure/database/repositories/audit_repo.py` (self — add implementation)

**Existing `get_project_activity` SQL pattern to copy from** (lines 103-181):
```python
async def get_project_activity(self, project_id: int, ...) -> Tuple[List[dict], int]:
    from app.infrastructure.database.models.user import UserModel

    conditions = [
        AuditLogModel.entity_type == "project",
        AuditLogModel.entity_id == project_id,   # ← this line is REMOVED in global variant
    ]
    # ... (types, user_id, date_from, date_to filters)

    count_stmt = select(sqlfunc.count(AuditLogModel.id)).where(*conditions)
    total = (await self.session.execute(count_stmt)).scalar() or 0

    items_stmt = (
        select(AuditLogModel.id, AuditLogModel.action, AuditLogModel.entity_type,
               AuditLogModel.entity_id, AuditLogModel.user_id,
               UserModel.full_name.label("user_name"), UserModel.avatar.label("user_avatar"),
               AuditLogModel.timestamp, AuditLogModel.extra_metadata)
        .select_from(AuditLogModel)
        .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
        .where(*conditions)
        .order_by(AuditLogModel.timestamp.desc())
        .limit(limit).offset(offset)
    )
    result = await self.session.execute(items_stmt)
    rows = result.mappings().all()
    items = [{ "id": row["id"], "action": row["action"], ... "metadata": row["extra_metadata"] }
             for row in rows]
    return items, total
```

**New implementation — copy `get_project_activity` but drop entity_type/entity_id conditions:**
```python
async def get_global_activity(self, limit: int = 20, offset: int = 0) -> Tuple[List[dict], int]:
    from app.infrastructure.database.models.user import UserModel

    # No conditions — queries ALL audit_log rows across all projects/entities
    count_stmt = select(sqlfunc.count(AuditLogModel.id))
    total = (await self.session.execute(count_stmt)).scalar() or 0

    items_stmt = (
        select(AuditLogModel.id, AuditLogModel.action, AuditLogModel.entity_type,
               AuditLogModel.entity_id, AuditLogModel.user_id,
               UserModel.full_name.label("user_name"), UserModel.avatar.label("user_avatar"),
               AuditLogModel.timestamp, AuditLogModel.extra_metadata)
        .select_from(AuditLogModel)
        .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
        .order_by(AuditLogModel.timestamp.desc())
        .limit(limit).offset(offset)
    )
    # ... (same row mapping as get_project_activity)
    return items, total
```

---

### `Backend/app/infrastructure/database/seeder.py` (utility, batch, extend)

**Analog:** `Backend/app/infrastructure/database/seeder.py` (self — extend)

**Existing project seeding pattern** (lines 42-75):
```python
PROJECTS_DATA = [
    {
        "name": "SPMS Geliştirme",
        "key": "SPMS",
        "description": "...",
        "methodology": Methodology.SCRUM,
        "manager_email": "ayse.oz@gazi.edu.tr",
        "labels": [...]
    },
    # ...
]
```

**D-36 additions — status field + process_template_id lookup:**
```python
# In PROJECTS_DATA entries, add:
{
    "name": "SPMS Geliştirme",
    "key": "SPMS",
    "description": "...",
    "methodology": Methodology.SCRUM,
    "status": "ACTIVE",             # D-36: varied statuses for filter testing
    "manager_email": "ayse.oz@gazi.edu.tr",
    "labels": [...]
},
# Include 2× ACTIVE, 1× COMPLETED, 1× ON_HOLD for SegmentedControl filter testing (D-36)
```

**process_template_id lookup pattern (D-36):**
```python
# Inside seed_projects(), look up templates after seeding:
from app.infrastructure.database.models.process_template import ProcessTemplateModel

result = await session.execute(select(ProcessTemplateModel))
templates_by_name = {t.name.lower(): t for t in result.scalars().all()}

# Map methodology to template:
METHODOLOGY_TO_TEMPLATE = {
    Methodology.SCRUM: "scrum",
    Methodology.KANBAN: "kanban",
    Methodology.WATERFALL: "waterfall",
}
project.process_template_id = templates_by_name.get(
    METHODOLOGY_TO_TEMPLATE.get(proj_data["methodology"], ""), None
)
```

**process_config base structure (D-36):**
```python
project.process_config = {
    "schema_version": 1,
    "workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []}
}
```

**Skip guard pattern** (analog lines 108-111):
```python
result = await session.execute(select(UserModel).limit(1))
if result.scalars().first():
    logger.info("SEEDER: Veritabanı zaten dolu, işlem atlanıyor.")
    return
```

---

## Shared Patterns

### `"use client"` Directive
**Source:** `Frontend2/context/app-context.tsx` line 1, `Frontend2/components/primitives/alert-banner.tsx` line 1
**Apply to:** All interactive components — every page and context file with `useState`, `useEffect`, `useRouter`, `useSearchParams`, `useQuery`, `useAuth`, `useApp`.
```typescript
"use client"
// Must be FIRST line of file, before all imports
```

### SSR-Safe localStorage Access
**Source:** `Frontend2/context/app-context.tsx` lines 69-86 (`load()` helper)
**Apply to:** `auth-context.tsx`, `api-client.ts` (token read in interceptor), session-expired page
```typescript
if (typeof window !== 'undefined') {
  // safe to access localStorage here
}
// OR for React effects:
React.useEffect(() => {
  // localStorage reads here are always client-side
}, [])
```

### `@/` Path Alias
**Source:** All existing Frontend2 files (e.g., `app-context.tsx` line 5: `import type { LangCode } from "@/lib/i18n"`)
**Apply to:** Every import in every Frontend2 file
```typescript
// Always use @/ alias — never relative paths like ../../lib/...
import { authService } from "@/services/auth-service"
import { useAuth } from "@/context/auth-context"
```

### Named Export Pattern
**Source:** `Frontend2/context/app-context.tsx` (`export function AppProvider`), `Frontend2/components/primitives/alert-banner.tsx` (`export function AlertBanner`)
**Apply to:** All Frontend2 components and providers
```typescript
// Named exports only — never default export for components/providers
export function ComponentName() { ... }
export function useComponentHook() { ... }
// Pages are the exception — Next.js requires default export for page.tsx files
export default function PageName() { ... }
```

### Inline CSS Token Vars Pattern
**Source:** `Frontend2/components/primitives/alert-banner.tsx` lines 47-64
**Apply to:** All new page/component files
```typescript
style={{ color: "var(--fg)", background: "var(--surface)", borderRadius: "var(--radius-sm)" }}
// color-mix expressions stay as inline style — NOT lowered to Tailwind arbitrary values
style={{ background: "color-mix(in oklch, var(--primary) 10%, var(--surface))" }}
```

### FastAPI Dependency Injection (Backend)
**Source:** `Backend/app/api/deps/audit.py` lines 14-15, `Backend/app/api/v1/activity.py` lines 31-32
**Apply to:** All new backend route handlers
```python
# DI pattern: inject via Depends()
async def route_handler(
    _user=Depends(get_current_user),
    audit_repo=Depends(get_audit_repo),
) -> ResponseDTO:
    use_case = UseCase(audit_repo)
    return await use_case.execute(...)
```

### Backend Use Case Pattern
**Source:** `Backend/app/application/use_cases/get_project_activity.py` lines 8-29
**Apply to:** New `GetGlobalActivityUseCase`
```python
class GetGlobalActivityUseCase:
    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo  # Injected interface — NEVER import sqlalchemy here

    async def execute(self, limit: int = 20, offset: int = 0) -> ActivityResponseDTO:
        items, total = await self.audit_repo.get_global_activity(limit=limit, offset=offset)
        return ActivityResponseDTO(
            items=[ActivityItemDTO.model_validate(i) for i in items],
            total=total,
        )
```

### Error Handling — useMutation onError Toast
**Source:** RESEARCH.md Pattern 7 (D-07)
**Apply to:** All mutation hooks (`useUpdateProjectStatus`, `useCreateProject`, `uploadAvatarMutation`, `changePasswordMutation`)
```typescript
useMutation({
  mutationFn: ...,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  onError: (error) => {
    // Toast — exact implementation is Claude's Discretion (minimal custom, no library)
    // showToast({ message: 'İşlem başarısız', variant: 'error' })
  },
})
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `Frontend2/middleware.ts` | middleware | request-response | No existing Next.js middleware in Frontend2 codebase. Pattern from Next.js docs (RESEARCH.md Pattern 3). |
| `Backend/app/application/use_cases/get_global_activity.py` | use case | request-response | New use case — no prior global (non-project-scoped) use case exists. Copy structure from `get_project_activity.py`. |

---

## Metadata

**Analog search scope:** `Frontend/`, `Frontend2/`, `Backend/app/api/`, `Backend/app/domain/`, `Backend/app/infrastructure/`, `New_Frontend/src/pages/`
**Files read:** 18
**Pattern extraction date:** 2026-04-21

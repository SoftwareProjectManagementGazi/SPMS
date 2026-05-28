"use client"
import * as React from "react"
import { authService, type AuthUser } from "@/services/auth-service"
import { AUTH_TOKEN_KEY } from "@/lib/constants"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  // Phase 15 D-1.7 — RBAC permissions[] decoded from JWT payload.permissions
  // claim. Empty array when the JWT lacks the claim (Pitfall 9 backwards-
  // compat for tokens minted before Plan 15-08 — combined with the
  // role.name === "Admin" short-circuit in hasPermission, existing Admins
  // keep access while the rest of the app degrades to "no permissions".)
  permissions: string[]
  /**
   * Phase 15 D-1.7 — Convenience guard for permission-gated UI. Returns true
   * when the active user has the given permission key OR is an Admin (D-1.5
   * super-role short-circuit). UI hides only — server-side
   * Depends(require_permission) is the authoritative defense (CONTEXT.md
   * cross-file rule line 417).
   */
  hasPermission: (key: string) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  // Update the cached user directly (e.g. after a profile/avatar save returns a
  // fresh AuthUser) so the navbar, profile header, and initials reflect the
  // change immediately instead of staying stale until a full reload.
  setUser: (user: AuthUser) => void
  // Re-fetch the current user from /auth/me and update the cache.
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/**
 * Phase 15 Plan 15-09 — Decode the `permissions` claim from a JWT payload.
 *
 * Pure base64url decode; NO signature verification client-side (per Phase 10
 * D-03 localStorage convention — backend re-verifies on every request).
 *
 * Pitfall 9 — backwards-compat:
 *   - null/undefined token  → []
 *   - JWT without claim     → []
 *   - claim is non-array    → []
 *   - claim is array but contains non-strings → filter to strings only
 *   - any decode failure    → [] (corrupt token, signature stripped, etc.)
 *
 * The empty-array fallback combined with the `role.name === "Admin"` short-
 * circuit in hasPermission means existing Admins (whose tokens predate Plan
 * 15-08) keep access without forcing a re-login.
 */
function decodePermissions(token: string | null): string[] {
  if (!token) return []
  try {
    const parts = token.split(".")
    if (parts.length < 2) return []
    // base64url → base64 padding compensation
    const b64 =
      parts[1].replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (parts[1].length % 4)) % 4)
    const payload = JSON.parse(atob(b64))
    const perms = payload.permissions
    return Array.isArray(perms)
      ? perms.filter((p: unknown): p is string => typeof p === "string")
      : []
  } catch {
    return []
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  // Phase 15 D-1.7 — permissions decoded from JWT claim.
  const [permissions, setPermissions] = React.useState<string[]>([])

  // SSR-safe init: localStorage only accessible on client
  React.useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_KEY) : null
    if (stored) {
      setToken(stored)
      // Phase 15 D-1.7 — hydrate permissions from JWT on page reload.
      setPermissions(decodePermissions(stored))
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => {
          // Stale token from a previous session — clear it so the next page
          // load doesn't fire a doomed /auth/me request.
          localStorage.removeItem(AUTH_TOKEN_KEY)
          document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const resp = await authService.login({ email, password })
    localStorage.setItem(AUTH_TOKEN_KEY, resp.access_token)
    // D-03: set lightweight presence cookie for Next.js middleware
    document.cookie = `auth_session=1; path=/; SameSite=Lax; max-age=28800` // 8 hours — must match ACCESS_TOKEN_EXPIRE_MINUTES
    setToken(resp.access_token)
    // Phase 15 D-1.7 — refresh permissions from new JWT.
    setPermissions(decodePermissions(resp.access_token))
    const me = await authService.getCurrentUser()
    setUser(me)
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    // D-03: clear presence cookie alongside localStorage
    document.cookie = `auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    // FL-01 fix (Phase 10 review): clear per-user transient state held in
    // sessionStorage so that on a shared device, User B logging in on the
    // same tab never inherits User A's in-flight wizard draft (name, key,
    // description, template selection). sessionStorage survives logout but
    // NOT tab close — so this must be wiped explicitly.
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("spms_wizard_draft")
    }
    setUser(null)
    setToken(null)
    // Phase 15 D-1.7 — clear permissions on logout so no stale claims leak
    // across user sessions on a shared device.
    setPermissions([])
  }, [])

  // Phase 15 D-1.7 — permission guard. Admin short-circuits to true (D-1.5
  // super-role); everyone else checks against the decoded JWT permissions[].
  // Case-insensitive role.name match guards against backend casing drift.
  const hasPermission = React.useCallback(
    (key: string) => {
      const roleName = user?.role?.name?.toLowerCase()
      if (roleName === "admin") return true
      return permissions.includes(key)
    },
    [user, permissions],
  )

  // Stable identity so consumers (e.g. settings mutations' onSuccess) can call
  // these without re-subscribing every render.
  const updateUser = React.useCallback((next: AuthUser) => setUser(next), [])
  const refreshUser = React.useCallback(async () => {
    const me = await authService.getCurrentUser()
    setUser(me)
  }, [])

  const value = React.useMemo(
    () => ({
      user,
      token,
      isLoading,
      permissions,
      hasPermission,
      login,
      logout,
      setUser: updateUser,
      refreshUser,
    }),
    [user, token, isLoading, permissions, hasPermission, login, logout, updateUser, refreshUser],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

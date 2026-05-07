"use client"
import * as React from "react"
import { authService, type AuthUser } from "@/services/auth-service"
import { AUTH_TOKEN_KEY } from "@/lib/constants"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // SSR-safe init: localStorage only accessible on client
  React.useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_KEY) : null
    if (stored) {
      setToken(stored)
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
  }, [])

  const value = React.useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

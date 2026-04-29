// Phase 15 Plan 15-09 — useHasPermission hook.
//
// Tiny composition over useAuth().hasPermission for callers that want a
// single boolean rather than the whole AuthContextType object. Returns false
// while auth is still hydrating (avoids UI flicker during page reload — the
// guarded UI stays hidden until permissions[] is decoded from the JWT in
// AuthContext mount-time useEffect).

"use client"

import { useAuth } from "@/context/auth-context"

export function useHasPermission(perm: string): boolean {
  const { hasPermission, isLoading } = useAuth()
  if (isLoading) return false
  return hasPermission(perm)
}

"use client"

// Phase 15 D-1.7 — UI hide guard for permission-gated children.
//
// Server-side `Depends(require_permission)` is the AUTHORITATIVE defense
// (CONTEXT.md cross-file rule line 417). This client guard is a UX hide
// only — DOM tampering bypasses it but the backend rejects the eventual API
// call (T-15-05 accept).
//
// Pattern: hook + early return (RESEARCH Open Question Q3 RESOLVED — React 19
// composition style; no HOC ceremony). Plan 15-11 (Roles tab CRUD) consumes
// this around action buttons; AvatarDropdown's admin-link gate stays put for
// now and migrates to <RequirePermission perm="admin.access"/> in Plan 15-11
// (D-2.11).

import * as React from "react"

import { useAuth } from "@/context/auth-context"

interface RequirePermissionProps {
  perm: string
  children: React.ReactNode
  /**
   * Rendered when the user lacks the perm. Default `null` hides the children
   * entirely. Pass a `<Tooltip>...</Tooltip>` or a disabled-style variant if
   * the surface needs an empty-state placeholder.
   */
  fallback?: React.ReactNode
}

export function RequirePermission({
  perm,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { hasPermission, isLoading } = useAuth()
  // Render nothing while auth is hydrating so a momentary "no permissions"
  // window (mount → JWT decoded) doesn't flash a fallback the user shouldn't
  // see anyway.
  if (isLoading) return null
  return hasPermission(perm) ? <>{children}</> : <>{fallback}</>
}

"use client"

// Phase 15 Plan 15-10 — PermissionScopeBadge (D-3.4 — 2-tier check
// transparency). Renders inline next to a permission key in the matrix grid
// to communicate whether the perm gates a system-level (e.g. admin.users.*)
// or project-level (e.g. task.create) action.
//
// Why a separate component (not a `<Badge>` inline at every PermissionRow
// callsite): the i18n + scope→label mapping logic stays in one place; the
// PATTERNS §16 spec calls out a dedicated primitive consumer.
//
// Visual choice: tone="neutral" + size="xs" — the scope context is informative
// (not warning, not success). Verbatim Badge primitive — no styling overrides.

import { Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

export interface PermissionScopeBadgeProps {
  scope: "system" | "project"
}

export function PermissionScopeBadge({ scope }: PermissionScopeBadgeProps) {
  const { language } = useApp()
  const label =
    scope === "system"
      ? adminRbacT("admin.permissions.scope_system", language)
      : adminRbacT("admin.permissions.scope_project", language)
  return (
    <Badge tone="neutral" size="xs">
      {label}
    </Badge>
  )
}

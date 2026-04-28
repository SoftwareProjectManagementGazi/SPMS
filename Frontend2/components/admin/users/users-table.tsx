"use client"

// Phase 14 Plan 14-03 — Users tab table.
//
// Verbatim grid template per UI-SPEC §Spacing line 84 + prototype admin.jsx
// line 170:
//   28px 40px 2fr 2fr 130px 1fr 100px 90px 28px
//
// Header row uses uppercase 11px label typography (UI-SPEC §Typography).
// Each body row maps to <UserRow/>. Pagination caption + page indicator at
// bottom (UI-SPEC §Surface C lines 354-356).

import * as React from "react"

import { Card, DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
import type { AdminUserListFilter } from "@/services/admin-user-service"
// Plan 14-18 (Cluster F UAT Test 34) — viewport overflow shell.
import { AdminTableShell } from "@/lib/admin/admin-table-shell"

import { UserRow, ROW_GRID_TEMPLATE, type UserRowUser } from "./user-row"

export interface UsersTableProps {
  filter: AdminUserListFilter
  selectedIds: number[]
  onToggleSelect: (userId: number) => void
  onToggleSelectAll: (allIds: number[]) => void
}

interface UserApiShape {
  id: number
  full_name?: string
  email?: string
  is_active?: boolean
  role?: { name?: string } | string | null
  last_active?: string | null
  projects_count?: number
  username?: string  // legacy /auth/users shape — full_name surrogate
}

function normalizeUser(u: UserApiShape): UserRowUser {
  return {
    id: u.id,
    full_name: u.full_name ?? u.username ?? "",
    email: u.email,
    is_active: u.is_active,
    role: u.role,
    last_active: u.last_active,
    projects_count: u.projects_count,
  }
}

export function UsersTable({
  filter,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: UsersTableProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const q = useAdminUsers(filter)

  // Tolerate both response shapes: array (legacy /auth/users) AND
  // {items, total} paged shape (richer /admin/users from this plan).
  const items: UserApiShape[] = React.useMemo(() => {
    const data = q.data as unknown
    if (Array.isArray(data)) return data as UserApiShape[]
    if (data && typeof data === "object" && Array.isArray((data as any).items)) {
      return (data as { items: UserApiShape[] }).items
    }
    return []
  }, [q.data])

  const total =
    (q.data as { total?: number } | undefined)?.total ?? items.length

  const normalized = React.useMemo(() => items.map(normalizeUser), [items])
  const isEmpty =
    !q.isLoading && !q.error && (Array.isArray(items) ? items.length === 0 : true)

  // Header checkbox state — checked when ALL visible items are in selectedIds.
  const allIds = normalized.map((u) => u.id)
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))

  const empty_no_match = adminUsersT("admin.users.empty_no_match", lang)
  const empty_no_users = adminUsersT("admin.users.empty_no_users", lang)
  const emptyCopy = (filter.q?.trim() || filter.role) ? empty_no_match : empty_no_users

  return (
    // Plan 14-18 — AdminTableShell wraps the Card so narrow viewports get
    // a horizontal scrollbar instead of overlapping cells.
    // Users table grid total ≈ 1180px (8 columns + checkbox cell).
    <AdminTableShell minWidth={1180}>
      <Card padding={0}>
        {/* Header row (table column labels) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: ROW_GRID_TEMPLATE,
            padding: "10px 16px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            color: "var(--fg-subtle)",
            fontWeight: 600,
            borderBottom: "1px solid var(--border)",
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleSelectAll(allIds)}
            aria-label="Select all"
          />
          <div />
          <div>{adminUsersT("admin.users.table_col_name", lang)}</div>
          <div>{adminUsersT("admin.users.table_col_email", lang)}</div>
          <div>{adminUsersT("admin.users.table_col_role", lang)}</div>
          <div>{adminUsersT("admin.users.table_col_projects", lang)}</div>
          <div>{adminUsersT("admin.users.table_col_last_seen", lang)}</div>
          <div>{adminUsersT("admin.users.table_col_status", lang)}</div>
          <div />
        </div>

        {/* Body — DataState fallback + row list */}
        <DataState
          loading={q.isLoading}
          error={q.error}
          empty={isEmpty}
          emptyFallback={
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                fontSize: 12.5,
                color: "var(--fg-subtle)",
              }}
            >
              {emptyCopy}
            </div>
          }
        >
          <div>
            {normalized.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                selected={selectedIds.includes(u.id)}
                isLast={i === normalized.length - 1}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </DataState>

        {/* Pagination footer */}
        <div
          style={{
            padding: "10px 16px",
            fontSize: 11.5,
            color: "var(--fg-muted)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {adminUsersT("admin.users.pagination_caption", lang).replace(
              "{N}",
              String(total),
            )}
          </div>
          <div className="mono">
            {adminUsersT("admin.users.pagination_page", lang)
              .replace("{P}", "1")
              .replace("{M}", "1")}
          </div>
        </div>
      </Card>
    </AdminTableShell>
  )
}

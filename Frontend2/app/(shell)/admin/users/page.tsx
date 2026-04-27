"use client"

// Phase 14 Plan 14-03 — /admin/users (Kullanıcılar) sub-route page.
//
// Composes the Users tab end-to-end:
//   1. <UsersToolbar/>     — search + role filter + CSV/Bulk-Invite/Add-User
//   2. <UserBulkBar/>      — appears when selectedIds.length > 0
//   3. <UsersTable/>       — verbatim 9-col grid
//   4. <AddUserModal/>     — single email-invite (Task 2)
//   5. <BulkInviteModal/>  — CSV preview + 500-row cap + summary (Task 2)
//
// Filter state persisted to localStorage key `spms.admin.users.filter` per
// Phase 11 D-21 + CONTEXT D-C5. Modal state lives in component state (not
// URL — modals are ephemeral).

import * as React from "react"

import { useLocalStoragePref } from "@/hooks/use-local-storage-pref"
import type { AdminUserListFilter } from "@/services/admin-user-service"

import { UsersToolbar } from "@/components/admin/users/users-toolbar"
import { UsersTable } from "@/components/admin/users/users-table"
import { UserBulkBar, type UserBulkBarUser } from "@/components/admin/users/user-bulk-bar"
import { AddUserModal } from "@/components/admin/users/add-user-modal"
import { BulkInviteModal } from "@/components/admin/users/bulk-invite-modal"
import { useAdminUsers } from "@/hooks/use-admin-users"

const FILTER_STORAGE_KEY = "admin.users.filter"

const DEFAULT_FILTER: AdminUserListFilter = {
  q: "",
  role: undefined,
  status: undefined,
}

type ModalState = "add" | "bulk-invite" | null

interface UserApiShape {
  id: number
  full_name?: string
  email?: string
  username?: string
}

export default function AdminUsersPage() {
  // Filter state — persisted to localStorage so the user's role filter
  // survives tab switches. The `spms.` prefix is added by useLocalStoragePref.
  const [filter, setFilter] = useLocalStoragePref<AdminUserListFilter>(
    FILTER_STORAGE_KEY,
    DEFAULT_FILTER,
  )

  // Bulk selection state — ids of currently checked rows.
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])

  // Modal state.
  const [modal, setModal] = React.useState<ModalState>(null)

  // Read users for the bulk-bar's name preview (first 5 names in confirm).
  // Re-using the same query key keeps the cache hit; no extra fetch.
  const usersQ = useAdminUsers(filter)

  const userIndex = React.useMemo(() => {
    const data = usersQ.data as unknown
    const items: UserApiShape[] = Array.isArray(data)
      ? (data as UserApiShape[])
      : (data as { items?: UserApiShape[] } | undefined)?.items ?? []
    const map = new Map<number, UserBulkBarUser>()
    for (const u of items) {
      map.set(u.id, {
        id: u.id,
        full_name: u.full_name ?? u.username ?? "",
        email: u.email,
      })
    }
    return map
  }, [usersQ.data])

  // ---- Selection handlers ----
  const handleToggleSelect = React.useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const handleToggleSelectAll = React.useCallback((allIds: number[]) => {
    setSelectedIds((prev) => {
      const allSelected =
        allIds.length > 0 && allIds.every((id) => prev.includes(id))
      return allSelected ? [] : allIds
    })
  }, [])

  const handleClearSelection = React.useCallback(() => {
    setSelectedIds([])
  }, [])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <UsersToolbar
        filter={filter}
        onFilterChange={setFilter}
        onOpenAddUser={() => setModal("add")}
        onOpenBulkInvite={() => setModal("bulk-invite")}
      />

      <UserBulkBar
        selectedIds={selectedIds}
        userIndex={userIndex}
        onClear={handleClearSelection}
      />

      <UsersTable
        filter={filter}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
      />

      <AddUserModal
        open={modal === "add"}
        onClose={() => setModal(null)}
      />
      <BulkInviteModal
        open={modal === "bulk-invite"}
        onClose={() => setModal(null)}
      />
    </div>
  )
}

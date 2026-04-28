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
//
// Plan 14-17 (Cluster E gap closure) — `?role=` URL param parser added so
// the cross-tab navigation from /admin/roles → "Görüntüle" → /admin/users
// actually pre-applies the role filter (D-W1 cross-tab data consistency).
//
// Behavior contract:
//   - With ?role=<id> → URL value WINS over localStorage AND writes through
//     to localStorage so subsequent visits without ?role= retain the filter.
//   - Without ?role= → existing Plan 14-03 behavior preserved (localStorage-
//     restored filter or DEFAULT_FILTER fallback). NO regression.
//
// URL param scheme: the role-card emits SHORT identifiers ("admin" / "pm" /
// "member" / "guest") as href query params; this page maps them to the
// canonical role enum strings ("Admin" / "Project Manager" / "Member") that
// useAdminUsers + the SegmentedControl expect. The SegmentedControl is
// already controlled (UsersToolbar renders `value={filter.role ?? "all"}`),
// so a parent setFilter() update propagates to the visible selection
// without further refactoring.

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { useLocalStoragePref } from "@/hooks/use-local-storage-pref"
import type {
  AdminRole,
  AdminUserListFilter,
} from "@/services/admin-user-service"

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

/**
 * Plan 14-17 — map the short URL identifier emitted by /admin/roles
 * (RoleCard's `id` field) to the canonical AdminRole enum string used by
 * the backend filter + the SegmentedControl options.
 *
 * The mapping is INTENTIONALLY case-tolerant on the URL side (admins
 * sometimes hand-edit query strings) but the OUTPUT is ALWAYS the canonical
 * casing the backend expects.
 *
 * Returns `undefined` for unrecognized values (treats malformed URL as
 * "no role filter" rather than throwing) — graceful degradation per the
 * v2.0 robustness norm.
 */
function urlRoleToAdminRole(raw: string | null): AdminRole | undefined {
  if (!raw) return undefined
  const norm = raw.toLowerCase().trim()
  switch (norm) {
    case "admin":
      return "Admin"
    case "pm":
    case "project manager":
    case "project_manager":
      return "Project Manager"
    case "member":
      return "Member"
    // "guest" intentionally returns undefined — there is no Guest role in
    // the v2.0 enum (D-A5). Filtering by guest would always return empty;
    // falling through to "no filter" is the friendlier UX.
    default:
      return undefined
  }
}

export default function AdminUsersPage() {
  // Plan 14-17 — read ?role=<id> URL param. Returns null if the param is
  // absent. We resolve the canonical AdminRole at render time (not in a
  // memo dep) so that a new URL after navigation triggers the effect below
  // without race conditions.
  const searchParams = useSearchParams()
  const roleFromUrlRaw = searchParams.get("role")
  const roleFromUrl = urlRoleToAdminRole(roleFromUrlRaw)

  // Plan 14-17 — seed the localStorage hook's default with the URL value
  // when present. On first render this seeds BOTH the visible filter AND
  // the localStorage write (write-through is guaranteed by the effect
  // below, which fires on roleFromUrl changes — including this very first
  // mount).
  const seededDefault: AdminUserListFilter = React.useMemo(() => {
    if (roleFromUrl !== undefined) {
      return { ...DEFAULT_FILTER, role: roleFromUrl }
    }
    return DEFAULT_FILTER
    // Intentionally only depend on roleFromUrl — DEFAULT_FILTER is a module-
    // level constant and never changes.
  }, [roleFromUrl])

  // Filter state — persisted to localStorage so the user's role filter
  // survives tab switches. The `spms.` prefix is added by useLocalStoragePref.
  const [filter, setFilter] = useLocalStoragePref<AdminUserListFilter>(
    FILTER_STORAGE_KEY,
    seededDefault,
  )

  // Plan 14-17 — write-through effect for cross-tab navigation. When
  // ?role= changes (including the post-mount re-render that hydrates
  // localStorage from disk), force the filter to the URL value AND let
  // useLocalStoragePref's effect persist it. This gives us:
  //
  //   1. URL param ALWAYS wins over a stale localStorage value (Case 3).
  //   2. After this navigation, returning to /admin/users WITHOUT ?role=
  //      still shows the URL-driven filter (write-through to localStorage).
  //
  // We intentionally exclude `filter` from deps — including it would
  // overwrite manual user changes back to the URL value on every render.
  React.useEffect(() => {
    if (roleFromUrl !== undefined) {
      setFilter((prev) =>
        prev.role === roleFromUrl ? prev : { ...prev, role: roleFromUrl },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFromUrl])

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

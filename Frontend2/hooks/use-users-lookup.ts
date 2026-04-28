// Phase 14 Plan 14-18 (Cluster F UAT Test 27) — useUsersLookup hook.
//
// Returns a memoized {[id]: UserShape} map for resolving numeric user ids
// to human-readable labels (full_name → email → fallback). Consumed by
// AuditFilterChips so the Aktör chip shows "Aktör: Yusuf Bayrakcı" instead
// of "Aktör: 2".
//
// Implementation: shares the cache slot with the existing /admin/users
// list endpoint (admin-user-service.list with no filter) by using the
// same query key shape as useAdminUsers. This means navigating between
// the Users tab and the Audit tab does NOT double-fetch — both consumers
// land in the same TanStack cache row. Stale time matches useAdminUsers
// (30s) so the data refreshes at a sane cadence.
//
// Plan 14-18 N-4 — uses the v5 placeholderData: keepPreviousData syntax
// (verified at hooks/use-admin-users.ts in the same plan).

import * as React from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"

import { adminUserService } from "@/services/admin-user-service"

export interface UserLookupShape {
  id: number
  full_name?: string
  email?: string
}

interface UserApiShape {
  id: number
  full_name?: string
  email?: string
  username?: string
}

const EMPTY: Record<number, UserLookupShape> = {}

/**
 * Fetch the unfiltered admin users list and reduce it to {[id]: user}.
 *
 * Returns:
 *  - usersById: the resolved map (empty when isLoading/error).
 *  - isLoading: TanStack flag for callers that want a spinner.
 *  - error:     TanStack error for callers that want to surface a toast.
 */
export function useUsersLookup() {
  // Same query-key shape as useAdminUsers with an empty filter, so the two
  // hooks share a single cache row.
  const q = useQuery({
    queryKey: ["admin", "users", {}],
    queryFn: () => adminUserService.list({}),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })

  const usersById = React.useMemo<Record<number, UserLookupShape>>(() => {
    const data = q.data as unknown
    let items: UserApiShape[] = []
    if (Array.isArray(data)) {
      items = data as UserApiShape[]
    } else if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { items?: UserApiShape[] }).items)
    ) {
      items = (data as { items: UserApiShape[] }).items
    } else {
      return EMPTY
    }
    const map: Record<number, UserLookupShape> = {}
    for (const u of items) {
      map[u.id] = {
        id: u.id,
        full_name: u.full_name ?? u.username ?? "",
        email: u.email,
      }
    }
    return map
  }, [q.data])

  return {
    usersById,
    isLoading: q.isLoading,
    error: q.error,
  }
}

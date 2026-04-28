// Phase 14 Plan 14-01 — useAdminUsers hook (D-W1).
//
// Filter encoded into queryKey so toggling role/status/q maintains independent
// cache slots. Plan 14-03 will fully wire the list endpoint; this hook ships
// in Wave 0 with the right key shape and staleTime contract.
//
// Plan 14-18 (Cluster F UAT Test 12 side-finding, N-4) — adds
// `placeholderData: keepPreviousData` so the table doesn't visibly thrash
// while the user types in the search input. Without it, every debounced
// `q` change replaces `data` with `undefined` while the next fetch is in
// flight and the table flips to a loading skeleton, then back to data —
// looks like the table is "thrashing" on every keystroke.
//
// VERSION VERIFIED via Plan 14-18 N-4 pre-flight (recorded in
// 14-18-SUMMARY.md):
//   - Frontend2/package.json:    "@tanstack/react-query": "^5.99.2"
//   - Frontend2/node_modules/@tanstack/react-query/package.json: 5.99.2
//   → v5 syntax: `placeholderData: keepPreviousData` (NAMED IMPORT).
//   The v4 syntax (`keepPreviousData: true` as a top-level useQuery option)
//   was DROPPED in v5 — using it on v5 would silently no-op.

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  adminUserService,
  type AdminUserListFilter,
} from "@/services/admin-user-service"

export function useAdminUsers(filter: AdminUserListFilter = {}) {
  return useQuery({
    queryKey: ["admin", "users", filter],
    queryFn: () => adminUserService.list(filter),
    staleTime: 30 * 1000,
    // Plan 14-18 N-4 — v5 syntax. Keeps the previous results visible while
    // the new query refetches so the table doesn't thrash on debounced
    // search input changes.
    placeholderData: keepPreviousData,
  })
}

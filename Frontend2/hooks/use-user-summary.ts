// Phase 13 Plan 13-01 Task 2 — useUserSummary hook.
//
// Caches the per-user 3-StatCard payload + project list + recent activity
// shipped by GET /users/{id}/summary. staleTime=30s keeps the profile page
// responsive on tab switches without re-fetching on every focus event
// (Phase 9 D-48 endpoint already does asyncio.gather of 3 sub-queries).

import { useQuery } from "@tanstack/react-query"
import { profileService, type UserSummary } from "@/services/profile-service"

export function useUserSummary(userId: number | null | undefined) {
  return useQuery<UserSummary>({
    queryKey: ["user-summary", userId],
    queryFn: () => profileService.getUserSummary(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

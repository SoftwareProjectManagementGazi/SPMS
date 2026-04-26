// Phase 13 Plan 13-01 Task 2 — useUserActivity hook (D-X4).
//
// Privacy-correct activity feed for the profile Activity tab (Plan 13-06).
// Backend filter is by VIEWER's project memberships, not target's, so the
// caller does not need to forward viewer info — JWT covers it.
//
// refetchOnWindowFocus per CONTEXT D-B3.

import { useQuery } from "@tanstack/react-query"
import {
  activityService,
  type ActivityResponse,
  type ActivityFilter,
} from "@/services/activity-service"

export function useUserActivity(
  userId: number | null | undefined,
  filter: ActivityFilter = {},
) {
  return useQuery<ActivityResponse>({
    queryKey: ["activity", "user", userId, filter],
    queryFn: () => activityService.getUserActivity(userId!, filter),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  })
}

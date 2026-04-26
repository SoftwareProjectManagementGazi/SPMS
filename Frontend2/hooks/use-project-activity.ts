// Phase 13 Plan 13-01 Task 2 — useProjectActivity hook.
//
// Project-scoped activity feed for the ProjectDetail Activity tab (Plan 13-04).
// Backend SQL was BROADENED in this plan to UNION over task events
// (RESEARCH §Pitfall 2 / D-13-01), so this hook now returns the full
// project-wide activity stream including task created / updated / deleted.
//
// refetchOnWindowFocus per CONTEXT D-B3.

import { useQuery } from "@tanstack/react-query"
import {
  activityService,
  type ActivityResponse,
  type ActivityFilter,
} from "@/services/activity-service"

export function useProjectActivity(
  projectId: number | null | undefined,
  filter: ActivityFilter = {},
) {
  return useQuery<ActivityResponse>({
    queryKey: ["activity", "project", projectId, filter],
    queryFn: () => activityService.getProjectActivity(projectId!, filter),
    enabled: !!projectId,
    refetchOnWindowFocus: true,
  })
}

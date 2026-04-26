"use client"

// Phase 13 Plan 13-04 — REPLACES the Phase 11 placeholder. Mounts the
// canonical vertical-timeline ActivityTab with projectId scoping.
//
// The stub file kept its name so existing project-detail-shell.tsx imports
// still resolve. Future cleanup may rename this re-export to
// `activity-tab-mount.tsx` if a wider refactor lands.

import { ActivityTab } from "@/components/activity/activity-tab"

export interface ActivityStubTabProps {
  projectId: number
}

export function ActivityStubTab({ projectId }: ActivityStubTabProps) {
  return <ActivityTab projectId={projectId} variant="full" />
}

"use client"

// Phase 13 Plan 13-04 Task 2 — canonical ActivityTab.
//
// Discriminated union (D-B4): one component handles BOTH the project tab
// (Plan 13-04 — projectId prop) and the user-profile tab (Plan 13-06 —
// userId prop). TypeScript enforces mutual exclusion at the call site.
//
// The component composes:
//   - useProjectActivity / useUserActivity (Plan 13-01) — picks based on prop
//   - useLocalStoragePref (existing) — D-B7 filter persistence
//   - mapAuditToSemantic + semanticToFilterChip (Plan 13-01) — chip filtering
//   - groupByDate + formatActivityDate (Plan 13-01 / this plan) — date buckets
//   - DataState (Plan 13-01 primitive) — loading / error / empty switch
//   - ActivityFilter / ActivityRow / ActivityEmpty / ActivityTimelineSkeleton
//
// Server-side fetch contract (D-B2 with 200-cap acceptance):
//   The backend is hit ONCE with limit=200 (the existing Phase 9 D-46 hard
//   cap). Client-side `showCount` slices in 30-row increments matching the
//   prototype "Daha fazla yükle" UX. Documented as v2.1 candidate in
//   13-CONTEXT deferred — rewire to offset-paginated network calls.
//
// Filter persistence key:
//   useLocalStoragePref auto-prefixes "spms." so passing "activity.filter.42"
//   stores under "spms.activity.filter.42" (matches D-B7 contract).
//
// refetchOnWindowFocus is set inside the hooks (Plan 13-01) — D-B3 honored
// at the data layer, not here.

import * as React from "react"

import { Card, DataState, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useLocalStoragePref } from "@/hooks/use-local-storage-pref"
import { useProjectActivity } from "@/hooks/use-project-activity"
import { useUserActivity } from "@/hooks/use-user-activity"
import {
  mapAuditToSemantic,
  semanticToFilterChip,
} from "@/lib/audit-event-mapper"
import { groupByDate } from "@/lib/activity/group-by-date"

import { ActivityRow } from "./activity-row"
import { ActivityFilter, type ActivityFilterValue } from "./activity-filter"
import { ActivityEmpty } from "./activity-empty"
import { ActivityTimelineSkeleton } from "./activity-skeleton"

export type ActivityTabProps =
  | { projectId: number; userId?: never; variant?: "full" | "compact" }
  | { projectId?: never; userId: number; variant?: "full" | "compact" }

const DEFAULT_FILTER: ActivityFilterValue = {
  type: "all",
  userIdFilter: null,
  showCount: 30,
}

const SHOW_COUNT_STEP = 30

// Backend hard cap (Phase 9 D-46). 200 events fetched once; client slices.
const SERVER_FETCH_LIMIT = 200

export function ActivityTab(props: ActivityTabProps) {
  // variant is reserved for the future compact placement (D-B8). v2.0 ships
  // the full timeline only — keep the prop in the signature so callers can
  // typecheck their intent without a follow-up DTO change later.
  void (props.variant ?? "full")

  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // localStorage key per project / per user (D-B7).
  const storageKey = props.projectId
    ? `activity.filter.${props.projectId}`
    : `activity.filter.user.${props.userId}`
  const [filter, setFilter] = useLocalStoragePref<ActivityFilterValue>(
    storageKey,
    DEFAULT_FILTER,
  )

  // Server-side request shape — single fetch up to the 200-cap. Client-side
  // chip + actor filters apply locally so chip toggles don't trigger refetch.
  const serverFilter = React.useMemo(
    () => ({ limit: SERVER_FETCH_LIMIT, offset: 0 }),
    [],
  )

  // Discriminated routing — call BOTH hooks (only one is enabled by id).
  const projectQuery = useProjectActivity(props.projectId, serverFilter)
  const userQuery = useUserActivity(props.userId, serverFilter)
  const query = props.projectId ? projectQuery : userQuery

  const allEvents = query.data?.items ?? []

  // Client-side filtering: chip + actor filter. Uses the same mapper that
  // ActivityRow uses, so both render path and filter path stay in sync.
  const filteredEvents = React.useMemo(() => {
    return allEvents.filter((ev) => {
      const semantic = mapAuditToSemantic(ev)
      if (!semantic) return false
      if (filter.type !== "all") {
        const chip = semanticToFilterChip(semantic)
        if (chip !== filter.type) return false
      }
      if (filter.userIdFilter != null && ev.user_id !== filter.userIdFilter) {
        return false
      }
      return true
    })
  }, [allEvents, filter.type, filter.userIdFilter])

  // Slice to the visible page; "Daha fazla yükle" extends showCount in
  // SHOW_COUNT_STEP increments (D-B2).
  const visible = filteredEvents.slice(0, filter.showCount)

  const grouped = React.useMemo(
    () => groupByDate(visible, language),
    [visible, language],
  )

  const isFiltered =
    filter.type !== "all" || filter.userIdFilter != null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ActivityFilter
        filter={filter}
        setFilter={setFilter}
        events={allEvents}
        totalCount={filteredEvents.length}
      />
      <Card padding={0}>
        <div
          className="activity-timeline"
          style={{ position: "relative", paddingLeft: 32 }}
        >
          <div
            className="activity-timeline-line"
            aria-hidden
            style={{
              position: "absolute",
              left: 19,
              top: 20,
              bottom: 20,
              width: 2,
              background: "var(--border)",
            }}
          />
          <DataState
            loading={query.isLoading}
            loadingFallback={<ActivityTimelineSkeleton />}
            error={query.error}
            empty={visible.length === 0}
            emptyFallback={<ActivityEmpty filtered={isFiltered} />}
          >
            {grouped.map((group) => (
              <div key={group.label}>
                <div
                  style={{
                    padding: "14px 16px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--fg-subtle)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {group.label}
                </div>
                {group.events.map((ev) => (
                  <ActivityRow
                    key={ev.id}
                    event={ev}
                    projectId={props.projectId}
                  />
                ))}
              </div>
            ))}
            {filteredEvents.length > filter.showCount && (
              <div style={{ padding: 16, textAlign: "center" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilter({
                      ...filter,
                      showCount: filter.showCount + SHOW_COUNT_STEP,
                    })
                  }
                >
                  {T("Daha fazla yükle", "Load more")}
                </Button>
              </div>
            )}
          </DataState>
        </div>
      </Card>
    </div>
  )
}

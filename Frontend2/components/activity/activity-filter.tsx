"use client"

// Phase 13 Plan 13-04 Task 1 — ActivityFilter (UI-SPEC §C.1 filter-bar row).
//
// Composition (verbatim from prototype activity-tab.jsx lines 102–120):
//   [ SegmentedControl 6 chips ] [ vertical separator ] [ user-avatar row ]
//   [ flex-1 spacer ] [ "{N} olay" mono caption ]
//
// SegmentedControl options match D-B1's six chips (Tümü / Oluşturma / Durum /
// Atama / Yorum / Yaşam Döngüsü). The lifecycle chip aggregates the 5 lifecycle
// SemanticEventType values (phase_transition + 4 lifecycle entities) per
// `semanticToFilterChip` from `audit-event-mapper.ts`.
//
// User-avatar row derives unique actors from the *unfiltered* events stream so
// switching between chips never hides actors that exist in the dataset (the
// prototype has the same behavior — `actors` is computed from `allEvents`).
//
// Active actor avatar gets `ring={true}` (Avatar primitive) per UI-SPEC §C.4.
// Click toggles selection; clicking the active one clears it (matches prototype
// line 113).

import * as React from "react"

import { SegmentedControl, Avatar } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { getInitials } from "@/lib/initials"
import type { ActivityItem } from "@/services/activity-service"

export interface ActivityFilterValue {
  /** SegmentedControl selection — matches the 6 chip ids. */
  type: "all" | "create" | "status" | "assign" | "comment" | "lifecycle"
  /** Per-actor filter (null = no actor filter applied). */
  userIdFilter: number | null
  /** Pagination accumulator for the "Daha fazla yükle" UX (D-B2). */
  showCount: number
}

export interface ActivityFilterProps {
  filter: ActivityFilterValue
  setFilter: (next: ActivityFilterValue) => void
  /**
   * Source of truth for the unique-actors avatar row. Pass the FULL
   * (pre-filter) events list so the actor list does not collapse when a chip
   * filter hides matching events.
   */
  events: ActivityItem[]
  /** Count caption — "{N} olay" / "{N} events". */
  totalCount: number
}

interface Actor {
  id: number
  name: string
  initials: string
  avColor: number
}

export function ActivityFilter({
  filter,
  setFilter,
  events,
  totalCount,
}: ActivityFilterProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // Unique actors (preserves first-seen order). avColor seeds 1..8 from the
  // numeric id; this matches the dashboard ActivityFeed convention so the same
  // user gets the same avatar background across surfaces.
  const actors = React.useMemo<Actor[]>(() => {
    const seen = new Map<number, Actor>()
    for (const ev of events) {
      if (ev.user_id == null || !ev.user_name) continue
      if (seen.has(ev.user_id)) continue
      seen.set(ev.user_id, {
        id: ev.user_id,
        name: ev.user_name,
        initials: getInitials(ev.user_name),
        avColor: (ev.user_id % 8) + 1,
      })
    }
    return Array.from(seen.values())
  }, [events])

  const options = React.useMemo(
    () => [
      { id: "all", label: T("Tümü", "All") },
      { id: "create", label: T("Oluşturma", "Created") },
      { id: "status", label: T("Durum", "Status") },
      { id: "assign", label: T("Atama", "Assign") },
      { id: "comment", label: T("Yorum", "Comment") },
      { id: "lifecycle", label: T("Yaşam Döngüsü", "Lifecycle") },
    ],
    [language], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <SegmentedControl
        size="sm"
        options={options}
        value={filter.type}
        onChange={(v) =>
          setFilter({
            ...filter,
            type: v as ActivityFilterValue["type"],
          })
        }
      />

      {/* Vertical separator (UI-SPEC §C.1 — 1×20 var(--border)). */}
      <div
        style={{ width: 1, height: 20, background: "var(--border)" }}
        aria-hidden
      />

      {/* User-avatar filter row. Buttons are unstyled wrappers so the Avatar
          primitive provides the entire visual (ring=true when active). */}
      <div style={{ display: "flex", gap: 4 }}>
        {actors.map((a) => {
          const active = filter.userIdFilter === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() =>
                setFilter({
                  ...filter,
                  userIdFilter: active ? null : a.id,
                })
              }
              aria-label={a.name}
              aria-pressed={active}
              title={a.name}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                borderRadius: "50%",
                lineHeight: 0,
              }}
            >
              <Avatar
                user={{ initials: a.initials, avColor: a.avColor }}
                size={24}
                ring={active}
              />
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--fg-muted)" }}
      >
        {totalCount} {T("olay", "events")}
      </span>
    </div>
  )
}

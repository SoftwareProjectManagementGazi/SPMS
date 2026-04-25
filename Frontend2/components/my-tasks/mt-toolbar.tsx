"use client"

// MTToolbar — the full-feature toolbar at the top of the MyTasksExperience
// list (replaces the older TaskFilterBar).
//
// Ported from `New_Frontend/src/pages/my-tasks.jsx` lines 388-497. The toolbar
// has TWO rows:
//
//   Row 1 (saved-views, hidden in `compact`):
//     6 button-pills (Today / Overdue / Upcoming / Starred / All / Completed)
//     each with an icon + accent count badge.
//
//   Row 2 (filters, always visible):
//     Search input · Group-by icon-button group (inset pill) · vertical divider ·
//     4 priority chips (Critical/High/Med/Low — toggleable) · spacer ·
//     Sort dropdown · Density 3-button toggle.
//
// Why a custom button-group instead of SegmentedControl primitive: the
// prototype's group-by control behaves differently in `compact` mode — it
// hides labels and shows ICON ONLY. SegmentedControl always renders labels
// alongside icons, so a custom inset-pill is the only way to achieve the
// prototype's compact look without forking the primitive.

import * as React from "react"
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  CheckSquare,
  CircleCheck,
  Flame,
  Folder,
  List,
  Search,
  Star,
} from "lucide-react"

import { Input, PriorityChip } from "@/components/primitives"
import type { LangCode } from "@/lib/i18n"
import type { Task } from "@/services/task-service"

import { MTDensityIcon, type MTDensityKind } from "./mt-density-icon"
import { MTPicker } from "./mt-picker"
import type { ViewId } from "@/lib/my-tasks/types"

export type GroupBy = "due" | "project" | "status" | "priority" | "none"
export type SortKey = "smart" | "due" | "priority" | "newest"
export type Priority = Task["priority"]

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"]

interface ViewMeta {
  id: ViewId
  icon: React.ReactNode
  labelTr: string
  labelEn: string
}

const VIEW_META: ViewMeta[] = [
  { id: "today", icon: <Flame size={13} />, labelTr: "Bugün", labelEn: "Today" },
  {
    id: "overdue",
    icon: <AlertTriangle size={13} />,
    labelTr: "Gecikmiş",
    labelEn: "Overdue",
  },
  {
    id: "upcoming",
    icon: <Calendar size={13} />,
    labelTr: "Yaklaşan",
    labelEn: "Upcoming",
  },
  {
    id: "starred",
    icon: <Star size={13} />,
    labelTr: "Yıldızlı",
    labelEn: "Starred",
  },
  {
    id: "all",
    icon: <CheckSquare size={13} />,
    labelTr: "Tümü",
    labelEn: "All",
  },
  {
    id: "done",
    icon: <CircleCheck size={13} />,
    labelTr: "Tamamlanan",
    labelEn: "Completed",
  },
]

export interface MTToolbarProps {
  compact?: boolean
  lang: LangCode
  view: ViewId
  setView: (v: ViewId) => void
  groupBy: GroupBy
  setGroupBy: (g: GroupBy) => void
  search: string
  setSearch: (s: string) => void
  priFilter: Priority[]
  setPriFilter: (p: Priority[]) => void
  density: MTDensityKind
  setDensity: (d: MTDensityKind) => void
  sort: SortKey
  setSort: (s: SortKey) => void
  /** Counts per saved view, indexed by view id. */
  viewCounts: Record<ViewId, number>
}

export function MTToolbar({
  compact,
  lang,
  view,
  setView,
  groupBy,
  setGroupBy,
  search,
  setSearch,
  priFilter,
  setPriFilter,
  density,
  setDensity,
  sort,
  setSort,
  viewCounts,
}: MTToolbarProps) {
  const togglePri = React.useCallback(
    (p: Priority) => {
      if (priFilter.includes(p)) {
        setPriFilter(priFilter.filter((x) => x !== p))
      } else {
        setPriFilter([...priFilter, p])
      }
    },
    [priFilter, setPriFilter]
  )

  const groupOptions: Array<{
    id: GroupBy
    label: string
    icon: React.ReactNode
  }> = [
    {
      id: "due",
      label: lang === "tr" ? "Tarihe göre" : "By date",
      icon: <Calendar size={12} />,
    },
    {
      id: "project",
      label: lang === "tr" ? "Projeye göre" : "By project",
      icon: <Folder size={12} />,
    },
    {
      id: "status",
      label: lang === "tr" ? "Duruma göre" : "By status",
      icon: <CheckSquare size={12} />,
    },
    {
      id: "priority",
      label: lang === "tr" ? "Önceliğe göre" : "By priority",
      icon: <Flame size={12} />,
    },
    {
      id: "none",
      label: lang === "tr" ? "Gruplama yok" : "Flat",
      icon: <List size={12} />,
    },
  ]

  const sortOptions: Array<{ id: SortKey; label: string }> = [
    { id: "smart", label: lang === "tr" ? "Akıllı" : "Smart" },
    { id: "due", label: lang === "tr" ? "Tarih" : "Due date" },
    { id: "priority", label: lang === "tr" ? "Öncelik" : "Priority" },
    { id: "newest", label: lang === "tr" ? "En yeni" : "Newest" },
  ]

  return (
    <div
      data-testid="mt-toolbar"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      {!compact && (
        <div
          data-testid="mt-views-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {VIEW_META.map((v) => {
            const active = v.id === view
            const c = viewCounts[v.id] ?? 0
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={active}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 12px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  boxShadow: active
                    ? "inset 0 0 0 1px var(--border), 0 1px 2px oklch(0 0 0 / 0.04)"
                    : "none",
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    color: active ? "var(--primary)" : "var(--fg-subtle)",
                    display: "inline-flex",
                  }}
                >
                  {v.icon}
                </span>
                {lang === "tr" ? v.labelTr : v.labelEn}
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    padding: "1px 6px",
                    borderRadius: 99,
                    background: active ? "var(--accent)" : "var(--surface-2)",
                    color: active ? "var(--accent-fg)" : "var(--fg-subtle)",
                  }}
                >
                  {c}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Search input — uses the Input primitive so the focus ring + size
            tokens match the rest of the app. The container `display: flex`
            override (instead of the primitive's default inline-flex) lets the
            input fill its width slot consistently across compact / page modes. */}
        <Input
          icon={<Search size={13} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === "tr" ? "Görevlerde ara…" : "Search tasks…"}
          size="sm"
          style={{ display: "flex", width: compact ? 200 : 240 }}
        />

        {/* Group-by icon-button group inside an inset pill (prototype lines 449-463) */}
        <div
          data-testid="mt-group-by"
          role="radiogroup"
          aria-label={lang === "tr" ? "Gruplama" : "Group by"}
          style={{
            display: "inline-flex",
            background: "var(--surface-2)",
            padding: 2,
            borderRadius: 7,
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          {groupOptions.map((g) => {
            const active = groupBy === g.id
            return (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setGroupBy(g.id)}
                title={g.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 500,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  boxShadow: active
                    ? "0 1px 1px oklch(0 0 0 / 0.06)"
                    : "none",
                  cursor: "pointer",
                }}
              >
                {g.icon}
                {!compact && g.label}
              </button>
            )
          })}
        </div>

        <div
          aria-hidden
          style={{ height: 20, width: 1, background: "var(--border)" }}
        />

        {/* Priority chips */}
        <div
          data-testid="mt-priority-filter"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {PRIORITIES.map((p) => {
            const active = priFilter.includes(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePri(p)}
                aria-pressed={active}
                title={priorityLabel(p, lang)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 500,
                  background: active
                    ? "color-mix(in oklch, var(--primary) 8%, var(--surface))"
                    : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  boxShadow: active
                    ? "inset 0 0 0 1px color-mix(in oklch, var(--primary) 35%, var(--border))"
                    : "inset 0 0 0 1px var(--border)",
                  cursor: "pointer",
                }}
              >
                <PriorityChip
                  level={p}
                  lang={lang}
                  withLabel={false}
                  style={{ fontSize: 0 }}
                />
                {!compact && priorityLabel(p, lang)}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        <MTPicker
          value={sort}
          onChange={(id) => setSort(id as SortKey)}
          options={sortOptions}
          icon={<ArrowUpDown size={12} />}
          ariaLabel={lang === "tr" ? "Sıralama" : "Sort"}
        />

        {/* Density toggle group (3 buttons inside an inset pill) */}
        <div
          data-testid="mt-density"
          role="radiogroup"
          aria-label={lang === "tr" ? "Yoğunluk" : "Density"}
          style={{
            display: "inline-flex",
            background: "var(--surface-2)",
            padding: 2,
            borderRadius: 7,
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          {(["compact", "cozy", "comfortable"] as const).map((d) => {
            const active = density === d
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDensity(d)}
                title={densityLabel(d, lang)}
                aria-label={densityLabel(d, lang)}
                style={{
                  padding: "4px 7px",
                  borderRadius: 5,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 1px 1px oklch(0 0 0 / 0.06)"
                    : "none",
                }}
              >
                <MTDensityIcon kind={d} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function priorityLabel(p: Priority, lang: LangCode): string {
  if (p === "critical") return lang === "tr" ? "Kritik" : "Critical"
  if (p === "high") return lang === "tr" ? "Yüksek" : "High"
  if (p === "medium") return lang === "tr" ? "Orta" : "Medium"
  return lang === "tr" ? "Düşük" : "Low"
}

function densityLabel(d: MTDensityKind, lang: LangCode): string {
  if (d === "compact") return lang === "tr" ? "Sıkı" : "Compact"
  if (d === "cozy") return lang === "tr" ? "Orta" : "Cozy"
  return lang === "tr" ? "Geniş" : "Comfortable"
}

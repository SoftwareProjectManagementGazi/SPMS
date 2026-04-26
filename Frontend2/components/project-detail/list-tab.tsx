"use client"

// ListTab — Phase 11 Plan 07 List tab (D-25/D-26 per 11-CONTEXT).
//
// Uses TanStack Table v8 (headless) for sort/filter primitives; styling
// comes from the prototype token system via inline styles — no external CSS.
// Column set: Key, Title (w/ bug icon), Status, Priority, Assignee, Due,
// Points. Phase column is added conditionally when
// project.processConfig.enable_phase_assignment === true (D-40/D-41 — surfaces
// the TASK-05 phase dimension for users who opted in).
//
// Data flow: useTasks(project.id) shares cache with Board + Timeline +
// Calendar (D-26: all three tabs read the same query). Search + phase filter
// values are pulled from ProjectDetailContext so the toolbar search (wired on
// Board) also filters the list (D-25 — shared search).
//
// Default sort: Priority desc → Due asc → Key asc (D-26). PriorityChip's
// "medium → med" token bridge does not matter here since sorting is by the
// PRIORITY_ORDER numeric lookup, not by CSS variable name.
//
// Row click → router.push('/projects/{id}/tasks/{taskId}') matches Board
// card click pattern (D-23).

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Bug, ChevronUp, ChevronDown } from "lucide-react"

import {
  Avatar,
  Badge,
  PriorityChip,
  StatusDot,
  type PriorityLevel,
  type StatusValue,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTasks } from "@/hooks/use-tasks"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

import { useProjectDetail } from "./project-detail-context"

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function shortDate(iso: string | null, lang: "tr" | "en"): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
      month: "short",
      day: "numeric",
    })
  } catch {
    return "—"
  }
}

interface PhaseNode {
  id: string
  name: string
}

interface WorkflowShape {
  nodes?: PhaseNode[]
}

function readWorkflowNodes(pc: Record<string, unknown> | null): PhaseNode[] {
  if (!pc) return []
  const wf = pc.workflow as WorkflowShape | undefined
  return wf?.nodes ?? []
}

function readEnablePhase(pc: Record<string, unknown> | null): boolean {
  if (!pc) return false
  return !!(pc as { enable_phase_assignment?: boolean }).enable_phase_assignment
}

export function ListTab({ project }: { project: Project }) {
  const { language } = useApp()
  const router = useRouter()
  const pd = useProjectDetail()
  const { data: tasks = [] } = useTasks(project.id)

  const phaseEnabled = readEnablePhase(project.processConfig)
  const phaseNodes = readWorkflowNodes(project.processConfig)

  // Filter by shared searchQuery + phaseFilter (from ProjectDetailContext)
  const filtered = React.useMemo(() => {
    return tasks.filter((t) => {
      const q = pd.searchQuery.trim().toLowerCase()
      if (q) {
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.key.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (pd.phaseFilter && t.phaseId !== pd.phaseFilter) return false
      return true
    })
  }, [tasks, pd.searchQuery, pd.phaseFilter])

  // Build columns. The effect of flipping enablePhaseAssignment mid-session is
  // handled by a new columns array — TanStack Table picks up the change via
  // re-render since columns is a memoized value.
  const columns = React.useMemo<ColumnDef<Task>[]>(() => {
    const cols: ColumnDef<Task>[] = [
      {
        accessorKey: "key",
        header: language === "tr" ? "ANAHTAR" : "KEY",
        cell: (info) => (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
            }}
          >
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: language === "tr" ? "BAŞLIK" : "TITLE",
        cell: (info) => {
          const t = info.row.original
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {t.type === "bug" && (
                <Bug size={12} color="var(--priority-critical)" />
              )}
              <span style={{ fontSize: 12.5 }}>{t.title}</span>
            </span>
          )
        },
      },
      {
        accessorKey: "status",
        header: language === "tr" ? "DURUM" : "STATUS",
        cell: (info) => {
          const s = String(info.getValue())
          // StatusDot only knows the 5 canonical values — unknown custom
          // statuses get a neutral token fallback via CSS var.
          const canonical: StatusValue = (
            ["todo", "progress", "review", "done", "blocked"] as const
          ).includes(s as StatusValue)
            ? (s as StatusValue)
            : "todo"
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <StatusDot status={canonical} />
              <span style={{ fontSize: 12 }}>{s}</span>
            </span>
          )
        },
      },
      {
        accessorKey: "priority",
        header: language === "tr" ? "ÖNCELİK" : "PRIORITY",
        cell: (info) => (
          <PriorityChip
            level={info.getValue() as PriorityLevel}
            lang={language}
          />
        ),
        // Sort by the numeric PRIORITY_ORDER map. Returning (b - a) means
        // higher numbers come FIRST when the column is sorted "desc", which
        // matches the D-26 default (critical → low).
        sortingFn: (rowA, rowB) => {
          const a = PRIORITY_ORDER[rowA.original.priority] ?? 0
          const b = PRIORITY_ORDER[rowB.original.priority] ?? 0
          return a - b
        },
      },
      {
        accessorKey: "assigneeId",
        header: language === "tr" ? "ATANAN" : "ASSIGNEE",
        cell: (info) => {
          const aid = info.getValue() as number | null
          if (aid == null) {
            return (
              <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                —
              </span>
            )
          }
          const initials = `#${aid}`.slice(0, 2).toUpperCase()
          const avColor = ((aid % 8) + 1) as number
          // Phase 13 Plan 13-03 (D-D4) — Avatar links to the assignee profile.
          return (
            <Avatar
              user={{ initials, avColor }}
              size={20}
              href={`/users/${aid}`}
            />
          )
        },
      },
      {
        accessorKey: "due",
        header: language === "tr" ? "BİTİŞ" : "DUE",
        cell: (info) => (
          <span style={{ fontSize: 12 }}>
            {shortDate(info.getValue() as string | null, language)}
          </span>
        ),
        // Null dues sort AFTER real dates in ascending order so scheduled
        // tasks lead the list and unscheduled tasks fall to the bottom.
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.due
          const b = rowB.original.due
          if (a == null && b == null) return 0
          if (a == null) return 1
          if (b == null) return -1
          return new Date(a).getTime() - new Date(b).getTime()
        },
      },
      {
        accessorKey: "points",
        header: "SP",
        cell: (info) => (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
            {info.getValue() == null ? "—" : String(info.getValue())}
          </span>
        ),
      },
    ]
    if (phaseEnabled) {
      cols.push({
        accessorKey: "phaseId",
        header: language === "tr" ? "FAZ" : "PHASE",
        cell: (info) => {
          const id = info.getValue() as string | null
          const name = id
            ? phaseNodes.find((n) => n.id === id)?.name ?? id
            : null
          return name ? (
            <Badge size="xs" tone="neutral">
              {name}
            </Badge>
          ) : (
            <span style={{ color: "var(--fg-subtle)" }}>—</span>
          )
        },
      })
    }
    return cols
  }, [language, phaseEnabled, phaseNodes])

  // D-26: default sort Priority desc → Due asc → Key asc. TanStack Table treats
  // each entry as a stable multi-sort — earlier entries in the array win ties.
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "priority", desc: true },
    { id: "due", desc: false },
    { id: "key", desc: false },
  ])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const gridCols = phaseEnabled
    ? "80px 2fr 110px 110px 70px 90px 50px 110px"
    : "80px 2fr 110px 110px 70px 90px 50px"

  return (
    <div style={{ padding: "8px 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          boxShadow: "inset 0 0 0 1px var(--border)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        {table.getHeaderGroups().map((hg) =>
          hg.headers.map((h) => {
            const isSorted = h.column.getIsSorted()
            const headerContent = flexRender(h.column.columnDef.header, h.getContext())
            return (
              <div
                key={h.id}
                onClick={h.column.getToggleSortingHandler()}
                style={{
                  padding: "8px 12px",
                  // UI-sweep: 11 -> 10.5 (Body small Heading-weight uppercase variant).
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  // UI-sweep: 0.4 -> 0.5 (standardize uppercase Section labels).
                  letterSpacing: 0.5,
                  color: isSorted ? "var(--fg)" : "var(--fg-subtle)",
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  userSelect: "none",
                }}
              >
                {headerContent}
                {isSorted === "asc" && <ChevronUp size={11} />}
                {isSorted === "desc" && <ChevronDown size={11} />}
              </div>
            )
          })
        )}
        {/* Data rows */}
        {table.getRowModel().rows.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 24,
              textAlign: "center",
              color: "var(--fg-subtle)",
              fontSize: 12,
            }}
          >
            {language === "tr" ? "Görev bulunamadı" : "No tasks found"}
          </div>
        ) : (
          table.getRowModel().rows.map((r) =>
            r.getVisibleCells().map((c) => (
              <div
                key={c.id}
                data-task-id={r.original.id}
                onClick={() =>
                  router.push(`/projects/${project.id}/tasks/${r.original.id}`)
                }
                style={{
                  padding: "8px 12px",
                  fontSize: 12.5,
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background =
                    "var(--surface-2)"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background =
                    "transparent"
                }}
              >
                {flexRender(c.column.columnDef.cell, c.getContext())}
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}

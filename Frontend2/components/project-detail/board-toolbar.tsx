"use client"

// BoardToolbar — the top bar of the Board tab.
//
// Per D-22 the Phase-11 toolbar scope is:
//   - search input (wires to ProjectDetailContext.searchQuery)
//   - Compact/Rich SegmentedControl (ProjectDetailContext.densityMode)
//   - Sprint filter dropdown (Scrum only — tıklanabilir, tüm sprint'leri listeler)
//   - Phase filter dropdown (hidden when enable_phase_assignment=false)

import * as React from "react"
import { Search, Filter, ChevronDown, CheckCheck, Plus } from "lucide-react"

import {
  Badge,
  Button,
  Input,
  SegmentedControl,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTaskModal } from "@/context/task-modal-context"
import { useSprints, type Sprint } from "@/hooks/use-sprints"
import type { Project } from "@/services/project-service"
import { useProjectDetail, type DensityMode } from "./project-detail-context"

export function BoardToolbar({ project }: { project: Project }) {
  const { language } = useApp()
  const pd = useProjectDetail()
  const { openTaskModal } = useTaskModal()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const isScrum = project.methodology === "SCRUM"

  const { data: sprints = [] } = useSprints(isScrum ? project.id : null)

  const cfg = (project.processConfig ?? {}) as {
    enable_phase_assignment?: boolean
    workflow?: { nodes?: Array<{ id: string; name: string }> }
  }
  const phaseEnabled = !!cfg.enable_phase_assignment
  const phaseNodes = cfg.workflow?.nodes ?? []

  // Sprint dropdown state
  const [sprintMenuOpen, setSprintMenuOpen] = React.useState(false)
  const sprintMenuRef = React.useRef<HTMLDivElement | null>(null)

  // Phase dropdown state
  const [phaseMenuOpen, setPhaseMenuOpen] = React.useState(false)
  const phaseMenuRef = React.useRef<HTMLDivElement | null>(null)

  // Auto-select active sprint on first load (only once per project session)
  const didAutoSelect = React.useRef(false)
  React.useEffect(() => {
    if (!isScrum || didAutoSelect.current || sprints.length === 0) return
    if (pd.sprintFilter !== null) return // user already picked one
    const active = sprints.find((s) => s.status === "ACTIVE")
    if (active) {
      pd.setSprintFilter(active.id)
      didAutoSelect.current = true
    }
  }, [sprints, isScrum, pd])

  // Close menus on outside click
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (sprintMenuOpen && sprintMenuRef.current && !sprintMenuRef.current.contains(e.target as Node)) {
        setSprintMenuOpen(false)
      }
      if (phaseMenuOpen && phaseMenuRef.current && !phaseMenuRef.current.contains(e.target as Node)) {
        setPhaseMenuOpen(false)
      }
    }
    if (sprintMenuOpen || phaseMenuOpen) {
      document.addEventListener("mousedown", onDown)
      return () => document.removeEventListener("mousedown", onDown)
    }
  }, [sprintMenuOpen, phaseMenuOpen])

  const densityOptions = [
    { id: "compact", label: T("Sıkı", "Compact") },
    { id: "rich", label: T("Detaylı", "Rich") },
  ]

  const selectedSprint = sprints.find((s) => s.id === pd.sprintFilter) ?? null
  const selectedPhaseName = pd.phaseFilter
    ? phaseNodes.find((n) => n.id === pd.phaseFilter)?.name ?? null
    : null

  const sprintLabel = selectedSprint
    ? selectedSprint.name
    : T("Tümü", "All")

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        flexWrap: "wrap",
      }}
    >
      <Input
        icon={<Search size={13} />}
        placeholder={T("Filtrele…", "Filter…")}
        size="sm"
        value={pd.searchQuery}
        onChange={(e) => pd.setSearchQuery(e.target.value)}
        style={{ width: 220 }}
      />

      <SegmentedControl
        options={densityOptions}
        value={pd.densityMode}
        onChange={(v) => pd.setDensityMode(v as DensityMode)}
      />

      {/* Sprint filter — only for SCRUM projects */}
      {isScrum && sprints.length > 0 && (
        <div ref={sprintMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setSprintMenuOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              padding: "3px 8px",
              background: "var(--surface)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "inset 0 0 0 1px var(--border)",
              border: "none",
              color: "var(--fg)",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ color: "var(--fg-muted)" }}>
              {T("Sprint:", "Sprint:")}
            </span>
            <Badge size="xs" tone={selectedSprint?.status === "ACTIVE" ? "success" : selectedSprint?.status === "CLOSED" ? "neutral" : "primary"}>
              {sprintLabel}
            </Badge>
            <ChevronDown size={11} style={{ color: "var(--fg-muted)" }} />
          </button>

          {sprintMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--surface)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "var(--radius-sm)",
                padding: 4,
                minWidth: 200,
                zIndex: 50,
                border: "1px solid var(--border)",
              }}
            >
              {/* All tasks option */}
              <SprintMenuItem
                label={T("Tüm görevler", "All tasks")}
                active={pd.sprintFilter === null}
                status={null}
                onClick={() => {
                  pd.setSprintFilter(null)
                  setSprintMenuOpen(false)
                }}
              />
              {sprints.map((s) => (
                <SprintMenuItem
                  key={s.id}
                  label={s.name}
                  active={pd.sprintFilter === s.id}
                  status={s.status}
                  taskCount={s.task_count}
                  completedCount={s.completed_count}
                  onClick={() => {
                    pd.setSprintFilter(s.id)
                    setSprintMenuOpen(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase filter */}
      {phaseEnabled && (
        <div ref={phaseMenuRef} style={{ position: "relative" }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Filter size={13} />}
            iconRight={<ChevronDown size={12} />}
            onClick={() => setPhaseMenuOpen((v) => !v)}
          >
            {selectedPhaseName ?? T("Faz", "Phase")}
          </Button>
          {phaseMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--surface)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "var(--radius-sm)",
                padding: 4,
                minWidth: 200,
                zIndex: 50,
                border: "1px solid var(--border)",
              }}
            >
              <MenuButton
                active={pd.phaseFilter === null}
                onClick={() => { pd.setPhaseFilter(null); setPhaseMenuOpen(false) }}
              >
                {T("Tümü", "All")}
              </MenuButton>
              {phaseNodes.map((n) => (
                <MenuButton
                  key={n.id}
                  active={pd.phaseFilter === n.id}
                  onClick={() => { pd.setPhaseFilter(n.id); setPhaseMenuOpen(false) }}
                >
                  {n.name}
                </MenuButton>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <Button
        variant="primary"
        size="sm"
        icon={<Plus size={13} />}
        onClick={() =>
          openTaskModal({
            defaultProjectId: project.id,
            defaultCycleId: pd.sprintFilter,
          })
        }
      >
        {T("Görev Ekle", "Add Task")}
      </Button>
    </div>
  )
}

// ---- Internal primitives -------------------------------------------------------

function SprintMenuItem({
  label,
  active,
  status,
  taskCount,
  completedCount,
  onClick,
}: {
  label: string
  active: boolean
  status: string | null
  taskCount?: number
  completedCount?: number
  onClick: () => void
}) {
  const tone =
    status === "ACTIVE" ? "success" :
    status === "CLOSED" ? "neutral" :
    status === "PLANNED" ? "primary" : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        textAlign: "left",
        padding: "6px 10px",
        fontSize: 12.5,
        background: active ? "var(--surface-2)" : "transparent",
        border: "none",
        color: "var(--fg)",
        cursor: "pointer",
        borderRadius: "var(--radius-sm)",
        gap: 8,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
        {active && <CheckCheck size={12} style={{ color: "var(--fg-success)", flexShrink: 0 }} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {tone && <Badge size="xs" tone={tone}>{status}</Badge>}
        {typeof taskCount === "number" && taskCount > 0 && (
          <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
            {completedCount}/{taskCount}
          </span>
        )}
      </span>
    </button>
  )
}

function MenuButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "6px 10px",
        fontSize: 12.5,
        background: active ? "var(--surface-2)" : "transparent",
        border: "none",
        color: "var(--fg)",
        cursor: "pointer",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {children}
    </button>
  )
}

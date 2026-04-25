"use client"

// BoardToolbar — the top bar of the Board tab.
//
// Per D-22 the Phase-11 toolbar scope is:
//   - search input (wires to ProjectDetailContext.searchQuery)
//   - Compact/Rich SegmentedControl (ProjectDetailContext.densityMode)
//   - current-cycle Badge (Scrum only — /api/v1/sprints?current=true)
//   - Phase filter dropdown (hidden when enable_phase_assignment=false)
//
// The cycle query is SCRUM-gated at the hook level: non-Scrum methodologies
// simply never fetch, so the badge row is omitted. Kanban has no cycle by
// definition; Waterfall/Iterative/etc. are deferred to Phase 12 per D-44.

import * as React from "react"
import { Search, Filter, ChevronDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import {
  Badge,
  Button,
  Input,
  SegmentedControl,
} from "@/components/primitives"
import { apiClient } from "@/lib/api-client"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"
import { useProjectDetail, type DensityMode } from "./project-detail-context"

interface CurrentCycleDTO {
  id: number
  name: string
  number?: number
}

function useCurrentCycle(projectId: number, methodology: string) {
  return useQuery({
    queryKey: ["sprints", "current", projectId],
    queryFn: async () => {
      try {
        const resp = await apiClient.get<CurrentCycleDTO[]>("/sprints", {
          params: { project_id: projectId, current: true },
        })
        return resp.data[0] ?? null
      } catch {
        // A 404/500 on a missing sprints endpoint should NOT break the toolbar.
        return null
      }
    },
    enabled: methodology === "SCRUM",
    staleTime: 60_000,
  })
}

export function BoardToolbar({ project }: { project: Project }) {
  const { language } = useApp()
  const pd = useProjectDetail()

  const cfg = (project.processConfig ?? {}) as {
    enable_phase_assignment?: boolean
    workflow?: { nodes?: Array<{ id: string; name: string }> }
  }
  const phaseEnabled = !!cfg.enable_phase_assignment
  const phaseNodes = cfg.workflow?.nodes ?? []

  const { data: currentSprint } = useCurrentCycle(project.id, project.methodology)

  const [phaseMenuOpen, setPhaseMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  // Click outside closes the phase filter menu.
  React.useEffect(() => {
    if (!phaseMenuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPhaseMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [phaseMenuOpen])

  const densityOptions = [
    { id: "compact", label: language === "tr" ? "Sıkı" : "Compact" },
    { id: "rich", label: language === "tr" ? "Detaylı" : "Rich" },
  ]

  const selectedPhaseName = pd.phaseFilter
    ? phaseNodes.find((n) => n.id === pd.phaseFilter)?.name ?? null
    : null

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
        placeholder={language === "tr" ? "Filtrele…" : "Filter…"}
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

      {currentSprint && (
        // UI-sweep: wrap Sprint indicator in a containment chip so the user reads
        // it as an information-only tag, not as a control. Avoids visual collision
        // with the SegmentedControl + Search input siblings.
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--fg-muted)",
            fontSize: 12,
            padding: "2px 6px",
            background: "var(--surface)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          <span>{language === "tr" ? "Sprint:" : "Sprint:"}</span>
          <Badge size="xs" tone="info">
            {currentSprint.name}
          </Badge>
        </div>
      )}

      {phaseEnabled && (
        <div ref={menuRef} style={{ position: "relative" }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Filter size={13} />}
            iconRight={<ChevronDown size={12} />}
            onClick={() => setPhaseMenuOpen((v) => !v)}
          >
            {selectedPhaseName ?? (language === "tr" ? "Faz" : "Phase")}
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
              <button
                type="button"
                onClick={() => {
                  pd.setPhaseFilter(null)
                  setPhaseMenuOpen(false)
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  fontSize: 12.5,
                  background:
                    pd.phaseFilter === null
                      ? "var(--surface-2)"
                      : "transparent",
                  border: "none",
                  color: "var(--fg)",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                {language === "tr" ? "Tümü" : "All"}
              </button>
              {phaseNodes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    pd.setPhaseFilter(n.id)
                    setPhaseMenuOpen(false)
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 8px",
                    fontSize: 12.5,
                    background:
                      pd.phaseFilter === n.id
                        ? "var(--surface-2)"
                        : "transparent",
                    border: "none",
                    color: "var(--fg)",
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  {n.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />
    </div>
  )
}

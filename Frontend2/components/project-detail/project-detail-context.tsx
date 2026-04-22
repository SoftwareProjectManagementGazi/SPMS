"use client"

// ProjectDetailContext — exposes searchQuery, density, phaseFilter to every
// descendant of a ProjectDetailShell. Later plans (Board toolbar in 11-05, List
// tab filter in 11-07) read from this shared state so the 8-tab shell stays
// in sync with its toolbar.
//
// Density is persisted per-project in localStorage under
// `spms.board.density.{projectId}` (D-21). searchQuery and phaseFilter are
// session-only by design — D-26: filter state is React-only for v1.

import * as React from "react"

export type DensityMode = "compact" | "rich"

interface ProjectDetailState {
  projectId: number
  searchQuery: string
  setSearchQuery: (q: string) => void
  densityMode: DensityMode
  setDensityMode: (d: DensityMode) => void
  phaseFilter: string | null
  setPhaseFilter: (id: string | null) => void
}

const Ctx = React.createContext<ProjectDetailState | null>(null)

export function useProjectDetail(): ProjectDetailState {
  const v = React.useContext(Ctx)
  if (!v) {
    throw new Error("useProjectDetail must be used within ProjectDetailProvider")
  }
  return v
}

// D-21: density per-project in localStorage (spms.board.density.{projectId}).
// Defensive try/catch matches AppContext.load pattern — corrupted or missing
// values fall back to "rich" silently (same disposition as T-08-01).
function loadDensity(projectId: number): DensityMode {
  if (typeof window === "undefined") return "rich"
  try {
    const v = window.localStorage.getItem(`spms.board.density.${projectId}`)
    return v === "compact" ? "compact" : "rich"
  } catch {
    return "rich"
  }
}

function saveDensity(projectId: number, d: DensityMode): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(`spms.board.density.${projectId}`, d)
  } catch {
    /* ignore */
  }
}

export function ProjectDetailProvider({
  projectId,
  children,
}: {
  projectId: number
  children: React.ReactNode
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [densityMode, setDensityModeState] = React.useState<DensityMode>(() =>
    loadDensity(projectId)
  )
  const [phaseFilter, setPhaseFilter] = React.useState<string | null>(null)

  // Persist density on every change — stable identity via useCallback.
  const setDensityMode = React.useCallback(
    (d: DensityMode) => {
      setDensityModeState(d)
      saveDensity(projectId, d)
    },
    [projectId]
  )

  const value = React.useMemo<ProjectDetailState>(
    () => ({
      projectId,
      searchQuery,
      setSearchQuery,
      densityMode,
      setDensityMode,
      phaseFilter,
      setPhaseFilter,
    }),
    [projectId, searchQuery, densityMode, setDensityMode, phaseFilter]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

"use client"

// Phase 13 Plan 13-06 Task 1 — ProfileProjectsTab FULL IMPL.
//
// Replaces the Plan 13-05 stub. Renders a 3-column grid of Phase 10
// ProjectCard components, sourced from useUserSummary().data.projects
// (the same /users/{id}/summary payload the route already fetches —
// no second network call). Layout matches /projects list page (D-C5).
//
// Project shape adaptation:
//   useUserSummary().data.projects is `UserSummaryProject` ({id,key,name,status}
//   only — Phase 9 D-48 endpoint output). ProjectCard expects the full
//   Phase 10 `Project` interface with description / dates / methodology /
//   manager / progress / columns. We adapt the summary entries into a
//   ProjectCard-compatible shape with safe defaults at the boundary so
//   the existing ProjectCard renders without changes (D-C5 reuse contract).
//   Defaults are chosen to render gracefully: description=null, progress=0,
//   methodology="", manager fields=null, columns=[]. Real values would
//   require a per-id /projects/{id} fetch (v2.1 candidate).
//
// Empty state: "Henüz proje yok." per D-F2 (matches /projects empty copy).
//
// Grid layout: inline `gridTemplateColumns: "repeat(3, 1fr)"` is the v2.0
// baseline. Plan 13-09 will add the `.profile-projects-grid` rule to
// globals.css with @media breakpoints (≤1024px → 2-col, ≤640px → 1-col).
// The className stays in place so 13-09's CSS rule attaches without a
// JSX change here.

import * as React from "react"
import { DataState } from "@/components/primitives"
import { ProjectCard } from "@/components/projects/project-card"
import { useUserSummary } from "@/hooks/use-user-summary"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"
import type { UserSummaryProject } from "@/services/profile-service"

export interface ProfileProjectsTabProps {
  userId: number
}

/**
 * Adapts a `/users/{id}/summary` project entry to the full `Project` shape
 * that the Phase 10 ProjectCard expects. The summary endpoint only carries
 * id+key+name+status, so all other fields default to safe empty values.
 * Kept inside this file (single consumer) — lift to `lib/` only when a
 * second consumer needs the same adaptation.
 */
function adaptSummaryProject(p: UserSummaryProject): Project {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    description: null,
    startDate: "",
    endDate: null,
    status: (p.status as Project["status"]) ?? "ACTIVE",
    methodology: "",
    processTemplateId: null,
    managerId: null,
    managerName: null,
    managerAvatar: null,
    progress: 0,
    columns: [],
    boardColumns: [],
    processConfig: null,
    createdAt: "",
    taskCount: 0,
    taskDoneCount: 0,
  }
}

export function ProfileProjectsTab({ userId }: ProfileProjectsTabProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)
  const { data: summary, isLoading, error } = useUserSummary(userId)
  const projects = summary?.projects ?? []

  return (
    <DataState
      loading={isLoading}
      error={error}
      empty={projects.length === 0}
      emptyFallback={
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 13,
          }}
        >
          {T("Henüz proje yok.", "No projects yet.")}
        </div>
      }
    >
      <div
        className="profile-projects-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {projects.map((p) => (
          <ProjectCard key={p.id} project={adaptSummaryProject(p)} />
        ))}
      </div>
    </DataState>
  )
}

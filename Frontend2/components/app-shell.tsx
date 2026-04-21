"use client"

// AppShell: horizontal flex layout frame used by the (shell) route group.
// Composes Sidebar + vertical stack (Header + scrollable main). Exact match to
// New_Frontend/src/app.jsx App component layout (lines 162-169).
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
//
// Plan 09: Wires the deferred Header Create button to /projects/new (D-08-04)
// and adds a dynamic project status Badge in the header for /projects/{id} routes (PROJ-02).

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"

import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useProjects } from "@/hooks/use-projects"
import { Badge } from "@/components/primitives"

// PROJ-02: status badge tone + label maps — same pattern as ProjectCard (Plan 05)
const STATUS_BADGE_TONE: Record<string, "success" | "info" | "warning" | "neutral"> = {
  ACTIVE: "success",
  COMPLETED: "info",
  ON_HOLD: "warning",
  ARCHIVED: "neutral",
}

const STATUS_LABEL_TR: Record<string, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  ON_HOLD: "Askıda",
  ARCHIVED: "Arşiv",
}

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  // PROJ-02: detect /projects/{id} route to show status badge in header
  const projectRouteMatch = pathname?.match(/^\/projects\/(\d+)/)
  const projectRouteId = projectRouteMatch ? Number(projectRouteMatch[1]) : null

  // Use cached projects list (TanStack Query cache — no extra network request when navigating
  // from /projects to /projects/{id}; fetches once on first visit if cache is empty).
  const { data: allProjects = [] } = useProjects()
  const headerProject = projectRouteId
    ? allProjects.find((p) => p.id === projectRouteId) ?? null
    : null

  // Render the dynamic status badge when on a project detail route
  const headerStatusBadge = (
    <>
      {headerProject && (
        <Badge
          size="xs"
          tone={STATUS_BADGE_TONE[headerProject.status] ?? "neutral"}
          dot
          style={{ marginLeft: 8 }}
        >
          {STATUS_LABEL_TR[headerProject.status] ?? headerProject.status}
        </Badge>
      )}
    </>
  )

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          statusBadge={headerStatusBadge}
          onCreateProject={() => router.push("/projects/new")}
        />
        <main className="flex-1 overflow-auto" style={{ padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

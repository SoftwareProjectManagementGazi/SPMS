"use client"
import * as React from "react"
import { useParams } from "next/navigation"
import { useProject } from "@/hooks/use-projects"
import { useMilestones } from "@/hooks/use-milestones"
import { ArchiveBanner } from "@/components/projects/archive-banner"
import { Card, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { ProjectDetailShell } from "@/components/project-detail/project-detail-shell"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = Number(params.id)
  const { language } = useApp()
  // T-10-08-02: NaN guard — enabled: !!projectId prevents API call when id is non-numeric
  const { data: project, isLoading } = useProject(projectId)

  // Phase 12 Plan 12-04 Step 6 — pre-fetch milestones at page level so the
  // TanStack cache primes for child consumers: LifecycleTab's Overview
  // sub-tab (Yaklaşan Teslimler column) and the Timeline tab (Plan 12-05
  // milestone flag lines). The hook is a no-op when projectId is invalid.
  useMilestones(projectId)

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)" }}>
        {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
      </div>
    )
  }

  if (!project) {
    return (
      <Card padding={40}>
        <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
          {language === 'tr' ? 'Proje bulunamadı.' : 'Project not found.'}
        </div>
      </Card>
    )
  }

  // D-34: isArchived boolean drives disabled state on all edit actions in this page.
  // Single source of truth — when status changes via ArchiveBanner, TanStack Query
  // invalidates → page re-fetches → isArchived becomes false → buttons re-enable.
  const isArchived = project.status === 'ARCHIVED'

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
      {/* PROJ-03: Show ArchiveBanner at top of content area when project is archived */}
      {isArchived && (
        <ArchiveBanner projectId={project.id} projectName={project.name} />
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, color: "var(--fg)" }}>
            {project.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 11 }}>
              {project.key}
            </span>
            {" · "}
            {project.methodology}
          </div>
        </div>
        {/* D-34: Edit button disabled when project is ARCHIVED */}
        <Button variant="primary" size="sm" disabled={isArchived}>
          {language === 'tr' ? 'Düzenle' : 'Edit'}
        </Button>
      </div>

      {/* Phase 11 Plan 04: 8-tab ProjectDetail shell (PAGE-03, D-09..D-12). */}
      <ProjectDetailShell project={project} isArchived={isArchived} />
    </div>
  )
}

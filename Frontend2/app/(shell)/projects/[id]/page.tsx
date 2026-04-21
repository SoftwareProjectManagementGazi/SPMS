"use client"
import * as React from "react"
import { useParams } from "next/navigation"
import { useProject } from "@/hooks/use-projects"
import { ArchiveBanner } from "@/components/projects/archive-banner"
import { Card, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = Number(params.id)
  const { language } = useApp()
  // T-10-08-02: NaN guard — enabled: !!projectId prevents API call when id is non-numeric
  const { data: project, isLoading } = useProject(projectId)

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

      {/* Phase 11 placeholder — full Board/List/Timeline tabs will replace this */}
      <Card padding={40}>
        <div style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
            {language === 'tr' ? 'Proje Detay Görünümü' : 'Project Detail View'}
          </div>
          <div style={{
            fontSize: 12.5,
            color: "var(--fg-muted)",
            maxWidth: 360,
            lineHeight: 1.5,
          }}>
            {language === 'tr'
              ? "Board, Liste, Zaman Çizelgesi ve diğer sekmeler Phase 11'de eklenecek."
              : 'Board, List, Timeline and other tabs will be added in Phase 11.'}
          </div>
          {/* D-34: Additional action buttons also disabled when project is ARCHIVED */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="ghost" size="sm" disabled={isArchived}>
              {language === 'tr' ? 'Görev Ekle' : 'Add Task'}
            </Button>
            <Button variant="ghost" size="sm" disabled={isArchived}>
              {language === 'tr' ? 'Üye Ekle' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

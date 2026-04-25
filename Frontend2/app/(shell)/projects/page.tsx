"use client"
import * as React from "react"
import Link from "next/link"
import { SegmentedControl, Input, Button } from "@/components/primitives"
import { ProjectCard } from "@/components/projects/project-card"
import { useProjects } from "@/hooks/use-projects"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"

// SegmentedControl uses { id, label } options — id is the filter value sent to API
const STATUS_SEGMENTS = [
  { id: "", label: "Tümü" },
  { id: "ACTIVE", label: "Aktif" },
  { id: "COMPLETED", label: "Bitti" },
  { id: "ARCHIVED", label: "Arşiv" },
]

const STATUS_SEGMENTS_EN = [
  { id: "", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "COMPLETED", label: "Done" },
  { id: "ARCHIVED", label: "Archive" },
]

export default function ProjectsPage() {
  const { language } = useApp()
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")

  // D-08: Yeni Proje button visible only to Admin + Project Manager.
  // Uses case-insensitive compare with the backend-returned role name
  // (see Frontend2/services/auth-service.ts — role.name is a free-form string
  // populated from the role table's `name` column). Defense-in-depth only —
  // the backend POST /api/v1/projects still enforces the same role check
  // (T-11-02-01 disposition: frontend gate is UX, not authz).
  const roleName = (user?.role?.name ?? "").toLowerCase()
  const canCreateProject =
    roleName === "admin" ||
    roleName === "project manager" ||
    roleName === "project_manager"

  // PROJ-05: fetch filtered list from API — "Tümü" omits status param (D-24)
  const { data: projects = [], isLoading } = useProjects(statusFilter || undefined)

  // Client-side search filter on top of API results
  const filtered = searchQuery.trim()
    ? projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects

  const segments = language === 'tr' ? STATUS_SEGMENTS : STATUS_SEGMENTS_EN

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header row — UI-sweep: split into 2 rows so primary CTA stands alone.
          Top row: title + Yeni Proje (single focal point per Phase 10 D-22 +
          UI-SPEC accent-reserved-list). Sub-row: filter + search. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.6 }}>
              {language === 'tr' ? 'Projeler' : 'Projects'}
            </div>
            <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
              {projects.length} {language === 'tr' ? 'proje · klavyeyle gezin' : 'projects · keyboard friendly'}
            </div>
          </div>
          {canCreateProject && (
            <Link href="/projects/new">
              <Button variant="primary">
                {language === 'tr' ? 'Yeni proje' : 'New project'}
              </Button>
            </Link>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SegmentedControl
            options={segments}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Input
            placeholder={language === 'tr' ? 'Proje ara' : 'Search projects'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: 220 }}
          />
        </div>
      </div>

      {/* Card grid — responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--fg-muted)", fontSize: 13 }}>
          {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ padding: 40, textAlign: "center", display: "flex",
            flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 320 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="var(--fg-muted)" strokeWidth="1.5">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {statusFilter
                ? (language === 'tr' ? 'Bu filtreyle eşleşen proje yok.' : 'No projects match this filter.')
                : (language === 'tr' ? 'Henüz proje yok.' : 'No projects yet.')}
            </div>
            {canCreateProject && (
              <Link href="/projects/new">
                <Button variant="primary" size="sm">
                  {language === 'tr' ? 'Yeni proje' : 'New project'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

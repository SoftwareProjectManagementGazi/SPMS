"use client"
import * as React from "react"
import { Badge, Avatar, AvatarStack } from "@/components/primitives"
import type { AvatarStackUser } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"

interface PortfolioTableProps {
  projects: Project[]
}

function getMethodologyTone(methodology: string): "info" | "primary" | "warning" | "neutral" {
  const m = methodology.toLowerCase()
  if (m.includes("scrum")) return "info"
  if (m.includes("kanban")) return "primary"
  if (m.includes("waterfall")) return "warning"
  return "neutral"
}

export function PortfolioTable({ projects }: PortfolioTableProps) {
  const { language } = useApp()

  if (projects.length === 0) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 12.5, color: "var(--fg-subtle)" }}>
        {language === "tr" ? "Aktif proje bulunamadı." : "No active projects found."}
      </div>
    )
  }

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 90px 120px 100px 90px 90px",
        padding: "10px 16px",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        color: "var(--fg-subtle)",
        fontWeight: 600,
        borderBottom: "1px solid var(--border)",
      }}>
        <div>{language === "tr" ? "Proje" : "Project"}</div>
        <div>{language === "tr" ? "Yöntem" : "Method"}</div>
        <div>{language === "tr" ? "Yönetici" : "Lead"}</div>
        <div>{language === "tr" ? "Takım" : "Team"}</div>
        <div style={{ textAlign: "right" }}>{language === "tr" ? "İlerleme" : "Progress"}</div>
        <div style={{ textAlign: "right" }}>{language === "tr" ? "Bitiş" : "End"}</div>
      </div>

      {/* Data rows */}
      {projects.map((project) => {
        const methodTone = getMethodologyTone(project.methodology)
        const progress = Math.round(project.progress ?? 0)

        // Build lead avatar from manager fields
        const leadUser = project.managerName
          ? {
              initials: project.managerName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase(),
              avColor: 1,
            }
          : null
        const leadFirstName = project.managerName
          ? project.managerName.split(" ")[0]
          : ""

        // Team avatars: project doesn't carry member list in this shape
        // — render empty AvatarStack (members wired in Phase 11 project detail)
        const teamMembers: AvatarStackUser[] = []

        const endDate = project.endDate
          ? new Date(project.endDate).toLocaleDateString(
              language === "tr" ? "tr-TR" : "en-US",
              { month: "short", day: "numeric" }
            )
          : "—"

        return (
          <div
            key={project.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 90px 120px 100px 90px 90px",
              padding: "11px 16px",
              alignItems: "center",
              fontSize: 13,
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Project: key chip + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--fg-muted)",
                background: "var(--surface-2)",
                padding: "2px 6px",
                borderRadius: 4,
                flexShrink: 0,
                fontFamily: "var(--font-mono)",
              }}>
                {project.key}
              </div>
              <div style={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {project.name}
              </div>
            </div>

            {/* Method badge */}
            <div>
              <Badge tone={methodTone} size="xs">
                {project.methodology}
              </Badge>
            </div>

            {/* Lead: avatar + first name */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <Avatar user={leadUser} size={20} />
              <span style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {leadFirstName}
              </span>
            </div>

            {/* Team AvatarStack */}
            <div>
              {teamMembers.length > 0 ? (
                <AvatarStack users={teamMembers} max={3} size={20} />
              ) : null}
            </div>

            {/* Progress bar + % */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              <div style={{ width: 48, height: 4, background: "var(--surface-2)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 2, background: "var(--primary)" }} />
              </div>
              <span style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--fg-muted)",
              }}>
                {progress}%
              </span>
            </div>

            {/* End date */}
            <div style={{ textAlign: "right", color: "var(--fg-muted)", fontSize: 12 }}>
              {endDate}
            </div>
          </div>
        )
      })}
    </div>
  )
}

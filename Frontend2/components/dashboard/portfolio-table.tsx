"use client"
import * as React from "react"
import { Badge, Avatar } from "@/components/primitives"
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
      {/* Header row — UI-sweep: standardize letterSpacing 0.4 -> 0.5 (uppercase Section labels) */}
      <div style={{
        display: "grid",
        // Method column widened 90 -> 140 to fit full Turkish template names
        // ("PRINCE2 (Proje Yönetimi)", "SAFe (Ölçekli Çevik)", …) — prototype
        // only carried short methodology slugs (scrum/kanban/waterfall).
        // columnGap prevents minor badge overflow from visually colliding
        // with the Yönetici/Lead column.
        gridTemplateColumns: "2fr 140px 120px 90px 90px",
        columnGap: 10,
        padding: "10px 16px",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "var(--fg-subtle)",
        fontWeight: 600,
        borderBottom: "1px solid var(--border)",
      }}>
        <div>{language === "tr" ? "Proje" : "Project"}</div>
        <div>{language === "tr" ? "Yöntem" : "Method"}</div>
        <div>{language === "tr" ? "Yönetici" : "Lead"}</div>
        <div style={{ textAlign: "right" }}>{language === "tr" ? "İlerleme" : "Progress"}</div>
        <div style={{ textAlign: "right" }}>{language === "tr" ? "Bitiş" : "End"}</div>
      </div>

      {/* Data rows */}
      {projects.map((project) => {
        // Badge tone still keys on methodology (Strategy ruleset), but the
        // visible label is the human template name picked at create-time
        // (V-Modeli, PRINCE2, …). Hidden — not enum-fallback'd — when the
        // project pre-dates the template-id backfill.
        const methodTone = getMethodologyTone(project.methodology)
        const templateLabel = project.processTemplateName ?? ""
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
              avatarUrl: project.managerAvatar,
            }
          : null
        const leadFirstName = project.managerName
          ? project.managerName.split(" ")[0]
          : ""

        // UI-sweep: empty AvatarStack column dropped from grid until project
        // member endpoint ships. Re-add when API delivers member list.

        const endDate = project.endDate
          ? new Date(project.endDate).toLocaleDateString(
              language === "tr" ? "tr-TR" : "en-US",
              { month: "short", day: "numeric" }
            )
          : "—"

        return (
          <div
            key={project.id}
            className="hover-row"
            style={{
              display: "grid",
              // Keep column track widths and gap aligned with the header above.
              gridTemplateColumns: "2fr 140px 120px 90px 90px",
              columnGap: 10,
              padding: "10px 16px",
              alignItems: "center",
              fontSize: 13,
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            {/* Project: key chip + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                  background: "var(--surface-2)",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-sm)",
                  flexShrink: 0,
                }}
              >
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

            {/* Method badge — minWidth:0 + overflow:hidden lets the badge
                truncate on the 30-char outliers ("V-Modeli + Scrum İç
                Döngüleri", "RAD (Hızlı Uygulama Geliştirme)") instead of
                overflowing into the Yönetici column. */}
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              {templateLabel && (
                <Badge tone={methodTone} size="xs" style={{ maxWidth: "100%" }}>
                  <span
                    title={templateLabel}
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                      minWidth: 0,
                    }}
                  >
                    {templateLabel}
                  </span>
                </Badge>
              )}
            </div>

            {/* Lead: avatar + first name. Phase 13 Plan 13-03 (D-D4) — Avatar
                forwards href when project.managerId is in scope so the manager
                badge becomes click-to-profile site-wide. */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <Avatar
                user={leadUser}
                size={20}
                href={project.managerId ? `/users/${project.managerId}` : undefined}
              />
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

            {/* Progress bar + % */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              <div style={{ width: 48, height: 4, background: "var(--surface-2)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 2, background: "var(--primary)" }} />
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                }}
              >
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

"use client"

// Members tab — Phase 11 ships a minimal Manager + info-row stub.
//
// The full member list requires a dedicated `GET /api/v1/projects/{id}/members`
// endpoint which is not yet implemented (per plan 11-04: "Additional members
// require GET /api/v1/projects/{id}/members (Phase 12+)."). Until that lands,
// this tab surfaces the project manager from the existing project DTO plus a
// helpful message so the 8-tab shell has a non-empty Members slot.

import { Avatar, Badge, Card, Section } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"

/**
 * Derive up-to-2-letter initials from a name string.
 * "Ayşe Oz" -> "AO", "Ayşe" -> "A", "" -> "?".
 */
function deriveInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

export function MembersTab({ project }: { project: Project }) {
  const { language: lang } = useApp()
  const managerName = project.managerName ?? (project.managerId ? `#${project.managerId}` : null)

  return (
    <Section title={lang === "tr" ? "Üyeler" : "Members"}>
      <Card padding={0}>
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-subtle)",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {lang === "tr" ? "PROJE YÖNETİCİSİ" : "PROJECT MANAGER"}
        </div>

        {managerName ? (
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Avatar
              user={{ initials: deriveInitials(managerName), avColor: 1 }}
              size={28}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
                {managerName}
              </div>
              <div>
                <Badge size="xs" tone="info">
                  {lang === "tr" ? "Yönetici" : "Manager"}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 20,
              color: "var(--fg-subtle)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {lang === "tr" ? "Yönetici atanmamış" : "No manager assigned"}
          </div>
        )}

        <div
          style={{
            padding: "12px 16px",
            fontSize: 11.5,
            color: "var(--fg-muted)",
            borderTop: "1px solid var(--border)",
            lineHeight: 1.5,
          }}
        >
          {lang === "tr"
            ? "Ek üyeler için GET /api/v1/projects/{id}/members uç noktası Faz 12+ kapsamında."
            : "Additional members require GET /api/v1/projects/{id}/members (Phase 12+)."}
        </div>
      </Card>
    </Section>
  )
}

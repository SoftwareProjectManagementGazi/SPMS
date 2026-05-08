"use client"

import { Avatar, Badge, Card, Section } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProjectMembers } from "@/hooks/use-projects"
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

// Avatar colour index cycles through the palette (1–8) by member list position
// so each member gets a distinct colour without storing preferences.
function avatarColor(index: number): number {
  return (index % 8) + 1
}

export function MembersTab({ project }: { project: Project }) {
  const { language: lang } = useApp()
  const { data: members = [], isLoading, isError } = useProjectMembers(project.id)

  return (
    <Section title={lang === "tr" ? "Üyeler" : "Members"}>
      <Card padding={0}>
        {/* Header row */}
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
          {lang === "tr"
            ? `PROJE ÜYELERİ · ${members.length}`
            : `PROJECT MEMBERS · ${members.length}`}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div
            style={{
              padding: 20,
              color: "var(--fg-muted)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {lang === "tr" ? "Yükleniyor..." : "Loading..."}
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div
            style={{
              padding: 20,
              color: "var(--fg-muted)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {lang === "tr"
              ? "Üyeler yüklenemedi."
              : "Could not load members."}
          </div>
        )}

        {/* Member list */}
        {!isLoading && !isError && members.length === 0 && (
          <div
            style={{
              padding: 20,
              color: "var(--fg-muted)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {lang === "tr" ? "Bu projede henüz üye yok." : "No members in this project yet."}
          </div>
        )}

        {!isLoading &&
          !isError &&
          members.map((member, index) => {
            const isManager = member.roleName?.toLowerCase() === "manager" ||
              member.id === project.managerId

            return (
              <div
                key={member.id}
                style={{
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom:
                    index < members.length - 1
                      ? "1px solid var(--border)"
                      : undefined,
                }}
              >
                <Avatar
                  user={{
                    initials: deriveInitials(member.fullName),
                    avColor: avatarColor(index),
                  }}
                  size={28}
                  href={`/users/${member.id}`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
                    {member.fullName}
                  </div>
                  <div>
                    <Badge size="xs" tone={isManager ? "info" : "neutral"}>
                      {isManager
                        ? lang === "tr" ? "Yönetici" : "Manager"
                        : member.roleName || (lang === "tr" ? "Üye" : "Member")}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
      </Card>
    </Section>
  )
}

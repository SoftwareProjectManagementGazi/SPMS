"use client"

// Phase 13 Plan 13-05 Task 1 — ProfileHeader card.
//
// Read-only profile header card per 13-CONTEXT D-C1..D-C8 +
// New_Frontend/src/pages/user-profile.jsx lines 32-48 (prototype design
// authority — D-00 quality bar):
//
//   [ Avatar 64 + ring ] [ name + role + Sen ] [ Düzenle (self only) ]
//                       [ email                                       ]
//                       [ Folder N proje · CheckSquare N görev · CircleCheck N tamamlanan ]
//
// Self detection: useAuth().user?.id === user.id (D-C6). The auth context
// returns id as a string; user.id from the summary endpoint is a number.
// Coerce both to strings before compare so "7" === 7's String(7) → true.
//
// Düzenle is the ONLY interactive control on the header (D-C1: read-only profile;
// inline edit is OUT — Settings owns it). Click → router.push("/settings").

import * as React from "react"
import { useRouter } from "next/navigation"
import { Folder, CheckSquare, CircleCheck, Edit } from "lucide-react"
import { Card, Avatar, Badge, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"

export interface ProfileHeaderUser {
  id: number
  full_name: string
  email: string
  role?: string | { name: string } | null
  avatar_url?: string | null
}

export interface ProfileHeaderStats {
  projectsTotal: number
  assignedTasks: number
  completedTasks: number
}

export interface ProfileHeaderProps {
  user: ProfileHeaderUser
  stats: ProfileHeaderStats
}

// Map a role name to a Badge tone (prototype line 37 verbatim).
function tonesFromRole(roleName: string): "danger" | "info" | "neutral" {
  const n = roleName.toLowerCase()
  if (n === "admin") return "danger"
  if (n.includes("project manager") || n.includes("manager")) return "info"
  return "neutral"
}

// Compute initials from "Yusuf Bayrakcı" → "YB" (Phase 8 D-02 pattern).
function initialsFrom(fullName: string): string {
  return (fullName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const { language } = useApp()
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // AuthUser.id is string ("7"); summary user.id is number (7). Coerce both
  // to strings so the comparison stays type-safe across the boundary.
  const isSelf = currentUser != null && String(currentUser.id) === String(user.id)

  // Role can be a plain string ("Admin") or an object ({ name: "Admin" }).
  const roleName =
    (typeof user.role === "string" ? user.role : user.role?.name) || ""

  const initials = initialsFrom(user.full_name)
  const avatarUser = { initials, avColor: ((user.id || 0) % 8) + 1 }

  return (
    <Card padding={24} className="profile-header-card">
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Avatar
          user={avatarUser}
          size={64}
          ring={isSelf}
          style={{ fontSize: 24 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: -0.4,
                margin: 0,
              }}
            >
              {user.full_name}
            </h1>
            {roleName && <Badge tone={tonesFromRole(roleName)}>{roleName}</Badge>}
            {isSelf && (
              <Badge tone="primary" size="xs">
                {T("Sen", "You")}
              </Badge>
            )}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--fg-muted)",
              marginTop: 4,
            }}
          >
            {user.email}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 8,
              fontSize: 12.5,
              color: "var(--fg-muted)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Folder size={12} />
              {stats.projectsTotal} {T("proje", "projects")}
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <CheckSquare size={12} />
              {stats.assignedTasks} {T("görev", "tasks")}
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <CircleCheck size={12} />
              {stats.completedTasks} {T("tamamlanan", "completed")}
            </span>
          </div>
        </div>
        {isSelf && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit size={13} />}
            onClick={() => router.push("/settings")}
            className="profile-header-edit-button"
          >
            {T("Düzenle", "Edit")}
          </Button>
        )}
      </div>
    </Card>
  )
}

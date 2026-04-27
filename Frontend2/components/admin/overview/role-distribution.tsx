"use client"

// Phase 14 Plan 14-02 Task 2 — Role distribution card (UI-SPEC §Surface B
// + prototype admin.jsx lines 102-118).
//
// Pure-CSS horizontal bars (NO recharts) — UI-SPEC §Spacing line 38 + acceptance
// criteria. Each row:
//   [color-dot] [role label] [count badge] [bar fill]
//
// Reads useAdminUsers (Plan 14-01 hook) and aggregates role counts client-side
// per CONTEXT D-Y1. Caveat: the current /auth/users endpoint (UserListDTO)
// doesn't include `role` — the role distribution gracefully degrades to 0
// counts until Plan 14-03 wires a richer /admin/users list endpoint.
// Documented in 14-02-SUMMARY.md handoff.
//
// Bar fill colors per UI-SPEC §Color rows 105-107:
//   - Admin           → var(--priority-critical)
//   - Project Manager → var(--status-progress)
//   - Member          → var(--fg-muted)

import * as React from "react"

import { Card, DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminT } from "@/lib/i18n/admin-keys"
import { useAdminUsers } from "@/hooks/use-admin-users"

interface UserLite {
  id: number
  role?: { name?: string } | string | null
}

function readRoleName(u: UserLite): string | null {
  if (!u || u.role == null) return null
  if (typeof u.role === "string") return u.role
  if (typeof u.role === "object" && typeof u.role.name === "string") {
    return u.role.name
  }
  return null
}

function bucketRole(name: string | null): "admin" | "pm" | "member" | "other" {
  if (!name) return "other"
  const v = name.toLowerCase()
  if (v === "admin") return "admin"
  if (v === "project manager" || v === "project_manager" || v === "pm")
    return "pm"
  if (v === "member") return "member"
  return "other"
}

export function RoleDistribution() {
  const { language } = useApp()
  const q = useAdminUsers()

  // Defensive normalization — useAdminUsers returns either an array or a paged
  // {items,total} shape depending on backend revision. Plan 14-03 will lock
  // the contract; for Plan 14-02 we tolerate both.
  const usersRaw = Array.isArray(q.data)
    ? (q.data as UserLite[])
    : ((q.data as { items?: UserLite[] } | undefined)?.items ?? [])

  const counts = React.useMemo(() => {
    const acc = { admin: 0, pm: 0, member: 0 }
    for (const u of usersRaw) {
      const bucket = bucketRole(readRoleName(u))
      if (bucket === "admin") acc.admin += 1
      else if (bucket === "pm") acc.pm += 1
      else if (bucket === "member") acc.member += 1
    }
    return acc
  }, [usersRaw])

  const total = Math.max(1, counts.admin + counts.pm + counts.member)

  const rows: Array<{
    key: "admin" | "pm" | "member"
    label: string
    count: number
    color: string
  }> = [
    {
      key: "admin",
      label: adminT("admin.overview.role_admin", language),
      count: counts.admin,
      color: "var(--priority-critical)",
    },
    {
      key: "pm",
      label: adminT("admin.overview.role_pm", language),
      count: counts.pm,
      color: "var(--status-progress)",
    },
    {
      key: "member",
      label: adminT("admin.overview.role_member", language),
      count: counts.member,
      color: "var(--fg-muted)",
    },
  ]

  return (
    <Card padding={16}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        {adminT("admin.overview.role_distribution_title", language)}
      </div>
      <DataState loading={q.isLoading} error={q.error}>
        <div>
          {rows.map((r) => {
            const pct = (r.count / total) * 100
            return (
              <div
                key={r.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  fontSize: 12.5,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: r.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{r.label}</span>
                <span
                  className="mono"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {r.count}
                </span>
                {/* Pure-CSS bar — outer track + inner fill at percentage width */}
                <div
                  style={{
                    width: 60,
                    height: 4,
                    background: "var(--surface-2)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: r.color,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </DataState>
    </Card>
  )
}

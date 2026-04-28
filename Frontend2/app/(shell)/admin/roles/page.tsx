"use client"

// Phase 14 Plan 14-04 Task 1 — /admin/roles (Roller) sub-route page.
//
// RBAC-deferred placeholder per CONTEXT D-A2..A5:
//   - 4 system role cards (Admin / PM / Member / Guest) with REWRITTEN
//     descriptions reflecting v2.0 reality (Admin = system-wide; PM/Member =
//     project-scoped via Team.leader_id) — replaces prototype's misleading
//     "all roles are global" implication.
//   - Guest card visually disabled with v3.0 Badge (cursor:not-allowed +
//     opacity 0.6 + warning Badge in card header).
//   - 5th "Yeni rol oluştur" card = dashed-border placeholder + tooltip
//     "Granüler RBAC v3.0 sürümünde gelecek" (D-A4).
//   - Page-level AlertBanner explains placeholder semantics so admins don't
//     mistake the page for a functional CRUD surface.
//
// Per-role user counts read from useAdminUsers() aggregate (D-Y1 — NO new
// endpoint; reuses Plan 14-01 Wave 0 hook). Guest count is 0 in v2.0
// (no Guest role in the users.role enum yet).
//
// Plan 14-17 (Cluster E gap closure) — TWO concerns wired here:
//
//   A. Count source fix (Approach 1). The default useAdminUsers() returned
//      the FIRST PAGE (~50 users), making per-role counts undercount past
//      page 1. We now request `{limit: 1000}` so counts cover the full
//      typical population. This is a defensive ceiling — past 1000 users
//      counts truncate silently, which is why concern B is mandatory.
//
//   B. MANDATORY truncation AlertBanner (N-3). When the response's `total`
//      field exceeds 1000, render an AlertBanner WARNING that the per-role
//      counts are based on the first 1000 users. Without this banner the
//      counts silently lie. v2.1 candidate: dedicated /admin/users/role-counts
//      endpoint (Approach 2) bypasses the limit entirely.
//
//   C. Loading state propagated to RoleCard (em-dash fallback in
//      role-card.tsx — null-safety guard via Number.isFinite). When
//      useAdminUsers().isLoading is true, the cards render `userCount={undefined}`
//      and the card itself draws an em-dash placeholder.
//
// AdminLayout (Plan 14-02) wraps this page automatically — page header +
// NavTabs strip + admin-only route guard inherited via the layout segment.

import * as React from "react"
import { ShieldCheck, Briefcase, User, Eye } from "lucide-react"

import { AlertBanner } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

import { RoleCard } from "@/components/admin/roles/role-card"
import { NewRolePlaceholderCard } from "@/components/admin/roles/new-role-placeholder-card"

interface AdminUserShape {
  id: number
  is_active?: boolean
  role?: { name?: string }
}

export default function AdminRolesPage() {
  const { language } = useApp()
  // Plan 14-17 — limit=1000 defensive ceiling so per-role counts cover the
  // full typical population (the default page size of ~50 was the gap that
  // produced UAT Test 19's "Kullanıcı: 0 / Kullanıcı: ?" symptoms). Past
  // 1000 users the truncation AlertBanner kicks in (N-3 below).
  const usersQ = useAdminUsers({ limit: 1000 })

  // Defensive shape extraction — useAdminUsers may return either the legacy
  // /auth/users array shape OR the Plan 14-03 /admin/users {items, total}
  // shape. Tolerate both for graceful degradation (matches stat-cards.tsx
  // pattern from Plan 14-02).
  const users: AdminUserShape[] = React.useMemo(() => {
    const data = usersQ.data as unknown
    if (Array.isArray(data)) return data as AdminUserShape[]
    return (data as { items?: AdminUserShape[] } | undefined)?.items ?? []
  }, [usersQ.data])

  // Plan 14-17 — N-3 truncation detection. The response shape is
  // {items, total}; if total > 1000 the per-role counts (derived from the
  // first 1000 items) are silently incomplete. Banner rendered below.
  const totalUsers: number = React.useMemo(() => {
    const data = usersQ.data as unknown
    if (Array.isArray(data)) return (data as unknown[]).length
    return (data as { total?: number } | undefined)?.total ?? 0
  }, [usersQ.data])
  const isCountTruncated = totalUsers > 1000

  // Plan 14-17 — when isLoading we want RoleCard's em-dash fallback to
  // render. Passing `undefined` (instead of 0) makes the loading state
  // visually distinct from the legitimate "0 admins" case.
  const isLoadingCounts = usersQ.isLoading

  // Per-role counts (case-insensitive match on role.name; tolerates
  // backend's "Project Manager" string and any future casing drift).
  const adminCount = isLoadingCounts
    ? undefined
    : users.filter(
        (u) => (u.role?.name ?? "").toLowerCase() === "admin",
      ).length
  const pmCount = isLoadingCounts
    ? undefined
    : users.filter(
        (u) => (u.role?.name ?? "").toLowerCase() === "project manager",
      ).length
  const memberCount = isLoadingCounts
    ? undefined
    : users.filter(
        (u) => (u.role?.name ?? "").toLowerCase() === "member",
      ).length
  // No Guest role in v2.0 enum — 0 always (NOT undefined; the empty count
  // is meaningful, not a loading state).
  const guestCount = 0

  // Banner body with {total} substitution. The i18n key value contains
  // "{total}" as a literal placeholder string — replaced at render time so
  // the admin sees the real magnitude (e.g., 1500) and not just "first 1000".
  const truncationBody = adminRbacT(
    "admin.roles.count_truncation_warning_body",
    language,
  ).replace("{total}", String(totalUsers))

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Page-level AlertBanner — D-Y1 / UI-SPEC §Surface D row 374.
          Explains the v3.0 RBAC defer so admins don't mistake the page for
          a functional CRUD surface. */}
      <AlertBanner tone="info">
        {adminRbacT("admin.roles.alert_banner_body", language)}
      </AlertBanner>

      {/* Plan 14-17 — N-3 MANDATORY truncation banner. Only renders when
          totalUsers > 1000 (Approach 1 ceiling). Without this banner the
          per-role counts silently undercount; with it the admin knows
          exactly how many users are missing from the slice.
          Wrapped in a div with role='alert' + data-testid because the
          AlertBanner primitive only forwards className/style — wrapper
          adds the ARIA semantics + RTL hook without touching shared code. */}
      {isCountTruncated && (
        <div role="alert" data-testid="role-count-truncation-banner">
          <AlertBanner tone="warning">
            <strong>
              {adminRbacT(
                "admin.roles.count_truncation_warning_title",
                language,
              )}
              :
            </strong>{" "}
            {truncationBody}
          </AlertBanner>
        </div>
      )}

      {/* Role cards grid — auto-fill responsive (≥3 per row at desktop;
          gracefully wraps to 2 at tablet, 1 at mobile). gap 14 = verbatim
          prototype line 211. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {/* Admin — --priority-critical icon fill (UI-SPEC §Color line 167) */}
        <RoleCard
          id="admin"
          icon={<ShieldCheck size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--priority-critical) 18%, transparent)"
          iconColor="var(--priority-critical)"
          name={adminRbacT("admin.roles.admin_name", language)}
          description={adminRbacT("admin.roles.admin_description", language)}
          userCount={adminCount}
        />

        {/* Project Manager — --status-progress icon fill (UI-SPEC line 180) */}
        <RoleCard
          id="pm"
          icon={<Briefcase size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--status-progress) 18%, transparent)"
          iconColor="var(--status-progress)"
          name={adminRbacT("admin.roles.pm_name", language)}
          description={adminRbacT("admin.roles.pm_description", language)}
          userCount={pmCount}
        />

        {/* Member — --fg-muted icon fill (UI-SPEC line 184) */}
        <RoleCard
          id="member"
          icon={<User size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--fg-muted) 14%, transparent)"
          iconColor="var(--fg-muted)"
          name={adminRbacT("admin.roles.member_name", language)}
          description={adminRbacT("admin.roles.member_description", language)}
          userCount={memberCount}
        />

        {/* Guest — disabled + v3.0 Badge per D-A5 (Eye icon = read-only
            affordance; --fg-subtle for "deferred" visual cue). */}
        <RoleCard
          id="guest"
          icon={<Eye size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--fg-subtle) 14%, transparent)"
          iconColor="var(--fg-subtle)"
          name={adminRbacT("admin.roles.guest_name", language)}
          description={adminRbacT("admin.roles.guest_description", language)}
          userCount={guestCount}
          disabled
          v3Badge
        />

        {/* "Yeni rol oluştur" 5th card — dashed-border placeholder per D-A4. */}
        <NewRolePlaceholderCard />
      </div>
    </div>
  )
}

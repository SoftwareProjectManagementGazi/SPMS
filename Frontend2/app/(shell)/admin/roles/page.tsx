"use client"

// Phase 14 Plan 14-04 (placeholder) → Phase 15 Plan 15-10 (RBAC active)
// — /admin/roles (Roller) sub-route page.
//
// Layers 6 + 7 of D-2.7 atomic 7-layer placeholder uplift:
//   - Layer 6: NewRolePlaceholderCard → NewRoleModalTrigger. The trigger
//     fires onClick to open RoleCreateModal (Plan 15-11 wires the modal
//     mount). For Plan 15-10 we just hold a useState flag; the modal
//     itself ships in Plan 15-11.
//   - Layer 7: Guest card no longer rendered with `disabled` + `v3Badge`
//     props. It's now an active read-only system role; the Sistem badge
//     comes from `is_system_role` (Plan 15-09 RoleCard prop accepts it).
//
// Plan 14-17 (Cluster E gap closure) — count source + N-3 truncation banner
// + Görüntüle cross-link wiring is preserved unchanged. The per-role count
// pipeline still uses useAdminUsers({limit: 1000}) and renders the
// truncation AlertBanner when total > 1000 (UAT Test 19 invariant).
//
// AdminLayout (Plan 14-02) wraps this page automatically.

import * as React from "react"
import { ShieldCheck, Briefcase, User, Eye } from "lucide-react"

import { AlertBanner } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

import { RoleCard } from "@/components/admin/roles/role-card"
import { NewRoleModalTrigger } from "@/components/admin/roles/new-role-modal-trigger"

interface AdminUserShape {
  id: number
  is_active?: boolean
  role?: { name?: string }
}

export default function AdminRolesPage() {
  const { language } = useApp()
  // Plan 14-17 — limit=500 (backend hard cap) so per-role counts cover the
  // full typical population (the default page size of ~50 was the gap that
  // produced UAT Test 19's "Kullanıcı: 0 / Kullanıcı: ?" symptoms). Past
  // 500 users the truncation AlertBanner kicks in (N-3 below).
  const usersQ = useAdminUsers({ limit: 500 })

  // Plan 15-10 — RoleCreateModal open state. Plan 15-11 will mount the
  // <RoleCreateModal open={createOpen} onClose={...}/> inside this page;
  // for Plan 15-10 we just hold the flag so the trigger has a real
  // onClick destination.
  const [createOpen, setCreateOpen] = React.useState(false)
  // Eslint hint — the value is intentionally read once Plan 15-11 wires
  // the modal. Reference it so TS doesn't flag the variable as unused.
  void createOpen

  // Defensive shape extraction — useAdminUsers may return either the legacy
  // /auth/users array shape OR the Plan 14-03 /admin/users {items, total}
  // shape. Tolerate both for graceful degradation.
  const users: AdminUserShape[] = React.useMemo(() => {
    const data = usersQ.data as unknown
    if (Array.isArray(data)) return data as AdminUserShape[]
    return (data as { items?: AdminUserShape[] } | undefined)?.items ?? []
  }, [usersQ.data])

  // Plan 14-17 — N-3 truncation detection.
  const totalUsers: number = React.useMemo(() => {
    const data = usersQ.data as unknown
    if (Array.isArray(data)) return (data as unknown[]).length
    return (data as { total?: number } | undefined)?.total ?? 0
  }, [usersQ.data])
  const isCountTruncated = totalUsers > 500

  // Plan 14-17 — passing `undefined` while loading (em-dash fallback in
  // RoleCard handles render).
  const isLoadingCounts = usersQ.isLoading

  // Per-role counts (case-insensitive match on role.name).
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
  // No Guest role population in v2.0 enum — 0 always.
  const guestCount = 0

  // Banner body with {total} substitution.
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
      {/* Page-level AlertBanner — Plan 15-10 active-state copy. */}
      <AlertBanner tone="info">
        {adminRbacT("admin.roles.alert_banner_body", language)}
      </AlertBanner>

      {/* Plan 14-17 — N-3 MANDATORY truncation banner. */}
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
        {/* Admin — --priority-critical icon fill */}
        <RoleCard
          id="admin"
          icon={<ShieldCheck size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--priority-critical) 18%, transparent)"
          iconColor="var(--priority-critical)"
          name={adminRbacT("admin.roles.admin_name", language)}
          description={adminRbacT("admin.roles.admin_description", language)}
          userCount={adminCount}
          isSystemRole
        />

        {/* Project Manager */}
        <RoleCard
          id="pm"
          icon={<Briefcase size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--status-progress) 18%, transparent)"
          iconColor="var(--status-progress)"
          name={adminRbacT("admin.roles.pm_name", language)}
          description={adminRbacT("admin.roles.pm_description", language)}
          userCount={pmCount}
          isSystemRole
        />

        {/* Member */}
        <RoleCard
          id="member"
          icon={<User size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--fg-muted) 14%, transparent)"
          iconColor="var(--fg-muted)"
          name={adminRbacT("admin.roles.member_name", language)}
          description={adminRbacT("admin.roles.member_description", language)}
          userCount={memberCount}
          isSystemRole
        />

        {/* Guest — Plan 15-10 layer 7: NO `disabled` + NO `v3Badge` props.
            Renders as an active read-only card with the Sistem badge from
            isSystemRole=true. The Görüntüle link is intentionally omitted
            on cards with no users (guestCount === 0) — see RoleCard for
            the empty-state guard. */}
        <RoleCard
          id="guest"
          icon={<Eye size={16} aria-hidden="true" />}
          iconBgColor="color-mix(in oklch, var(--fg-subtle) 14%, transparent)"
          iconColor="var(--fg-subtle)"
          name={adminRbacT("admin.roles.guest_name", language)}
          description={adminRbacT("admin.roles.guest_description", language)}
          userCount={guestCount}
          isSystemRole
        />

        {/* Plan 15-10 layer 6 — NewRoleModalTrigger replaces the Phase 14
            14-04 NewRolePlaceholderCard. onClick sets createOpen; Plan
            15-11 will wire the actual <RoleCreateModal /> mount. */}
        <NewRoleModalTrigger onClick={() => setCreateOpen(true)} />
      </div>
    </div>
  )
}

"use client"

// Phase 14 Plan 14-04 (placeholder) → Phase 15 Plan 15-10 (RBAC active)
// → Phase 15 Plan 15-11 (Roles tab full CRUD modals wired).
// — /admin/roles (Roller) sub-route page.
//
// Layers 6 + 7 of D-2.7 atomic 7-layer placeholder uplift:
//   - Layer 6: NewRolePlaceholderCard → NewRoleModalTrigger. Plan 15-11
//     wires the actual <RoleCreateModal /> mount against the createOpen
//     useState flag.
//   - Layer 7: Guest card no longer rendered with `disabled` + `v3Badge`
//     props. It's now an active read-only system role; the Sistem badge
//     comes from `is_system_role`.
//
// Plan 15-11 — Custom role CRUD modals wired:
//   - Yeni rol: NewRoleModalTrigger → RoleCreateModal (createOpen state).
//   - Düzenle: RoleCard.onEdit → RoleEditModal (editingRole state).
//   - Sil: RoleCard.onDelete → RoleDeleteConfirm (deletingRole state with
//     affectedUserCount sourced from the existing Plan 14-17 count pipeline).
//
// Plan 14-17 (Cluster E gap closure) — count source + N-3 truncation banner
// + Görüntüle cross-link wiring is preserved unchanged. The per-role count
// pipeline still uses useAdminUsers({limit: 1000}) and renders the
// truncation AlertBanner when total > 1000 (UAT Test 19 invariant). Plan
// 15-11 reuses the same `users` array to compute the affected-user count
// for custom-role deletion confirmation dialogs.
//
// AdminLayout (Plan 14-02) wraps this page automatically.

import * as React from "react"
import { ShieldCheck, Briefcase, User, Eye } from "lucide-react"

import { AlertBanner } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { useRoles } from "@/hooks/use-roles"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

import { RoleCard } from "@/components/admin/roles/role-card"
import { NewRoleModalTrigger } from "@/components/admin/roles/new-role-modal-trigger"
import { RoleCreateModal } from "@/components/admin/roles/role-create-modal"
import { RoleEditModal } from "@/components/admin/roles/role-edit-modal"
import { RoleDeleteConfirm } from "@/components/admin/roles/role-delete-confirm"
import type { Role } from "@/services/admin-rbac-service"

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
  // Plan 15-11 — useRoles is the source of custom-role rendering. The
  // 4 system role cards (Admin/PM/Member/Guest) remain hardcoded for v2.0;
  // any role with is_system_role=false is rendered as a custom RoleCard
  // with onEdit/onDelete wired to the modal state setters below.
  const rolesQ = useRoles()

  // Plan 15-11 — modal state. Three independent modal slots so the user
  // can dismiss one without affecting the others.
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = React.useState<Role | null>(null)

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
  const isCountTruncated = totalUsers > 1000

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

  // Plan 15-11 — custom role list (filter out system roles; system rolleri
  // are still rendered as the 4 hardcoded cards below).
  const customRoles: Role[] = React.useMemo(() => {
    return (rolesQ.data?.items ?? []).filter((r) => !r.is_system_role)
  }, [rolesQ.data])

  // Plan 15-11 — affected-user count for custom roles. Computed from the
  // SAME users array Plan 14-17 already loads, so no extra round-trip.
  // Returns 0 if the user array is still loading; the dialog body shows
  // 0 → "Bu rolü silmek 0 kullanıcıyı Member rolüne taşıyacak" — accurate
  // when no users are assigned.
  const countUsersForRole = React.useCallback(
    (roleName: string): number => {
      if (isLoadingCounts) return 0
      const target = roleName.toLowerCase()
      return users.filter(
        (u) => (u.role?.name ?? "").toLowerCase() === target,
      ).length
    },
    [users, isLoadingCounts],
  )

  const deletingRoleAffectedCount = deletingRole
    ? countUsersForRole(deletingRole.name)
    : 0

  // Custom role icon/color → fallback to the User icon + --fg-muted token
  // when icon_key/color_token are NULL (D-2.8 default for legacy seeds).
  // The icon mapping below mirrors RoleIconPicker's 8 keys; unknown keys
  // fall through to User (defensive).
  const customIcon = (key: string | null | undefined) => {
    switch (key) {
      case "shield-check":
        return <ShieldCheck size={16} aria-hidden="true" />
      case "briefcase":
        return <Briefcase size={16} aria-hidden="true" />
      case "eye":
        return <Eye size={16} aria-hidden="true" />
      default:
        return <User size={16} aria-hidden="true" />
    }
  }
  const customColor = (token: string | null | undefined): string =>
    token || "--fg-muted"

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

        {/* Plan 15-11 — custom role cards from useRoles. Each renders with
            its admin-supplied icon + color token; onEdit/onDelete wire to
            the modal state setters below. The userCount fallback uses the
            same Plan 14-17 count pipeline as the system roles. */}
        {customRoles.map((role) => (
          <RoleCard
            key={role.id}
            id={String(role.id)}
            icon={customIcon(role.icon_key)}
            iconBgColor={`color-mix(in oklch, var(${customColor(role.color_token)}) 18%, transparent)`}
            iconColor={`var(${customColor(role.color_token)})`}
            name={role.name}
            description={role.description ?? ""}
            userCount={
              isLoadingCounts ? undefined : countUsersForRole(role.name)
            }
            onEdit={() => setEditingRole(role)}
            onDelete={() => setDeletingRole(role)}
          />
        ))}

        {/* Plan 15-10 layer 6 — NewRoleModalTrigger replaces the Phase 14
            14-04 NewRolePlaceholderCard. Plan 15-11 wires the actual
            <RoleCreateModal /> mount via createOpen state below. */}
        <NewRoleModalTrigger onClick={() => setCreateOpen(true)} />
      </div>

      {/* Plan 15-11 — Modal mounts. Each is independent so dismiss + edit +
          delete can be open in parallel paths if needed (in practice the
          user opens at most one at a time). */}
      <RoleCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <RoleEditModal
        open={editingRole !== null}
        role={editingRole}
        onClose={() => setEditingRole(null)}
      />
      <RoleDeleteConfirm
        open={deletingRole !== null}
        role={deletingRole}
        affectedUserCount={deletingRoleAffectedCount}
        onClose={() => setDeletingRole(null)}
      />
    </div>
  )
}

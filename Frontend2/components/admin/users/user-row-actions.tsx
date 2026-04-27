"use client"

// Phase 14 Plan 14-03 — Per-row MoreH menu (UI-SPEC §Surface C lines 357-362).
//
// 5 menu items (verbatim per UI-SPEC):
//   1. Şifre sıfırla        → useResetPassword.mutate(user.id) — no confirm
//   2. Rolü değiştir        → submenu (Admin / PM / Member) via secondary
//                             MoreMenu opened on click; useChangeRole.mutate.
//   3. Devre dışı bırak     → ConfirmDialog tone="danger" → useDeactivateUser
//      (or Tekrar aktif et if user.is_active === false → useBulkAction
//      action="activate")
//   4. Sil                  → SOFT-DISABLED with tooltip "v2.1'de aktif olacak"
//                             (CONTEXT D-A6 enumerates 5 endpoints, no DELETE).
//
// Consumes Plan 14-01's shared MoreMenu primitive — DOES NOT rebuild.

import * as React from "react"

import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import {
  MoreMenu,
  type MoreMenuItem,
} from "@/components/admin/shared/more-menu"
import { useDeactivateUser } from "@/hooks/use-deactivate-user"
import { useResetPassword } from "@/hooks/use-reset-password"
import { useChangeRole } from "@/hooks/use-change-role"
import { useBulkAction } from "@/hooks/use-bulk-action"
import { useApp } from "@/context/app-context"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
import type { AdminRole } from "@/services/admin-user-service"

export interface UserRowActionsUser {
  id: number
  full_name?: string
  email?: string
  is_active?: boolean
}

export interface UserRowActionsProps {
  user: UserRowActionsUser
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const resetM = useResetPassword()
  const changeRoleM = useChangeRole()
  const deactivateM = useDeactivateUser()
  const bulkActionM = useBulkAction()

  // ConfirmDialog state for Devre dışı bırak / Tekrar aktif et flows.
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  // Nested submenu state for "Rolü değiştir".
  const [roleSubmenuOpen, setRoleSubmenuOpen] = React.useState(false)

  const isActive = user.is_active !== false
  const userDisplayName = user.full_name || user.email || `#${user.id}`

  // ---- Menu items (5 entries per UI-SPEC §Surface C) ----
  const items: MoreMenuItem[] = [
    {
      id: "reset_password",
      label: adminUsersT("admin.users.more_reset_password", lang),
      onClick: () => resetM.mutate(user.id),
    },
    {
      id: "change_role",
      label: adminUsersT("admin.users.more_change_role", lang),
      onClick: () => setRoleSubmenuOpen(true),
    },
    {
      id: "deactivate",
      label: isActive
        ? adminUsersT("admin.users.more_deactivate", lang)
        : adminUsersT("admin.users.more_reactivate", lang),
      onClick: () => setConfirmOpen(true),
    },
    {
      id: "delete",
      label: adminUsersT("admin.users.more_delete", lang),
      // CONTEXT D-A6 enumerates 5 admin user endpoints. DELETE is NOT in the
      // list — soft-disable with tooltip per threat T-14-03-06.
      disabled: true,
      destructive: true,
      onClick: () => {
        /* no-op while disabled (defense-in-depth) */
      },
    },
  ]

  // ---- Role submenu items (Admin / PM / Member) ----
  const roleSubmenuItems: MoreMenuItem[] = (
    ["Admin", "Project Manager", "Member"] as AdminRole[]
  ).map((role) => ({
    id: `change_role_${role}`,
    label: role,
    onClick: () => {
      changeRoleM.mutate({ userId: user.id, role })
      setRoleSubmenuOpen(false)
    },
  }))

  // Confirm dialog body uses TR/EN copy + name interpolation.
  const confirmTitle = isActive
    ? adminUsersT("admin.users.confirm_deactivate_title", lang)
    : adminUsersT("admin.users.confirm_reactivate_title", lang)
  const confirmBodyTpl = isActive
    ? adminUsersT("admin.users.confirm_deactivate_body", lang)
    : adminUsersT("admin.users.confirm_reactivate_body", lang)
  const confirmBody = confirmBodyTpl.replace("{name}", userDisplayName)

  const handleConfirm = () => {
    setConfirmOpen(false)
    if (isActive) {
      deactivateM.mutate(user.id)
    } else {
      // Re-activate path: bulk-action with action="activate" on a single user.
      bulkActionM.mutate({
        user_ids: [user.id],
        action: "activate",
      })
    }
  }

  return (
    <span style={{ display: "inline-flex" }}>
      <MoreMenu
        items={items}
        ariaLabel={adminUsersT("admin.users.more_change_role", lang)}
      />

      {/* Submenu — open as a portal-style overlay; reuses MoreMenu primitive
          but pre-opened. We render it inline as a separate menu surface. */}
      {roleSubmenuOpen && (
        <RoleChangeSubmenu
          items={roleSubmenuItems}
          onDismiss={() => setRoleSubmenuOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={adminUsersT("admin.users.confirm_confirm", lang)}
        cancelLabel={adminUsersT("admin.users.confirm_cancel", lang)}
        // Both deactivate AND reactivate use tone="danger" because the
        // mutation is irreversible-from-the-user's-side and the visual
        // weight should match. (Reactivate is harmless to the user but the
        // admin still deserves the same confirm gravity.)
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </span>
  )
}

/**
 * Inline role-change submenu — a tiny wrapper that renders a popover-style
 * dropdown with the 3 role choices. Click-outside + ESC dismiss handled
 * via a wrapper div with a small useEffect.
 */
function RoleChangeSubmenu({
  items,
  onDismiss,
}: {
  items: MoreMenuItem[]
  onDismiss: () => void
}) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        onDismiss()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss()
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", onKey)
    }
  }, [onDismiss])

  return (
    <div
      ref={wrapperRef}
      role="menu"
      style={{
        position: "absolute",
        // Anchor a bit further to the left so the submenu doesn't overlap the
        // primary MoreH menu. 28px width of the icon + 4px gap → 32px.
        marginTop: 4,
        marginLeft: -32,
        minWidth: 160,
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-lg)",
        padding: 4,
        zIndex: 60,
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={item.onClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: "var(--radius-sm)",
            fontSize: 12.5,
            color: "var(--fg)",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

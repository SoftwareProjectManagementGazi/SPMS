"use client"

// Phase 14 Plan 14-03 — Per-row MoreH menu (UI-SPEC §Surface C lines 357-362).
//
// 5 menu items (verbatim per UI-SPEC):
//   1. Şifre sıfırla        → useResetPassword.mutate(user.id) — no confirm
//   2. Rolü değiştir        → searchable popover with ALL roles (system + custom)
//                             via useRoles(); useChangeRole.mutate({roleId}).
//   3. Devre dışı bırak     → ConfirmDialog tone="danger" → useDeactivateUser
//      (or Tekrar aktif et if user.is_active === false → useBulkAction
//      action="activate")
//   4. Sil                  → SOFT-DISABLED with tooltip "v2.1'de aktif olacak"
//                             (CONTEXT D-A6 enumerates 5 endpoints, no DELETE).
//
// Phase 15 Plan 15-11 hotfix — replaces hardcoded ["Admin","PM","Member"] with
// useRoles() so custom Plan 15-11 roles (e.g. "Kodlamacı") appear in the
// submenu. Submenu now renders as a fixed-position popover anchored to the
// trigger via getBoundingClientRect, so it never overflows the viewport edge,
// and includes a search input for fast filtering across many roles.
//
// Phase 15 Plan 15-11 D-2.9 — Self-edit prevention UI: when this row's user
// is the currently logged-in admin, the "Rolü değiştir" item is disabled to
// prevent the admin from accidentally changing their own role and locking
// themselves out (e.g., demoting Admin → Member). The backend
// ChangeUserRoleUseCase ALSO raises PermissionError on self-edit (Phase 15
// Plan 15-05 D-2.9 server-side gate); this UI guard is defense in depth and
// makes the prohibited action visually obvious BEFORE the user clicks.

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
import { useRoles } from "@/hooks/use-roles"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
import type { Role } from "@/services/admin-rbac-service"

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
  const { user: currentUser } = useAuth()
  const isSelf =
    currentUser != null &&
    Number((currentUser as { id?: string | number }).id) === user.id

  const resetM = useResetPassword()
  const changeRoleM = useChangeRole()
  const deactivateM = useDeactivateUser()
  const bulkActionM = useBulkAction()
  const rolesQ = useRoles()

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [rolePickerOpen, setRolePickerOpen] = React.useState(false)
  // Anchor rect for the role-picker popover (computed at open time so the
  // popover positions next to the MoreH icon — never the viewport edge).
  const triggerRef = React.useRef<HTMLSpanElement>(null)

  const isActive = user.is_active !== false
  const userDisplayName = user.full_name || user.email || `#${user.id}`

  const items: MoreMenuItem[] = [
    {
      id: "reset_password",
      label: adminUsersT("admin.users.more_reset_password", lang),
      onClick: () => resetM.mutate(user.id),
    },
    {
      id: "change_role",
      label: adminUsersT("admin.users.more_change_role", lang),
      disabled: isSelf,
      onClick: () => {
        if (isSelf) return
        setRolePickerOpen(true)
      },
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
      disabled: true,
      destructive: true,
      onClick: () => {},
    },
  ]

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
      bulkActionM.mutate({ user_ids: [user.id], action: "activate" })
    }
  }

  const handlePickRole = (roleId: number) => {
    changeRoleM.mutate({ userId: user.id, roleId })
    setRolePickerOpen(false)
  }

  return (
    <span ref={triggerRef} style={{ display: "inline-flex" }}>
      <MoreMenu
        items={items}
        ariaLabel={adminUsersT("admin.users.more_change_role", lang)}
      />

      {rolePickerOpen && (
        <RoleChangePicker
          anchorEl={triggerRef.current}
          roles={rolesQ.data?.items ?? []}
          isLoading={rolesQ.isLoading}
          lang={lang}
          onPick={handlePickRole}
          onDismiss={() => setRolePickerOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={adminUsersT("admin.users.confirm_confirm", lang)}
        cancelLabel={adminUsersT("admin.users.confirm_cancel", lang)}
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </span>
  )
}

/**
 * Searchable role picker — fixed-position popover anchored to the trigger.
 *
 * Positioning: computed from anchorEl.getBoundingClientRect(). When the
 * trigger is near the right viewport edge we right-align the popover so it
 * never overflows. Width 240, height capped at 320 with internal scroll.
 *
 * Search: case-insensitive substring match on role.name. Filtered list is
 * capped at the natural list length; matches show in API order (system roles
 * first, then custom alphabetical per backend Plan 15-06 ordering).
 *
 * Dismiss: click outside, ESC, or after pick.
 */
function RoleChangePicker({
  anchorEl,
  roles,
  isLoading,
  lang,
  onPick,
  onDismiss,
}: {
  anchorEl: HTMLElement | null
  roles: Role[]
  isLoading: boolean
  lang: "tr" | "en"
  onPick: (roleId: number) => void
  onDismiss: () => void
}) {
  const [query, setQuery] = React.useState("")
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Compute fixed position from anchor rect with right-edge fallback.
  const position = React.useMemo(() => {
    const POPOVER_W = 240
    const POPOVER_H = 320
    const MARGIN = 8
    if (!anchorEl) {
      return { top: 0, left: 0, right: undefined as number | undefined }
    }
    const rect = anchorEl.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let top = rect.bottom + 4
    if (top + POPOVER_H > vh - MARGIN) {
      top = Math.max(MARGIN, rect.top - POPOVER_H - 4)
    }
    let left: number | undefined = rect.left
    let right: number | undefined
    if (rect.left + POPOVER_W > vw - MARGIN) {
      // Anchor to right edge so popover stays inside viewport
      left = undefined
      right = Math.max(MARGIN, vw - rect.right)
    }
    return { top, left, right }
  }, [anchorEl])

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return roles
    return roles.filter((r) => r.name.toLowerCase().includes(q))
  }, [roles, query])

  const placeholder = lang === "tr" ? "Rol ara..." : "Search role..."
  const emptyText = lang === "tr" ? "Eşleşen rol yok" : "No matching role"
  const loadingText = lang === "tr" ? "Yükleniyor..." : "Loading..."

  return (
    <div
      ref={wrapperRef}
      role="dialog"
      aria-label={lang === "tr" ? "Rol seç" : "Pick role"}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        right: position.right,
        width: 240,
        maxHeight: 320,
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 8,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12.5,
            background: "var(--surface-2)",
            color: "var(--fg)",
            outline: "none",
          }}
        />
      </div>

      <div
        role="listbox"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 4,
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: "8px 10px",
              fontSize: 12,
              color: "var(--fg-muted)",
            }}
          >
            {loadingText}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "8px 10px",
              fontSize: 12,
              color: "var(--fg-muted)",
            }}
          >
            {emptyText}
          </div>
        ) : (
          filtered.map((role) => (
            <button
              key={role.id}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => onPick(role.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {role.name}
              </span>
              {role.is_system_role && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--fg-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1px 5px",
                    flexShrink: 0,
                  }}
                >
                  {lang === "tr" ? "Sistem" : "System"}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

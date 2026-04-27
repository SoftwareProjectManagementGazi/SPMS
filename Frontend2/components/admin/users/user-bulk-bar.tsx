"use client"

// Phase 14 Plan 14-03 — Bulk-select sticky bar (D-B7).
//
// Renders only when selectedIds.length > 0. Top-of-table position (matches
// prototype's bulk-select pattern; UI-SPEC §Surface C lines 363-366).
//
// Components:
//   - "{N} seçili" label
//   - Bulk Deactivate button → ConfirmDialog tone="danger" → useBulkAction
//     action="deactivate". Body lists first 5 selected names + "+ {N-5} daha".
//   - Bulk Role Change dropdown → 3 sub-buttons (Admin / PM / Member) →
//     useBulkAction action="role_change" payload {role}. NO confirm
//     (per behavior contract; bulk role change is reversible).
//   - Vazgeç → clears selection.
//
// All bulk operations honor backend's atomic semantics (D-B7) — the
// useBulkAction hook reflects the all-or-nothing contract via summary toast.

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/primitives"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import { MoreMenu, type MoreMenuItem } from "@/components/admin/shared/more-menu"
import { useBulkAction } from "@/hooks/use-bulk-action"
import { useApp } from "@/context/app-context"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
import type { AdminRole } from "@/services/admin-user-service"

export interface UserBulkBarUser {
  id: number
  full_name?: string
  email?: string
}

export interface UserBulkBarProps {
  selectedIds: number[]
  // Map of id → user record so we can render names in the confirm body.
  userIndex: Map<number, UserBulkBarUser>
  onClear: () => void
}

const FIRST_N_NAMES = 5

export function UserBulkBar({
  selectedIds,
  userIndex,
  onClear,
}: UserBulkBarProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] =
    React.useState(false)
  const bulkActionM = useBulkAction()

  // Hide entirely when nothing selected. Component tree stays mounted at the
  // call site to avoid layout shifts; we just render nothing.
  if (selectedIds.length === 0) return null

  const selectedLabel = adminUsersT("admin.users.bulk_selected", lang).replace(
    "{N}",
    String(selectedIds.length),
  )

  // Build the first-5-names body for the confirm dialog.
  const namesPreview: string[] = []
  for (let i = 0; i < Math.min(FIRST_N_NAMES, selectedIds.length); i++) {
    const u = userIndex.get(selectedIds[i])
    if (u) namesPreview.push(u.full_name || u.email || `#${u.id}`)
  }
  const overflow = selectedIds.length - FIRST_N_NAMES
  const moreSuffix =
    overflow > 0
      ? " " +
        adminUsersT("admin.users.bulk_deactivate_body_more", lang).replace(
          "{N}",
          String(overflow),
        )
      : ""
  const confirmTitle = adminUsersT(
    "admin.users.bulk_deactivate_title",
    lang,
  ).replace("{N}", String(selectedIds.length))
  const confirmBody = namesPreview.join(", ") + moreSuffix

  const handleBulkDeactivate = () => {
    setConfirmDeactivateOpen(false)
    bulkActionM.mutate(
      {
        user_ids: selectedIds,
        action: "deactivate",
      },
      {
        onSuccess: onClear,
      },
    )
  }

  const roleChangeItems: MoreMenuItem[] = (
    ["Admin", "Project Manager", "Member"] as AdminRole[]
  ).map((role) => ({
    id: `bulk_role_${role}`,
    label: role,
    onClick: () => {
      bulkActionM.mutate(
        {
          user_ids: selectedIds,
          action: "role_change",
          payload: { role },
        },
        {
          onSuccess: onClear,
        },
      )
    },
  }))

  return (
    <>
      <div
        role="region"
        aria-label="Bulk actions"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
          fontSize: 12.5,
        }}
      >
        <span style={{ fontWeight: 600 }}>{selectedLabel}</span>
        <div style={{ flex: 1 }} />

        <Button
          variant="danger"
          size="sm"
          disabled={bulkActionM.isPending}
          onClick={() => setConfirmDeactivateOpen(true)}
        >
          {adminUsersT("admin.users.bulk_deactivate", lang)}
        </Button>

        {/* Bulk role change — uses MoreMenu primitive with custom trigger so
            the button looks like a "Toplu rol değiştir ▾" dropdown. */}
        <MoreMenu
          items={roleChangeItems}
          ariaLabel={adminUsersT("admin.users.bulk_role_change", lang)}
          trigger={
            <Button
              variant="secondary"
              size="sm"
              iconRight={<ChevronDown size={12} />}
              disabled={bulkActionM.isPending}
            >
              {adminUsersT("admin.users.bulk_role_change", lang)}
            </Button>
          }
        />

        <Button variant="ghost" size="sm" onClick={onClear}>
          {adminUsersT("admin.users.bulk_cancel", lang)}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDeactivateOpen}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={adminUsersT("admin.users.confirm_confirm", lang)}
        cancelLabel={adminUsersT("admin.users.confirm_cancel", lang)}
        tone="danger"
        onConfirm={handleBulkDeactivate}
        onCancel={() => setConfirmDeactivateOpen(false)}
      />
    </>
  )
}

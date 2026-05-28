"use client"

// Phase 15 Plan 15-11 — RoleDeleteConfirm (D-2.2).
//
// Wraps the existing ConfirmDialog primitive (Phase 14 14-01 D-25) with the
// danger tone + Member fallback warning copy. Per D-2.2, deleting a custom
// role MIGRATES (not blocks) every user currently holding that role to the
// Member system role — the body of the dialog must convey that migration
// to the admin BEFORE confirming so they understand the side-effect.
//
// On confirm: useDeleteRole().mutate(role.id). Backend handles the Member
// migration in a single transaction (Plan 15-06 D-2.2). The hook's
// onSettled invalidates roles + matrix + admin/users so the UI updates
// without manual refresh.
//
// role=null is a defensive guard; the parent (admin/roles/page.tsx) keeps
// deletingRole in state and opens the dialog by setting it.

import * as React from "react"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import { useApp } from "@/context/app-context"
import { useDeleteRole } from "@/hooks/use-delete-role"
import type { Role } from "@/services/admin-rbac-service"

export interface RoleDeleteConfirmProps {
  open: boolean
  role: Role | null
  /**
   * Number of users currently assigned to this role. The parent computes
   * this from the existing useAdminUsers query (Plan 14-17's per-card count
   * pipeline) and passes it through. The dialog body interpolates the
   * count so the admin sees "Bu rolü silmek 5 kullanıcıyı Member rolüne
   * taşıyacak" before confirming.
   */
  affectedUserCount: number
  onClose: () => void
}

export function RoleDeleteConfirm({
  open,
  role,
  affectedUserCount,
  onClose,
}: RoleDeleteConfirmProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const deleteRole = useDeleteRole()

  if (!role) return null

  const title = lang === "tr" ? "Rolü Sil" : "Delete Role"

  // D-2.2 Member fallback message — explicit count + destination role name
  // ("Member") so the admin understands the migration is automatic, not a
  // delete-with-orphans.
  const body =
    lang === "tr"
      ? `Bu rolü silmek ${affectedUserCount} kullanıcıyı Member rolüne taşıyacak. Devam?`
      : `Deleting this role will move ${affectedUserCount} user(s) to Member. Continue?`

  return (
    <ConfirmDialog
      open={open}
      title={title}
      body={body}
      tone="danger"
      pending={deleteRole.isPending}
      confirmLabel={lang === "tr" ? "Sil" : "Delete"}
      cancelLabel={lang === "tr" ? "İptal" : "Cancel"}
      onConfirm={() => {
        deleteRole.mutate(role.id, {
          onSuccess: () => {
            onClose()
          },
        })
      }}
      onCancel={onClose}
    />
  )
}

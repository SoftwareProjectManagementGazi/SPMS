// Phase 15 Plan 15-09 — useUpdateRole hook.
//
// Plan 15-11 (Roles tab) consumes this when the Admin renames or recolors a
// custom role. Backend Plan 15-06 rejects edits to system roles with
// 422 SYSTEM_ROLE_PROTECTED.
//
// onSettled invalidates both the roles list and the permission matrix so any
// label / color change ripples to the matrix header immediately.

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useToast } from "@/components/toast"
import { useApp } from "@/context/app-context"
import {
  adminRbacService,
  type RoleUpdateRequest,
} from "@/services/admin-rbac-service"

export function useUpdateRole() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { language } = useApp()

  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: RoleUpdateRequest }) =>
      adminRbacService.updateRole(id, req),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roles"] })
      qc.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] })
    },
    onSuccess: () => {
      showToast({
        variant: "success",
        message: language === "tr" ? "Rol güncellendi" : "Role updated",
      })
    },
    onError: (err: any) => {
      const code = err?.response?.data?.detail?.error_code
      const msg =
        code === "SYSTEM_ROLE_PROTECTED"
          ? language === "tr"
            ? "Sistem rolü düzenlenemez"
            : "System role cannot be edited"
          : err?.response?.data?.detail?.message ||
            (language === "tr"
              ? "Rol güncellenemedi"
              : "Failed to update role")
      showToast({ variant: "error", message: msg })
    },
  })
}

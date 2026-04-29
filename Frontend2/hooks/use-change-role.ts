// Phase 14 Plan 14-01 — useChangeRole hook (D-A6).
// Phase 15 Plan 15-06 D-1.17 — migrated from {role: AdminRole} literal to
// {roleId: int} so custom Plan 15-11 roles can be assigned.
//
// Single-user role flip — confirmation toast on success. Bulk role-change
// goes through useBulkAction (separate hook).

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { adminUserService } from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useChangeRole() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      adminUserService.changeRole(userId, roleId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onSuccess: () => {
      showToast({ variant: "success", message: "Rol güncellendi" })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Rol güncellenemedi"
      showToast({ variant: "error", message: msg })
    },
  })
}

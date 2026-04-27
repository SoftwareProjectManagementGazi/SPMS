// Phase 14 Plan 14-01 — useChangeRole hook (D-A6).
//
// Single-user role flip — confirmation toast on success. Bulk role-change
// goes through useBulkAction (separate hook).

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminUserService,
  type AdminRole,
} from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useChangeRole() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: AdminRole }) =>
      adminUserService.changeRole(userId, role),
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

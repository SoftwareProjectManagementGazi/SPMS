// Phase 14 Plan 14-01 — useDeactivateUser hook (D-A6).
//
// Single-field flip — onSettled invalidates ["admin","users"] so the table
// refreshes regardless of success/failure (mirrors useUpdateProjectStatus).

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUserService } from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useDeactivateUser() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (userId: number) => adminUserService.deactivate(userId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onSuccess: () => {
      showToast({ variant: "success", message: "Kullanıcı devre dışı bırakıldı" })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Devre dışı bırakma başarısız"
      showToast({ variant: "error", message: msg })
    },
  })
}

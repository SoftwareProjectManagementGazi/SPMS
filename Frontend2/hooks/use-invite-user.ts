// Phase 14 Plan 14-01 — useInviteUser hook (D-B2).
//
// Single-user invite — onSuccess invalidates ["admin","users"] so the table
// re-fetches with the new pending-activation row.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUserService } from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useInviteUser() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: adminUserService.invite,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      showToast({
        variant: "success",
        message: `Davet gönderildi: ${data.email}`,
      })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Davet gönderilemedi"
      showToast({ variant: "error", message: msg })
    },
  })
}

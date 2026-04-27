// Phase 14 Plan 14-01 — useBulkInvite hook (D-B4).
//
// Returns the {successful, failed} summary so the caller (Plan 14-03's
// bulk-invite-modal) can render the post-upload summary modal.
// onSuccess invalidates ["admin","users"] so the new pending-activation
// rows surface in the user table.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminUserService,
  type BulkInviteRow,
  type BulkInviteResponse,
} from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useBulkInvite() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation<BulkInviteResponse, unknown, BulkInviteRow[]>({
    mutationFn: (rows) => adminUserService.bulkInvite(rows),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      const okCount = data.successful.length
      const failCount = data.failed.length
      showToast({
        variant: failCount === 0 ? "success" : "warning",
        message: `${okCount} davet gönderildi, ${failCount} satır atlandı`,
      })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Toplu davet başarısız"
      showToast({ variant: "error", message: msg })
    },
  })
}

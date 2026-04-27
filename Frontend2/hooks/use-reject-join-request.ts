// Phase 14 Plan 14-01 — useRejectJoinRequest hook (D-W2 optimistic update).
//
// Symmetric with useApproveJoinRequest — same optimistic-remove pattern,
// different toast text. Reject does NOT touch team membership server-side.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminJoinRequestService,
  type PendingJoinRequest,
} from "@/services/admin-join-request-service"
import { useToast } from "@/components/toast"

interface PendingCacheShape {
  items: PendingJoinRequest[]
  total: number
}

const PENDING_QUERY_KEY = ["admin", "join-requests", "pending", { limit: 5 }]

export function useRejectJoinRequest() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: adminJoinRequestService.reject,
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ["admin", "join-requests", "pending"] })
      const snapshot = qc.getQueryData<PendingCacheShape>(PENDING_QUERY_KEY)
      if (snapshot) {
        qc.setQueryData<PendingCacheShape>(PENDING_QUERY_KEY, {
          items: snapshot.items.filter((r) => r.id !== id),
          total: Math.max(0, snapshot.total - 1),
        })
      }
      return { snapshot }
    },
    onError: (err: any, _id, ctx) => {
      if (ctx?.snapshot) {
        qc.setQueryData(PENDING_QUERY_KEY, ctx.snapshot)
      }
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Reddetme başarısız"
      showToast({ variant: "error", message: msg })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "join-requests"] })
    },
    onSuccess: () => {
      showToast({ variant: "success", message: "Talep reddedildi" })
    },
  })
}

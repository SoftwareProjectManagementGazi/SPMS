// Phase 14 Plan 14-01 — useApproveJoinRequest hook (D-W2 optimistic update).
//
// Approve flow:
// - onMutate snapshots current ["admin","join-requests","pending"] cache,
//   removes the approved request from items + decrements total
// - onError reverts to snapshot + toast
// - onSettled invalidates ["admin","join-requests"] for fresh server state
// - onSuccess success toast
//
// Pitfall 2 — toast text uses tone="success" for happy path; the toast
// primitive uses `variant: 'success' | 'error' | 'warning' | 'info'` (NOT
// `tone:`). Aligned with Frontend2/components/toast/index.tsx contract.

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

export function useApproveJoinRequest() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: adminJoinRequestService.approve,
    onMutate: async (id: number) => {
      // Pause any in-flight queries against this key so the optimistic
      // update isn't overwritten.
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
        "Onaylama başarısız"
      showToast({ variant: "error", message: msg })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "join-requests"] })
    },
    onSuccess: () => {
      showToast({ variant: "success", message: "Talep onaylandı" })
    },
  })
}

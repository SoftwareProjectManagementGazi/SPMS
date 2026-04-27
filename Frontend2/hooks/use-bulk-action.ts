// Phase 14 Plan 14-01 — useBulkAction hook (D-B7 + D-W2 optimistic update).
//
// Optimistic update for bulk-deactivate: snapshot current ["admin","users"]
// cache, mutate is_active=false on each user_id in the request, revert on
// error. After success: summary toast {success_count}/{total} + invalidate
// to fetch authoritative server state.
//
// Bulk role-change skips optimism (cache shape includes role joins that are
// hard to predict client-side); the post-action toast + cache invalidation
// is enough.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminUserService,
  type BulkActionRequest,
  type BulkActionResponse,
} from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

interface UsersCacheShape {
  // The exact shape depends on the list endpoint; for Wave 0 we operate on
  // a list of user records with `id` and optional `is_active` field. Plan
  // 14-03 may refine this shape.
  data?: Array<{ id: number; is_active?: boolean }>
}

export function useBulkAction() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation<BulkActionResponse, unknown, BulkActionRequest>({
    mutationFn: (req) => adminUserService.bulkAction(req),
    onMutate: async (req) => {
      if (req.action !== "deactivate" && req.action !== "activate") {
        return { snapshot: null }
      }
      await qc.cancelQueries({ queryKey: ["admin", "users"] })
      const snapshots: Array<[unknown, UsersCacheShape | undefined]> = []
      // Iterate every cached query under ["admin","users",...] and patch
      // matching user records.
      const queries = qc.getQueryCache().findAll({ queryKey: ["admin", "users"] })
      for (const q of queries) {
        const cur = q.state.data as UsersCacheShape | undefined
        snapshots.push([q.queryKey, cur])
        if (cur && Array.isArray(cur.data)) {
          const newActive = req.action === "activate"
          const newData = cur.data.map((u) =>
            req.user_ids.includes(u.id) ? { ...u, is_active: newActive } : u,
          )
          qc.setQueryData(q.queryKey, { ...cur, data: newData })
        }
      }
      return { snapshots }
    },
    onError: (err: any, _req, ctx) => {
      // Revert all snapshots
      if (ctx && Array.isArray((ctx as any).snapshots)) {
        for (const [key, snap] of (ctx as any).snapshots) {
          qc.setQueryData(key, snap)
        }
      }
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Toplu işlem başarısız"
      showToast({ variant: "error", message: msg })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onSuccess: (data) => {
      const total = data.success_count + data.failed_count
      showToast({
        variant: data.failed_count === 0 ? "success" : "warning",
        message: `${data.success_count}/${total} kullanıcı güncellendi`,
      })
    },
  })
}

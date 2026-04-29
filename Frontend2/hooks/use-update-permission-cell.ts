// Phase 15 Plan 15-09 — useUpdatePermissionCell hook (D-1.12 optimistic).
//
// The matrix cell click latency is a UX hot path: Admin toggles a single
// checkbox, expects the cell to flip immediately, and only sees a revert if
// the backend rejects. Pattern 3 (RESEARCH) — onMutate cancels in-flight
// queries against the matrix key, snapshots the current data, applies the
// optimistic cell update; onError reverts to the snapshot + shows a Toast;
// onSettled always invalidates so the cache resyncs against the server.
//
// Backend Plan 15-06 emits 422 SYSTEM_ROLE_PROTECTED when the Admin column is
// the target — we surface a TR/EN message that explains the revert.

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useToast } from "@/components/toast"
import { useApp } from "@/context/app-context"
import {
  adminRbacService,
  type PermissionMatrix,
} from "@/services/admin-rbac-service"

interface UpdateCellArgs {
  roleId: number
  permKey: string
  granted: boolean
}

const MATRIX_KEY = ["admin", "permissions", "matrix"] as const

/**
 * Applies an optimistic cell update to a PermissionMatrix snapshot. Pure
 * function — exported for unit testing the matrix-mutation rules without
 * spinning up a QueryClient (Pitfall 14 — sort + dedup invariants).
 */
export function applyCellUpdate(
  matrix: PermissionMatrix | undefined,
  roleId: number,
  permKey: string,
  granted: boolean,
): PermissionMatrix | undefined {
  if (!matrix) return matrix
  const perm = matrix.permissions.find((p) => p.key === permKey)
  if (!perm) return matrix

  const existingIdx = matrix.cells.findIndex(
    (c) => c.role_id === roleId && c.permission_id === perm.id,
  )

  const nextCells = matrix.cells.slice()
  if (granted) {
    if (existingIdx === -1) {
      nextCells.push({
        role_id: roleId,
        permission_id: perm.id,
        granted: true,
      })
    } else {
      nextCells[existingIdx] = { ...nextCells[existingIdx], granted: true }
    }
  } else {
    if (existingIdx !== -1) {
      nextCells.splice(existingIdx, 1)
    }
  }

  return { ...matrix, cells: nextCells }
}

export function useUpdatePermissionCell() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { language } = useApp()

  return useMutation({
    mutationFn: ({ roleId, permKey, granted }: UpdateCellArgs) =>
      adminRbacService.updateCell(roleId, permKey, granted),

    onMutate: async ({ roleId, permKey, granted }) => {
      // Cancel outgoing refetches that might overwrite our optimistic update.
      await qc.cancelQueries({ queryKey: MATRIX_KEY })
      const snapshot = qc.getQueryData<PermissionMatrix>(MATRIX_KEY)
      qc.setQueryData<PermissionMatrix | undefined>(MATRIX_KEY, (old) =>
        applyCellUpdate(old, roleId, permKey, granted),
      )
      return { snapshot }
    },

    onError: (err: any, _vars, ctx) => {
      // Roll back to snapshot.
      if (ctx?.snapshot !== undefined) {
        qc.setQueryData(MATRIX_KEY, ctx.snapshot)
      }
      const code = err?.response?.data?.detail?.error_code
      const msg =
        code === "SYSTEM_ROLE_PROTECTED"
          ? language === "tr"
            ? "Admin rolü düzenlenemez"
            : "Admin role is read-only"
          : language === "tr"
            ? "Yetki güncellenemedi"
            : "Failed to update permission"
      showToast({ variant: "error", message: msg })
    },

    onSuccess: () => {
      showToast({
        variant: "success",
        message:
          language === "tr" ? "Yetki güncellendi" : "Permission updated",
      })
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: MATRIX_KEY })
    },
  })
}

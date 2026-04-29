// Phase 15 Plan 15-09 — useDeleteRole hook.
//
// Plan 15-11 (Roles tab) consumes this when the Admin removes a custom role.
// Backend Plan 15-06 implements D-2.2 — orphaned users are migrated to Member
// before the role row is dropped. The audit_log records role.deleted with
// extra_metadata.affected_user_count for the activity feed.
//
// onSettled invalidates the roles list, the permission matrix, AND the admin
// users query (because some users may have just become Member).

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useToast } from "@/components/toast"
import { useApp } from "@/context/app-context"
import { adminRbacService } from "@/services/admin-rbac-service"

export function useDeleteRole() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { language } = useApp()

  return useMutation({
    mutationFn: (id: number) => adminRbacService.deleteRole(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roles"] })
      qc.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] })
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onSuccess: () => {
      showToast({
        variant: "success",
        message: language === "tr" ? "Rol silindi" : "Role deleted",
      })
    },
    onError: (err: any) => {
      const code = err?.response?.data?.detail?.error_code
      const msg =
        code === "SYSTEM_ROLE_PROTECTED"
          ? language === "tr"
            ? "Sistem rolü silinemez"
            : "System role cannot be deleted"
          : err?.response?.data?.detail?.message ||
            (language === "tr"
              ? "Rol silinemedi"
              : "Failed to delete role")
      showToast({ variant: "error", message: msg })
    },
  })
}

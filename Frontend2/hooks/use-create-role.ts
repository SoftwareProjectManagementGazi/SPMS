// Phase 15 Plan 15-09 — useCreateRole hook.
//
// Plan 15-11 (Roles tab CRUD) consumes this in the "Yeni rol" modal. Backend
// Plan 15-06 returns 409 with `detail.reason: "reserved" | "duplicate"` for
// reserved role names ("Admin" / "PM" / "Member") and existing names.
//
// onSettled invalidates BOTH the roles list AND the permission matrix so the
// matrix UI sees the new column immediately. Single useMutation analog of
// use-change-role.ts (Phase 14).

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useToast } from "@/components/toast"
import { useApp } from "@/context/app-context"
import {
  adminRbacService,
  type RoleCreateRequest,
} from "@/services/admin-rbac-service"

export function useCreateRole() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { language } = useApp()

  return useMutation({
    mutationFn: (req: RoleCreateRequest) => adminRbacService.createRole(req),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roles"] })
      qc.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] })
    },
    onSuccess: () => {
      showToast({
        variant: "success",
        message: language === "tr" ? "Rol oluşturuldu" : "Role created",
      })
    },
    onError: (err: any) => {
      const reason = err?.response?.data?.detail?.reason
      const msg =
        reason === "reserved"
          ? language === "tr"
            ? "Bu isim sistem rolü için ayrılmıştır"
            : "Reserved name"
          : reason === "duplicate"
            ? language === "tr"
              ? "Bu isimde rol zaten var"
              : "Duplicate role name"
            : err?.response?.data?.detail?.message ||
              (language === "tr"
                ? "Rol oluşturulamadı"
                : "Failed to create role")
      showToast({ variant: "error", message: msg })
    },
  })
}

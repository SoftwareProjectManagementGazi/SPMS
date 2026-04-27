// Phase 14 Plan 14-01 — useResetPassword hook (D-B3).
//
// Admin-triggered password reset — sends email + emits audit row server-side.
// No cache invalidation needed (no list state changes); just the success
// toast confirms the action.

import { useMutation } from "@tanstack/react-query"
import { adminUserService } from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useResetPassword() {
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (userId: number) => adminUserService.resetPassword(userId),
    onSuccess: () => {
      showToast({
        variant: "success",
        message: "Şifre sıfırlama bağlantısı gönderildi",
      })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Şifre sıfırlama gönderilemedi"
      showToast({ variant: "error", message: msg })
    },
  })
}

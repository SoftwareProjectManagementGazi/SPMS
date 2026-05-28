"use client"

// Password-reset surface. The route group "(auth)" adds NO URL segment, so this
// page is served at exactly `/reset-password` — both the self-service
// forgot-password flow (request_password_reset) and the admin-triggered reset
// (reset_user_password) email this path.
//
// Shares all form logic with /set-password via <PasswordSetForm/> (single
// source of truth); both flows POST the same backend endpoint and differ only
// in copy. Next.js 16 requires the useSearchParams reader behind Suspense.

import * as React from "react"

import { PasswordSetForm } from "@/components/auth/password-set-form"

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <PasswordSetForm variant="reset" />
    </React.Suspense>
  )
}

"use client"

// Invite flow surface. The route group "(auth)" adds NO URL segment, so this
// page is served at exactly `/set-password` — backend invite emails MUST point
// there (Backend/app/application/use_cases/invite_user.py).
//
// All form logic lives in the shared <PasswordSetForm/> (single source of truth
// shared with /reset-password); both flows POST the same backend endpoint and
// differ only in copy. Next.js 16 requires the useSearchParams reader to sit
// behind a Suspense boundary.

import * as React from "react"

import { PasswordSetForm } from "@/components/auth/password-set-form"

export default function SetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <PasswordSetForm variant="invite" />
    </React.Suspense>
  )
}

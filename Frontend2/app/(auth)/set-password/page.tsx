"use client"

// Phase 14 Plan 14-18 (Cluster F, B-6 closure) — Set-password page consumed
// by the invite-email flow.
//
// Backend contract (verified in Plan 14-18 Step 0 pre-flight; do NOT
// re-investigate — values recorded with file:line references in
// 14-18-SUMMARY.md):
//
//   - Endpoint   : POST /api/v1/auth/password-reset/confirm
//                  (Backend/app/api/v1/auth.py:165)
//   - Payload    : { token: string, new_password: string }
//                  (Backend/app/application/dtos/auth_dtos.py:49-51 —
//                   PasswordResetConfirmDTO)
//   - 204 on success; 400 on invalid/expired/used token (no body).
//
// Email URL contract (verified):
//   - Invite emails ship: ${FRONTEND_URL}/auth/set-password?token=${raw}
//     (Backend/app/application/use_cases/invite_user.py:94 — InviteUserUseCase)
//   - This page mounts at exactly that path so the invite link works without
//     backend template changes.
//
// NOTE — forgot-password and admin-reset emails ship a DIFFERENT URL:
//   ${FRONTEND_URL}/reset-password?token=${raw}
//   (Backend/app/application/use_cases/request_password_reset.py:27 +
//    Backend/app/application/use_cases/reset_user_password.py:48)
// Both URLs hit the SAME backend endpoint — only the front-end route varies.
// /auth/set-password (this page) is the invite-flow surface; /reset-password
// is a separate forgot-password surface, NOT scoped to this plan.

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { LogoMark } from "@/components/logo-mark"
import { Button, Input } from "@/components/primitives"
import { apiClient } from "@/lib/api-client"

export default function SetPasswordPage() {
  // Plan 14-18 — Next.js 16 useSearchParams CSR-bailout requires Suspense.
  return (
    <React.Suspense fallback={null}>
      <SetPasswordPageInner />
    </React.Suspense>
  )
}

function SetPasswordPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  // Token-missing state — render an error pane and a link back to login.
  if (!token) {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxWidth: 380,
          margin: "80px auto",
          padding: "0 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={22} />
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>
            PMS
          </div>
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: -0.6,
            marginTop: 12,
          }}
        >
          Geçersiz davet bağlantısı
        </div>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--fg-muted)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Token eksik. Davet e-postanızdaki bağlantıyı tekrar kontrol edin
          veya yöneticinizden yeni bir davet talep edin.
        </p>
        <div>
          <Link
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--primary)",
              textDecoration: "none",
            }}
          >
            ← Giriş ekranına dön
          </Link>
        </div>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side validation — mirror the backend's DTO contract
    // (PasswordResetConfirmDTO requires min length 8) so we don't burn a
    // round-trip on a trivially invalid value.
    if (password.length < 8) {
      setError("Parola en az 8 karakter olmalı.")
      return
    }
    if (password !== confirm) {
      setError("Parolalar eşleşmiyor.")
      return
    }

    setSubmitting(true)
    try {
      // Verified backend contract — see top-of-file comment block.
      // apiClient adds Authorization automatically only if the user is logged
      // in; for the invite flow the user is anonymous, which is fine — the
      // password-reset/confirm endpoint takes the token as the auth proof.
      await apiClient.post("/auth/password-reset/confirm", {
        token,
        new_password: password,
      })
      setSuccess(true)
      // Auto-redirect to /login after a brief success flash so the user can
      // log in with their new password. The `?invite=ok` flag gives the
      // login page a hook for any future welcome-toast UX.
      setTimeout(() => {
        router.push("/login?invite=ok")
      }, 1500)
    } catch (err) {
      // The backend returns 400 with `{detail: "..."}` for invalid/expired/
      // used tokens. axios wraps non-2xx in an error with response.data.detail.
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Parola sıfırlanamadı. Bağlantınız geçersiz veya süresi dolmuş olabilir."
      setError(String(detail))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        zIndex: 100,
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "40px 60px",
          maxWidth: 600,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Logo header — matches /forgot-password styling */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={22} />
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>
            PMS
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
            Proje Yönetim Sistemi
          </div>
        </div>

        {/* Centered form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
            {!success ? (
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: -0.8,
                    marginBottom: 8,
                  }}
                >
                  Parolanı belirle
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  Davet edildin! Hesabını aktive etmek için yeni bir parola
                  belirle (en az 8 karakter).
                </div>

                {/* New password */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "var(--fg)",
                    }}
                  >
                    Yeni parola
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "var(--fg)",
                    }}
                  >
                    Parolayı tekrarla
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--priority-critical)",
                      marginBottom: 14,
                      padding: "8px 12px",
                      background:
                        "color-mix(in oklch, var(--priority-critical) 10%, var(--surface))",
                      borderRadius: "var(--radius-sm)",
                      border:
                        "1px solid color-mix(in oklch, var(--priority-critical) 30%, transparent)",
                    }}
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={submitting}
                  style={{ width: "100%" }}
                >
                  {submitting ? "Kaydediliyor…" : "Parolayı belirle"}
                </Button>

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--fg-muted)",
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  <Link
                    href="/login"
                    style={{
                      color: "var(--primary)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    ← Giriş ekranına dön
                  </Link>
                </div>
              </form>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: -0.6,
                  }}
                >
                  Parolan oluşturuldu
                </div>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Giriş ekranına yönlendiriliyorsun…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

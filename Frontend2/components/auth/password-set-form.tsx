"use client"

// Shared password set/confirm form — single source of truth for the
// invite ("set-password") and password-reset ("reset-password") flows.
//
// Backend contract (one endpoint for BOTH flows):
//   POST /auth/password-reset/confirm  { token, new_password }  -> 204
//   400 on invalid/expired/used token. The token is the auth proof, so the
//   caller is anonymous (apiClient only attaches Authorization when logged in).
//
// The two flows differ ONLY in copy + post-success redirect, driven by the
// `variant` prop. Keep the logic here so the two routes never diverge.

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { LogoMark } from "@/components/logo-mark"
import { Button, Input } from "@/components/primitives"
import { apiClient } from "@/lib/api-client"

type Variant = "invite" | "reset"

const COPY: Record<
  Variant,
  {
    missingTitle: string
    missingBody: string
    formTitle: string
    formBody: string
    submitIdle: string
    successTitle: string
    successBody: string
    redirect: string
  }
> = {
  invite: {
    missingTitle: "Geçersiz davet bağlantısı",
    missingBody:
      "Token eksik. Davet e-postanızdaki bağlantıyı tekrar kontrol edin veya yöneticinizden yeni bir davet talep edin.",
    formTitle: "Parolanı belirle",
    formBody:
      "Davet edildin! Hesabını aktive etmek için yeni bir parola belirle (en az 8 karakter).",
    submitIdle: "Parolayı belirle",
    successTitle: "Parolan oluşturuldu",
    successBody: "Giriş ekranına yönlendiriliyorsun…",
    redirect: "/login?invite=ok",
  },
  reset: {
    missingTitle: "Geçersiz sıfırlama bağlantısı",
    missingBody:
      "Token eksik. Parola sıfırlama e-postanızdaki bağlantıyı tekrar kontrol edin veya yeni bir bağlantı talep edin.",
    formTitle: "Yeni parolanı belirle",
    formBody: "Hesabın için yeni bir parola oluştur (en az 8 karakter).",
    submitIdle: "Parolayı güncelle",
    successTitle: "Parolan güncellendi",
    successBody: "Giriş ekranına yönlendiriliyorsun…",
    redirect: "/login?reset=ok",
  },
}

export function PasswordSetForm({ variant }: { variant: Variant }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const copy = COPY[variant]

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
          {copy.missingTitle}
        </div>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--fg-muted)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {copy.missingBody}
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
      await apiClient.post("/auth/password-reset/confirm", {
        token,
        new_password: password,
      })
      setSuccess(true)
      setTimeout(() => {
        router.push(copy.redirect)
      }, 1500)
    } catch (err) {
      // Backend returns 400 with {detail: "..."} for invalid/expired/used
      // tokens; axios wraps non-2xx in error.response.data.detail.
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ??
        "Parola kaydedilemedi. Bağlantınız geçersiz veya süresi dolmuş olabilir."
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
                  {copy.formTitle}
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  {copy.formBody}
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
                  {submitting ? "Kaydediliyor…" : copy.submitIdle}
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
                  {copy.successTitle}
                </div>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {copy.successBody}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

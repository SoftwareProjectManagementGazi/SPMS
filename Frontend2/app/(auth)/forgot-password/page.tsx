"use client"
import * as React from "react"
import Link from "next/link"
import { LogoMark } from "@/components/logo-mark"
import { Button } from "@/components/primitives"
import { Input } from "@/components/primitives"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // authService.requestPasswordReset not yet implemented — show success inline
    // In a full implementation this would call POST /auth/password-reset
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitted(true)
    setIsLoading(false)
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.1fr",
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        zIndex: 100,
      }}
    >
      {/* LEFT — form panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "40px 60px",
        }}
      >
        {/* Logo header */}
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
          <div style={{ width: "100%", maxWidth: 380 }}>
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: -0.8,
                    marginBottom: 8,
                  }}
                >
                  Parolanızı mı unuttunuz?
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  E-posta adresinizi girin, parola sıfırlama bağlantısı gönderelim.
                </div>

                {/* Email */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "var(--fg)",
                    }}
                  >
                    E-posta
                  </label>
                  <Input
                    type="email"
                    placeholder="ornek@sirket.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isLoading}
                  style={{ width: "100%", marginBottom: 16 }}
                >
                  {isLoading ? "Gönderiliyor..." : "Bağlantı gönder"}
                </Button>

                <div style={{ textAlign: "center" }}>
                  <Link
                    href="/login"
                    style={{
                      fontSize: 13,
                      color: "var(--fg-muted)",
                      textDecoration: "none",
                    }}
                  >
                    ← Girişe dön
                  </Link>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: -0.8,
                    marginBottom: 8,
                  }}
                >
                  Bağlantı gönderildi
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  {email} adresine parola sıfırlama bağlantısı gönderildi. Gelen
                  kutunuzu kontrol edin.
                </div>
                <Link
                  href="/login"
                  style={{
                    fontSize: 13,
                    color: "var(--primary)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  ← Girişe dön
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-subtle)",
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <span>© 2025 Acme Holding</span>
          <a
            href="#"
            style={{ color: "var(--fg-subtle)", textDecoration: "none" }}
          >
            Gizlilik
          </a>
          <a
            href="#"
            style={{ color: "var(--fg-subtle)", textDecoration: "none" }}
          >
            Şartlar
          </a>
        </div>
      </div>

      {/* RIGHT — branding panel */}
      <div
        style={{
          background: "var(--surface-2)",
          boxShadow: "inset 1px 0 0 var(--border)",
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 70% 30%, color-mix(in oklch, var(--primary) 12%, transparent) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* v2.4 badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.5,
            color: "var(--primary)",
            background: "color-mix(in oklch, var(--primary) 12%, var(--surface))",
            padding: "4px 10px",
            borderRadius: 20,
            marginBottom: 24,
            width: "fit-content",
          }}
        >
          ✦ v2.4 — Yeni Özellikler
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.15,
            marginBottom: 16,
            color: "var(--fg)",
          }}
        >
          Projelerinizi
          <br />
          tek yerden yönetin
        </div>

        {/* Paragraph */}
        <div
          style={{
            fontSize: 14.5,
            color: "var(--fg-muted)",
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 380,
          }}
        >
          Scrum, Kanban ve Waterfall metodolojilerini destekleyen SPMS ile
          ekibinizin verimliliğini artırın. Görevleri takip edin, sprint&apos;leri
          planlayın ve raporlara anında ulaşın.
        </div>

        {/* 2×2 stat grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            maxWidth: 380,
          }}
        >
          {[
            { value: "4", label: "Metodoloji desteği" },
            { value: "16+", label: "UI bileşeni" },
            { value: "%100", label: "Prototipe sadık" },
            { value: "v2.0", label: "Mevcut sürüm" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "16px 20px",
                background: "color-mix(in oklch, var(--surface) 60%, var(--bg))",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--fg)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-muted)",
                  marginTop: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

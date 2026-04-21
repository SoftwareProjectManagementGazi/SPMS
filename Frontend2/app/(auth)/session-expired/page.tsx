"use client"
import * as React from "react"
import { AUTH_TOKEN_KEY } from "@/lib/constants"
import { LogoMark } from "@/components/logo-mark"
import { Button } from "@/components/primitives"
import Link from "next/link"

export default function SessionExpiredPage() {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <LogoMark size={32} />
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6 }}>
        Oturumunuz sona erdi
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: "var(--fg-muted)",
          textAlign: "center",
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        Güvenliğiniz için oturumunuzu kapattık. Tekrar giriş yapın.
      </div>
      <Link href="/login">
        <Button variant="primary">Giriş ekranına dön</Button>
      </Link>
    </div>
  )
}

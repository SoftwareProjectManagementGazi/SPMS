"use client"

// Lifecycle tab stub per D-10 — real content lands in Phase 12 (LIFE-01..07).

import { AlertBanner } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export function LifecycleStubTab() {
  const { language: lang } = useApp()
  return (
    <div style={{ padding: 20 }}>
      <AlertBanner tone="info">
        {lang === "tr"
          ? "Bu sekme Faz 12'de aktive edilecek."
          : "This tab will be activated in Phase 12."}
      </AlertBanner>
    </div>
  )
}

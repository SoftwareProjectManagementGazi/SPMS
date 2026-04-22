"use client"

// Activity tab stub per D-10 — real content lands in Phase 13 (PROF-01).
// Uses the AlertBanner info tone for a friendly "coming soon" treatment.

import { AlertBanner } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export function ActivityStubTab() {
  const { language: lang } = useApp()
  return (
    <div style={{ padding: 20 }}>
      <AlertBanner tone="info">
        {lang === "tr"
          ? "Bu sekme Faz 13'te aktive edilecek."
          : "This tab will be activated in Phase 13."}
      </AlertBanner>
    </div>
  )
}

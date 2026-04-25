"use client"

// ViewportFallback (Phase 12 Plan 12-07) — rendered by the workflow-editor
// route when window.innerWidth < 1024. SPEC desktop-only constraint per
// 12-SPEC + UI-SPEC §736-742.
//
// Localized copy ships in TR + EN via useApp().language. The "Projeye Dön"
// Button calls router.push('/projects/' + projectId) so users return to the
// project detail view immediately.

import * as React from "react"
import { AlertBanner, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useRouter } from "next/navigation"

export interface ViewportFallbackProps {
  projectId: number
}

export function ViewportFallback({ projectId }: ViewportFallbackProps) {
  const { language } = useApp()
  const router = useRouter()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  return (
    <div style={{ padding: 20 }}>
      <AlertBanner tone="info">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <strong>
            {T(
              "Workflow editörü 1024px+ ekran gerektirir.",
              "Workflow editor requires a 1024px+ screen.",
            )}
          </strong>
          <p style={{ margin: 0, fontSize: 12, color: "var(--fg-muted)" }}>
            {T(
              "Lütfen daha geniş bir cihazda açın veya pencereyi büyütün.",
              "Please open on a larger device or maximize the window.",
            )}
          </p>
          <div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              {T("Projeye Dön", "Back to Project")}
            </Button>
          </div>
        </div>
      </AlertBanner>
    </div>
  )
}

"use client"

// Phase 13 Plan 13-01 Task 2 (D-F2 + UI-SPEC §Surface F).
//
// 3-state primitive for chart cards, activity timelines, profile tabs, and
// the Faz Raporları section. Render priority: error > loading > empty > children.
//
// Why slot pattern, not <Suspense/>: TanStack Query v5's default mode pairs
// poorly with Suspense when refetchOnWindowFocus=true (it would re-suspend on
// every focus event, causing visual flicker). Reading query.isLoading /
// query.error directly avoids that.

import * as React from "react"
import { AlertBanner } from "./alert-banner"
import { Button } from "./button"
import { useApp } from "@/context/app-context"

export interface DataStateProps {
  /** True while initial data is loading. */
  loading?: boolean
  /** Override for the default loading copy. */
  loadingFallback?: React.ReactNode
  /** Truthy = show errorFallback. Accepts `Error | unknown | null | undefined`. */
  error?: Error | null | unknown
  /** Override for the default error AlertBanner. */
  errorFallback?: React.ReactNode
  /** True = show emptyFallback when there's no error and not loading. */
  empty?: boolean
  /** Override for the default empty copy. */
  emptyFallback?: React.ReactNode
  /** Optional retry handler — wired into the default error AlertBanner action. */
  onRetry?: () => void
  /** The happy-path content. */
  children: React.ReactNode
}

export function DataState({
  loading,
  loadingFallback,
  error,
  errorFallback,
  empty,
  emptyFallback,
  onRetry,
  children,
}: DataStateProps) {
  const { language } = useApp()
  const lang = language === "en" ? "en" : "tr"
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  // Render priority: error > loading > empty > children (UI-SPEC §F.1).
  if (error) {
    return (
      <>
        {errorFallback ?? (
          <AlertBanner tone="danger">
            {T("Veri alınamadı.", "Couldn't load data.")}
            {onRetry && (
              <span style={{ marginLeft: 8 }}>
                <Button size="xs" variant="ghost" onClick={onRetry}>
                  {T("Tekrar dene", "Try again")}
                </Button>
              </span>
            )}
          </AlertBanner>
        )}
      </>
    )
  }

  if (loading) {
    return (
      <>
        {loadingFallback ?? (
          <div
            style={{
              padding: 16,
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            {T("Yükleniyor…", "Loading…")}
          </div>
        )}
      </>
    )
  }

  if (empty) {
    return (
      <>
        {emptyFallback ?? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--fg-subtle)",
              fontSize: 13,
            }}
          >
            {T("Veri yok.", "No data.")}
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}

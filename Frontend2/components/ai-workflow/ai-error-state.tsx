"use client"

/**
 * AI Error State — full-bleed centered card shown when stream errors out.
 *
 * Two error kinds with distinct copy + icon:
 *   service_down  → AlertOctagon, "Şablonlara Git" + "Tekrar Dene"
 *   rate_limit    → Clock, countdown to reset, "Şablonlara Git" only
 *
 * Replaces the old inline red banner with a calmer, more actionable layout
 * that matches the mockup's State 5 and State 6 visuals.
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 ai-error-state.tsx
 */

import * as React from "react"
import { AlertOctagon, Clock, FileText, RefreshCw } from "lucide-react"

import { useApp } from "@/context/app-context"

export type AIErrorKind = "service_down" | "rate_limit"

export interface AIErrorStateProps {
  kind: AIErrorKind
  /** Seconds until quota reset — shown as "X saat Y dakika" for rate_limit */
  resetInSeconds?: number
  onRetry?: () => void
  onGoToTemplates?: () => void
}

export function AIErrorState({
  kind,
  resetInSeconds,
  onRetry,
  onGoToTemplates,
}: AIErrorStateProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const isRateLimit = kind === "rate_limit"
  const Icon = isRateLimit ? Clock : AlertOctagon
  const iconBg = isRateLimit
    ? "oklch(0.95 0.05 220)"
    : "oklch(0.96 0.04 65)"
  const iconColor = isRateLimit
    ? "oklch(0.55 0.15 230)"
    : "var(--warning)"

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 16,
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: iconBg,
          color: iconColor,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden
      >
        <Icon size={28} />
      </span>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
        {isRateLimit
          ? T("Günlük AI kullanım sınırına ulaştın", "Daily AI usage limit reached")
          : T("AI servisine şu an ulaşılamıyor", "AI service is currently unavailable")}
      </h2>

      <p
        style={{
          fontSize: 13,
          color: "var(--fg-muted)",
          lineHeight: 1.5,
          margin: 0,
          maxWidth: 380,
        }}
      >
        {isRateLimit
          ? T(
              "Bugün için sınıra ulaştın — yarın tekrar dene. " +
                "(Akademik proje için ücretsiz kotamız sınırlı tutuluyor.)",
              "You've hit today's limit — try again tomorrow. " +
                "(Free tier quota is limited for academic projects.)",
            )
          : T(
              "Sunucu kısa süreli yanıt vermiyor. Birkaç dakika sonra tekrar " +
                "dene — ya da kayıtlı şablonlardan birini kullanabilirsin.",
              "The server is briefly unresponsive. Try again in a few minutes " +
                "or use one of the saved templates.",
            )}
      </p>

      {isRateLimit && resetInSeconds !== undefined && resetInSeconds > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: "var(--radius)",
            background: "var(--surface-2)",
            color: "var(--fg-muted)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
        >
          <Clock size={12} />
          {T("Sonraki sıfırlanma:", "Next reset:")}{" "}
          <strong style={{ color: "var(--fg)" }}>
            {formatResetCountdown(resetInSeconds, language)}
          </strong>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {onGoToTemplates && (
          <button
            type="button"
            onClick={onGoToTemplates}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--fg)",
              fontSize: 13,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <FileText size={14} />
            {T("Şablonlara Git", "Go to Templates")}
          </button>
        )}
        {!isRateLimit && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "var(--ai-accent)",
              color: "var(--ai-accent-fg)",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 2px 4px var(--ai-accent-ring)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--ai-accent-hover)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--ai-accent)"
            }}
          >
            <RefreshCw size={14} />
            {T("Tekrar Dene", "Try Again")}
          </button>
        )}
      </div>
    </div>
  )
}

function formatResetCountdown(seconds: number, language: string): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (language === "tr") {
    if (h > 0) return `${h} saat ${m} dakika`
    return `${m} dakika`
  }
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

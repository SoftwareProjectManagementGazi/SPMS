"use client"

// MTHero — gradient banner at the top of /my-tasks.
//
// Ported 1:1 from `New_Frontend/src/pages/my-tasks.jsx` lines 326-384.
//
// Layout: 2-column grid (1.3fr / 1fr). Left = greeting + title + subtitle.
// Right = 4-stat grid (Overdue / Today / This week / Done this week).
// A radial decoration in the top-right corner is purely decorative.
//
// Permitted exceptions to the 4-size + 8-pt scale (per UI-SPEC):
//   - padding: 22 (matches prototype banner inset; not on 8-pt scale)
//   - fontSize: 28 (hero number — matches prototype value)
//   - letterSpacing: -0.8 (hero title) and -1 (stat number) match prototype
//
// Bilingual copy via local literals (lang === "tr" ? ... : ...) — matches the
// pattern used by the rest of the my-tasks components.

import * as React from "react"
import { AlertTriangle, Calendar, CircleCheck, Flame } from "lucide-react"

import type { LangCode } from "@/lib/i18n"

export interface MTHeroStats {
  overdue: number
  today: number
  week: number
  done: number
}

export interface MTHeroProps {
  stats: MTHeroStats
  lang: LangCode
  /** Optional first name to use in the greeting; defaults to a neutral string. */
  firstName?: string
  title?: string
  subtitle?: string
  /** Override the date used for greeting/today copy — primarily for tests. */
  nowRef?: Date
}

function pickGreeting(hour: number, lang: LangCode): string {
  if (hour < 12) return lang === "tr" ? "Günaydın" : "Good morning"
  if (hour < 18) return lang === "tr" ? "İyi günler" : "Good afternoon"
  return lang === "tr" ? "İyi akşamlar" : "Good evening"
}

export function MTHero({
  stats,
  lang,
  firstName,
  title,
  subtitle,
  nowRef,
}: MTHeroProps) {
  // Hydration safety: `new Date()` returns the SERVER clock during SSR and
  // the BROWSER clock during the first client render. If those land in
  // different greeting/day buckets (e.g. server is UTC just past midnight,
  // client is TR with date one ahead), the rendered string differs and React
  // emits a hydration mismatch warning.
  //
  // Render a stable placeholder ("—") for greeting + date on first paint and
  // SSR; swap in the live values via a mount-only useEffect. Tests can pin
  // the value by passing nowRef, which bypasses the deferred path entirely.
  const [now, setNow] = React.useState<Date | null>(nowRef ?? null)
  React.useEffect(() => {
    if (nowRef) return
    setNow(new Date())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const greet = now
    ? pickGreeting(now.getHours(), lang)
    : lang === "tr"
      ? "Merhaba"
      : "Hello"
  const dateText = now
    ? now.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "—"

  // Subtitle priority mirrors the prototype:
  //   1. Explicit prop wins.
  //   2. Otherwise, if there are overdue tasks, surface that.
  //   3. Else, surface today's count.
  const computedSubtitle =
    subtitle ??
    (stats.overdue > 0
      ? lang === "tr"
        ? `${stats.overdue} gecikmiş görev var. En kritik olanlardan başlamak iyi fikir.`
        : `${stats.overdue} tasks are overdue. Starting from the most critical might be a good idea.`
      : lang === "tr"
        ? `${stats.today} görev bugün için planlandı. Güzel bir tempoda gidiyor.`
        : `${stats.today} tasks scheduled for today. You're on a good pace.`)

  const computedTitle =
    title ??
    (lang === "tr" ? "Bugünün odak noktanız" : "Your focus today")

  return (
    <div
      data-testid="mt-hero"
      style={{
        display: "grid",
        gridTemplateColumns: "1.3fr 1fr",
        gap: 16,
        // padding 22 is a permitted exception (prototype-faithful, not on 8-pt scale).
        padding: 22,
        borderRadius: 14,
        background:
          "linear-gradient(135deg, color-mix(in oklch, var(--primary) 10%, var(--surface)) 0%, var(--surface) 60%)",
        boxShadow: "var(--shadow-md)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative radial accent — pointer-events: none so it never blocks clicks. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--fg-muted)",
            fontWeight: 500,
          }}
        >
          {greet}
          {firstName ? `, ${firstName}` : ""} — {dateText}
        </div>
        <div
          style={{
            fontSize: 28, // permitted exception (prototype hero size)
            fontWeight: 600,
            letterSpacing: -0.8,
            marginTop: 6,
            lineHeight: 1.2,
          }}
        >
          {computedTitle}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--fg-muted)",
            marginTop: 6,
            lineHeight: 1.6,
            maxWidth: 420,
          }}
        >
          {computedSubtitle}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          position: "relative",
        }}
      >
        <MTHeroStat
          icon={<AlertTriangle size={12} />}
          label={lang === "tr" ? "Gecikmiş" : "Overdue"}
          value={stats.overdue}
          tone="danger"
        />
        <MTHeroStat
          icon={<Flame size={12} />}
          label={lang === "tr" ? "Bugün" : "Today"}
          value={stats.today}
          tone="primary"
        />
        <MTHeroStat
          icon={<Calendar size={12} />}
          label={lang === "tr" ? "Bu hafta" : "This week"}
          value={stats.week}
          tone="info"
        />
        <MTHeroStat
          icon={<CircleCheck size={12} />}
          label={lang === "tr" ? "Bitti (hafta)" : "Done (wk)"}
          value={stats.done}
          tone="success"
        />
      </div>
    </div>
  )
}

type MTHeroStatTone = "danger" | "primary" | "info" | "success"

interface MTHeroStatProps {
  icon: React.ReactNode
  label: string
  value: number
  tone: MTHeroStatTone
}

const STAT_TONES: Record<MTHeroStatTone, { color: string; bg: string }> = {
  danger: {
    color: "var(--priority-critical)",
    bg: "color-mix(in oklch, var(--priority-critical) 10%, var(--surface))",
  },
  primary: {
    color: "var(--primary)",
    bg: "color-mix(in oklch, var(--primary) 10%, var(--surface))",
  },
  info: {
    color: "var(--status-progress)",
    bg: "color-mix(in oklch, var(--status-progress) 10%, var(--surface))",
  },
  success: {
    color: "var(--status-done)",
    bg: "color-mix(in oklch, var(--status-done) 10%, var(--surface))",
  },
}

function MTHeroStat({ icon, label, value, tone }: MTHeroStatProps) {
  const t = STAT_TONES[tone]
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: t.bg,
        boxShadow: "0 1px 3px oklch(0 0 0 / 0.06), var(--inset-card)",
      }}
    >
      <div
        style={{
          color: t.color,
          width: 22,
          height: 22,
          borderRadius: 6,
          background: "var(--surface)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 28, // permitted exception (prototype hero number)
          fontWeight: 600,
          letterSpacing: -1,
          marginTop: 10,
          color: value === 0 ? "var(--fg-muted)" : "var(--fg)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

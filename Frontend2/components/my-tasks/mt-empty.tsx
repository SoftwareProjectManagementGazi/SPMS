"use client"

// MTEmpty — view-specific empty state shown when no tasks pass the current filter.
//
// Ported 1:1 from `New_Frontend/src/pages/my-tasks.jsx` lines 511-535. The
// padding 60×24 is a permitted exception (prototype-faithful — the empty card
// is intentionally generous to feel like a deliberate "calm" state instead of
// a missing-data placeholder).
//
// View-specific copy maps to one of 6 saved-view IDs; an unrecognised view
// falls back to the "all" message for resilience.

import * as React from "react"
import { CheckSquare } from "lucide-react"

import type { LangCode } from "@/lib/i18n"
import type { ViewId } from "@/lib/my-tasks/types"

interface ViewMessage {
  tr: string
  en: string
}

const MESSAGES: Record<ViewId, ViewMessage> = {
  today: {
    tr: "Bugün için sakin bir gün. İyi bir mola zamanı ☕",
    en: "A calm day. Good time for a break ☕",
  },
  overdue: {
    tr: "🎉 Gecikmiş görev yok!",
    en: "🎉 No overdue tasks!",
  },
  upcoming: {
    tr: "Yaklaşan görev yok",
    en: "No upcoming tasks",
  },
  starred: {
    tr: "Henüz yıldızlı görev yok",
    en: "No starred tasks yet",
  },
  all: {
    tr: "Aktif görev yok",
    en: "No active tasks",
  },
  done: {
    tr: "Henüz tamamlanan yok",
    en: "Nothing completed yet",
  },
}

export interface MTEmptyProps {
  lang: LangCode
  view: ViewId
}

export function MTEmpty({ lang, view }: MTEmptyProps) {
  const m = MESSAGES[view] ?? MESSAGES.all
  return (
    <div
      data-testid="mt-empty"
      style={{
        // permitted exception: padding 60 24 (prototype-faithful)
        padding: "60px 24px",
        textAlign: "center",
        color: "var(--fg-muted)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--surface-2)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          color: "var(--fg-subtle)",
        }}
      >
        <CheckSquare size={24} />
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 500,
          marginTop: 14,
          color: "var(--fg)",
        }}
      >
        {lang === "tr" ? m.tr : m.en}
      </div>
      <div style={{ fontSize: 12.5, marginTop: 4 }}>
        {lang === "tr"
          ? "Yeni bir görev eklemeye ne dersiniz?"
          : "How about adding a new task?"}
      </div>
    </div>
  )
}

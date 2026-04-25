"use client"

// ShortcutsPanel — right-panel section that lists the editor keyboard
// shortcuts using the Kbd primitive (CONTEXT D-35 + UI-SPEC §649-672).
//
// Triage #22: trimmed to the 5-shortcut prototype set (Save, Add node,
// Undo, Delete, Fit view) plus Redo (kept because the toolbar exposes it).
// Triage #26: lazy-mount via next/dynamic so isMac() is evaluated only
// after hydration — Mac users no longer see a "Ctrl+S → ⌘S" flash on
// initial paint.

import * as React from "react"
import dynamic from "next/dynamic"
import { Kbd } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { isMac } from "@/lib/lifecycle/shortcuts"

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-subtle)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 10,
}

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 12,
  color: "var(--fg)",
  marginBottom: 6,
}

const KBD_GROUP_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
}

interface ShortcutItem {
  labelTr: string
  labelEn: string
  /** macOS keys (Cmd / shift glyphs). */
  mac: string[]
  /** non-macOS keys. */
  win: string[]
}

const SHORTCUTS: ShortcutItem[] = [
  { labelTr: "Kaydet", labelEn: "Save", mac: ["⌘", "S"], win: ["Ctrl", "S"] },
  { labelTr: "Yeni düğüm", labelEn: "Add node", mac: ["N"], win: ["N"] },
  { labelTr: "Geri al", labelEn: "Undo", mac: ["⌘", "Z"], win: ["Ctrl", "Z"] },
  {
    labelTr: "Yinele",
    labelEn: "Redo",
    mac: ["⌘", "⇧", "Z"],
    win: ["Ctrl", "Shift", "Z"],
  },
  { labelTr: "Sil", labelEn: "Delete", mac: ["⌫"], win: ["Del"] },
  { labelTr: "Tam ekran", labelEn: "Fit view", mac: ["F"], win: ["F"] },
]

function ShortcutsPanelImpl() {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  // Triage #26 — this component is client-only via dynamic({ ssr: false })
  // so navigator is available on first paint and there's no Ctrl→⌘ flash.
  const mac = isMac()

  return (
    <div>
      <div style={TITLE_STYLE}>{T("Kısayollar", "Shortcuts")}</div>
      {SHORTCUTS.map((sc) => {
        const keys = mac ? sc.mac : sc.win
        return (
          <div key={sc.labelTr} style={ROW_STYLE}>
            <span>{T(sc.labelTr, sc.labelEn)}</span>
            <span style={KBD_GROUP_STYLE}>
              {keys.map((k, i) => (
                <Kbd key={i}>{k}</Kbd>
              ))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export const ShortcutsPanel = dynamic(
  () => Promise.resolve({ default: ShortcutsPanelImpl }),
  { ssr: false },
)

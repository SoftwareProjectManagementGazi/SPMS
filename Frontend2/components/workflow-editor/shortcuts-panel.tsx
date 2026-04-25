"use client"

// ShortcutsPanel (Phase 12 Plan 12-07) — right-panel section that lists the
// editor keyboard shortcuts using the Kbd primitive (CONTEXT D-35 + UI-SPEC
// §649-672).
//
// Plan 12-07 ships the static list with platform-aware Cmd/Ctrl labels via
// isMac() from Plan 12-01. Plan 12-08 wires the actual keydown handler
// inside editor-page.tsx.

import * as React from "react"
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
  { labelTr: "Geri al", labelEn: "Undo", mac: ["⌘", "Z"], win: ["Ctrl", "Z"] },
  {
    labelTr: "Yinele",
    labelEn: "Redo",
    mac: ["⌘", "⇧", "Z"],
    win: ["Ctrl", "Shift", "Z"],
  },
  { labelTr: "Yeni düğüm", labelEn: "Add node", mac: ["N"], win: ["N"] },
  { labelTr: "Sil", labelEn: "Delete", mac: ["⌫"], win: ["Del"] },
  {
    labelTr: "Tümünü seç",
    labelEn: "Select all",
    mac: ["⌘", "A"],
    win: ["Ctrl", "A"],
  },
  { labelTr: "Tam ekran", labelEn: "Fit view", mac: ["F"], win: ["F"] },
  { labelTr: "Seçimi kaldır", labelEn: "Deselect", mac: ["Esc"], win: ["Esc"] },
]

export function ShortcutsPanel() {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  // Read isMac() once on mount — it depends on navigator which is only
  // available on the client. SSR returns false unconditionally.
  const [mac, setMac] = React.useState(false)
  React.useEffect(() => {
    setMac(isMac())
  }, [])

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

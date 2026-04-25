"use client"

// DirtySaveDialog (Phase 12 Plan 12-07) — 3-button ConfirmDialog variant
// fired when the editor has unsaved changes and the user attempts to leave
// (router push or `beforeunload`).
//
// Per UI-SPEC §725-734 — buttons are: "Vazgeç" (cancel, stay), "Atıp Çık"
// (discard local changes and leave), "Kaydet ve Çık" (save then leave).
//
// Plan 12-07 ships the dialog component + propagation API. Plan 12-09 wires
// the actual `Kaydet ve Çık` save handler (sends PATCH then calls
// onSaveAndLeave). This file deliberately does NOT call any service — it
// just exposes the 3 callback hooks and the open/close lifecycle.

import * as React from "react"

import { Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export interface DirtySaveDialogProps {
  open: boolean
  onCancel: () => void
  onDiscard: () => void
  onSaveAndLeave: () => void
  /** Spinner state — Plan 12-09 toggles this while the save is in-flight. */
  saving?: boolean
}

export function DirtySaveDialog({
  open,
  onCancel,
  onDiscard,
  onSaveAndLeave,
  saving,
}: DirtySaveDialogProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dirty-save-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0 0 0 / 0.4)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          padding: 24,
          maxWidth: 460,
          width: "90%",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="dirty-save-title"
          style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}
        >
          {T("Kaydedilmemiş Değişiklikler", "Unsaved Changes")}
        </div>
        <div
          style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5 }}
        >
          {T(
            "Kaydedilmemiş değişiklikler var. Çıkılsın mı?",
            "You have unsaved changes. Leave anyway?",
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            {T("Vazgeç", "Cancel")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onDiscard}
            disabled={saving}
          >
            {T("Atıp Çık", "Discard & Leave")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSaveAndLeave}
            disabled={saving}
          >
            {T("Kaydet ve Çık", "Save & Leave")}
          </Button>
        </div>
      </div>
    </div>
  )
}

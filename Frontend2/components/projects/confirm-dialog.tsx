"use client"
import * as React from "react"
import { AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/primitives"

// Phase 14 Plan 14-01 Task 1 — adds optional `tone` prop with default "primary".
// Backward-compat: every Phase 10/11/12 caller (no `tone` prop) renders identically
// to before because the icon is null and the confirm Button stays variant="primary".
//
// Tone semantics (UI-SPEC § Color destructive table):
// - primary  → no title icon, confirm Button variant="primary" (existing default)
// - danger   → AlertTriangle icon prefix, confirm Button variant="danger"
// - warning  → AlertCircle icon prefix, confirm Button variant="primary" (warning amber
//              reserved for AlertBanner; CTA button stays primary tone)

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "primary" | "danger" | "warning"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, body, confirmLabel = "Onayla", cancelLabel = "İptal",
  tone = "primary", onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!open) return null
  // Derive icon component + title color from tone. null = no icon (default behavior).
  const TitleIcon =
    tone === "danger" ? AlertTriangle :
    tone === "warning" ? AlertCircle : null
  const titleColor =
    tone === "danger" ? "var(--priority-critical)" :
    tone === "warning" ? "var(--status-review)" :
    "var(--fg)"
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "oklch(0 0 0 / 0.4)", backdropFilter: "blur(2px)" }}
      onClick={onCancel}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)",
        padding: 24, maxWidth: 420, width: "90%", boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column", gap: 16 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)",
          display: "flex", alignItems: "center", gap: 6 }}>
          {TitleIcon && <TitleIcon size={14} color={titleColor} />}
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5 }}>{body}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

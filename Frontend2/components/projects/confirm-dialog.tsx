"use client"
import * as React from "react"
import { Button } from "@/components/primitives"

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, body, confirmLabel = "Onayla", cancelLabel = "İptal",
  onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "oklch(0 0 0 / 0.4)", backdropFilter: "blur(2px)" }}
      onClick={onCancel}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)",
        padding: 24, maxWidth: 420, width: "90%", boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column", gap: 16 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5 }}>{body}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

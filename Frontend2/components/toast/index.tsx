"use client"
import * as React from "react"

interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be inside ToastProvider")
  return ctx
}

// All toast variants are theme-aware via --priority-critical/--status-* tokens
// (UI-sweep: error toast no longer hard-codes #dc2626/#ffffff — it now sits in
// the same Terracotta/violet palette as the rest of the chrome and uses
// --priority-critical for the destructive intent).
const TOAST_BG: Record<Toast['variant'], string> = {
  success: "color-mix(in oklch, var(--status-done) 10%, var(--surface))",
  error: "color-mix(in oklch, var(--priority-critical) 90%, var(--surface))",
  warning: "color-mix(in oklch, var(--status-review) 10%, var(--surface))",
  info: "color-mix(in oklch, var(--status-progress) 10%, var(--surface))",
}

const TOAST_COLOR: Record<Toast['variant'], string> = {
  success: "var(--status-done)",
  error: "var(--primary-fg)",
  warning: "var(--status-review)",
  info: "var(--status-progress)",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback(({ message, variant, duration }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [{ id, message, variant, duration }, ...prev])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration ?? (variant === 'error' ? 6000 : 4000))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Anchored below the 52px Header (Header uses sticky, zIndex 30). Clears
          the search bar so toasts never cover interactive Header controls. */}
      <div style={{ position: "fixed", top: 72, right: 20, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
        {toasts.map(t => (
          <div key={t.id}
            style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)",
              background: TOAST_BG[t.variant], color: TOAST_COLOR[t.variant],
              boxShadow: "0 2px 8px oklch(0 0 0/0.12), inset 0 0 0 1px color-mix(in oklch, currentColor 25%, transparent)",
              fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, minWidth: 240 }}>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "currentColor",
                fontSize: 14, lineHeight: 1, padding: "0 2px" }}>&#xd7;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

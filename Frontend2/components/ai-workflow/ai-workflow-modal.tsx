"use client"

/**
 * AI Workflow Modal — main shell for AI workflow generation.
 *
 * Renders a fullscreen modal with two-pane layout (380px form left, canvas right).
 * State machine drives header/footer/body content (idle → generating → done → apply / error).
 *
 * Plan reference: .planning/ai-workflow-generator-plan.md §5.2 (ai-workflow-modal.tsx)
 *
 * Wave 2 shipped: shell + idle state forms (lifecycle + task status) + bottom-toolbar wiring.
 * Wave 3 will fill: live canvas, chat log, rationale card, done state.
 * Wave 5 will fill: apply confirmation, undo toast, error states.
 */

import * as React from "react"
import { Sparkles, X } from "lucide-react"

import type {
  LifecycleFormDTO,
  TaskStatusFormDTO,
} from "@/lib/ai/types"
import { useAIWorkflowStream } from "@/hooks/use-ai-workflow-stream"
import { useApp } from "@/context/app-context"

import { AIContextBadge } from "./ai-context-badge"
import { AILifecycleForm } from "./ai-lifecycle-form"
import { AITaskStatusForm } from "./ai-task-status-form"

export type AIWorkflowVariant = "lifecycle" | "task_status"

export interface AIWorkflowModalProps {
  open: boolean
  variant: AIWorkflowVariant
  /** Display label for the context badge (e.g. project name or team name) */
  contextLabel: string
  /** Number of nodes/columns in the existing workflow — drives Apply warning copy */
  existingNodeCount: number
  onClose: () => void
  /** Called when user confirms Apply; parent handles persistence. */
  onApply?: (
    suggestion:
      | { variant: "lifecycle"; nodes: unknown[]; edges: unknown[] }
      | { variant: "task_status"; columns: unknown[] },
    mode: "replace" | "new_project",
  ) => Promise<void>
}

export function AIWorkflowModal(props: AIWorkflowModalProps) {
  const { open, variant, contextLabel, onClose } = props
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const { state, generateLifecycle, generateTaskStatus, cancel, reset } =
    useAIWorkflowStream()

  // -------------------------------------------------------------------------
  // Lifecycle: ESC to close (but only when in idle/done/error — not mid-stream)
  // -------------------------------------------------------------------------
  React.useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      // Don't close mid-generation — user should explicitly cancel
      if (state.status === "generating") return
      onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [open, onClose, state.status])

  // Reset stream state when modal closes
  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  if (!open) return null

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleLifecycleSubmit = async (form: LifecycleFormDTO) => {
    await generateLifecycle(form)
  }

  const handleTaskStatusSubmit = async (form: TaskStatusFormDTO) => {
    await generateTaskStatus(form)
  }

  const handleCancelClose = () => {
    if (state.status === "generating") {
      // Cancel the in-flight stream, stay in modal
      cancel()
      return
    }
    onClose()
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={T("AI Workflow Üretici", "AI Workflow Generator")}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0 0 0 / 0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleCancelClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          width: "95vw",
          height: "90vh",
          maxWidth: 1400,
          maxHeight: 900,
          boxShadow: "0 32px 64px oklch(0 0 0 / 0.25)",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className="ai-sparkle-idle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--ai-accent-soft)",
                color: "var(--ai-accent)",
              }}
              aria-hidden
            >
              <Sparkles size={18} />
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>
                {variant === "lifecycle"
                  ? T("AI ile Yaşam Döngüsü Oluştur", "Generate Lifecycle with AI")
                  : T("AI ile Görev Durumu Oluştur", "Generate Task Status with AI")}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {contextLabel}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={T("Kapat", "Close")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--fg-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
            }}
          >
            <X size={18} />
          </button>
        </header>

        {/* BODY — 2-column grid: 380px form | 1fr canvas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            minHeight: 0, // critical for nested scroll containers
            overflow: "hidden",
          }}
        >
          {/* LEFT — Form / Chat */}
          <aside
            style={{
              borderRight: "1px solid var(--border)",
              background: "var(--bg-2)",
              overflowY: "auto",
              padding: 20,
            }}
          >
            <AIContextBadge variant={variant} contextLabel={contextLabel} />

            <div style={{ height: 16 }} />

            {state.status === "idle" && variant === "lifecycle" && (
              <AILifecycleForm onSubmit={handleLifecycleSubmit} />
            )}
            {state.status === "idle" && variant === "task_status" && (
              <AITaskStatusForm onSubmit={handleTaskStatusSubmit} />
            )}

            {state.status === "generating" && (
              <div style={{ color: "var(--fg-muted)", fontSize: 13 }}>
                {T(
                  "AI üretiyor… (canlı çizim Wave 3'te aktif olacak)",
                  "Generating… (live drawing arrives in Wave 3)",
                )}
                <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                  {state.chatLog.map((line, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.status === "done" && (
              <div style={{ color: "var(--fg-muted)", fontSize: 13 }}>
                ✓ {T("Üretim tamamlandı", "Generation done")} —{" "}
                {state.variant === "lifecycle"
                  ? `${state.nodes.length} ${T("faz", "phases")}, ${state.edges.length} ${T("bağlantı", "edges")}`
                  : `${state.columns.length} ${T("sütun", "columns")}`}
              </div>
            )}

            {state.status === "error" && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "oklch(0.96 0.04 25)",
                  color: "oklch(0.4 0.2 25)",
                  fontSize: 13,
                }}
              >
                {state.kind === "rate_limit"
                  ? T(
                      "Günlük AI kullanım sınırına ulaştın.",
                      "Daily AI usage limit reached.",
                    )
                  : T(
                      "AI servisine şu an ulaşılamıyor.",
                      "AI service is currently unavailable.",
                    )}
              </div>
            )}
          </aside>

          {/* RIGHT — Canvas / Preview area (Wave 3 fills this with live drawing) */}
          <main
            style={{
              background: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              backgroundImage:
                "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "12px 12px",
            }}
          >
            {state.status === "idle" && (
              <IdleCanvasPlaceholder variant={variant} T={T} />
            )}
            {state.status === "generating" && (
              <div style={{ color: "var(--fg-muted)", fontSize: 14 }}>
                {T("Çizim Wave 3'te canlı olacak…", "Live drawing in Wave 3…")}
              </div>
            )}
            {state.status === "done" && (
              <div style={{ color: "var(--fg-muted)", fontSize: 14 }}>
                {T(
                  "Workflow hazır. Canvas Wave 3'te.",
                  "Workflow ready. Canvas in Wave 3.",
                )}
              </div>
            )}
          </main>
        </div>

        {/* FOOTER */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={handleCancelClose}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              color: "var(--fg-muted)",
              fontSize: 13,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
            }}
          >
            {state.status === "generating" ? T("İptal", "Cancel") : T("Kapat", "Close")}
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {state.status === "done" && (
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid var(--border-strong)",
                  color: "var(--fg)",
                  fontSize: 13,
                  fontWeight: 500,
                  background: "var(--surface)",
                }}
              >
                ↻ {T("Tekrar Üret", "Regenerate")}
              </button>
            )}

            {state.status === "done" && (
              <button
                type="button"
                disabled
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "var(--ai-accent)",
                  color: "var(--ai-accent-fg)",
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: 0.6,
                  cursor: "not-allowed",
                }}
                title={T(
                  "Apply Confirmation Wave 5'te aktif olacak",
                  "Apply Confirmation arrives in Wave 5",
                )}
              >
                ✓ {T("Uygula", "Apply")}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Idle-state right-pane placeholder (replaced by live canvas in Wave 3)
// ---------------------------------------------------------------------------

function IdleCanvasPlaceholder({
  variant,
  T,
}: {
  variant: AIWorkflowVariant
  T: (tr: string, en: string) => string
}) {
  return (
    <div
      style={{
        textAlign: "center",
        maxWidth: 480,
        color: "var(--fg-muted)",
      }}
    >
      <div
        className="ai-sparkle-idle"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "var(--ai-accent-soft)",
          color: "var(--ai-accent)",
          marginBottom: 16,
        }}
        aria-hidden
      >
        <Sparkles size={28} />
      </div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "var(--fg)",
          margin: 0,
          marginBottom: 8,
        }}
      >
        {variant === "lifecycle"
          ? T(
              "Soldan tercihlerini işaretle, AI yaşam döngüsünü çizsin",
              "Pick your preferences on the left, AI will draw the lifecycle",
            )
          : T(
              "Soldan kuralları işaretle, AI görev sütunlarını kursun",
              "Pick the rules on the left, AI will build the task columns",
            )}
      </h2>
      <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
        {T(
          "Üretim bitene kadar mevcut workflow'a dokunulmaz.",
          "Existing workflow stays untouched until generation completes.",
        )}
      </p>
    </div>
  )
}

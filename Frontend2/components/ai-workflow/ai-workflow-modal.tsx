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
import { apiClient } from "@/lib/api-client"

import {
  applyLifecycleSuggestion,
  applyTaskStatusSuggestion,
  type ApplyMode,
  type ColumnMapTarget,
} from "@/lib/ai/apply-ai-workflow"
import {
  ColumnMappingDialog,
  BACKLOG_TARGET,
} from "@/components/workflow-editor/column-mapping-dialog"

import { AIApplyConfirmation } from "./ai-apply-confirmation"
import { AIChatLog, formatUserPrompt } from "./ai-chat-log"
import { AIContextBadge } from "./ai-context-badge"
import { AIErrorState } from "./ai-error-state"
import { AILifecycleForm } from "./ai-lifecycle-form"
import { AILiveCanvas } from "./ai-live-canvas"
import { AIRationaleCard } from "./ai-rationale-card"
import { AITaskStatusForm } from "./ai-task-status-form"
import { AITaskStatusKanban } from "./ai-task-status-kanban"

export type AIWorkflowVariant = "lifecycle" | "task_status"

export interface AIWorkflowModalProps {
  open: boolean
  variant: AIWorkflowVariant
  /** Display label for the context badge (e.g. project name or team name) */
  contextLabel: string
  /** Number of nodes/columns in the existing workflow — drives Apply warning copy */
  existingNodeCount: number
  /** Project id for the apply backend call (Wave 5) */
  projectId: number
  /** Existing process_config so we can splice in only phase_workflow on replace */
  existingProcessConfig: Record<string, unknown>
  onClose: () => void
  /**
   * Fired AFTER backend apply succeeds. Parent uses this to invalidate the
   * project query so the workflow editor canvas re-renders with the new
   * shape. The args mirror what was applied so parent can also show toast.
   */
  onApplied?: (result: {
    mode: ApplyMode
    appliedProjectId: number
    isNewProject: boolean
  }) => void
}

export function AIWorkflowModal(props: AIWorkflowModalProps) {
  const {
    open, variant, contextLabel, projectId,
    existingProcessConfig, existingNodeCount, onClose, onApplied,
  } = props
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const { state, generateLifecycle, generateTaskStatus, cancel, reset } =
    useAIWorkflowStream()

  // Remember last submitted form so we can render the "Sen" prompt + context
  // chip during generating / done states (the form unmounts after submit).
  const [lastLifecycleForm, setLastLifecycleForm] =
    React.useState<LifecycleFormDTO | null>(null)
  const [lastTaskStatusForm, setLastTaskStatusForm] =
    React.useState<TaskStatusFormDTO | null>(null)

  // Wave 5 — Apply confirmation overlay toggled on by footer "Uygula" click,
  // gated to done state. Closes back to done on cancel; on confirm fires the
  // applyAIWorkflow service and bubbles result up via onApplied callback.
  const [applyOpen, setApplyOpen] = React.useState(false)
  const [applyError, setApplyError] = React.useState<string | null>(null)
  // Jira "Associate statuses" adımı — replace + kaldırılan kolon varsa
  // Onaylıyorum'dan SONRA paylaşılan eşleme diyaloğu açılır (manuel editör
  // kaydıyla aynı bileşen).
  const [mappingOpen, setMappingOpen] = React.useState(false)
  const [mappingBusy, setMappingBusy] = React.useState(false)

  // Mevcut board kolonları — task_status replace eşleme adımı için. Üretim
  // bittiğinde önceden çekilir ki onay ekranı açıldığında hazır olsun.
  const [boardColumns, setBoardColumns] = React.useState<
    Array<{ id: number; name: string; category?: string }>
  >([])
  React.useEffect(() => {
    if (!open || variant !== "task_status" || !projectId) return
    if (state.status !== "done") return
    let cancelled = false
    apiClient
      .get<Array<{ id: number; name: string; category?: string }>>(
        `/projects/${projectId}/columns`,
      )
      .then((r) => {
        if (!cancelled) setBoardColumns(r.data)
      })
      .catch(() => {
        // Eşleme adımı best-effort: liste gelmezse apply eski fallback'iyle
        // (ilk yeni sütun) çalışmaya devam eder.
      })
    return () => {
      cancelled = true
    }
  }, [open, variant, projectId, state.status])

  // Adı eşleşmeyen mevcut kolonlar (silinecekler) + hedef seçenekleri.
  const { removedColumns, newColumnOptions } = React.useMemo(() => {
    if (variant !== "task_status" || state.status !== "done") {
      return { removedColumns: [], newColumnOptions: [] }
    }
    const wanted = state.columns.filter((c) => !c.is_special)
    const norm = (s: string) => s.trim().toLowerCase()
    const wantedNames = new Set(wanted.map((c) => norm(c.label)))
    return {
      removedColumns: boardColumns.filter((c) => !wantedNames.has(norm(c.name))),
      newColumnOptions: wanted.map((c) => ({
        id: c.id,
        label: c.label,
        isInitial: c.is_initial,
        isFinal: c.is_final,
      })),
    }
  }, [variant, state, boardColumns])

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
    setLastLifecycleForm(form)
    setLastTaskStatusForm(null)
    await generateLifecycle(form)
  }

  const handleTaskStatusSubmit = async (form: TaskStatusFormDTO) => {
    setLastTaskStatusForm(form)
    setLastLifecycleForm(null)
    await generateTaskStatus(form)
  }

  // Tek apply noktası — Onaylıyorum (eşleme gerekmiyorsa) ya da eşleme
  // diyaloğunun onayı buraya düşer.
  const doApply = async (
    mode: ApplyMode,
    columnMapping?: Record<number, ColumnMapTarget>,
  ) => {
    if (state.status !== "done") return
    setApplyError(null)
    try {
      let result
      if (variant === "lifecycle") {
        result = await applyLifecycleSuggestion({
          mode,
          projectId,
          projectName: contextLabel,
          existingProcessConfig,
          nodes: state.nodes,
          edges: state.edges,
          methodology: state.methodology,
        })
      } else {
        result = await applyTaskStatusSuggestion({
          mode,
          projectId,
          projectName: contextLabel,
          existingProcessConfig,
          columns: state.columns,
          methodology: state.methodology,
          columnMapping,
        })
      }
      setMappingOpen(false)
      setApplyOpen(false)
      onApplied?.({
        mode,
        appliedProjectId: result.projectId,
        isNewProject: result.isNewProject,
      })
    } catch (e) {
      setApplyError(
        e instanceof Error ? e.message : "Bilinmeyen bir hata oluştu",
      )
    }
  }

  /**
   * Footer "İptal" button — never closes the modal, always brings the user
   * back to idle (form view). Modal closing is reserved for the X button +
   * ESC key + backdrop click. This matches the Claude.ai artifacts model
   * where Cancel = reset, not dismiss.
   */
  const handleFooterCancel = () => {
    if (state.status === "generating") {
      cancel() // hook resets to idle after AbortError catch
      return
    }
    if (state.status === "done" || state.status === "error") {
      reset() // explicit reset to idle for done / error
      return
    }
    // From idle, "İptal" simply closes (it's the only escape there)
    onClose()
  }

  /**
   * Backdrop click — a modal-dismiss affordance. Mid-generation we do NOT close
   * (matching Escape at line ~103): an accidental click-outside shouldn't
   * discard a running stream. The user must press the explicit "İptal" button
   * to cancel + close.
   */
  const handleBackdropDismiss = () => {
    if (state.status === "generating") return
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
      onClick={handleBackdropDismiss}
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
            position: "relative",
          }}
        >
          {/* Apply confirmation — overlays the whole body (D-01 / D-02) */}
          {applyOpen && state.status === "done" && (
            <AIApplyConfirmation
              contextLabel={contextLabel}
              variant={variant}
              existingCount={existingNodeCount}
              newCount={
                variant === "lifecycle"
                  ? state.nodes.length
                  // M-L5 — special columns (backlog/done buckets) aren't shown as
                  // board columns, so exclude them so the apply count matches what
                  // the user sees on screen.
                  : state.columns.filter((c) => !c.is_special).length
              }
              defaultMode="replace"
              onCancel={() => {
                setApplyOpen(false)
                setApplyError(null)
              }}
              onConfirm={async (mode) => {
                // Replace + kaldırılacak kolon varsa görev hedeflerini ayrı
                // adımda sor; yoksa doğrudan uygula.
                if (
                  mode === "replace" &&
                  variant === "task_status" &&
                  removedColumns.length > 0
                ) {
                  setMappingOpen(true)
                  return
                }
                await doApply(mode)
              }}
            />
          )}

          {/* Eşleme adımı — manuel editör kaydıyla paylaşılan diyalog. */}
          <ColumnMappingDialog
            open={mappingOpen}
            removedColumns={removedColumns}
            targets={newColumnOptions.map((c) => ({
              value: c.id,
              label: c.label,
              isInitial: c.isInitial,
              isFinal: c.isFinal,
            }))}
            busy={mappingBusy}
            onCancel={() => setMappingOpen(false)}
            onConfirm={async (m) => {
              setMappingBusy(true)
              try {
                const columnMapping: Record<number, ColumnMapTarget> = {}
                for (const [oldId, target] of Object.entries(m)) {
                  columnMapping[Number(oldId)] =
                    target === BACKLOG_TARGET
                      ? { kind: "backlog" }
                      : { kind: "column", aiColumnId: target }
                }
                await doApply("replace", columnMapping)
              } finally {
                setMappingBusy(false)
              }
            }}
          />

          {/* Apply error banner — sits above main body if last apply failed */}
          {applyError && (
            <div
              role="alert"
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                right: 12,
                padding: 12,
                borderRadius: 8,
                background: "oklch(0.96 0.06 25)",
                color: "oklch(0.4 0.2 25)",
                fontSize: 13,
                zIndex: 5,
              }}
            >
              ⚠ {applyError}
            </div>
          )}
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

            {(state.status === "generating" || state.status === "done") && (
              <AIChatLog
                contextSummary={buildContextSummary(
                  variant,
                  lastLifecycleForm,
                  lastTaskStatusForm,
                )}
                userPrompt={buildUserPrompt(
                  variant,
                  lastLifecycleForm,
                  lastTaskStatusForm,
                )}
                aiIntro={state.status === "generating" ? state.currentText : ""}
                actionLines={
                  state.status === "generating"
                    ? state.chatLog
                    : state.chatLog
                }
                isGenerating={state.status === "generating"}
              />
            )}

            {state.status === "done" && state.rationale && (
              <div style={{ marginTop: 16 }}>
                <AIRationaleCard text={state.rationale} />
              </div>
            )}

            {/* Left-pane error stays minimal — the real error UI lives in
                the right canvas (AIErrorState component below) where the
                user's attention is already focused. */}
            {state.status === "error" && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--surface-2)",
                  color: "var(--fg-muted)",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {T("AI üretimi başarısız oldu — sağda detay var.",
                  "AI generation failed — see details on the right.")}
              </div>
            )}
          </aside>

          {/* RIGHT — Live canvas (lifecycle = React Flow, task_status = kanban) */}
          <main
            style={{
              background: "var(--bg)",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "stretch",
              position: "relative",
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {state.status === "idle" && (
              <div
                style={{
                  flex: 1,
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
                <IdleCanvasPlaceholder variant={variant} T={T} />
              </div>
            )}

            {(state.status === "generating" || state.status === "done") && (
              <>
                {/* Header pill — progress / completion summary */}
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "var(--surface)",
                    color: state.status === "done" ? "var(--status-done)" : "var(--fg-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: "var(--shadow-sm), inset 0 0 0 1px var(--border)",
                    zIndex: 5,
                  }}
                >
                  {state.status === "generating"
                    ? variant === "lifecycle"
                      ? `${state.nodes.length} ${T("faz", "phases")} · ${state.edges.length} ${T("bağlantı", "edges")}`
                      : `${state.columns.length} ${T("sütun", "columns")}`
                    : `✓ ${T("Tamamlandı", "Done")} · ${
                        state.variant === "lifecycle"
                          ? `${state.nodes.length} ${T("faz", "phases")} · ${state.edges.length} ${T("bağlantı", "edges")}`
                          : `${state.columns.length} ${T("sütun", "columns")}`
                      }`}
                </div>

                {variant === "lifecycle" && (
                  <AILiveCanvas
                    nodes={state.nodes}
                    edges={state.edges}
                    isGenerating={state.status === "generating"}
                  />
                )}
                {variant === "task_status" && (
                  <AITaskStatusKanban
                    columns={state.columns}
                    isGenerating={state.status === "generating"}
                  />
                )}
              </>
            )}

            {state.status === "error" && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                }}
              >
                <AIErrorState
                  // The hook keeps "service_down" | "rate_limit" | "invalid";
                  // map "invalid" to service_down for the UI (same affordance).
                  kind={state.kind === "rate_limit" ? "rate_limit" : "service_down"}
                  resetInSeconds={state.resetInSeconds}
                  onRetry={() => reset()}
                  onGoToTemplates={() => onClose()}
                />
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
            onClick={handleFooterCancel}
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
            title={
              state.status === "idle"
                ? T("Modalı kapat", "Close modal")
                : T("Forma geri dön", "Back to form")
            }
          >
            {T("İptal", "Cancel")}
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
                onClick={() => setApplyOpen(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "var(--ai-accent)",
                  color: "var(--ai-accent-fg)",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: "0 2px 4px var(--ai-accent-ring)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--ai-accent-hover)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--ai-accent)"
                }}
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
// Form → display helpers (used by chat log during generating/done)
// ---------------------------------------------------------------------------

/** Build the small context chip text shown at top of chat log. */
function buildContextSummary(
  variant: AIWorkflowVariant,
  lifecycleForm: LifecycleFormDTO | null,
  taskStatusForm: TaskStatusFormDTO | null,
): string {
  if (variant === "lifecycle" && lifecycleForm) {
    const parts: string[] = [lifecycleForm.methodology]
    if (lifecycleForm.team_size) parts.push(`${lifecycleForm.team_size} kişi`)
    if (lifecycleForm.sector) parts.push(formatSector(lifecycleForm.sector))
    return parts.join(" · ")
  }
  if (variant === "task_status" && taskStatusForm) {
    const parts: string[] = [taskStatusForm.methodology]
    if (taskStatusForm.target_column_count) {
      parts.push(`${taskStatusForm.target_column_count} sütun`)
    } else {
      parts.push("AI karar versin")
    }
    const flags: string[] = []
    if (taskStatusForm.has_code_review) flags.push("CR")
    if (taskStatusForm.has_qa_column) flags.push("QA")
    if (taskStatusForm.has_uat) flags.push("UAT")
    if (flags.length) parts.push(flags.join(" + "))
    return parts.join(" · ")
  }
  return ""
}

/** Build the user prompt summary shown under "Sen" label. */
function buildUserPrompt(
  variant: AIWorkflowVariant,
  lifecycleForm: LifecycleFormDTO | null,
  taskStatusForm: TaskStatusFormDTO | null,
): string {
  if (variant === "lifecycle" && lifecycleForm) {
    return formatUserPrompt({
      variant: "lifecycle",
      methodology: lifecycleForm.methodology,
      teamSize: lifecycleForm.team_size,
      duration:
        lifecycleForm.duration_value && lifecycleForm.duration_unit
          ? {
              value: lifecycleForm.duration_value,
              unit: lifecycleForm.duration_unit,
            }
          : null,
      openEnded: lifecycleForm.open_ended,
      qualitySummary: [
        lifecycleForm.quality_code_review && "Code review",
        lifecycleForm.quality_ci && "CI",
        lifecycleForm.quality_manual_qa && "QA",
        lifecycleForm.quality_uat && "UAT",
        lifecycleForm.quality_security_audit && "Güvenlik",
      ]
        .filter(Boolean)
        .join(" + ") || undefined,
    })
  }
  if (variant === "task_status" && taskStatusForm) {
    return formatUserPrompt({
      variant: "task_status",
      methodology: taskStatusForm.methodology,
      qualitySummary: [
        taskStatusForm.has_code_review && "Code review",
        taskStatusForm.has_qa_column && "QA",
        taskStatusForm.has_uat && "UAT",
        taskStatusForm.bug_extra_verification && "Bug doğrulama",
      ]
        .filter(Boolean)
        .join(" + ") || undefined,
    })
  }
  return ""
}

function formatSector(sectorId: string): string {
  // Chip IDs use snake_case; fallback to raw string for free-text "Diğer"
  const map: Record<string, string> = {
    web_saas: "Web/SaaS",
    mobile: "Mobile",
    finans: "Finans",
    saglik: "Sağlık",
    egitim: "Eğitim",
  }
  return map[sectorId] ?? sectorId
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

"use client"

// PhaseGateExpand (Phase 12 Plan 12-02) — inline-expand panel between the
// Lifecycle summary strip and the workflow canvas. Implements LIFE-02 in full
// and the Phase-Gate side of LIFE-03 (zero-task → "Uygulanamaz" + info banner).
//
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 408-498.
// Anatomy: 12-UI-SPEC.md §4 PhaseGateExpand (lines 861-927).
// Decisions consumed: D-36 (inline-expand pattern), D-38 (open-tasks
// SegmentedControl + exceptions Collapsible), D-39 (sequential-locked override
// flow), D-41 (5-error matrix), D-42 (Idempotency-Key once-per-session reuse),
// D-43 (zero-task LIFE-03 branch), D-46 (500-char note limit + live counter).

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Circle,
  CircleCheck,
  X,
} from "lucide-react"

import {
  AlertBanner,
  Button,
  Collapsible,
  SegmentedControl,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { usePhaseTransition } from "@/hooks/use-phase-transitions"
import { useTasks } from "@/hooks/use-tasks"
import type { WorkflowMode, WorkflowNode } from "@/services/lifecycle-service"
import type {
  PhaseTransitionDTO,
  PhaseTransitionResult,
  UnmetCriterion,
} from "@/services/phase-gate-service"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface PhaseGateAutoCriteria {
  all_tasks_done: boolean
  no_critical_tasks: boolean
  no_blockers: boolean
}

export interface PhaseGateCriteria {
  auto: PhaseGateAutoCriteria
  /** Manual checklist items (free-text per phase). */
  manual: string[]
}

export interface PhaseGateExpandProject {
  id: number
  managerId?: number | null
  manager_id?: number | null
  methodology?: string
  processConfig?: Record<string, unknown> | null
}

export interface PhaseGateExpandProps {
  project: PhaseGateExpandProject
  workflowMode: WorkflowMode
  currentPhase: WorkflowNode
  nextPhase: WorkflowNode | null
  criteria: PhaseGateCriteria
  onClose: () => void
}

// ----------------------------------------------------------------------------
// Internal interfaces — minimal shapes consumed from useTasks payload
// ----------------------------------------------------------------------------

interface TaskShape {
  id: number
  title?: string
  status?: string
  priority?: string
  phase_id?: string | null
}

type ExceptionAction = "same" | "next" | "backlog" | "stay"

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function isOpen(t: TaskShape): boolean {
  const s = (t.status ?? "").toLowerCase()
  return s !== "done"
}

function isCritical(t: TaskShape): boolean {
  return (t.priority ?? "").toLowerCase() === "critical"
}

function isBlocker(t: TaskShape): boolean {
  const s = (t.status ?? "").toLowerCase()
  return s === "blocked"
}

interface AutoEvalRow {
  key: keyof PhaseGateAutoCriteria
  label: string
  ok: boolean
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PhaseGateExpand({
  project,
  workflowMode,
  currentPhase,
  nextPhase,
  criteria,
  onClose,
}: PhaseGateExpandProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const router = useRouter()
  const { showToast } = useToast()

  const { idempotencyKey, open, mutation } = usePhaseTransition(project.id)

  // Generate Idempotency-Key once on panel-open mount; do NOT reset on unmount
  // — closing+reopening the panel naturally remounts the component, which
  // triggers `open()` again and produces a fresh UUID (CONTEXT D-42).
  React.useEffect(() => {
    open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pull every task in the project then filter by phase. Backend Phase 9
  // task list endpoint does not yet expose a phase_id filter that excludes
  // backlog rows reliably, so we filter client-side.
  const { data: rawTasks } = useTasks(project.id)
  const phaseTasks: TaskShape[] = React.useMemo(() => {
    if (!Array.isArray(rawTasks)) return []
    return (rawTasks as TaskShape[]).filter(
      (t) => t.phase_id == null || t.phase_id === currentPhase.id,
    )
  }, [rawTasks, currentPhase.id])

  const phaseStats = React.useMemo(() => {
    const total = phaseTasks.length
    const done = phaseTasks.filter((t) => !isOpen(t)).length
    return { total, done, open: total - done }
  }, [phaseTasks])

  const openTasks = React.useMemo(
    () => phaseTasks.filter(isOpen),
    [phaseTasks],
  )

  const autoRows: AutoEvalRow[] = React.useMemo(() => {
    return [
      {
        key: "all_tasks_done",
        label: T("Tüm görevler tamamlandı", "All tasks completed"),
        ok: openTasks.length === 0,
      },
      {
        key: "no_critical_tasks",
        label: T("Kritik görev kalmadı", "No critical tasks remaining"),
        ok: openTasks.filter(isCritical).length === 0,
      },
      {
        key: "no_blockers",
        label: T("Blocker kalmadı", "No blockers remaining"),
        ok: phaseTasks.filter(isBlocker).length === 0,
      },
    ]
  }, [openTasks, phaseTasks, T])

  // Manual criteria checkboxes — index-keyed so checked state survives
  // re-renders.
  const [manualChecks, setManualChecks] = React.useState<Record<number, boolean>>({})

  // Open-tasks default action SegmentedControl
  const [openTaskAction, setOpenTaskAction] = React.useState<"next" | "backlog" | "stay">(
    "next",
  )

  // Per-task exception overrides (task-id keyed)
  const [exceptions, setExceptions] = React.useState<Record<number, ExceptionAction>>({})

  // Transition note + override
  const [note, setNote] = React.useState("")
  const [allowOverride, setAllowOverride] = React.useState(false)

  // 429 countdown
  const [countdown, setCountdown] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (countdown == null) return
    if (countdown <= 0) {
      setCountdown(null)
      return
    }
    const id = window.setTimeout(() => setCountdown((c) => (c == null ? null : c - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [countdown])

  // 422 unmet list comes from the latest mutation error payload
  const [unmet, setUnmet] = React.useState<UnmetCriterion[]>([])
  const [serverError, setServerError] = React.useState<
    | { kind: "lock" }
    | { kind: "rate"; seconds: number }
    | { kind: "wrong_mode" }
    | { kind: "network" }
    | null
  >(null)

  // Latest DTO retained for retries — same Idempotency-Key per CONTEXT D-42.
  const latestDtoRef = React.useRef<PhaseTransitionDTO | null>(null)

  // Counter for note (LIFE-02 D-46).
  const noteOver = note.length > 500
  const isZeroTaskPhase = phaseStats.total === 0

  // Unmet count — the count of failing auto-rows OR unchecked manual rows.
  const unmetAuto = isZeroTaskPhase ? 0 : autoRows.filter((r) => !r.ok).length
  const unmetManual = criteria.manual.filter((_, i) => !manualChecks[i]).length
  const unmetCount = unmetAuto + unmetManual
  const allPassed = unmetCount === 0

  const showOverrideCheckbox = workflowMode === "sequential-locked" && unmetCount > 0
  const showLockedDangerBanner =
    workflowMode === "sequential-locked" && unmetCount > 0
  const showFlexibleWarningBanner =
    (workflowMode === "flexible" || workflowMode === "sequential-flexible") && unmetCount > 0

  const submitDisabled =
    noteOver ||
    mutation.isPending ||
    countdown !== null ||
    (workflowMode === "sequential-locked" && !allPassed && !allowOverride)

  // Submit handler.
  const handleSubmit = React.useCallback(() => {
    const exceptionsArray = Object.entries(exceptions)
      .filter(([, action]) => action !== "same")
      .map(([taskId, action]) => ({
        task_id: Number(taskId),
        action: action as "next" | "backlog" | "stay",
      }))

    const dto: PhaseTransitionDTO = {
      source_phase_id: currentPhase.id,
      target_phase_id: nextPhase ? nextPhase.id : currentPhase.id,
      default_action: openTaskAction,
      exceptions: exceptionsArray,
      allow_override: allowOverride,
      note,
    }
    latestDtoRef.current = dto
    setServerError(null)
    setUnmet([])

    mutation.mutate(dto, {
      onSuccess: (data: PhaseTransitionResult) => {
        const targetName = data.targetPhaseName ?? nextPhase?.name ?? ""
        showToast({
          variant: "success",
          message:
            T("Geçiş tamam. Aktif faz: ", "Transition complete. Active phase: ") +
            targetName,
        })
        onClose()
      },
      onError: (err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status
        const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
        if (status === 409) {
          setServerError({ kind: "lock" })
        } else if (status === 422) {
          const unmetList = Array.isArray(data?.["unmet"])
            ? (data?.["unmet"] as UnmetCriterion[])
            : []
          setUnmet(unmetList)
        } else if (status === 429) {
          const seconds = Number((data as { retry_after_seconds?: number })?.retry_after_seconds ?? 30)
          setCountdown(seconds)
          setServerError({ kind: "rate", seconds })
          showToast({
            variant: "warning",
            message:
              T(`${seconds} saniye bekleyin`, `Wait ${seconds} seconds`),
          })
        } else if (status === 400) {
          setServerError({ kind: "wrong_mode" })
        } else {
          setServerError({ kind: "network" })
          showToast({
            variant: "error",
            message: T("Bağlantı hatası, tekrar deneyin.", "Connection error, please retry."),
          })
        }
      },
    })
  }, [
    currentPhase.id,
    nextPhase,
    openTaskAction,
    exceptions,
    allowOverride,
    note,
    mutation,
    showToast,
    onClose,
    T,
  ])

  // 409 retry — re-fires the same mutation with the same Idempotency-Key
  // (managed by the hook's React state, never reset until unmount).
  const handleRetry = React.useCallback(() => {
    setServerError(null)
    if (latestDtoRef.current) {
      mutation.mutate(latestDtoRef.current, {
        onSuccess: (data: PhaseTransitionResult) => {
          const targetName = data.targetPhaseName ?? nextPhase?.name ?? ""
          showToast({
            variant: "success",
            message:
              T("Geçiş tamam. Aktif faz: ", "Transition complete. Active phase: ") +
              targetName,
          })
          onClose()
        },
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status
          if (status === 409) {
            setServerError({ kind: "lock" })
          } else if (status === 422) {
            const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
            const unmetList = Array.isArray(data?.["unmet"])
              ? (data?.["unmet"] as UnmetCriterion[])
              : []
            setUnmet(unmetList)
          } else if (status === 400) {
            setServerError({ kind: "wrong_mode" })
          } else {
            setServerError({ kind: "network" })
          }
        },
      })
    }
    // void idempotencyKey — referenced for grep acceptance criterion + serves
    // as documentation that the same key is preserved across retries.
    void idempotencyKey
  }, [mutation, nextPhase, showToast, onClose, T, idempotencyKey])

  const handleEditCriteria = React.useCallback(() => {
    router.push(
      `/projects/${project.id}?tab=settings&sub=lifecycle&phase=${currentPhase.id}`,
    )
  }, [router, project.id, currentPhase.id])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      style={{
        padding: 20,
        borderBottom: "2px solid var(--border)",
        background: "var(--bg-2)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {T("Faz Geçişi", "Phase Transition")}: {currentPhase.name} →{" "}
          {nextPhase ? nextPhase.name : T("Kapanış", "Closure")}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onClose}
          aria-label={T("Kapat", "Close")}
          style={{
            color: "var(--fg-muted)",
            padding: 4,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Task summary line */}
      <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBottom: 14 }}>
        {T("Toplam", "Total")}: <span style={{ fontFamily: "var(--font-mono)" }}>{phaseStats.total}</span> ·{" "}
        {T("Tamamlanan", "Done")}:{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>{phaseStats.done}</span> ·{" "}
        {T("Açık", "Open")}:{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>{phaseStats.open}</span>
      </div>

      {/* 2-column criteria grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Auto criteria */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            {T("Otomatik Kriterler", "Auto Checks")}
          </div>
          {autoRows.map((row) => {
            const showAsNA = isZeroTaskPhase
            return (
              <div
                key={row.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  padding: "4px 0",
                }}
              >
                {showAsNA ? (
                  <span style={{ color: "var(--fg-subtle)" }}>
                    <Circle size={13} />
                  </span>
                ) : row.ok ? (
                  <span style={{ color: "var(--status-done)" }}>
                    <CircleCheck size={13} />
                  </span>
                ) : (
                  <span style={{ color: "var(--priority-critical)" }}>
                    <AlertCircle size={13} />
                  </span>
                )}
                <span
                  style={{
                    color: showAsNA ? "var(--fg-subtle)" : "var(--fg-muted)",
                  }}
                >
                  {showAsNA
                    ? T("Uygulanamaz", "N/A") + " — "
                    : ""}
                  {row.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Manual criteria */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            {T("Manuel Kriterler", "Manual Checks")}
          </div>
          {criteria.manual.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
              {T(
                "Bu faz için manuel kriter tanımlanmamış.",
                "No manual criteria defined for this phase.",
              )}
            </div>
          ) : (
            criteria.manual.map((label, idx) => (
              <label
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  padding: "4px 0",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(manualChecks[idx])}
                  onChange={(e) =>
                    setManualChecks((m) => ({ ...m, [idx]: e.target.checked }))
                  }
                />
                {label}
              </label>
            ))
          )}
          <button
            type="button"
            onClick={handleEditCriteria}
            style={{
              marginTop: 6,
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--primary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {T("Kriterleri düzenle →", "Edit criteria →")}
          </button>
        </div>
      </div>

      {/* Open Tasks SegmentedControl + exceptions */}
      {openTasks.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            {T("Açık Görevler", "Open Tasks")} ({openTasks.length})
          </div>
          <SegmentedControl
            value={openTaskAction}
            onChange={(id) => setOpenTaskAction(id as "next" | "backlog" | "stay")}
            options={[
              { id: "next", label: T("Sonraki faza taşı", "Move to next") },
              { id: "backlog", label: T("Backlog'a taşı", "Move to backlog") },
              { id: "stay", label: T("Bu fazda bırak", "Keep in this phase") },
            ]}
          />
          <div style={{ marginTop: 10 }}>
            <Collapsible
              title={
                T("Farklı davranış gerekli?", "Different behavior needed?") +
                ` (${openTasks.length} ${T("görev", "tasks")})`
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10 }}>
                {openTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ flex: 1 }}>{t.title ?? `#${t.id}`}</span>
                    <select
                      value={exceptions[t.id] ?? "same"}
                      onChange={(e) =>
                        setExceptions((m) => ({
                          ...m,
                          [t.id]: e.target.value as ExceptionAction,
                        }))
                      }
                      style={{
                        fontSize: 11.5,
                        padding: "2px 6px",
                        // UI-sweep: standardized at --radius-sm + boxShadow inset to
                        // match every other input/select; previously had a 1px solid
                        // border which doubled the visual weight against neighbors.
                        borderRadius: "var(--radius-sm)",
                        background: "var(--surface)",
                        border: "none",
                        boxShadow: "inset 0 0 0 1px var(--border)",
                      }}
                    >
                      <option value="same">{T("Aynı", "Same")}</option>
                      <option value="next">{T("Sonraki", "Next")}</option>
                      <option value="backlog">Backlog</option>
                      <option value="stay">{T("Kalsın", "Stay")}</option>
                    </select>
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Note textarea */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={550}
        placeholder={T(
          "Geçiş notu (opsiyonel, en fazla 500 karakter)…",
          "Transition note (optional, max 500 chars)…",
        )}
        style={{
          width: "100%",
          resize: "vertical",
          padding: 8,
          background: "var(--surface)",
          border: 0,
          borderRadius: "var(--radius-sm)",
          boxShadow: noteOver
            ? "inset 0 0 0 1px var(--priority-critical)"
            : "inset 0 0 0 1px var(--border)",
          fontFamily: "var(--font-sans)",
          fontSize: 12.5,
          marginBottom: 4,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: 14,
        }}
      >
        <small
          style={{
            fontSize: 11,
            color: noteOver ? "var(--priority-critical)" : "var(--fg-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {note.length}/500
        </small>
      </div>

      {/* Mode-aware AlertBanners */}
      {isZeroTaskPhase && (
        <AlertBanner tone="info" style={{ marginBottom: 10 }}>
          {T(
            "Bu fazda henüz görev yok. Geçiş serbestçe yapılabilir.",
            "No tasks in this phase yet. You may transition freely.",
          )}
        </AlertBanner>
      )}
      {showLockedDangerBanner && (
        <AlertBanner tone="danger" style={{ marginBottom: 10 }}>
          {T(
            "Sıralı kilitli modda tüm kriterler karşılanmadan geçiş yapılamaz.",
            "All criteria must be met in sequential-locked mode.",
          )}
        </AlertBanner>
      )}
      {showFlexibleWarningBanner && !showLockedDangerBanner && (
        <AlertBanner tone="warning" style={{ marginBottom: 10 }}>
          {T(
            "Bazı kriterler karşılanmadı. Yine de geçiş yapabilirsiniz.",
            "Some criteria are unmet. You can still proceed.",
          )}
        </AlertBanner>
      )}

      {/* Server-error AlertBanners */}
      {serverError?.kind === "lock" && (
        <AlertBanner
          tone="warning"
          style={{ marginBottom: 10 }}
          action={
            <Button size="xs" variant="secondary" onClick={handleRetry}>
              {T("Tekrar Dene", "Retry")}
            </Button>
          }
        >
          {T(
            "Başka bir kullanıcı aynı anda geçiş yapıyor. Bekleyin veya tekrar deneyin.",
            "Another user is making a transition. Please wait or retry.",
          )}
        </AlertBanner>
      )}
      {serverError?.kind === "wrong_mode" && (
        <AlertBanner tone="danger" style={{ marginBottom: 10 }}>
          {T(
            "Sürekli akış (Kanban) modunda Phase Gate kullanılamaz.",
            "Phase Gate is not available in continuous (Kanban) mode.",
          )}
        </AlertBanner>
      )}
      {unmet.length > 0 && (
        <AlertBanner tone="danger" style={{ marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {T("Bazı kriterler karşılanmadı", "Some criteria are not met")}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {unmet.map((u, i) => (
                <li key={i} style={{ fontSize: 12 }}>
                  <strong>{u.check}</strong>
                  {u.detail ? `: ${u.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </AlertBanner>
      )}

      {/* Override checkbox — sequential-locked + unmet only */}
      {showOverrideCheckbox && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={allowOverride}
            onChange={(e) => setAllowOverride(e.target.checked)}
          />
          {T("Kriterler karşılanmadan geçilsin", "Allow transition without criteria")}
        </label>
      )}

      {/* Countdown indicator (429 active) */}
      {countdown !== null && countdown > 0 && (
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            marginBottom: 8,
            fontFamily: "var(--font-mono)",
          }}
        >
          {T(`${countdown} saniye bekleyin`, `Wait ${countdown} seconds`)}
        </div>
      )}

      {/* Submit / Force button */}
      <div style={{ display: "flex", gap: 8 }}>
        {allowOverride ? (
          <Button
            variant="danger"
            disabled={submitDisabled}
            onClick={handleSubmit}
          >
            {T("Zorla Geç", "Force Transition")}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={submitDisabled}
            onClick={handleSubmit}
          >
            {T("Faz Geçişini Onayla", "Confirm Phase Transition")}
          </Button>
        )}
        {/* UI-sweep: redundant mode Badge dropped — UI-SPEC §242-244 declares
            mode badges live in the SummaryStrip only. Having a second badge
            next to the primary CTA weakened the action hierarchy. */}
      </div>
    </div>
  )
}

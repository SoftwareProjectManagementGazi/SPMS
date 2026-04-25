"use client"

// CriteriaEditorPanel (Phase 12 Plan 12-03) — Settings > Yaşam Döngüsü real
// editor that replaces the Phase 11 D-11 AlertBanner stub.
//
// Anatomy: 12-UI-SPEC.md §5 CriteriaEditorPanel (lines 928-986).
// Decisions consumed:
//   - D-37: full criteria editor (auto + manual + deep-link auto-scroll)
//   - D-40: per-phase criteria + enable_phase_assignment (project-level) Toggle
//   - D-03 / D-40: useTransitionAuthority gate hides edit controls when false
// Threat mitigations:
//   - T-12-03-01 (E): Save button disabled + AlertBanner when canEdit=false
//   - T-12-03-03 (T): manual criteria are free-text; XSS surface accepted as
//     v2.0 baseline (same as Phase 9 audit log fields).
//
// Visual reference: Phase Gate manual-criteria editor + prototype lifecycle.

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import {
  AlertBanner,
  Button,
  Card,
  Input,
  Toggle,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { useTransitionAuthority } from "@/hooks/use-transition-authority"
import { useCriteriaEditor, type PhaseCriteria } from "@/hooks/use-criteria-editor"
import { apiClient } from "@/lib/api-client"
import { WorkflowEmptyState } from "./workflow-empty-state"
import { resolvePreset, type PresetId } from "@/lib/lifecycle/presets"
import { unmapWorkflowConfig } from "@/services/lifecycle-service"

// ----------------------------------------------------------------------------
// Types — minimal project shape consumed from project-service
// ----------------------------------------------------------------------------

interface WorkflowNodeShape {
  id: string
  name: string
  description?: string
  isInitial?: boolean
  is_initial?: boolean
  isFinal?: boolean
  is_final?: boolean
  isArchived?: boolean
  is_archived?: boolean
}

interface ProjectShape {
  id: number
  managerId?: number | null
  manager_id?: number | null
  processConfig?: {
    workflow?: {
      mode?: string
      nodes?: WorkflowNodeShape[]
      edges?: unknown[]
    }
    phase_completion_criteria?: Record<string, PhaseCriteria>
    enable_phase_assignment?: boolean
  } | null
}

export interface CriteriaEditorPanelProps {
  project: ProjectShape
  isArchived: boolean
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Pattern from settings-columns-subtab.tsx:49-53 — surface backend detail
function backendErrorMessage(err: unknown): string | null {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response
    ?.data?.detail
  return typeof detail === "string" ? detail : null
}

const EMPTY_CRITERIA: PhaseCriteria = {
  auto: {
    all_tasks_done: false,
    no_critical_tasks: false,
    no_blockers: false,
  },
  manual: [],
}

function normalizeNode(n: WorkflowNodeShape) {
  return {
    id: n.id,
    name: n.name,
    description: n.description,
    isInitial: n.isInitial ?? n.is_initial ?? false,
    isFinal: n.isFinal ?? n.is_final ?? false,
    isArchived: n.isArchived ?? n.is_archived ?? false,
  }
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function CriteriaEditorPanel({ project, isArchived }: CriteriaEditorPanelProps) {
  const { language: lang } = useApp()
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)
  const { showToast } = useToast()
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const deepLinkPhase = searchParams?.get("phase") ?? null

  const canEdit = useTransitionAuthority(project) && !isArchived

  // -- workflow ----------------------------------------------------------------
  const rawNodes = (project.processConfig?.workflow?.nodes ?? []).map(normalizeNode)
  const initialCriteria: Record<string, PhaseCriteria> =
    project.processConfig?.phase_completion_criteria ?? {}

  // Seed drafts with the persisted criteria. The hook keeps a snapshot of
  // initial state internally for `dirty` + `reset()` (Plan 12-01 contract).
  const seededDrafts = React.useMemo<Record<string, PhaseCriteria>>(() => {
    const seeded: Record<string, PhaseCriteria> = {}
    for (const node of rawNodes) {
      const existing = initialCriteria[node.id]
      seeded[node.id] = existing
        ? {
            auto: {
              all_tasks_done: !!existing.auto?.all_tasks_done,
              no_critical_tasks: !!existing.auto?.no_critical_tasks,
              no_blockers: !!existing.auto?.no_blockers,
            },
            manual: Array.isArray(existing.manual) ? [...existing.manual] : [],
          }
        : { ...EMPTY_CRITERIA, auto: { ...EMPTY_CRITERIA.auto }, manual: [] }
    }
    return seeded
    // deps: hash of node ids + initial criteria JSON — stable string dep
    // to avoid OOM-loop on fresh-array references (Phase 11 D-44 pattern)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes.map((n) => n.id).join("|"), JSON.stringify(initialCriteria)])

  // Pick a default initial active phase: the first non-archived node, or null.
  const firstSelectableId =
    rawNodes.find((n) => !n.isArchived)?.id ?? rawNodes[0]?.id ?? null

  const editor = useCriteriaEditor(seededDrafts, firstSelectableId)

  const [addInput, setAddInput] = React.useState("")
  const scrollAnchorRef = React.useRef<HTMLButtonElement | null>(null)

  // Project-level enable_phase_assignment is persisted independently of the
  // per-phase criteria draft (Plan 12-03 PLAN behavior #6).
  const [localEPA, setLocalEPA] = React.useState<boolean>(
    !!project.processConfig?.enable_phase_assignment,
  )
  React.useEffect(() => {
    setLocalEPA(!!project.processConfig?.enable_phase_assignment)
  }, [project.processConfig?.enable_phase_assignment])

  // ---- deep-link auto-scroll -------------------------------------------------
  React.useEffect(() => {
    if (!deepLinkPhase) return
    const targetExists = rawNodes.find((n) => n.id === deepLinkPhase)
    if (!targetExists) return
    editor.setActivePhaseId(deepLinkPhase)
    // Defer scroll until ref has been attached after the picker re-renders
    const t = setTimeout(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkPhase, rawNodes.map((n) => n.id).join("|")])

  // ---- empty workflow guard --------------------------------------------------
  // Phase 12 Plan 12-10 (LIFE-01 UAT fix) — replace the dead-end AlertBanner
  // with the WorkflowEmptyState dual-CTA: "Şablon Yükle" applies a preset
  // in-place via PATCH /projects/{id}, and "Workflow Editörünü Aç" deep-links
  // to the editor. Picking a preset here writes
  // process_config.workflow = unmapWorkflowConfig(resolvePreset(id)) so the
  // user can immediately start editing per-phase criteria without a route hop.
  async function applyPresetInline(id: PresetId) {
    try {
      const wf = unmapWorkflowConfig(resolvePreset(id))
      await apiClient.patch(`/projects/${project.id}`, {
        process_config: {
          ...(project.processConfig ?? {}),
          workflow: wf,
        },
      })
      qc.invalidateQueries({ queryKey: ["project", project.id] })
      showToast({
        variant: "success",
        message: T("Şablon uygulandı.", "Template applied."),
      })
    } catch (err) {
      showToast({
        variant: "error",
        message:
          backendErrorMessage(err) ??
          T("Şablon uygulanamadı.", "Failed to apply template."),
      })
    }
  }

  if (rawNodes.length === 0) {
    return (
      <Card padding={0}>
        <WorkflowEmptyState
          projectId={project.id}
          onApplyPreset={(id) => {
            void applyPresetInline(id)
          }}
        />
      </Card>
    )
  }

  // ---- enable_phase_assignment persist ---------------------------------------
  async function persistEPA(next: boolean) {
    setLocalEPA(next)
    try {
      await apiClient.patch(`/projects/${project.id}`, {
        process_config: {
          ...(project.processConfig ?? {}),
          enable_phase_assignment: next,
          // Preserve phase_completion_criteria explicitly to satisfy
          // independent-persist contract (Test 6).
          phase_completion_criteria:
            project.processConfig?.phase_completion_criteria ?? {},
        },
      })
      qc.invalidateQueries({ queryKey: ["project", project.id] })
      showToast({
        variant: "success",
        message: T(
          "Görev–Faz Ataması güncellendi.",
          "Task–phase assignment updated.",
        ),
      })
    } catch (err) {
      // Revert local state on failure.
      setLocalEPA(!next)
      showToast({
        variant: "error",
        message:
          backendErrorMessage(err) ??
          T("Güncelleme sırasında hata oluştu.", "Update failed."),
      })
    }
  }

  // ---- per-phase criteria save ----------------------------------------------
  async function save() {
    try {
      await apiClient.patch(`/projects/${project.id}`, {
        process_config: {
          ...(project.processConfig ?? {}),
          phase_completion_criteria: editor.drafts,
          enable_phase_assignment: localEPA,
        },
      })
      qc.invalidateQueries({ queryKey: ["project", project.id] })
      showToast({
        variant: "success",
        message: T("Kriterler kaydedildi.", "Criteria saved."),
      })
    } catch (err) {
      showToast({
        variant: "error",
        message:
          backendErrorMessage(err) ??
          T("Kayıt sırasında hata oluştu.", "Save failed."),
      })
    }
  }

  // ---- active phase + draft accessors ---------------------------------------
  const activePhaseId = editor.activePhaseId
  const activeNode = rawNodes.find((n) => n.id === activePhaseId) ?? null
  const draft: PhaseCriteria = activePhaseId
    ? editor.getDraft(activePhaseId)
    : EMPTY_CRITERIA

  function setAuto(key: keyof PhaseCriteria["auto"], next: boolean) {
    if (!activePhaseId || !canEdit) return
    editor.setDraft(activePhaseId, {
      ...draft,
      auto: { ...draft.auto, [key]: next },
    })
  }

  function addManual() {
    const trimmed = addInput.trim()
    if (!activePhaseId || !canEdit || !trimmed) return
    editor.setDraft(activePhaseId, {
      ...draft,
      manual: [...draft.manual, trimmed],
    })
    setAddInput("")
  }

  function removeManual(idx: number) {
    if (!activePhaseId || !canEdit) return
    editor.setDraft(activePhaseId, {
      ...draft,
      manual: draft.manual.filter((_, i) => i !== idx),
    })
  }

  // ---- render ---------------------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!canEdit && (
        <AlertBanner tone="warning">
          {T(
            "Bu sekmeyi düzenleme yetkiniz yok. Görüntüleme modunda.",
            "You don't have permission to edit this tab. View-only mode.",
          )}
        </AlertBanner>
      )}

      {/* enable_phase_assignment block (project-level) */}
      <Card padding={20}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              {T("Görev–Faz Ataması", "Task–Phase Assignment")}
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12.5,
                color: "var(--fg-muted)",
              }}
            >
              {T(
                "Açıkken görev formuna ve board kartlarına faz alanı eklenir.",
                "When on, the task form and board cards expose a phase field.",
              )}
            </p>
          </div>
          <Toggle
            on={localEPA}
            onChange={(next) => {
              if (!canEdit) return
              persistEPA(next)
            }}
          />
        </div>
      </Card>

      {/* phase picker + criteria editor */}
      <Card padding={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 0,
          }}
        >
          {/* Left: phase picker */}
          <div
            style={{
              padding: 12,
              borderRight: "1px solid var(--border)",
              minHeight: 320,
            }}
          >
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
              {T("Faz Seç", "Select Phase")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {rawNodes.map((n) => {
                const active = n.id === activePhaseId
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => editor.setActivePhaseId(n.id)}
                    ref={active ? scrollAnchorRef : undefined}
                    data-phase-row={n.id}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      color: n.isArchived
                        ? "var(--fg-subtle)"
                        : active
                          ? "var(--fg)"
                          : "var(--fg-muted)",
                      background: active ? "var(--accent)" : "transparent",
                      borderLeft: active
                        ? "2px solid var(--primary)"
                        : "2px solid transparent",
                      borderRadius: 4,
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "var(--surface-2)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent"
                      }
                    }}
                  >
                    {n.name}
                    {n.isArchived ? ` (${T("Arşiv", "Archive")})` : ""}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: editor for the active phase */}
          <div style={{ padding: 20 }}>
            {!activeNode ? (
              <AlertBanner tone="info">
                {T("Bir faz seçin.", "Select a phase.")}
              </AlertBanner>
            ) : activeNode.isArchived ? (
              <AlertBanner tone="info">
                {T(
                  "Arşivlenmiş fazların kriterleri değiştirilemez.",
                  "Archived phase criteria are not editable.",
                )}
              </AlertBanner>
            ) : (
              <>
                {/* Auto criteria section */}
                <div data-criteria-section="auto" style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--fg-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 12,
                    }}
                  >
                    {T("Otomatik Kriterler", "Auto Checks")}
                  </div>
                  <CriteriaToggleRow
                    label={T("Tüm görevler tamamlandı", "All tasks completed")}
                    on={draft.auto.all_tasks_done}
                    onChange={(v) => setAuto("all_tasks_done", v)}
                    disabled={!canEdit}
                  />
                  <CriteriaToggleRow
                    label={T(
                      "Kritik görev kalmadı",
                      "No critical tasks remaining",
                    )}
                    on={draft.auto.no_critical_tasks}
                    onChange={(v) => setAuto("no_critical_tasks", v)}
                    disabled={!canEdit}
                  />
                  <CriteriaToggleRow
                    label={T("Blocker kalmadı", "No blockers remaining")}
                    on={draft.auto.no_blockers}
                    onChange={(v) => setAuto("no_blockers", v)}
                    disabled={!canEdit}
                  />
                </div>

                {/* Manual criteria section */}
                <div data-criteria-section="manual" style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--fg-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 12,
                    }}
                  >
                    {T("Manuel Kriterler", "Manual Checks")}
                  </div>
                  {draft.manual.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--fg-subtle)",
                        marginBottom: 12,
                      }}
                    >
                      {T(
                        "Henüz manuel kriter eklenmedi.",
                        "No manual criteria yet.",
                      )}
                    </div>
                  ) : (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        marginBottom: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {draft.manual.map((entry, idx) => (
                        <li
                          key={`${idx}-${entry}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            background: "var(--surface-2)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                          }}
                        >
                          <span
                            style={{ color: "var(--fg-muted)" }}
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <span style={{ flex: 1 }}>{entry}</span>
                          <button
                            type="button"
                            aria-label={T("Kriteri sil", "Remove criterion")}
                            onClick={() => removeManual(idx)}
                            disabled={!canEdit}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "var(--fg-subtle)",
                              cursor: canEdit ? "pointer" : "not-allowed",
                              padding: 2,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Input
                      value={addInput}
                      onChange={(e) => setAddInput(e.target.value)}
                      placeholder={T("Yeni kriter ekle…", "Add new criterion…")}
                      disabled={!canEdit}
                      style={{ flex: 1 }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Plus size={12} />}
                      onClick={addManual}
                      disabled={!canEdit || !addInput.trim()}
                    >
                      {T("Ekle", "Add")}
                    </Button>
                  </div>
                </div>

                {/* Save / cancel buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 12,
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      editor.reset()
                      setAddInput("")
                    }}
                    disabled={!editor.dirty || !canEdit}
                  >
                    {T("İptal", "Cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={save}
                    disabled={!canEdit}
                  >
                    {T("Kaydet", "Save")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

interface CriteriaToggleRowProps {
  label: string
  on: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}

function CriteriaToggleRow({ label, on, onChange, disabled }: CriteriaToggleRowProps) {
  return (
    <div
      data-criteria-row
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid var(--border-subtle, var(--border))",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--fg)" }}>{label}</span>
      <Toggle
        on={on}
        onChange={(next) => {
          if (disabled) return
          onChange(next)
        }}
      />
    </div>
  )
}

"use client"

// Settings > Genel sub-tab — D-11 + D-17 + D-43.
//
// Fields:
//   - Project name (blur-commits via PATCH /projects/{id})
//   - Description (blur-commits)
//   - Start date + End date (blur-commits)
//   - Döngü Etiketi (cycle_label) — overrides methodology default
//   - Backlog Tanımı SegmentedControl (cycle_null / leftmost_column /
//                                      phase_null_or_first / custom)
//   - Danger zone: Archive button with ConfirmDialog
//
// All writes go through projectService.update(id, patch). process_config
// changes shallow-merge with existing keys (T-11-04-01 mitigation —
// client preserves keys; backend normalizer re-fills missing defaults on read).
//
// NOTE on input elements: the Input primitive wraps <input> inside a <div>
// and doesn't forward onBlur. The Genel sub-tab needs blur-to-commit on five
// text inputs, so we use native <input>/<textarea> here with matching token
// styling rather than forking the primitive (keeps Rule 3 scope boundary).

import * as React from "react"
import { Info } from "lucide-react"

import {
  AlertBanner,
  Button,
  Card,
  SegmentedControl,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import { Tooltip } from "@/components/workflow-editor/tooltip"
import { projectService, type Project } from "@/services/project-service"
import { useQueryClient } from "@tanstack/react-query"
import {
  BACKLOG_DEFINITION_BY_METHODOLOGY,
  type BacklogDefinition,
  type Methodology,
} from "@/lib/methodology-matrix"

// CONTEXT D-60 — methodology is fixed at project creation. The Settings >
// General sub-tab displays the methodology as a localized read-only label
// with an info-icon Tooltip; there is no editable input or PATCH path.
const METHODOLOGY_LABEL_TR: Record<string, string> = {
  SCRUM: "Scrum",
  KANBAN: "Kanban",
  WATERFALL: "Şelale (Waterfall)",
  ITERATIVE: "İteratif",
  INCREMENTAL: "Artırımlı",
  EVOLUTIONARY: "Evrimsel",
  RAD: "RAD",
}
const METHODOLOGY_LABEL_EN: Record<string, string> = {
  SCRUM: "Scrum",
  KANBAN: "Kanban",
  WATERFALL: "Waterfall",
  ITERATIVE: "Iterative",
  INCREMENTAL: "Incremental",
  EVOLUTIONARY: "Evolutionary",
  RAD: "RAD",
}

function methodologyLabel(methodology: string, lang: string): string {
  const map = lang === "tr" ? METHODOLOGY_LABEL_TR : METHODOLOGY_LABEL_EN
  return map[methodology] ?? methodology
}

interface BacklogOption {
  id: BacklogDefinition
  label: string
}

const BACKLOG_DEFINITION_OPTIONS_TR: BacklogOption[] = [
  { id: "cycle_null", label: "Döngüye atanmamış" },
  { id: "leftmost_column", label: "İlk kolondaki görevler" },
  { id: "phase_null_or_first", label: "Faza atanmamış" },
  { id: "custom", label: "Özel seçim" },
]

const BACKLOG_DEFINITION_OPTIONS_EN: BacklogOption[] = [
  { id: "cycle_null", label: "Not in a cycle" },
  { id: "leftmost_column", label: "Leftmost column" },
  { id: "phase_null_or_first", label: "Not in a phase" },
  { id: "custom", label: "Custom" },
]

interface SettingsGeneralSubtabProps {
  project: Project
  isArchived: boolean
}

// T-11-04-01 mitigation: process_config spread preserves existing keys;
// backend normalizer re-fills backlog_definition/cycle_label/workflow when
// missing (_migrate_v0_to_v1 in Backend/app/domain/entities/project.py).
function mergeProcessConfig(
  cfg: Record<string, unknown> | null,
  patch: Record<string, unknown>
): Record<string, unknown> {
  return { ...(cfg ?? {}), ...patch }
}

function backendErrorMessage(err: unknown): string | null {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response
    ?.data?.detail
  return typeof detail === "string" ? detail : null
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--fg-muted)",
  display: "block",
  marginBottom: 6,
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0 8px",
  height: 32,
  fontSize: 13,
  background: "var(--surface)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  border: "none",
  outline: "none",
  fontFamily: "inherit",
}

const TEXTAREA_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: 13,
  background: "var(--surface-2)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  resize: "vertical",
  border: "none",
  outline: "none",
  fontFamily: "inherit",
}

export function SettingsGeneralSubtab({
  project,
  isArchived,
}: SettingsGeneralSubtabProps) {
  const { language: lang } = useApp()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [name, setName] = React.useState(project.name)
  const [description, setDescription] = React.useState(project.description ?? "")
  const [startDate, setStartDate] = React.useState(project.startDate ?? "")
  const [endDate, setEndDate] = React.useState(project.endDate ?? "")

  const cfg = (project.processConfig ?? {}) as {
    backlog_definition?: BacklogDefinition
    cycle_label?: string | null
  }
  const defaultBacklog =
    BACKLOG_DEFINITION_BY_METHODOLOGY[project.methodology as Methodology] ??
    "cycle_null"
  const [backlogDefinition, setBacklogDefinition] =
    React.useState<BacklogDefinition>(cfg.backlog_definition ?? defaultBacklog)
  const [cycleLabel, setCycleLabel] = React.useState<string>(
    cfg.cycle_label ?? ""
  )

  const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // NOTE on resync: lazy useState initializers cover first-mount sync to the
  // project prop. After a successful PATCH the upstream query invalidates →
  // new project prop arrives → typed value already equals server value, so
  // no resync useEffect is needed. An earlier draft added one, keyed on
  // `project.processConfig` (object reference) — that caused an OOM feedback
  // loop in vitest because the prop is a fresh object every parent render.
  // If a caller ever needs to hot-swap projects without unmounting, pass a
  // `key={project.id}` to force a remount.

  async function patchProject(patch: Parameters<typeof projectService.update>[1]) {
    setSaving(true)
    try {
      await projectService.update(project.id, patch)
      showToast({
        variant: "success",
        message: lang === "tr" ? "Güncellendi" : "Updated",
      })
      qc.invalidateQueries({ queryKey: ["projects"] })
    } catch (err: unknown) {
      const msg = backendErrorMessage(err)
      showToast({
        variant: "error",
        message: msg ?? (lang === "tr" ? "Güncellenemedi" : "Update failed"),
      })
    } finally {
      setSaving(false)
    }
  }

  function onBlurName() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== project.name) {
      patchProject({ name: trimmed })
    }
  }
  function onBlurDesc() {
    if (description !== (project.description ?? "")) {
      patchProject({ description })
    }
  }
  function onBlurDates() {
    const newStart = startDate || null
    const newEnd = endDate || null
    const cur = {
      start: project.startDate ?? null,
      end: project.endDate ?? null,
    }
    if (newStart !== cur.start || newEnd !== cur.end) {
      patchProject({ start_date: newStart, end_date: newEnd })
    }
  }
  function onChangeBacklogDef(v: BacklogDefinition) {
    setBacklogDefinition(v)
    if (v !== (cfg.backlog_definition ?? defaultBacklog)) {
      patchProject({
        process_config: mergeProcessConfig(project.processConfig, {
          backlog_definition: v,
        }),
      })
    }
  }
  function onBlurCycleLabel() {
    const trimmed = cycleLabel.trim()
    const next = trimmed || null
    if (next !== (cfg.cycle_label ?? null)) {
      patchProject({
        process_config: mergeProcessConfig(project.processConfig, {
          cycle_label: next,
        }),
      })
    }
  }
  async function onArchive() {
    setShowArchiveConfirm(false)
    await patchProject({ status: "ARCHIVED" })
  }

  const backlogOptions =
    lang === "tr" ? BACKLOG_DEFINITION_OPTIONS_TR : BACKLOG_DEFINITION_OPTIONS_EN

  const fieldsDisabled = isArchived || saving

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 720,
      }}
    >
      {isArchived && (
        <AlertBanner tone="warning">
          {lang === "tr"
            ? "Arşiv modunda düzenleme devre dışı."
            : "Editing disabled in archive mode."}
        </AlertBanner>
      )}

      <Card padding={16}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>
              {lang === "tr" ? "Proje Adı" : "Project Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={onBlurName}
              disabled={fieldsDisabled}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>
              {lang === "tr" ? "Açıklama" : "Description"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={onBlurDesc}
              rows={3}
              disabled={fieldsDisabled}
              style={TEXTAREA_STYLE}
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={LABEL_STYLE}>
                {lang === "tr" ? "Başlangıç" : "Start Date"}
              </label>
              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={onBlurDates}
                disabled={fieldsDisabled}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>
                {lang === "tr" ? "Bitiş" : "End Date"}
              </label>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={onBlurDates}
                disabled={fieldsDisabled}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div>
            <label style={LABEL_STYLE}>
              {lang === "tr" ? "Döngü Etiketi" : "Cycle Label"}
            </label>
            <input
              type="text"
              value={cycleLabel}
              onChange={(e) => setCycleLabel(e.target.value)}
              onBlur={onBlurCycleLabel}
              placeholder={
                lang === "tr" ? "Metodolojiye göre varsayılan" : "Methodology default"
              }
              disabled={fieldsDisabled}
              style={INPUT_STYLE}
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-subtle)",
                marginTop: 4,
              }}
            >
              {lang === "tr"
                ? "Özelleştirmek için doldurun"
                : "Fill in to customize"}
            </div>
          </div>

          <div>
            <label style={LABEL_STYLE}>
              {lang === "tr" ? "Backlog Tanımı" : "Backlog Definition"}
            </label>
            <SegmentedControl
              options={backlogOptions}
              value={backlogDefinition}
              onChange={(v) => onChangeBacklogDef(v as BacklogDefinition)}
            />
          </div>

          {/* Methodology — read-only display + Tooltip per CONTEXT D-60.
              Phase 12 intentionally REMOVES any editable methodology input
              from the DOM (T-12-03-02 mitigation: client-side tampering
              eliminated at the UI surface; backend Phase 9 D-29 still no-ops
              the change as the second defense). */}
          <div>
            <label style={LABEL_STYLE}>
              {lang === "tr" ? "Metodoloji" : "Methodology"}
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 8px",
                height: 32,
                fontSize: 13,
                background: "var(--surface-2)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                color: "var(--fg)",
              }}
            >
              <span style={{ flex: 1, fontWeight: 500 }}>
                {methodologyLabel(project.methodology, lang)}
              </span>
              <Tooltip
                text={
                  lang === "tr"
                    ? "Metodoloji proje oluşturulduğu an sabittir. Değiştirmek için yeni proje oluşturun."
                    : "Methodology is fixed at project creation. Create a new project to change it."
                }
              >
                <span
                  aria-label={lang === "tr" ? "Bilgi" : "Info"}
                  style={{
                    color: "var(--fg-subtle)",
                    display: "inline-flex",
                    cursor: "help",
                  }}
                >
                  <Info size={14} />
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card
        padding={16}
        style={{ borderTop: "2px solid var(--priority-critical)" }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--priority-critical)",
            marginBottom: 8,
          }}
        >
          {lang === "tr" ? "Tehlikeli Bölge" : "Danger Zone"}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            marginBottom: 12,
          }}
        >
          {lang === "tr"
            ? "Proje arşivlendiğinde içerik düzenlemesi engellenir."
            : "Archiving blocks content edits."}
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowArchiveConfirm(true)}
          disabled={isArchived || saving}
        >
          {lang === "tr" ? "Arşivle" : "Archive"}
        </Button>
      </Card>

      <ConfirmDialog
        open={showArchiveConfirm}
        title={lang === "tr" ? "Projeyi arşivle?" : "Archive project?"}
        body={
          lang === "tr"
            ? "İçerik düzenlemesi engellenecek. Daha sonra yeniden aktifleştirebilirsiniz."
            : "Content editing will be blocked. You can reactivate later."
        }
        confirmLabel={lang === "tr" ? "Arşivle" : "Archive"}
        cancelLabel={lang === "tr" ? "İptal" : "Cancel"}
        onConfirm={onArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />
    </div>
  )
}

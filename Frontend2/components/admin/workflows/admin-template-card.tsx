"use client"

// Phase 14 Plan 14-06 — Single template card on the /admin/workflows
// (Şablonlar) tab.
//
// Verbatim layout per UI-SPEC §Surface G + prototype admin.jsx lines 363-385:
//   Card padding={16}
//   ├─ HeaderRow (flex justify:space-between gap:8 align:flex-start)
//   │    ├─ TitleBlock
//   │    │    ├─ NameRow (name 14/600 + Custom Badge tone="primary" if !is_builtin)
//   │    │    └─ Description (12/400 var(--fg-muted) lineHeight:1.5 marginTop:6)
//   │    └─ <TemplateRowActions/> (per-card MoreH — Düzenle/Klonla/Sil)
//   └─ Footer (flex align:center gap:8 marginTop:12 padding:"10px 0 0 0"
//             borderTop:1px solid var(--border) fontSize:11.5)
//        ├─ ModeBadge (tone-mapped per mode)
//        ├─ Spacer (flex:1)
//        └─ "{N} proje" (var(--fg-muted))
//
// Mode badge tone (UI-SPEC §G.3 lines 1519-1521):
//   - sequential-locked → tone="warning" (Locked)
//   - continuous        → tone="info"    (Continuous)
//   - flexible          → tone="neutral" (Flexible)
//
// Custom Badge: shown when the template is NOT built-in. Backend exposes the
// inverted flag `is_builtin: bool`; we treat user-created templates as Custom.
//
// "is_custom" / "active_project_count" / "mode" derivation:
//   The backend ProcessTemplateResponseDTO doesn't currently expose these
//   fields directly. Plan 14-06 critical_constraints forbid backend changes,
//   so we derive client-side:
//     - is_custom              → !is_builtin
//     - active_project_count   → parent counts from useProjects() cache
//                                (matched on processTemplateId)
//     - mode                   → behavioral_flags?.process_mode (string) with
//                                "flexible" fallback. v2.1 candidate: encode
//                                mode as a first-class column on the
//                                process_templates table so it's not buried
//                                in JSONB.
//
// Consumes <TemplateRowActions/> (Plan 14-06) for the per-card MoreH menu.

import * as React from "react"

import { Card, Badge, type BadgeTone } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminWorkflowsT } from "@/lib/i18n/admin-workflows-keys"
import { WorkflowMiniPreview } from "@/components/workflow-editor/workflow-mini-preview"

import { TemplateRowActions } from "./template-row-actions"

// ProcessTemplate response shape from GET /api/v1/process-templates.
// Snake_case kept to match the backend DTO (no service-level mapper exists
// for this endpoint — useProcessTemplates returns the raw JSON).
export interface AdminTemplateCardData {
  id: number
  name: string
  is_builtin: boolean
  description: string | null
  // behavioral_flags is a JSONB Dict — process_mode lives here when set.
  behavioral_flags?: Record<string, unknown> | null
  // Canonical mode + graph live on the editable lifecycle workflow; the
  // mini preview renders nodes/edges/groups straight from this shape.
  default_workflow?: {
    mode?: string
    nodes?: Array<{ id: string; name?: string; x: number; y: number; color?: string }>
    edges?: Array<{ source: string; target: string; type?: string }>
    groups?: Array<{ id: string; color?: string; children?: string[] }>
  } | null
}

export interface AdminTemplateCardProps {
  template: AdminTemplateCardData
  /** Number of active projects currently linked to this template via
   *  projects.process_template_id. Computed by the parent grid from the
   *  useProjects() cache so we don't pay for a round-trip per card. */
  activeProjectCount: number
}

type TemplateMode = "sequential-locked" | "continuous" | "flexible"

function deriveMode(template: AdminTemplateCardData): TemplateMode {
  // Prefer default_workflow.mode (what the editor saves); fall back to the
  // behavioral_flags hint, then the name heuristic. "sequential-flexible"
  // renders with the neutral badge.
  const wfMode = template.default_workflow?.mode
  if (
    wfMode === "sequential-locked" ||
    wfMode === "continuous" ||
    wfMode === "flexible"
  ) {
    return wfMode
  }
  if (wfMode === "sequential-flexible") return "flexible"
  const raw =
    template.behavioral_flags &&
    typeof template.behavioral_flags["process_mode"] === "string"
      ? String(template.behavioral_flags["process_mode"])
      : null
  if (raw === "sequential-locked" || raw === "continuous" || raw === "flexible") {
    return raw
  }
  // Fallback: derive from the template name when behavioral_flags is empty
  // (the prototype hand-mapped templates this way at admin.jsx:354-360).
  const lower = template.name.toLowerCase()
  if (
    lower.includes("waterfall") ||
    lower.includes("iso") ||
    lower.includes("phase gate") ||
    lower.includes("phase-gate")
  ) {
    return "sequential-locked"
  }
  if (lower.includes("kanban") || lower.includes("lean")) {
    return "continuous"
  }
  return "flexible"
}

function modeBadgeTone(mode: TemplateMode): BadgeTone {
  if (mode === "sequential-locked") return "warning"
  if (mode === "continuous") return "info"
  return "neutral"
}

function modeBadgeLabel(mode: TemplateMode, lang: "tr" | "en"): string {
  if (mode === "sequential-locked")
    return adminWorkflowsT("admin.workflows.mode_locked", lang)
  if (mode === "continuous")
    return adminWorkflowsT("admin.workflows.mode_continuous", lang)
  return adminWorkflowsT("admin.workflows.mode_flexible", lang)
}

export function AdminTemplateCard({
  template,
  activeProjectCount,
}: AdminTemplateCardProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const isCustom = !template.is_builtin
  const mode = deriveMode(template)
  const tone = modeBadgeTone(mode)
  const modeLabel = modeBadgeLabel(mode, lang)

  return (
    <Card padding={16}>
      {/* Header: title block + per-card MoreH. justify:space-between
          + align:flex-start matches prototype admin.jsx line 366. */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Standart kart ritmi: ad tek satır (ellipsis), açıklama sabit
            2 satırlık blok — böylece önizleme ve footer her kartta aynı
            hizada başlar. Tam metinler hover tooltip'inde. */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              title={template.name}
              style={{
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {template.name}
            </div>
            {isCustom && (
              <Badge size="xs" tone="primary">
                {adminWorkflowsT("admin.workflows.custom_badge", lang)}
              </Badge>
            )}
          </div>
          <div
            title={template.description ?? undefined}
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              marginTop: 6,
              lineHeight: 1.5,
              height: 36, // 2 satır × 12px × 1.5 — boş açıklama da yer tutar
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {template.description}
          </div>
        </div>

        <TemplateRowActions
          template={{
            id: template.id,
            name: template.name,
            is_builtin: template.is_builtin,
          }}
          activeProjectCount={activeProjectCount}
        />
      </div>

      {/* Statik mini önizleme — şablonun gerçek kanvas yerleşiminin
          minyatürü (SVG; React Flow mount edilmez). Workflow'u olmayan
          şablonlarda aynı boyutta boş-durum kutusu durur ki kart ritmi
          (önizleme + footer hizası) satır genelinde bozulmasın. */}
      {template.default_workflow?.nodes?.length ? (
        <WorkflowMiniPreview workflow={template.default_workflow} />
      ) : (
        <div
          data-testid="workflow-mini-preview-empty"
          style={{
            marginTop: 12,
            height: 104,
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-2)",
            boxShadow: "inset 0 0 0 1px var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11.5,
            color: "var(--fg-subtle)",
          }}
        >
          {lang === "tr" ? "Önizleme yok" : "No preview"}
        </div>
      )}

      {/* Footer: mode badge + spacer + N proje counter. Vertical rhythm
          per prototype lines 376-381 (marginTop:12 + padding-top:10 +
          1px border-top) so the badge "lifts" off the description. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
          padding: "10px 0 0 0",
          borderTop: "1px solid var(--border)",
          fontSize: 11.5,
        }}
      >
        <Badge size="xs" tone={tone}>
          {modeLabel}
        </Badge>
        <div style={{ flex: 1 }} />
        <span style={{ color: "var(--fg-muted)" }}>
          {activeProjectCount} {adminWorkflowsT("admin.workflows.proje_suffix", lang)}
        </span>
      </div>
    </Card>
  )
}

"use client"

/**
 * AI Lifecycle Form — left-pane idle-state form for lifecycle workflow generation.
 *
 * Renders the full preference questionnaire from mockup Idle state §1:
 *   - Methodology chip group (7 chips, mirrors methodology-matrix.ts)
 *   - Team size (free number input + multi-team checkbox) — D-05 friendly
 *   - Duration (number + unit + Süresiz toggle) — free input, no buckets
 *   - Quality controls (5 toggles incl. UAT + Security)
 *   - Sector chips with inline "Diğer" text input (max 80 chars per D-04)
 *   - Deployment model (3 chips)
 *   - Additional context textarea
 *   - Submit button (--ai-accent)
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 + §17 locked decisions.
 */

import * as React from "react"
import { Sparkles } from "lucide-react"

import { Toggle } from "@/components/primitives"
import { useApp } from "@/context/app-context"

import type { LifecycleFormDTO, Methodology } from "@/lib/ai/types"

const METHODOLOGIES: Methodology[] = [
  "SCRUM",
  "KANBAN",
  "WATERFALL",
  "ITERATIVE",
  "INCREMENTAL",
  "EVOLUTIONARY",
  "RAD",
]

const SECTOR_CHIPS = [
  "web_saas",
  "mobile",
  "finans",
  "saglik",
  "egitim",
] as const

type SectorChip = (typeof SECTOR_CHIPS)[number] | "other"

const DEPLOYMENT_MODELS = ["saas", "versioned", "mobile"] as const

export interface AILifecycleFormProps {
  onSubmit: (form: LifecycleFormDTO) => void | Promise<void>
}

interface FormState {
  methodology: Methodology
  teamSize: string // string for input field, parsed on submit
  multiTeam: boolean
  durationValue: string
  durationUnit: "week" | "month" | "year"
  openEnded: boolean
  qualityCodeReview: boolean
  qualityCi: boolean
  qualityManualQa: boolean
  qualityUat: boolean
  qualitySecurityAudit: boolean
  sectorChip: SectorChip | null
  sectorOtherText: string
  deploymentModel: "saas" | "versioned" | "mobile" | null
  additionalContext: string
}

const INITIAL: FormState = {
  methodology: "SCRUM",
  teamSize: "",
  multiTeam: false,
  durationValue: "",
  durationUnit: "month",
  openEnded: false,
  qualityCodeReview: false,
  qualityCi: false,
  qualityManualQa: false,
  qualityUat: false,
  qualitySecurityAudit: false,
  sectorChip: null,
  sectorOtherText: "",
  deploymentModel: null,
  additionalContext: "",
}

export function AILifecycleForm({ onSubmit }: AILifecycleFormProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const [form, setForm] = React.useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = React.useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const dto: LifecycleFormDTO = {
        methodology: form.methodology,
        team_size: form.teamSize ? parseInt(form.teamSize, 10) : null,
        multi_team: form.multiTeam,
        duration_value: form.openEnded
          ? null
          : form.durationValue
            ? parseInt(form.durationValue, 10)
            : null,
        duration_unit: form.openEnded ? null : form.durationUnit,
        open_ended: form.openEnded,
        quality_code_review: form.qualityCodeReview,
        quality_ci: form.qualityCi,
        quality_manual_qa: form.qualityManualQa,
        quality_uat: form.qualityUat,
        quality_security_audit: form.qualitySecurityAudit,
        sector:
          form.sectorChip === "other"
            ? form.sectorOtherText.slice(0, 80) || null
            : form.sectorChip,
        deployment_model: form.deploymentModel,
        additional_context: form.additionalContext.slice(0, 500),
      }
      await onSubmit(dto)
    } finally {
      setSubmitting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* METHODOLOGY */}
      <Field label={T("Metodoloji", "Methodology")}>
        <ChipGroup>
          {METHODOLOGIES.map((m) => (
            <Chip
              key={m}
              selected={form.methodology === m}
              onClick={() => update("methodology", m)}
            >
              {METH_LABEL_TR[m]}
            </Chip>
          ))}
        </ChipGroup>
      </Field>

      {/* TEAM SIZE */}
      <Field label={T("Takım Büyüklüğü", "Team Size")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="number"
            min={1}
            max={999}
            placeholder={T("Örn. 6", "e.g. 6")}
            value={form.teamSize}
            onChange={(e) => update("teamSize", e.target.value)}
            style={inputStyle}
          />
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            {T("kişi", "people")}
          </span>
        </div>
        <CheckboxRow
          checked={form.multiTeam}
          onChange={(v) => update("multiTeam", v)}
          label={T("Birden fazla takım (cross-team)", "Multiple teams (cross-team)")}
        />
      </Field>

      {/* DURATION */}
      <Field label={T("Proje Süresi", "Project Duration")}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            min={1}
            max={999}
            disabled={form.openEnded}
            placeholder={T("Örn. 3", "e.g. 3")}
            value={form.durationValue}
            onChange={(e) => update("durationValue", e.target.value)}
            style={{ ...inputStyle, opacity: form.openEnded ? 0.5 : 1 }}
          />
          <select
            disabled={form.openEnded}
            value={form.durationUnit}
            onChange={(e) =>
              update("durationUnit", e.target.value as "week" | "month" | "year")
            }
            style={{ ...inputStyle, width: 90, opacity: form.openEnded ? 0.5 : 1 }}
          >
            <option value="week">{T("hafta", "week")}</option>
            <option value="month">{T("ay", "month")}</option>
            <option value="year">{T("yıl", "year")}</option>
          </select>
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{T("veya", "or")}</span>
          <label
            style={{
              fontSize: 13,
              color: "var(--fg)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.openEnded}
              onChange={(e) => update("openEnded", e.target.checked)}
            />
            {T("Süresiz", "Open-ended")}
          </label>
        </div>
      </Field>

      {/* QUALITY CONTROLS */}
      <Field label={T("Kalite Kontrolü", "Quality Controls")}>
        <ToggleRow
          checked={form.qualityCodeReview}
          onChange={(v) => update("qualityCodeReview", v)}
          title={T("Code review zorunlu", "Code review required")}
          subtitle={T("Pull request gate'i ve doğrulama edge'leri ekler", "Adds PR gate and verification edges")}
        />
        <ToggleRow
          checked={form.qualityCi}
          onChange={(v) => update("qualityCi", v)}
          title={T("Otomatik testler (CI/CD)", "Automated tests (CI/CD)")}
          subtitle={T("Her commit'te test koşulur", "Tests run on each commit")}
        />
        <ToggleRow
          checked={form.qualityManualQa}
          onChange={(v) => update("qualityManualQa", v)}
          title={T("Manuel QA fazı", "Manual QA phase")}
          subtitle={T("Bağımsız test fazı eklenir", "Independent test phase added")}
        />
        <ToggleRow
          checked={form.qualityUat}
          onChange={(v) => update("qualityUat", v)}
          title={T("Müşteri / PO onayı (UAT)", "Customer / PO approval (UAT)")}
          subtitle={T("Final öncesi kabul testi fazı", "Pre-final acceptance test phase")}
          badge="D-05"
        />
        <ToggleRow
          checked={form.qualitySecurityAudit}
          onChange={(v) => update("qualitySecurityAudit", v)}
          title={T("Güvenlik denetimi", "Security audit")}
          subtitle={T("Penetrasyon testi ve compliance gate'i", "Pen test and compliance gate")}
          badge={T("YENİ", "NEW")}
        />
      </Field>

      {/* SECTOR */}
      <Field label={T("Sektör (opsiyonel)", "Sector (optional)")}>
        <ChipGroup>
          {SECTOR_CHIPS.map((s) => (
            <Chip
              key={s}
              selected={form.sectorChip === s}
              onClick={() => {
                update("sectorChip", form.sectorChip === s ? null : s)
                if (form.sectorChip !== s) update("sectorOtherText", "")
              }}
            >
              {SECTOR_LABEL_TR[s]}
            </Chip>
          ))}
          <Chip
            selected={form.sectorChip === "other"}
            onClick={() => {
              update("sectorChip", form.sectorChip === "other" ? null : "other")
            }}
          >
            {T("Diğer", "Other")}
          </Chip>
        </ChipGroup>
        {form.sectorChip === "other" && (
          <input
            type="text"
            maxLength={80}
            autoFocus
            placeholder={T(
              "Sektörü yaz (örn. lojistik, kripto, kamu yönetimi)",
              "Type your sector (e.g. logistics, crypto, public)",
            )}
            value={form.sectorOtherText}
            onChange={(e) => update("sectorOtherText", e.target.value)}
            style={{ ...inputStyle, marginTop: 8, width: "100%" }}
          />
        )}
      </Field>

      {/* DEPLOYMENT */}
      <Field label={T("Dağıtım Modeli (opsiyonel)", "Deployment Model (optional)")}>
        <ChipGroup>
          {DEPLOYMENT_MODELS.map((d) => (
            <Chip
              key={d}
              selected={form.deploymentModel === d}
              onClick={() =>
                update("deploymentModel", form.deploymentModel === d ? null : d)
              }
            >
              {DEPLOYMENT_LABEL_TR[d]}
            </Chip>
          ))}
        </ChipGroup>
      </Field>

      {/* ADDITIONAL CONTEXT */}
      <Field label={T("Ek Bağlam (opsiyonel)", "Additional Context (optional)")}>
        <textarea
          rows={3}
          maxLength={500}
          placeholder={T(
            "Projeye özel kısıt, tercih veya alışkanlık varsa kısaca yaz…",
            "Any project-specific constraint or preference…",
          )}
          value={form.additionalContext}
          onChange={(e) => update("additionalContext", e.target.value)}
          style={{ ...inputStyle, width: "100%", resize: "vertical", minHeight: 72 }}
        />
      </Field>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "12px 16px",
          borderRadius: "var(--radius)",
          background: "var(--ai-accent)",
          color: "var(--ai-accent-fg)",
          fontSize: 14,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 2px 4px var(--ai-accent-ring)",
          opacity: submitting ? 0.6 : 1,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!submitting) e.currentTarget.style.background = "var(--ai-accent-hover)"
        }}
        onMouseLeave={(e) => {
          if (!submitting) e.currentTarget.style.background = "var(--ai-accent)"
        }}
      >
        <Sparkles size={16} />
        {T("Yaşam Döngüsünü Oluştur", "Generate Lifecycle")}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Internal helpers — kept local to this file (only used by this form variant
// and ai-task-status-form which has its own copies for divergence flexibility)
// ---------------------------------------------------------------------------

const METH_LABEL_TR: Record<Methodology, string> = {
  SCRUM: "Scrum",
  KANBAN: "Kanban",
  WATERFALL: "Waterfall",
  ITERATIVE: "Iterative",
  INCREMENTAL: "Incremental",
  EVOLUTIONARY: "Evolutionary",
  RAD: "RAD",
}

const SECTOR_LABEL_TR: Record<(typeof SECTOR_CHIPS)[number], string> = {
  web_saas: "Web/SaaS",
  mobile: "Mobile",
  finans: "Finans",
  saglik: "Sağlık",
  egitim: "Eğitim",
}

const DEPLOYMENT_LABEL_TR: Record<(typeof DEPLOYMENT_MODELS)[number], string> = {
  saas: "SaaS · Sürekli",
  versioned: "Versiyonlu",
  mobile: "Mobil App Store",
}

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  fontSize: 13,
  color: "var(--fg)",
  width: 80,
  fontFamily: "inherit",
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--fg-muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
  )
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${selected ? "var(--ai-accent)" : "var(--border)"}`,
        background: selected ? "var(--ai-accent-soft)" : "var(--surface)",
        color: selected ? "var(--ai-accent)" : "var(--fg)",
        fontSize: 12,
        fontWeight: selected ? 600 : 500,
        cursor: "pointer",
        transition: "all 120ms ease",
      }}
    >
      {children}
    </button>
  )
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "var(--fg-muted)",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

function ToggleRow({
  checked,
  onChange,
  title,
  subtitle,
  badge,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  subtitle: string
  badge?: string
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--fg)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {title}
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 999,
                background: "var(--ai-accent-soft)",
                color: "var(--ai-accent)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-subtle)",
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      </div>
      <Toggle on={checked} onChange={onChange} size="sm" />
    </div>
  )
}

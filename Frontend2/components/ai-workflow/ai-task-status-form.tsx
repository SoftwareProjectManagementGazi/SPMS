"use client"

/**
 * AI Task Status Form — left-pane idle-state form for task workflow generation.
 *
 * Mirrors lifecycle form structure but with task-specific fields:
 *   - Methodology chip group (same 7)
 *   - Hedef Durum Sayısı (optional number, default "AI karar versin")
 *   - Onay ve İnceleme: 5 toggles (incl. D-03 "Bug için ayrı doğrulama")
 *   - Özel Durumlar multi-select chip (7 chips)
 *   - WIP limit toggle
 *   - Additional context textarea
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 + §17 D-03.
 */

import * as React from "react"
import { Sparkles } from "lucide-react"

import { Toggle } from "@/components/primitives"
import { useApp } from "@/context/app-context"

import type { Methodology, TaskStatusFormDTO } from "@/lib/ai/types"

const METHODOLOGIES: Methodology[] = [
  "SCRUM",
  "KANBAN",
  "WATERFALL",
  "ITERATIVE",
  "INCREMENTAL",
  "EVOLUTIONARY",
  "RAD",
]

// All seven special states from §17 D-03 expansion
const SPECIAL_STATES_TR = [
  "Blocked",
  "On Hold",
  "Cancelled",
  "Rejected",
  "Müşteri Onayı Bekliyor",
  "Dış Bağımlılık",
  "Yeniden Açıldı",
]

export interface AITaskStatusFormProps {
  onSubmit: (form: TaskStatusFormDTO) => void | Promise<void>
}

interface FormState {
  methodology: Methodology
  aiDecidesCount: boolean
  targetColumnCount: string
  hasCodeReview: boolean
  hasQaColumn: boolean
  hasUat: boolean
  hasSecurityAudit: boolean
  bugExtraVerification: boolean // D-03
  specialStates: Set<string>
  wipLimitsEnabled: boolean
  additionalContext: string
}

const INITIAL: FormState = {
  methodology: "SCRUM",
  aiDecidesCount: true,
  targetColumnCount: "",
  hasCodeReview: false,
  hasQaColumn: false,
  hasUat: false,
  hasSecurityAudit: false,
  bugExtraVerification: false,
  specialStates: new Set(),
  wipLimitsEnabled: true,
  additionalContext: "",
}

export function AITaskStatusForm({ onSubmit }: AITaskStatusFormProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const [form, setForm] = React.useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = React.useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }))

  const toggleSpecialState = (state: string) =>
    setForm((s) => {
      const next = new Set(s.specialStates)
      if (next.has(state)) next.delete(state)
      else next.add(state)
      return { ...s, specialStates: next }
    })

  const parsedCount = parseInt(form.targetColumnCount, 10)
  const countTooLow =
    !form.aiDecidesCount &&
    !!form.targetColumnCount &&
    !isNaN(parsedCount) &&
    parsedCount < 5

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const dto: TaskStatusFormDTO = {
        methodology: form.methodology,
        target_column_count: form.aiDecidesCount
          ? null
          : form.targetColumnCount
            ? parseInt(form.targetColumnCount, 10)
            : null,
        has_code_review: form.hasCodeReview,
        has_qa_column: form.hasQaColumn,
        has_uat: form.hasUat,
        has_security_audit: form.hasSecurityAudit,
        bug_extra_verification: form.bugExtraVerification,
        special_states: Array.from(form.specialStates),
        wip_limits_enabled: form.wipLimitsEnabled,
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

      {/* TARGET COLUMN COUNT — input tıkla/focus → otomatik manuel moda geçer */}
      <Field
        label={T("Hedef Durum Sayısı (opsiyonel)", "Target Column Count (optional)")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="number"
            min={5}
            max={12}
            placeholder="—"
            value={form.targetColumnCount}
            onChange={(e) => {
              const v = e.target.value
              update("targetColumnCount", v)
              // Boş yazıldıysa AI mode'a dön, doluysa manuel
              update("aiDecidesCount", !v)
            }}
            onFocus={() => {
              // Input'a tıklayınca otomatik manuel moda geç
              if (form.aiDecidesCount) update("aiDecidesCount", false)
            }}
            style={{
              ...inputStyle,
              opacity: form.aiDecidesCount ? 0.5 : 1,
            }}
          />
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            {T("durum", "columns")}
          </span>
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            {T("veya", "or")}
          </span>
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
              type="radio"
              checked={form.aiDecidesCount}
              onChange={() => {
                update("aiDecidesCount", true)
                update("targetColumnCount", "")
              }}
            />
            {T("AI karar versin", "Let AI decide")}
          </label>
        </div>

        {countTooLow && (
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-muted)",
              fontStyle: "italic",
              marginTop: 4,
            }}
          >
            {T(
              "5'ten az durum için AI'a gerek yok, manuel ekleyebilirsin.",
              "Below 5 columns AI isn't needed — add manually.",
            )}
          </div>
        )}
      </Field>

      {/* APPROVAL & REVIEW */}
      <Field label={T("Onay ve İnceleme", "Approval & Review")}>
        <ToggleRow
          checked={form.hasCodeReview}
          onChange={(v) => update("hasCodeReview", v)}
          title={T("Code review aşaması", "Code review stage")}
          subtitle={T("Pull request gate'i ayrı sütun olur", "PR gate becomes its own column")}
        />
        <ToggleRow
          checked={form.hasQaColumn}
          onChange={(v) => update("hasQaColumn", v)}
          title={T("QA / Test ayrı sütun", "QA / Test as separate column")}
          subtitle={T("Test ekibi için bağımsız akış noktası", "Independent flow point for QA")}
        />
        <ToggleRow
          checked={form.hasUat}
          onChange={(v) => update("hasUat", v)}
          title={T("Müşteri / PO onayı (UAT)", "Customer / PO approval (UAT)")}
          subtitle={T(
            "Approve sütunu eklenir, Bitti öncesi kapı",
            "Approve column added, gate before Done",
          )}
        />
        <ToggleRow
          checked={form.hasSecurityAudit}
          onChange={(v) => update("hasSecurityAudit", v)}
          title={T("Güvenlik denetimi", "Security audit")}
          subtitle={T("Penetrasyon / compliance sütunu", "Pen test / compliance column")}
          badge={T("YENİ", "NEW")}
        />
        <ToggleRow
          checked={form.bugExtraVerification}
          onChange={(v) => update("bugExtraVerification", v)}
          title={T("Bug için ayrı doğrulama adımı", "Extra verification step for bugs")}
          subtitle={T(
            "Bug çözüldükten sonra ek doğrulama sütunu",
            "Extra verification after bug fix",
          )}
          badge="D-03"
        />
      </Field>

      {/* SPECIAL STATES */}
      <Field
        label={T("Özel Durumlar — çoklu seçim", "Special States — multi-select")}
      >
        <ChipGroup>
          {SPECIAL_STATES_TR.map((s) => (
            <Chip
              key={s}
              selected={form.specialStates.has(s)}
              onClick={() => toggleSpecialState(s)}
            >
              {s}
            </Chip>
          ))}
        </ChipGroup>
      </Field>

      {/* WIP LIMITS */}
      <Field label={T("WIP Limiti", "WIP Limit")}>
        <ToggleRow
          checked={form.wipLimitsEnabled}
          onChange={(v) => update("wipLimitsEnabled", v)}
          title={T("WIP limitleri olsun", "Enable WIP limits")}
          subtitle={T(
            "AI her sütun için eşzamanlı görev üst sınırı önerir",
            "AI suggests per-column concurrency caps",
          )}
        />
      </Field>

      {/* ADDITIONAL CONTEXT */}
      <Field label={T("Ek Bağlam (opsiyonel)", "Additional Context (optional)")}>
        <textarea
          rows={3}
          maxLength={500}
          placeholder={T(
            "Takıma özel bir kural veya alışkanlık var mı?",
            "Any team-specific rule or habit?",
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
        {T("Görev Durumlarını Oluştur", "Generate Task Status")}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Local helpers (duplicated from lifecycle form intentionally — D-05 single
// responsibility, easier to diverge if variants evolve)
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

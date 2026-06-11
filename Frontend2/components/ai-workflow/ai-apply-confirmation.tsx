"use client"

/**
 * AI Apply Confirmation — inline overlay shown when user clicks "Uygula"
 * on a finished AI workflow. Two radio choices control the side effect:
 *
 *   ◉ Mevcut workflow'u tamamen değiştir       (default — D-01)
 *   ○ Mevcut workflow'u koru, yeni proje oluştur
 *
 * Plan refs:
 *   - §17 D-01: default = "replace"
 *   - §17 D-02: shown even when existing workflow is empty
 *   - §5.2 ai-apply-confirmation.tsx
 *
 * NOTE: This is a nested overlay (not a separate modal) — it renders
 * INSIDE the AIWorkflowModal body, dimming the workflow behind it so
 * the user keeps visual context.
 */

import * as React from "react"
import { AlertTriangle, Check } from "lucide-react"

import { useApp } from "@/context/app-context"
import type { ColumnMapTarget } from "@/lib/ai/apply-ai-workflow"

export type ApplyMode = "replace" | "new_project"

/** Existing board column the suggestion would remove. */
export interface RemovedColumnInfo {
  id: number
  name: string
  category?: string
}

/** Non-special AI column offered as a mapping target. */
export interface NewColumnOption {
  id: string
  label: string
  isInitial?: boolean
  isFinal?: boolean
}

export interface AIApplyConfirmationProps {
  /** Display label for the project/team being replaced */
  contextLabel: string
  variant: "lifecycle" | "task_status"
  /** Count of nodes/columns in the EXISTING workflow (drives copy) */
  existingCount: number
  /** Count of nodes/columns in the NEW AI-generated workflow */
  newCount: number
  /** Default selection — D-01: "replace" */
  defaultMode?: ApplyMode
  /** Jira "Associate statuses" adımı (task_status + replace): silinecek eski
   *  kolonlar. Boş/verilmemişse eşleme bölümü hiç görünmez. */
  removedColumns?: RemovedColumnInfo[]
  /** Eşleme hedefi olarak sunulacak yeni AI kolonları. */
  newColumns?: NewColumnOption[]
  onCancel: () => void
  onConfirm: (
    mode: ApplyMode,
    columnMapping?: Record<number, ColumnMapTarget>,
  ) => Promise<void> | void
}

const BACKLOG_VALUE = "__backlog__"

/** Smart default per removed column: done-category → first final AI column,
 *  everything else → first initial (falling back to the first column). */
function defaultTargetFor(
  removed: RemovedColumnInfo,
  options: NewColumnOption[],
): string {
  if (options.length === 0) return BACKLOG_VALUE
  if (removed.category === "done") {
    const fin = options.find((o) => o.isFinal)
    if (fin) return fin.id
  }
  const init = options.find((o) => o.isInitial)
  return (init ?? options[0]).id
}

export function AIApplyConfirmation({
  contextLabel,
  variant,
  existingCount,
  newCount,
  defaultMode = "replace",
  removedColumns,
  newColumns,
  onCancel,
  onConfirm,
}: AIApplyConfirmationProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const [mode, setMode] = React.useState<ApplyMode>(defaultMode)
  const [submitting, setSubmitting] = React.useState(false)

  const removed = React.useMemo(
    () => removedColumns ?? [],
    [removedColumns],
  )
  const targets = React.useMemo(() => newColumns ?? [], [newColumns])

  // Per-removed-column selection: AI column id or the backlog sentinel.
  const [mapping, setMapping] = React.useState<Record<number, string>>(() => {
    const init: Record<number, string> = {}
    for (const r of removed) init[r.id] = defaultTargetFor(r, targets)
    return init
  })

  const showMapping =
    mode === "replace" && variant === "task_status" && removed.length > 0

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      let columnMapping: Record<number, ColumnMapTarget> | undefined
      if (showMapping) {
        columnMapping = {}
        for (const r of removed) {
          const sel = mapping[r.id] ?? defaultTargetFor(r, targets)
          columnMapping[r.id] =
            sel === BACKLOG_VALUE
              ? { kind: "backlog" }
              : { kind: "column", aiColumnId: sel }
        }
      }
      await onConfirm(mode, columnMapping)
    } finally {
      setSubmitting(false)
    }
  }

  const titleTr =
    variant === "lifecycle"
      ? "Mevcut yaşam döngünüz değiştirilecek"
      : "Görev durumlarınız değiştirilecek"

  const itemWord = variant === "lifecycle" ? T("faz", "phase") : T("durum", "column")

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-apply-title"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(1 0 0 / 0.6)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: 480,
          maxWidth: "100%",
          background: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header — warning icon + title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "oklch(0.95 0.06 65)",
              color: "var(--warning)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <AlertTriangle size={18} />
          </span>
          <h2
            id="ai-apply-title"
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--fg)",
              margin: 0,
              lineHeight: 1.35,
              flex: 1,
              minWidth: 0,
            }}
          >
            {titleTr}
          </h2>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5, margin: 0 }}>
          {language === "tr" ? (
            <>
              <strong style={{ color: "var(--fg)" }}>&quot;{contextLabel}&quot;</strong>{" "}
              {variant === "lifecycle"
                ? "projesinin workflow'unda"
                : "takımının görev durumlarında"}{" "}
              şu anda{" "}
              <strong style={{ color: "var(--fg)" }}>
                {existingCount} {itemWord}
              </strong>{" "}
              var. Bu işlem onları AI&apos;ın ürettiği yeni{" "}
              <strong style={{ color: "var(--fg)" }}>
                {newCount} {itemWord}la
              </strong>{" "}
              değiştirecek.
              {variant === "task_status" &&
                " Adı eşleşen sütunlardaki görevler yerinde kalır; kaldırılan sütunların görevleri aşağıdaki eşlemeye göre taşınır."}
            </>
          ) : (
            <>
              <strong style={{ color: "var(--fg)" }}>&quot;{contextLabel}&quot;</strong>{" "}
              currently has{" "}
              <strong style={{ color: "var(--fg)" }}>
                {existingCount} {itemWord}s
              </strong>
              . This action will replace them with the AI&apos;s new{" "}
              <strong style={{ color: "var(--fg)" }}>
                {newCount} {itemWord}s
              </strong>
              .
              {variant === "task_status" &&
                " Tasks in name-matched columns stay put; tasks in removed columns follow the mapping below."}
            </>
          )}
        </p>

        {/* Radio options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <RadioCard
            checked={mode === "replace"}
            onSelect={() => setMode("replace")}
            title={
              variant === "lifecycle"
                ? T("Mevcut yaşam döngüsünü tamamen değiştir", "Replace the lifecycle entirely")
                : T("Mevcut görev durumlarını tamamen değiştir", "Replace task statuses entirely")
            }
            subtitle={
              <>
                {T(
                  "Tüm fazlar/sütunlar yenisiyle değiştirilir. ",
                  "All items will be replaced with the new ones. ",
                )}
                <span style={{ color: "var(--danger)" }}>
                  ⚠ {T("Bu işlem geri alınamaz.", "This action cannot be undone.")}
                </span>
              </>
            }
            recommended={false}
          />
          <RadioCard
            checked={mode === "new_project"}
            onSelect={() => setMode("new_project")}
            title={T(
              "Mevcut workflow'u koru, yeni proje oluştur",
              "Keep current workflow, create new project",
            )}
            subtitle={T(
              `"${contextLabel} (AI önerisi)" adıyla yeni bir proje açılır. Mevcut ekibin ve görevlerin etkilenmez.`,
              `Opens a new project named "${contextLabel} (AI suggestion)". Your team and tasks stay untouched.`,
            )}
            recommended
          />
        </div>

        {/* Jira "Associate statuses" adımı — kaldırılan her eski sütun için
            görevlerin gideceği hedef (yeni sütun ya da Backlog). */}
        {showMapping && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 12,
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--bg-2)",
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg)",
              }}
            >
              {T(
                "Kaldırılan sütunlardaki görevler nereye taşınsın?",
                "Where should tasks from removed columns go?",
              )}
            </div>
            {removed.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    color: "var(--fg-muted)",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={r.name}
                >
                  {r.name}
                </span>
                <span aria-hidden style={{ color: "var(--fg-subtle)", fontSize: 12 }}>
                  →
                </span>
                <select
                  aria-label={T(
                    `${r.name} görevlerinin hedefi`,
                    `Target for tasks in ${r.name}`,
                  )}
                  value={mapping[r.id] ?? defaultTargetFor(r, targets)}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  style={{
                    fontSize: 12.5,
                    padding: "5px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    maxWidth: 200,
                  }}
                >
                  {targets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                  <option value={BACKLOG_VALUE}>
                    {T("Backlog'a taşı (pano dışı)", "Move to backlog (off board)")}
                  </option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            paddingTop: 8,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              color: "var(--fg-muted)",
              fontSize: 13,
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {T("Vazgeç", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "var(--ai-accent)",
              color: "var(--ai-accent-fg)",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 2px 4px var(--ai-accent-ring)",
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "var(--ai-accent-hover)"
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = "var(--ai-accent)"
            }}
          >
            <Check size={14} />
            {submitting ? T("Uygulanıyor…", "Applying…") : T("Onaylıyorum", "Confirm")}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal — radio card row
// ---------------------------------------------------------------------------

function RadioCard({
  checked,
  onSelect,
  title,
  subtitle,
  recommended,
}: {
  checked: boolean
  onSelect: () => void
  title: React.ReactNode
  subtitle: React.ReactNode
  recommended: boolean
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: 12,
        borderRadius: "var(--radius)",
        border: `1px solid ${checked ? "var(--ai-accent)" : "var(--border)"}`,
        background: checked ? "var(--ai-accent-soft)" : "var(--surface)",
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
    >
      <input
        type="radio"
        name="ai-apply-mode"
        checked={checked}
        onChange={onSelect}
        style={{ marginTop: 2, accentColor: "var(--ai-accent)" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--fg)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {title}
          {recommended && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 999,
                background: "var(--ai-accent)",
                color: "var(--ai-accent-fg)",
              }}
            >
              Önerilen
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </div>
      </div>
    </label>
  )
}

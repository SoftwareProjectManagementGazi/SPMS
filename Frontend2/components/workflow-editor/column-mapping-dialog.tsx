"use client"

// ColumnMappingDialog — Jira'nın "Associate statuses" adımının karşılığı.
// Status workflow'dan kolon kaldıran HER akış (manuel editör kaydı + AI
// önerisi uygulaması) son onayda bu diyaloğu gösterir: kaldırılan her eski
// kolon için görevlerin gideceği hedef seçilir — yeni/kalan bir kolon ya da
// Backlog (pano dışı: column + sprint bağı temizlenir).

import * as React from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export const BACKLOG_TARGET = "__backlog__"

export interface MappingRemovedColumn {
  id: number
  name: string
  category?: string
}

export interface MappingTargetOption {
  /** Caller-defined target key (board column id or AI column id). */
  value: string
  label: string
  isInitial?: boolean
  isFinal?: boolean
}

export interface ColumnMappingDialogProps {
  open: boolean
  removedColumns: MappingRemovedColumn[]
  targets: MappingTargetOption[]
  /** Spinner state while the caller executes the moves. */
  busy?: boolean
  onCancel: () => void
  /** mapping: removed column id → target option value | BACKLOG_TARGET */
  onConfirm: (mapping: Record<number, string>) => void
}

/** Smart default: done-category columns → first final target; everything
 *  else → first initial target (falling back to the first option). */
export function defaultMappingTarget(
  removed: MappingRemovedColumn,
  targets: MappingTargetOption[],
): string {
  if (targets.length === 0) return BACKLOG_TARGET
  if (removed.category === "done") {
    const fin = targets.find((t) => t.isFinal)
    if (fin) return fin.value
  }
  const init = targets.find((t) => t.isInitial)
  return (init ?? targets[0]).value
}

export function ColumnMappingDialog({
  open,
  removedColumns,
  targets,
  busy,
  onCancel,
  onConfirm,
}: ColumnMappingDialogProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  // Only the user's overrides live in state; defaults are derived at render
  // via resolve(). Reset on each open transition (render-time adjust) so a
  // previous attempt's choices don't leak into the next one.
  const [mapping, setMapping] = React.useState<Record<number, string>>({})
  const [lastOpen, setLastOpen] = React.useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setMapping({})
  }

  if (!open) return null

  const resolve = (r: MappingRemovedColumn) =>
    mapping[r.id] ?? defaultMappingTarget(r, targets)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="column-mapping-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.2 0.02 260 / 0.45)",
        backdropFilter: "blur(2px)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "80vh",
          background: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl), inset 0 0 0 1px var(--border)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div>
          <h2
            id="column-mapping-title"
            style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--fg)" }}
          >
            {T(
              "Kaldırılan sütunlardaki görevler nereye taşınsın?",
              "Where should tasks from removed columns go?",
            )}
          </h2>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--fg-muted)",
              margin: "6px 0 0",
              lineHeight: 1.5,
            }}
          >
            {T(
              "Bu sütunlar yeni akışta yok. Her biri için görevlerin gideceği sütunu ya da Backlog'u seçin.",
              "These columns are not in the new flow. Pick a destination column or the backlog for each.",
            )}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          {removedColumns.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-2)",
                boxShadow: "inset 0 0 0 1px var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--fg)",
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
              <ArrowRight size={13} color="var(--fg-subtle)" aria-hidden />
              <select
                aria-label={T(
                  `${r.name} görevlerinin hedefi`,
                  `Target for tasks in ${r.name}`,
                )}
                value={resolve(r)}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
                disabled={busy}
                style={{
                  fontSize: 12.5,
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--fg)",
                  maxWidth: 220,
                }}
              >
                {targets.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
                <option value={BACKLOG_TARGET}>
                  {T("Backlog'a taşı (pano dışı)", "Move to backlog (off board)")}
                </option>
              </select>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            paddingTop: 4,
          }}
        >
          <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
            {T("Vazgeç", "Cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => {
              const out: Record<number, string> = {}
              for (const r of removedColumns) out[r.id] = resolve(r)
              onConfirm(out)
            }}
          >
            {busy
              ? T("Taşınıyor…", "Moving…")
              : T("Taşı ve Kaydet", "Move and Save")}
          </Button>
        </div>
      </div>
    </div>
  )
}

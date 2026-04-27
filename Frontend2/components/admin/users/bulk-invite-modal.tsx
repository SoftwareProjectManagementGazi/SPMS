"use client"

// Phase 14 Plan 14-03 Task 2 — Bulk-invite CSV modal (D-B4).
//
// Modal width 560 (UI-SPEC §Spacing line 89). 4-step wizard:
//   1. upload     — file picker + format hint
//   2. preview    — preview table with per-row validation badges + summary +
//                   500-row warning AlertBanner if rows.length > 500
//   3. submitting — submit-button spinner state ("{N} davet gönderiliyor...")
//   4. summary    — final summary modal: {S} successful / {F} failed +
//                   close (failed-row CSV download is optional v2.1 add)
//
// CSV injection guard (T-14-04): rows starting with =,+,-,@ are rejected
// at preview time (defense in depth — server-side csv module also escapes).
//
// 500-row hard cap is enforced both client-side (this modal warns + slices)
// AND server-side (Pydantic Field(max_length=500)) per Pitfall 5.

import * as React from "react"

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Badge,
  AlertBanner,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
import {
  parseBulkInviteCsv,
  BULK_INVITE_MAX_ROWS,
  type BulkInviteParseResult,
  type BulkInviteRow,
} from "@/lib/admin/csv-parse"
import { useBulkInvite } from "@/hooks/use-bulk-invite"
import type { BulkInviteResponse } from "@/services/admin-user-service"

export interface BulkInviteModalProps {
  open: boolean
  onClose: () => void
}

type Step = "upload" | "preview" | "submitting" | "summary"

// Cells with leading =, +, -, @ are CSV-injection candidates; reject at
// preview time so they never reach the server (T-14-04 defense in depth).
const CSV_INJECTION_LEADING_CHARS = ["=", "+", "-", "@"]

function isCsvInjectionRow(row: BulkInviteRow): boolean {
  const checkCells = [row.email, row.name, row.role]
  for (const cell of checkCells) {
    const trimmed = (cell ?? "").trim()
    if (trimmed.length === 0) continue
    if (CSV_INJECTION_LEADING_CHARS.includes(trimmed[0])) return true
  }
  return false
}

const PREVIEW_MAX_VISIBLE_ROWS = 100

export function BulkInviteModal({ open, onClose }: BulkInviteModalProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const { showToast } = useToast()
  const bulkInvite = useBulkInvite()

  const [step, setStep] = React.useState<Step>("upload")
  const [parseResult, setParseResult] =
    React.useState<BulkInviteParseResult | null>(null)
  const [rawRowCount, setRawRowCount] = React.useState<number>(0)
  const [submitResult, setSubmitResult] =
    React.useState<BulkInviteResponse | null>(null)

  // Reset on modal open.
  React.useEffect(() => {
    if (open) {
      setStep("upload")
      setParseResult(null)
      setRawRowCount(0)
      setSubmitResult(null)
    }
  }, [open])

  const handleFileSelect = async (file: File) => {
    setStep("preview")
    const result = await parseBulkInviteCsv(file)

    // Apply CSV-injection guard — rebuild rows excluding injection candidates,
    // moving them into errors with the "csv injection" message.
    const safeRows: BulkInviteRow[] = []
    const injectionErrors = result.errors.slice()
    for (let i = 0; i < result.rows.length; i++) {
      const r = result.rows[i]
      if (isCsvInjectionRow(r)) {
        injectionErrors.push({
          // Match existing row-numbering convention (i+2 because of header).
          row_number: i + 2,
          message: adminUsersT(
            "admin.users.modal_bulk_csv_injection_error",
            lang,
          ),
        })
      } else {
        safeRows.push(r)
      }
    }
    setParseResult({ rows: safeRows, errors: injectionErrors })
    setRawRowCount(result.rows.length + result.errors.length)

    // 500-row toast warning (UX) — the parser already pushes a row-cap error
    // entry, but a Toast is more visible.
    if (result.rows.length > BULK_INVITE_MAX_ROWS) {
      showToast({
        variant: "warning",
        message: adminUsersT("admin.users.modal_bulk_too_many_toast", lang),
      })
    }
  }

  const handleSubmit = () => {
    if (!parseResult) return
    const rowsToSubmit = parseResult.rows.slice(0, BULK_INVITE_MAX_ROWS)
    setStep("submitting")
    bulkInvite.mutate(rowsToSubmit, {
      onSuccess: (resp) => {
        setSubmitResult(resp)
        setStep("summary")
      },
      onError: () => {
        // Hook already shows error toast; reset to preview so user can retry.
        setStep("preview")
      },
    })
  }

  // Derived view-state values.
  const validCount = parseResult?.rows.length ?? 0
  const invalidCount = parseResult?.errors.length ?? 0
  const totalCount = validCount + invalidCount
  const overCap = validCount > BULK_INVITE_MAX_ROWS

  const summaryLine = adminUsersT(
    "admin.users.modal_bulk_preview_summary",
    lang,
  )
    .replace("{V}", String(validCount))
    .replace("{I}", String(invalidCount))
    .replace("{T}", String(totalCount))

  return (
    <Modal open={open} onClose={onClose} width={560}>
      <ModalHeader>{adminUsersT("admin.users.modal_bulk_title", lang)}</ModalHeader>
      <ModalBody>
        {/* Step 1 — Upload */}
        {step === "upload" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                color: "var(--fg-muted)",
                lineHeight: 1.5,
              }}
            >
              {adminUsersT("admin.users.modal_bulk_format_hint", lang)}
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 16px",
                background: "var(--surface-2)",
                borderRadius: "var(--radius)",
                boxShadow: "inset 0 0 0 1.5px var(--border-strong)",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--fg-muted)",
                gap: 6,
              }}
            >
              <input
                type="file"
                accept=".csv,text/csv"
                aria-label="CSV file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
              {adminUsersT("admin.users.modal_bulk_select_file", lang)}
            </label>
          </div>
        )}

        {/* Step 2 — Preview */}
        {step === "preview" && parseResult && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {overCap && (
              <AlertBanner tone="warning">
                {adminUsersT(
                  "admin.users.modal_bulk_warning_500",
                  lang,
                ).replace("{N}", String(rawRowCount))}
              </AlertBanner>
            )}
            <div
              style={{
                fontSize: 12.5,
                color: "var(--fg-muted)",
                fontWeight: 600,
              }}
            >
              {summaryLine}
            </div>

            {/* Preview table — show up to PREVIEW_MAX_VISIBLE_ROWS rows */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {parseResult.rows
                .slice(0, PREVIEW_MAX_VISIBLE_ROWS)
                .map((r, i) => (
                  <div
                    key={`row-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1.5fr 1fr 100px 80px",
                      padding: "8px 10px",
                      gap: 6,
                      alignItems: "center",
                      fontSize: 12,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ color: "var(--fg-subtle)" }} className="mono">
                      {i + 1}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.email}
                    </span>
                    <span
                      style={{
                        color: "var(--fg-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.name}
                    </span>
                    <span style={{ fontSize: 11 }}>{r.role}</span>
                    <Badge size="xs" tone="success">
                      {adminUsersT(
                        "admin.users.modal_bulk_preview_valid",
                        lang,
                      )}
                    </Badge>
                  </div>
                ))}
              {parseResult.errors.slice(0, PREVIEW_MAX_VISIBLE_ROWS).map((err, i) => (
                <div
                  key={`err-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 80px",
                    padding: "8px 10px",
                    gap: 6,
                    alignItems: "center",
                    fontSize: 11.5,
                    borderBottom: "1px solid var(--border)",
                    background: "color-mix(in oklch, var(--priority-critical) 4%, transparent)",
                  }}
                >
                  <span style={{ color: "var(--fg-subtle)" }} className="mono">
                    {err.row_number}
                  </span>
                  <span style={{ color: "var(--priority-critical)" }}>
                    {err.message}
                  </span>
                  <Badge size="xs" tone="danger">
                    {adminUsersT(
                      "admin.users.modal_bulk_preview_invalid",
                      lang,
                    )}
                  </Badge>
                </div>
              ))}
              {totalCount > PREVIEW_MAX_VISIBLE_ROWS && (
                <div
                  style={{
                    padding: "10px 10px",
                    fontSize: 11.5,
                    color: "var(--fg-subtle)",
                    textAlign: "center",
                  }}
                >
                  {adminUsersT(
                    "admin.users.modal_bulk_preview_more_rows",
                    lang,
                  ).replace(
                    "{N}",
                    String(totalCount - PREVIEW_MAX_VISIBLE_ROWS),
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Submitting */}
        {step === "submitting" && (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--fg-muted)",
            }}
          >
            {adminUsersT(
              "admin.users.modal_bulk_submitting",
              lang,
            ).replace("{N}", String(validCount))}
          </div>
        )}

        {/* Step 4 — Summary */}
        {step === "summary" && submitResult && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg)",
              }}
            >
              {adminUsersT("admin.users.modal_bulk_summary_title", lang)}
            </div>
            <div style={{ fontSize: 13, color: "var(--fg)" }}>
              {adminUsersT("admin.users.modal_bulk_summary_body", lang)
                .replace("{S}", String(submitResult.successful.length))
                .replace("{F}", String(submitResult.failed.length))}
            </div>
            {submitResult.failed.length > 0 && (
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                  maxHeight: 200,
                  overflowY: "auto",
                  padding: 8,
                }}
              >
                {submitResult.failed.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11.5,
                      padding: "4px 6px",
                      color: "var(--priority-critical)",
                    }}
                  >
                    #{f.row_number} {f.email ?? ""} — {f.errors.join(", ")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {step === "preview" && (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              {adminUsersT("admin.users.modal_add_cancel", lang)}
            </Button>
            {overCap ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={validCount === 0}
              >
                {adminUsersT("admin.users.modal_bulk_warning_cta", lang)}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={validCount === 0}
              >
                {adminUsersT(
                  "admin.users.modal_bulk_submit",
                  lang,
                ).replace("{N}", String(Math.min(validCount, BULK_INVITE_MAX_ROWS)))}
              </Button>
            )}
          </>
        )}
        {step !== "preview" && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            {adminUsersT("admin.users.modal_bulk_close", lang)}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

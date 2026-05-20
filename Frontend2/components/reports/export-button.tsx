"use client"

// Reports migration v2 Wave 5 — Export buttons.
//
// 3 plain primitive Buttons (no DropdownMenu primitive per peer review §2.9):
//   - [Önizle ↗]   opens the PDF in a new browser tab via window.open(blob).
//                  Uses the browser's native PDF viewer; no CSP risk vs the
//                  iframe-in-modal approach from plan v1.
//   - [PDF ↓]      direct download of the PDF blob.
//   - [Excel ↓]    direct download of the .xlsx blob.
//
// Loader state replaces the icon on the active button (only the in-flight
// button disables itself; the other two stay clickable). Success / failure
// feedback bubbles up via the `onMessage` callback so the page composer
// can render an inline AlertBanner — keeps the Toast primitive deferral
// from peer review §2.8 honored.

import * as React from "react"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { reportService, type ReportFilters } from "@/services/report-service"

export type ExportMessageVariant = "success" | "error"

export interface ExportMessage {
  variant: ExportMessageVariant
  text: string
}

export interface ExportButtonProps {
  filters: ReportFilters
  /** Disabled when projectId is null OR when the page hasn't resolved a
   *  project yet. The 3 buttons all share the same gate. */
  disabled?: boolean
  /** Called with a TR/EN message after every export attempt. Page renders
   *  it as an inline AlertBanner; we don't ship a Toast primitive. */
  onMessage?: (msg: ExportMessage) => void
}

type ExportKind = "view-pdf" | "download-pdf" | "download-excel"

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Defer the revoke so Firefox / Safari finishes triggering the
  // download dialog before we drop the URL.
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function pdfFilename(projectId: number | null): string {
  return `SPMS_Report_${projectId ?? "ALL"}_${todayIsoDate()}.pdf`
}

function excelFilename(projectId: number | null): string {
  return `SPMS_Report_${projectId ?? "ALL"}_${todayIsoDate()}.xlsx`
}

export function ExportButton({
  filters,
  disabled = false,
  onMessage,
}: ExportButtonProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)
  const [pending, setPending] = React.useState<ExportKind | null>(null)
  const isBusy = pending !== null

  const reportT = React.useCallback(
    (kind: ExportKind, success: boolean): ExportMessage => {
      if (success) {
        if (kind === "download-pdf")
          return { variant: "success", text: T("PDF indirildi.", "PDF downloaded.") }
        if (kind === "download-excel")
          return { variant: "success", text: T("Excel indirildi.", "Excel downloaded.") }
        return { variant: "success", text: T("PDF yeni sekmede açıldı.", "PDF opened in a new tab.") }
      }
      return {
        variant: "error",
        text: T(
          "Rapor oluşturulamadı. Lütfen tekrar deneyin.",
          "Failed to generate the report. Please try again.",
        ),
      }
    },
    [T],
  )

  async function handleViewPdf() {
    setPending("view-pdf")
    try {
      const blob = await reportService.exportPdf(filters)
      const url = URL.createObjectURL(blob)
      // window.open returns null when a popup blocker fires; surface a
      // distinct error so the user knows to retry the download instead.
      const opened = window.open(url, "_blank", "noopener,noreferrer")
      if (!opened) {
        URL.revokeObjectURL(url)
        onMessage?.({
          variant: "error",
          text: T(
            "Yeni sekme açılamadı (popup engellendi). PDF indirmeyi deneyin.",
            "Couldn't open a new tab (popup blocked). Try downloading instead.",
          ),
        })
        return
      }
      // Revoke after the new tab has had a moment to fetch the blob URL.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      onMessage?.(reportT("view-pdf", true))
    } catch {
      onMessage?.(reportT("view-pdf", false))
    } finally {
      setPending(null)
    }
  }

  async function handleDownloadPdf() {
    setPending("download-pdf")
    try {
      const blob = await reportService.exportPdf(filters)
      downloadBlob(blob, pdfFilename(filters.projectId))
      onMessage?.(reportT("download-pdf", true))
    } catch {
      onMessage?.(reportT("download-pdf", false))
    } finally {
      setPending(null)
    }
  }

  async function handleDownloadExcel() {
    setPending("download-excel")
    try {
      const blob = await reportService.exportExcel(filters)
      downloadBlob(blob, excelFilename(filters.projectId))
      onMessage?.(reportT("download-excel", true))
    } catch {
      onMessage?.(reportT("download-excel", false))
    } finally {
      setPending(null)
    }
  }

  const SpinnerIcon = <Loader2 size={13} className="reports-export-spinner" />

  return (
    <div style={{ display: "inline-flex", gap: 6 }} data-testid="export-button-group">
      <Button
        variant="secondary"
        size="sm"
        icon={pending === "view-pdf" ? SpinnerIcon : <ExternalLink size={13} />}
        disabled={disabled || isBusy}
        onClick={handleViewPdf}
        aria-label={T("PDF'i yeni sekmede aç", "Open PDF in new tab")}
      >
        {T("Önizle", "Preview")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={pending === "download-pdf" ? SpinnerIcon : <Download size={13} />}
        disabled={disabled || isBusy}
        onClick={handleDownloadPdf}
        aria-label={T("PDF olarak indir", "Download as PDF")}
      >
        PDF
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={pending === "download-excel" ? SpinnerIcon : <Download size={13} />}
        disabled={disabled || isBusy}
        onClick={handleDownloadExcel}
        aria-label={T("Excel olarak indir", "Download as Excel")}
      >
        Excel
      </Button>
    </div>
  )
}

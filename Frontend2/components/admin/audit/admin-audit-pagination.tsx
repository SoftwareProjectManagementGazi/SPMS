"use client"

// Phase 14 Plan 14-07 — Admin audit pagination toolbar.
//
// Per UI-SPEC §Surface H lines 479-483:
//   - Page-size selector (SegmentedControl with 25/50/100 options)
//   - "Sayfa N / M" caption
//   - Prev / Next chevron buttons (disabled at boundaries)
//   - Caption "Toplam: {N} kayıt"
//
// Pagination math uses min(actual_total, 50000) — Pitfall 6 awareness.
// Filter changes reset offset to 0; that policy lives in the parent page
// (`updateFilter` helper). This component is purely presentational.

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button, SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminAuditT } from "@/lib/i18n/admin-audit-keys"

const HARD_CAP = 50_000
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const

interface AdminAuditPaginationProps {
  total: number
  truncated: boolean
  size: number
  offset: number
  onSizeChange: (size: number) => void
  onOffsetChange: (offset: number) => void
}

export function AdminAuditPagination({
  total,
  truncated,
  size,
  offset,
  onSizeChange,
  onOffsetChange,
}: AdminAuditPaginationProps) {
  const { language } = useApp()

  // Pitfall 6 — pagination math caps at 50k regardless of true total.
  const cappedTotal = truncated ? HARD_CAP : Math.min(total, HARD_CAP)
  const totalPages = Math.max(1, Math.ceil(cappedTotal / size))
  const currentPage = Math.min(totalPages, Math.floor(offset / size) + 1)

  const canPrev = offset > 0
  const canNext = offset + size < cappedTotal

  const onPrev = () => {
    if (!canPrev) return
    onOffsetChange(Math.max(0, offset - size))
  }
  const onNext = () => {
    if (!canNext) return
    onOffsetChange(offset + size)
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderTop: "1px solid var(--border)",
        fontSize: 12,
        color: "var(--fg-muted)",
      }}
    >
      {/* Page size selector */}
      <span>{adminAuditT("admin.audit.pagination_size_label", language)}</span>
      <SegmentedControl
        size="xs"
        value={String(size)}
        onChange={(id) => onSizeChange(Number(id))}
        options={PAGE_SIZE_OPTIONS.map((n) => ({
          id: String(n),
          label: String(n),
        }))}
      />

      <div style={{ flex: 1 }} />

      {/* Total + page caption */}
      <span className="mono" style={{ fontVariantNumeric: "tabular-nums" }}>
        {adminAuditT("admin.audit.pagination_total", language).replace(
          "{N}",
          String(cappedTotal),
        )}
      </span>
      <span className="mono" style={{ fontVariantNumeric: "tabular-nums" }}>
        {adminAuditT("admin.audit.pagination_page", language)
          .replace("{P}", String(currentPage))
          .replace("{M}", String(totalPages))}
      </span>

      {/* Chevron buttons */}
      <Button
        variant="ghost"
        size="icon"
        aria-label={adminAuditT("admin.audit.pagination_prev_aria", language)}
        disabled={!canPrev}
        onClick={onPrev}
        icon={<ChevronLeft size={14} />}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label={adminAuditT("admin.audit.pagination_next_aria", language)}
        disabled={!canNext}
        onClick={onNext}
        icon={<ChevronRight size={14} />}
      />
    </div>
  )
}

"use client"

// Phase 14 Plan 14-07 — Admin audit toolbar.
//
// Per prototype admin.jsx lines 402-407 + UI-SPEC §Surface H:
//   - Search Input (placeholder "actor, action, target…")
//   - "Son 24 saat" quick filter Button (sets date_from = now - 24h, date_to = now)
//   - "Filtre" Button — opens AuditFilterModal (Task 2)
//   - flex spacer
//   - "JSON" export Button — calls downloadCsv(adminAuditService.exportJsonUrl(filter))
//
// Search behavior: the prototype's search input was decorative (no backend
// support). The /admin/audit endpoint doesn't expose a free-text search;
// the closest approximation is the action_prefix filter. For v2.0 we keep
// the search input visible (prototype fidelity) but it's a no-op stub.
// Real text search is a v2.1 candidate when the backend adds full-text on
// audit_log.

import * as React from "react"
import { Search, Calendar, Filter, Download } from "lucide-react"

import { Input, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminAuditT } from "@/lib/i18n/admin-audit-keys"
import { downloadCsv } from "@/lib/admin/csv-export"
import {
  adminAuditService,
  type AdminAuditFilter,
} from "@/services/admin-audit-service"

interface AdminAuditToolbarProps {
  filter: AdminAuditFilter
  /** Update one or more filter facets — parent updates URL search params. */
  onUpdate: (next: Partial<AdminAuditFilter>) => void
  /** Open the AuditFilterModal — owned by the parent. */
  onOpenFilterModal: () => void
}

export function AdminAuditToolbar({
  filter,
  onUpdate,
  onOpenFilterModal,
}: AdminAuditToolbarProps) {
  const { language } = useApp()

  const onLast24h = () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    onUpdate({
      date_from: yesterday.toISOString(),
      date_to: now.toISOString(),
    })
  }

  const onJsonExport = () => {
    const url = adminAuditService.exportJsonUrl(filter)
    downloadCsv(url, "audit-log.json")
  }

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <Input
        icon={<Search size={13} />}
        placeholder={adminAuditT(
          "admin.audit.search_placeholder",
          language,
        )}
        size="sm"
        style={{ width: 260 }}
      />
      <Button
        size="sm"
        variant="ghost"
        icon={<Calendar size={13} />}
        onClick={onLast24h}
      >
        {adminAuditT("admin.audit.last_24h", language)}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<Filter size={13} />}
        onClick={onOpenFilterModal}
      >
        {adminAuditT("admin.audit.filter_button", language)}
      </Button>
      <div style={{ flex: 1 }} />
      <Button
        size="sm"
        variant="secondary"
        icon={<Download size={13} />}
        onClick={onJsonExport}
      >
        {adminAuditT("admin.audit.json_button", language)}
      </Button>
    </div>
  )
}

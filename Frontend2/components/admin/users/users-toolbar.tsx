"use client"

// Phase 14 Plan 14-03 — Users tab toolbar (UI-SPEC §Surface C).
//
// Layout (verbatim prototype admin.jsx lines 156-168):
//   [search input] [SegmentedControl: Tümü/Admin/PM/Member] ↔ [CSV] [Bulk invite] [Add user]
//
// CSV button → downloadAuthenticated(/admin/users.csv?<URLSearchParams of filter>)
// per CONTEXT D-W3 (server-rendered, NO client-side blob). Plan 14-13
// (Cluster A 401 fix) replaced the original anchor-trigger downloadCsv() —
// which stripped the Authorization header — with a fetch+blob helper that
// includes Bearer <token>.
//
// Bulk-invite + Add-user buttons emit onOpenBulkInvite / onOpenAddUser which
// the parent page wires to its modal-open state.

import * as React from "react"
import { Search, Download, Mail, Plus } from "lucide-react"

import {
  Button,
  Input,
  SegmentedControl,
  type SegmentedOption,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
// Plan 14-13 — authenticated download (Cluster A 401 fix). The previous
// downloadCsv() anchor-trigger fired GET without Authorization, so the
// backend's Depends(require_admin) returned 401. downloadAuthenticated()
// uses fetch() with an explicit Bearer header.
import { downloadAuthenticated } from "@/lib/admin/download-authenticated"
import {
  adminUserService,
  type AdminUserListFilter,
} from "@/services/admin-user-service"

export interface UsersToolbarProps {
  filter: AdminUserListFilter
  onFilterChange: (next: AdminUserListFilter) => void
  onOpenAddUser: () => void
  onOpenBulkInvite: () => void
}

export function UsersToolbar({
  filter,
  onFilterChange,
  onOpenAddUser,
  onOpenBulkInvite,
}: UsersToolbarProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const { showToast } = useToast()

  // 4-option SegmentedControl (Tümü / Admin / PM / Member).
  const roleOptions: SegmentedOption[] = [
    { id: "all", label: adminUsersT("admin.users.filter_all", lang) },
    { id: "Admin", label: "Admin" },
    { id: "Project Manager", label: "Project Manager" },
    { id: "Member", label: "Member" },
  ]

  // Plan 14-13 — authenticated download (Cluster A 401 fix). The CSV is
  // still server-rendered (D-W3 — UTF-8 BOM + Content-Disposition);
  // downloadAuthenticated() just fixes the missing Authorization header.
  const handleCsvExport = async () => {
    try {
      const url = adminUserService.exportCsv(filter)
      const filename = `users-${new Date().toISOString().slice(0, 10)}.csv`
      await downloadAuthenticated(url, filename)
    } catch (err) {
      showToast({
        variant: "error",
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow), var(--inset-card)",
      }}
    >
      <Input
        icon={<Search size={13} />}
        placeholder={adminUsersT("admin.users.search_placeholder", lang)}
        value={filter.q ?? ""}
        onChange={(e) => onFilterChange({ ...filter, q: e.target.value })}
        size="sm"
        style={{ width: 240 }}
      />
      <SegmentedControl
        options={roleOptions}
        value={(filter.role as string | undefined) ?? "all"}
        onChange={(id) =>
          onFilterChange({
            ...filter,
            role: id === "all" ? undefined : (id as AdminUserListFilter["role"]),
          })
        }
      />
      <div style={{ flex: 1 }} />
      <Button
        size="sm"
        variant="secondary"
        icon={<Download size={13} />}
        onClick={handleCsvExport}
      >
        {adminUsersT("admin.users.csv_button", lang)}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        icon={<Mail size={13} />}
        onClick={onOpenBulkInvite}
      >
        {adminUsersT("admin.users.bulk_invite_button", lang)}
      </Button>
      <Button
        size="sm"
        variant="primary"
        icon={<Plus size={13} />}
        onClick={onOpenAddUser}
      >
        {adminUsersT("admin.users.add_user_button", lang)}
      </Button>
    </div>
  )
}

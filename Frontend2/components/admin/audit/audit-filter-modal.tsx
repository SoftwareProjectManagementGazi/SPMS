"use client"

// Phase 14 Plan 14-07 Task 2 — Audit filter modal.
//
// Modal width 520 (UI-SPEC §Spacing line 89). 4 form fields + 3 footer
// buttons. Per UI-SPEC §Surface H lines 470-477:
//
//   Title:   "Audit Filtresi" / "Audit Filter"
//   Body:
//     - Başlangıç (date_from) — Input type="date"
//     - Bitiş (date_to)       — Input type="date"
//     - Aktör (actor_id)      — native <select> from useAdminUsers()
//     - İşlem öneki           — Input type="text" placeholder
//   Footer:
//     - Vazgeç (ghost — closes without applying)
//     - Temizle (ghost — applies an empty filter so all fields are reset)
//     - Uygula  (primary — applies the local draft)
//
// Draft state: a local mirror of the parent's `filter` so edits don't
// commit until Uygula. When the modal opens we re-sync draft from filter
// (covers the case where the parent updated filter externally).

import * as React from "react"

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminAuditT } from "@/lib/i18n/admin-audit-keys"
import { useAdminUsers } from "@/hooks/use-admin-users"
import type { AdminAuditFilter } from "@/services/admin-audit-service"

interface AuditFilterModalProps {
  open: boolean
  filter: AdminAuditFilter
  onApply: (next: AdminAuditFilter) => void
  onClose: () => void
}

interface AdminUserShape {
  id: number
  email?: string
  full_name?: string
  username?: string
}

/** Slice an ISO timestamp (e.g. "2026-04-01T00:00:00Z") down to the
 *  YYYY-MM-DD format expected by <input type="date"> .value */
function toDateInput(iso: string | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function AuditFilterModal({
  open,
  filter,
  onApply,
  onClose,
}: AuditFilterModalProps) {
  const { language } = useApp()
  const { data: usersData } = useAdminUsers({})

  // Local draft mirrors the parent filter; the parent only sees the new
  // filter shape after the user clicks Uygula.
  const [draft, setDraft] = React.useState<AdminAuditFilter>(filter)

  // Re-sync draft when modal opens or parent filter changes (e.g. user
  // closed the modal without applying, then a chip clear changed the
  // parent filter externally).
  React.useEffect(() => {
    if (open) setDraft(filter)
  }, [open, filter])

  // Normalize the users response shape — backend may ship an array OR an
  // {items: []} envelope depending on endpoint.
  const users: AdminUserShape[] = React.useMemo(() => {
    const data = usersData as unknown
    if (Array.isArray(data)) return data as AdminUserShape[]
    if (data && typeof data === "object" && "items" in data) {
      const items = (data as { items?: unknown }).items
      return Array.isArray(items) ? (items as AdminUserShape[]) : []
    }
    return []
  }, [usersData])

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const handleClear = () => {
    // Clear: send an empty filter so the parent resets every facet AND
    // resets offset to 0 (the parent's updateFilter helper enforces that).
    onApply({})
    onClose()
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--fg-muted)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  }

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <ModalHeader>
        {adminAuditT("admin.audit.filter_modal_title", language)}
      </ModalHeader>
      <ModalBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            {adminAuditT("admin.audit.filter_date_from", language)}
            <Input
              type="date"
              value={toDateInput(draft.date_from)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  date_from: e.target.value || undefined,
                })
              }
            />
          </label>

          <label style={labelStyle}>
            {adminAuditT("admin.audit.filter_date_to", language)}
            <Input
              type="date"
              value={toDateInput(draft.date_to)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  date_to: e.target.value || undefined,
                })
              }
            />
          </label>

          <label style={labelStyle}>
            {adminAuditT("admin.audit.filter_actor", language)}
            <select
              value={draft.actor_id ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  actor_id: e.target.value
                    ? parseInt(e.target.value, 10)
                    : undefined,
                })
              }
              style={{
                height: 32,
                padding: "0 8px",
                background: "var(--surface)",
                color: "var(--fg)",
                border: 0,
                borderRadius: "var(--radius-sm)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                fontSize: 13,
              }}
            >
              <option value="">
                {adminAuditT("admin.audit.filter_actor_all", language)}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email || u.username || `#${u.id}`}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            {adminAuditT("admin.audit.filter_action_prefix", language)}
            <Input
              type="text"
              value={draft.action_prefix ?? ""}
              placeholder={adminAuditT(
                "admin.audit.filter_action_prefix_placeholder",
                language,
              )}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  action_prefix: e.target.value || undefined,
                })
              }
            />
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {adminAuditT("admin.audit.filter_cancel", language)}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          {adminAuditT("admin.audit.filter_clear", language)}
        </Button>
        <Button variant="primary" size="sm" onClick={handleApply}>
          {adminAuditT("admin.audit.filter_apply", language)}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

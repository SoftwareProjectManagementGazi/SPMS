"use client"

// Phase 14 Plan 14-04 (placeholder) → Phase 15 Plan 15-10 (RBAC active)
// — PermissionMatrixCard component.
//
// Layers 2, 3, 5 of D-2.7 atomic 7-layer placeholder uplift:
//   - Layer 2: placeholder tooltip text REMOVED (toggles don't have
//     placeholder tooltips — they auto-save).
//   - Layer 3: deferred-version Badge in card header REMOVED.
//   - Layer 5: "Kopyala" button ENABLED (was disabled w/ deferred-version
//     tooltip in Phase 14 14-04). It now copies the matrix to clipboard
//     as JSON for v2.0; full CSV export deferred to v2.1.
//
// Data source: usePermissionMatrix() (Plan 15-09 hook) — the static
// `permissions-static.ts` import is gone. Matrix shape is
// {roles, permissions, cells} from /admin/permissions/matrix endpoint
// (Plan 15-06). Per D-1.5 the backend sorts roles Admin → PM → Member →
// Guest → custom alphabetical.
//
// Per-column "Sistem" badge (D-2.4): every role with is_system_role=true
// gets a tone="neutral" badge in its column header so admins can tell
// built-in roles apart from custom roles at a glance.

import * as React from "react"
import { Copy } from "lucide-react"

import {
  AlertBanner,
  Badge,
  Button,
  Card,
  DataState,
} from "@/components/primitives"
import { useToast } from "@/components/toast"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"
import { usePermissionMatrix } from "@/hooks/use-permission-matrix"

import { PermissionRow } from "./permission-row"

export function PermissionMatrixCard() {
  const { language } = useApp()
  const { showToast } = useToast()
  const { data: matrix, isLoading, error } = usePermissionMatrix()

  const copyTooltip = adminRbacT("admin.permissions.copy_tooltip", language)
  const copyButtonLabel = adminRbacT(
    "admin.permissions.copy_button",
    language,
  )

  // Plan 15-10 — Kopyala now active. Copies the full matrix as a
  // pretty-printed JSON snapshot to the clipboard for ad-hoc audits /
  // diff-against-baseline workflows. v2.1 candidate: dedicated CSV export
  // with role × permission grid layout.
  const handleCopy = React.useCallback(async () => {
    if (!matrix) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(matrix, null, 2))
      showToast({
        variant: "success",
        message: adminRbacT("admin.permissions.copy_success", language),
      })
    } catch {
      // clipboard.writeText may throw on insecure origin; surface a
      // recoverable error toast (the matrix is still visible in DOM).
      showToast({
        variant: "error",
        message:
          language === "tr"
            ? "Kopyalama başarısız oldu"
            : "Copy failed",
      })
    }
  }, [matrix, showToast, language])

  // 3-state render via DataState primitive (D-F2 — load/error/happy
  // unified). The matrix endpoint is a single GET so initial loading
  // covers the typical UX path; mutations are handled inline by
  // useUpdatePermissionCell's optimistic update inside PermissionRow.
  if (error) {
    return (
      <AlertBanner tone="danger">
        {language === "tr"
          ? "İzin matrisi alınamadı."
          : "Couldn't load permission matrix."}
      </AlertBanner>
    )
  }
  if (isLoading || !matrix) {
    return (
      <DataState loading={true}>
        <span />
      </DataState>
    )
  }

  return (
    <Card padding={0}>
      {/* Header — title + subtitle + active Kopyala button. Deferred
          Badge REMOVED per D-2.7 layer 3 (atomic placeholder uplift). */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
          {adminRbacT("admin.permissions.card_title", language)}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
          {adminRbacT("admin.permissions.card_subtitle", language)}
        </div>
        <div style={{ flex: 1 }} />
        {/* Kopyala — ENABLED per D-2.7 layer 5. Tooltip describes the
            action ("Copy permission matrix to clipboard as JSON"). */}
        <Button
          size="xs"
          variant="secondary"
          icon={<Copy size={12} aria-hidden="true" />}
          onClick={handleCopy}
          title={copyTooltip}
          aria-label={copyButtonLabel}
        >
          {copyButtonLabel}
        </Button>
      </div>

      {/* Phase 15 hotfix — Kanban-board style horizontal scroll. The
          matrix wrapper is the scroll container; header + rows share the
          same grid template with min-width: fit-content so all role
          columns are reachable via horizontal scroll without trying to
          squeeze them into the viewport. The first (permission label)
          column is sticky-left in PermissionRow so admins can always
          read which perm a row represents while scrolling sideways. */}
      <div
        style={{
          overflowX: "auto",
          maxWidth: "100%",
        }}
      >
        {/* Header row — sticky-top via position:sticky inside the scroll
            container. matches PermissionRow gridTemplateColumns exactly so
            cells align under role names. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `260px repeat(${matrix.roles.length}, 120px)`,
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--fg-muted)",
            position: "sticky",
            top: 0,
            zIndex: 2,
            minWidth: "fit-content",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              // Sticky-left mirror of PermissionRow's first column so
              // header + rows align both vertically and horizontally
              // during scroll.
              position: "sticky",
              left: 0,
              background: "var(--surface-2)",
              borderRight: "1px solid var(--border)",
              zIndex: 3,
            }}
          >
            {adminRbacT("admin.permissions.column_permission", language)}
          </div>
          {matrix.roles.map((role) => (
            <div
              key={role.id}
              style={{
                textAlign: "center",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 8px",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
                title={role.name}
              >
                {role.name}
              </span>
              {role.is_system_role && (
                <Badge tone="neutral" size="xs">
                  {adminRbacT("admin.roles.system_badge_label", language)}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Permission rows — 1 row per perm. Backend orders perms by group
            + key (Plan 15-06); we render in the API-provided order. */}
        {matrix.permissions.map((perm) => (
          <PermissionRow
            key={perm.id}
            permission={perm}
            roles={matrix.roles}
            cells={matrix.cells}
          />
        ))}
      </div>
    </Card>
  )
}

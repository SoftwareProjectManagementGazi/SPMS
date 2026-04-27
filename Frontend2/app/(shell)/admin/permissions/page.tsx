"use client"

// Phase 14 Plan 14-04 Task 2 — /admin/permissions (İzin Matrisi) sub-route
// page.
//
// RBAC-deferred placeholder per CONTEXT D-A3:
//   - 14×4 disabled toggle matrix (data from Plan 14-01
//     lib/admin/permissions-static.ts).
//   - Page-level AlertBanner explaining v3.0 RBAC defer (UI-SPEC §Surface E
//     row 395).
//   - PermissionMatrixCard ships v3.0 Badge in card header + disabled
//     "Kopyala" button + every toggle disabled with aria-disabled + tooltip.
//
// Multiple defense layers per threat model T-14-04-01 — a future v3.0
// contributor would have to remove ALL of:
//   1. disabled attribute on every <input> (14 × 4 = 56 toggles)
//   2. aria-disabled="true" on every toggle
//   3. tooltip "RBAC altyapısı v3.0 sürümünde gelecek"
//   4. v3.0 Badge in card header
//   5. AlertBanner on this page
//   6. Kopyala disabled state
// before accidentally enabling permission writes.
//
// AdminLayout (Plan 14-02) wraps this page automatically — page header +
// NavTabs strip + admin-only route guard inherited.

import * as React from "react"

import { AlertBanner } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

import { PermissionMatrixCard } from "@/components/admin/permissions/permission-matrix-card"

export default function AdminPermissionsPage() {
  const { language } = useApp()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <AlertBanner tone="info">
        {adminRbacT("admin.permissions.alert_banner_body", language)}
      </AlertBanner>

      <PermissionMatrixCard />
    </div>
  )
}

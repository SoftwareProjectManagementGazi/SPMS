"use client"

// Phase 14 Plan 14-04 (placeholder) → Phase 15 Plan 15-10 (RBAC active)
// — /admin/permissions (İzin Matrisi) sub-route page.
//
// Layer 4 of D-2.7 atomic 7-layer placeholder uplift: AlertBanner copy is
// FLIPPED from the Phase 14 14-04 deferred-warning to an active-state info
// message about auto-save behavior. The i18n key
// `admin.permissions.alert_banner_body` carries the new copy; tone="info"
// is appropriate (informational, not warning).
//
// The 6 placeholder defense layers shipped by Phase 14 14-04 are removed in
// the same atomic commit that ships Plan 15-10:
//   1. permission-row.tsx disabled toggle attrs (general case removed —
//      Admin/Guest retain disabled per D-1.5/D-2.4)
//   2. permission-matrix-card.tsx tooltip with the placeholder text
//   3. permission-matrix-card.tsx Badge in card header
//   4. THIS FILE — AlertBanner content
//   5. permission-matrix-card.tsx Kopyala disabled
//   6. role-card.tsx Guest disabled state (separate route, same atomic
//      commit)
//   7. roles/page.tsx NewRolePlaceholderCard → NewRoleModalTrigger
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

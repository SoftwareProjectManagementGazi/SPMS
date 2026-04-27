"use client"

// Phase 14 Plan 14-02 Task 1 — Admin route layout (D-C2 / D-C3 / D-C4).
//
// Triple-layer admin gate:
//   1. Server-edge cookie check  → Frontend2/middleware.ts (Pitfall 10).
//   2. Client-side role guard    → THIS FILE (Pitfall 3 — isLoading FIRST).
//   3. Backend require_admin     → every admin endpoint (Plan 14-01 router).
//
// Pitfall 3 mitigation: `useAuth()` initializes `user=null, isLoading=true`
// during the auth context's first render. If we evaluated `user.role` first
// we'd bounce a legitimate admin to /dashboard. The effect bails out with
// `if (isLoading) return` — only after hydration completes does the role
// check fire.
//
// Page-header buttons "Rapor al" + "Denetim günlüğü" are STUBS in this plan
// (Plan 14-11 wires them — D-B6). Visible-but-onClick-noops keeps the layout
// pixel-faithful to the prototype while the real handlers ship later.

import * as React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Shield } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import {
  Button,
  DataState,
  NavTabs,
  type NavTabItem,
} from "@/components/primitives"
import { adminT } from "@/lib/i18n/admin-keys"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const { language } = useApp()
  const router = useRouter()
  const pathname = usePathname() ?? "/admin"
  const { showToast } = useToast()

  // Side-effect: redirect on negative auth states. Pitfall 3 — bail FIRST while
  // isLoading so the auth context's initial null user state can't trigger a
  // false-positive redirect for an admin who's mid-hydration.
  useEffect(() => {
    if (isLoading) return // ← Pitfall 3 mitigation lives here.
    if (!user) {
      router.replace(`/auth/login?next=${pathname}`)
      return
    }
    const roleName = user.role?.name?.toLowerCase()
    if (roleName !== "admin") {
      router.replace("/dashboard")
      // Toast contract: variant uses 'error' for the danger tone (Plan 14-01
      // Pitfall 2 — toast primitive doesn't accept tone:; only variant:).
      showToast({
        variant: "error",
        message: adminT("admin.layout.access_denied_toast", language),
      })
    }
  }, [isLoading, user, pathname, router, language, showToast])

  // Render gates — fall through the same priority as the effect.
  if (isLoading) {
    return <DataState loading>{null}</DataState>
  }
  if (!user || user.role?.name?.toLowerCase() !== "admin") {
    // About to redirect — render nothing in the gap between effect & route nav.
    return null
  }

  // Sub-route tabs (D-C2 — exact 8-route shape). Localized labels via the
  // admin-keys.ts barrel; admin-keys handles the TR/EN parity contract.
  const tabs: NavTabItem[] = [
    {
      id: "overview",
      href: "/admin",
      label: adminT("admin.layout.tab_overview", language),
    },
    {
      id: "users",
      href: "/admin/users",
      label: adminT("admin.layout.tab_users", language),
    },
    {
      id: "roles",
      href: "/admin/roles",
      label: adminT("admin.layout.tab_roles", language),
    },
    {
      id: "permissions",
      href: "/admin/permissions",
      label: adminT("admin.layout.tab_permissions", language),
    },
    {
      id: "projects",
      href: "/admin/projects",
      label: adminT("admin.layout.tab_projects", language),
    },
    {
      id: "workflows",
      href: "/admin/workflows",
      label: adminT("admin.layout.tab_workflows", language),
    },
    {
      id: "audit",
      href: "/admin/audit",
      label: adminT("admin.layout.tab_audit", language),
    },
    {
      id: "stats",
      href: "/admin/stats",
      label: adminT("admin.layout.tab_stats", language),
    },
  ]

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* PageHeader — verbatim prototype lines 9-22 (admin.jsx) */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={20} color="var(--primary)" />
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: -0.6,
                margin: 0,
              }}
            >
              {adminT("admin.layout.title", language)}
            </h1>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--fg-muted)",
              marginTop: 4,
            }}
          >
            {adminT("admin.layout.subtitle", language)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* TODO(14-11): wire to admin summary PDF endpoint (D-B6 Rapor al).
              For now: visible-but-onClick-noop keeps the layout pixel-faithful
              to the prototype while the real handler ships in Plan 14-11. */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // Plan 14-11 will wire this to the admin-summary PDF download.
              // eslint-disable-next-line no-console
              console.log("[Plan 14-11 stub] Rapor al — to be wired")
            }}
          >
            {adminT("admin.layout.export", language)}
          </Button>
          {/* TODO(14-11): wire to router.push('/admin/audit') (D-B6 Denetim
              günlüğü — pure client-side push, no new backend). */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // Plan 14-11 will wire this to router.push('/admin/audit').
              // eslint-disable-next-line no-console
              console.log("[Plan 14-11 stub] Denetim günlüğü — to be wired")
            }}
          >
            {adminT("admin.layout.audit_log", language)}
          </Button>
        </div>
      </div>

      {/* NavTabs strip — 8 sub-routes (Pitfall 4 active-detection guard
          baked into the NavTabs primitive itself in Plan 14-01). */}
      <NavTabs tabs={tabs} />

      {/* Sub-route content slot. flex:1 + minHeight:0 so the children
          layout (e.g., the Overview grid) can lay out their own height. */}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  )
}

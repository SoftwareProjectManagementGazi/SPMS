"use client"

// Sidebar: collapsible navigation (232px expanded / 56px collapsed) with logo
// and WORKSPACE + ADMIN sections.
// The collapse toggle lives in the Header (single source of control); this sidebar
// reads `sidebarCollapsed` from useApp() but does not render its own toggle button.
// Ported from New_Frontend/src/shell.jsx (lines 8-155). Prototype RouterContext is fully
// replaced with next/link + usePathname() per D-09. All icons via lucide-react (size={16}).
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
//
// Phase 13 Plan 13-02 (PROF-03 / CONTEXT D-D1): SidebarUserMenu and the
// sidebar footer wrapper that hosted it have been REMOVED. The user menu is
// now header-mounted via <AvatarDropdown/> (Frontend2/components/shell/
// avatar-dropdown.tsx). The sidebar footer area becomes a pure nav region —
// the flex layout flows naturally to the bottom without the footer block.

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react"

import { Badge, Kbd } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { t } from "@/lib/i18n"

// --- SidebarLogo ---------------------------------------------------------

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 14px 14px 16px",
        height: 52,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          // UI-sweep permitted exception: 7px logo radius matches prototype shell.jsx
          // — 1px slightly tighter than --radius-sm(6) since the logo is 26px (the
          // standard 6px radius is tuned for 32-40px controls). Documented here.
          borderRadius: 7,
          background: "var(--primary)",
          color: "var(--primary-fg)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: -0.3,
          boxShadow:
            "inset 0 0 0 1px color-mix(in oklch, var(--primary) 60%, black), 0 1px 2px color-mix(in oklch, var(--primary) 40%, black)",
        }}
      >
        SP
      </div>
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: -0.2 }}>SPMS</div>
          <div
            className="mono"
            style={{ fontSize: 10.5, color: "var(--fg-subtle)", marginTop: 2 }}
          >
            v2.4
          </div>
        </div>
      )}
    </div>
  )
}

// --- NavItem -------------------------------------------------------------

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  collapsed: boolean
  badge?: number | string
  shortcut?: string
}

function NavItem({
  href,
  icon,
  label,
  active,
  collapsed,
  badge,
  shortcut,
}: NavItemProps) {
  // UI-sweep: hover-row utility class replaces imperative onMouseEnter/Leave
  // (now also responds to keyboard :focus-visible). Active items skip the
  // class so the accent background isn't overridden on hover.
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={active ? undefined : "hover-row"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "0 0" : "0 10px",
        height: 30,
        width: "100%",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: "var(--radius-sm)",
        color: active ? "var(--fg)" : "var(--fg-muted)",
        background: active ? "var(--accent)" : "transparent",
        fontWeight: active ? 600 : 400,
        fontSize: 13,
        transition: "background 0.1s, color 0.1s",
        position: "relative",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          color: active ? "var(--primary)" : "var(--fg-subtle)",
          display: "inline-flex",
        }}
      >
        {icon}
      </span>
      {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}
      {!collapsed && badge != null && (
        <Badge size="xs" tone={active ? "primary" : "neutral"}>
          {badge}
        </Badge>
      )}
      {!collapsed && shortcut && <Kbd>{shortcut}</Kbd>}
    </Link>
  )
}

// SidebarUserMenu removed in Plan 13-02 — replaced by AvatarDropdown in
// header.tsx (PROF-03 / CONTEXT D-D1). The Phase 8 placeholder user constant
// was removed alongside it; the real user is read from auth context inside
// the AvatarDropdown.

// --- Sidebar main component ----------------------------------------------

export function Sidebar() {
  const { sidebarCollapsed, language } = useApp()
  const pathname = usePathname() || "/"
  const lang = language

  const items: { href: string; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard size={16} />,
      label: t("nav.dashboard", lang),
      shortcut: "G D",
    },
    {
      href: "/projects",
      icon: <FolderKanban size={16} />,
      label: t("nav.projects", lang),
      shortcut: "G P",
    },
    {
      href: "/my-tasks",
      icon: <CheckSquare size={16} />,
      label: t("nav.myTasks", lang),
      shortcut: "G T",
    },
    {
      href: "/teams",
      icon: <Users size={16} />,
      label: t("nav.teams", lang),
    },
    {
      href: "/reports",
      icon: <BarChart3 size={16} />,
      label: t("nav.reports", lang),
    },
    {
      href: "/settings",
      icon: <Settings size={16} />,
      label: t("nav.settings", lang),
    },
  ]

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (href === "/dashboard" && pathname === "/")

  return (
    <aside
      style={{
        width: sidebarCollapsed ? 56 : 232,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--bg-2)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.18s ease",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <SidebarLogo collapsed={sidebarCollapsed} />
      <div
        style={{
          flex: 1,
          padding: "8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflowY: "auto",
        }}
      >
        {!sidebarCollapsed && (
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "var(--fg-subtle)",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              padding: "12px 10px 6px",
            }}
          >
            {lang === "tr" ? "ÇALIŞMA" : "WORKSPACE"}
          </div>
        )}
        {items.map((it) => (
          <NavItem
            key={it.href}
            href={it.href}
            icon={it.icon}
            label={it.label}
            active={isActive(it.href)}
            collapsed={sidebarCollapsed}
            shortcut={it.shortcut}
          />
        ))}
        {!sidebarCollapsed && (
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "var(--fg-subtle)",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              padding: "12px 10px 6px",
            }}
          >
            {lang === "tr" ? "YÖNETİM" : "ADMIN"}
          </div>
        )}
        {sidebarCollapsed && (
          <div
            style={{ height: 1, background: "var(--border)", margin: "8px 8px" }}
          />
        )}
        <NavItem
          href="/admin"
          icon={<Shield size={16} />}
          label={lang === "tr" ? "Yönetim Paneli" : "Admin Panel"}
          active={isActive("/admin")}
          collapsed={sidebarCollapsed}
        />
      </div>
    </aside>
  )
}

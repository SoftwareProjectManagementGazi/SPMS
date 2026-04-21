"use client"

// Sidebar: collapsible navigation (232px expanded / 56px collapsed) with logo,
// WORKSPACE + ADMIN sections, user menu with click-outside dismiss, and a collapse toggle.
// Ported from New_Frontend/src/shell.jsx (lines 8-155). Prototype RouterContext is fully
// replaced with next/link + usePathname() per D-09. All icons via lucide-react (size={16}).
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

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
  ChevronUp,
  LogOut,
  PanelLeft,
} from "lucide-react"

import { Avatar, Badge, Kbd } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { t, type LangCode } from "@/lib/i18n"

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
            style={{ fontSize: 9.5, color: "var(--fg-subtle)", marginTop: 2 }}
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
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
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
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--surface-2)"
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent"
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

// --- SidebarUserMenu -----------------------------------------------------

// Placeholder user data -- real auth integration in later phases.
const PLACEHOLDER_USER = { name: "User", initials: "U", avColor: 1 } as const

function SidebarUserMenu({
  collapsed,
  lang,
}: {
  collapsed: boolean
  lang: LangCode
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismiss (exact pattern from shell.jsx lines 104-107)
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    fontSize: 12.5,
    textAlign: "left",
    background: "transparent",
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: 0,
          textAlign: "left",
        }}
      >
        <Avatar user={PLACEHOLDER_USER} size={28} />
        {!collapsed && (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {PLACEHOLDER_USER.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-subtle)" }}>Member</div>
          </div>
        )}
        {!collapsed && (
          <ChevronUp size={12} style={{ color: "var(--fg-subtle)" }} />
        )}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: 4,
            background: "var(--surface)",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg)",
            padding: 4,
            border: "1px solid var(--border)",
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setOpen(false)}
            style={menuItemStyle}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {lang === "tr" ? "Profilim" : "My Profile"}
          </button>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            style={{ ...menuItemStyle, textDecoration: "none", color: "inherit" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {lang === "tr" ? "Ayarlar" : "Settings"}
          </Link>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              margin: "4px 0",
            }}
          />
          <button
            onClick={() => setOpen(false)}
            style={{ ...menuItemStyle, color: "var(--priority-critical)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <LogOut size={13} />
            {lang === "tr" ? "Çıkış Yap" : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  )
}

// --- Sidebar main component ----------------------------------------------

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, language } = useApp()
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
    pathname === href || pathname.startsWith(href + "/")

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
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: 8,
          display: "flex",
          justifyContent: sidebarCollapsed ? "center" : "flex-end",
        }}
      >
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={lang === "tr" ? "Kenar çubuğunu daralt/genişlet" : "Toggle sidebar"}
          style={{
            color: "var(--fg-muted)",
            padding: 6,
            borderRadius: 6,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--surface-2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <PanelLeft size={16} />
        </button>
      </div>
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: 10,
        }}
      >
        <SidebarUserMenu collapsed={sidebarCollapsed} lang={lang} />
      </div>
    </aside>
  )
}

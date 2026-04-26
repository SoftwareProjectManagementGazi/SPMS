"use client"

// Phase 14 Plan 14-01 — NavTabs primitive (D-C4).
//
// Link-based tab strip for sub-route navigation (admin tabs). Mirrors the
// existing Tabs primitive's visual API verbatim (PAD_MAP / FONT_MAP / active
// border) but renders each tab as a Next <Link href={tab.href}> instead of a
// click handler.
//
// Active detection (Pitfall 4): when pathname is `/admin/users`, the `/admin`
// (Overview) tab MUST NOT show as active. The special-case guard treats the
// /admin Overview href as active only when no other tab.href is a pathname
// prefix — preventing the substring collision of pathname.startsWith("/admin").

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "./badge"

export interface NavTabItem {
  id: string
  href: string                  // Full path: "/admin", "/admin/users", ...
  label: string
  icon?: React.ReactNode
  badge?: number | string
}

export interface NavTabsProps {
  tabs: NavTabItem[]
  size?: "sm" | "md" | "lg"
}

const PAD_MAP: Record<NonNullable<NavTabsProps["size"]>, string> = {
  sm: "6px 10px",
  md: "8px 14px",
  lg: "10px 16px",
}

const FONT_MAP: Record<NonNullable<NavTabsProps["size"]>, number> = {
  sm: 12,
  md: 13,
  lg: 14,
}

export function NavTabs({ tabs, size = "md" }: NavTabsProps) {
  const pathname = usePathname() ?? ""
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)" }}>
      {tabs.map((tab) => {
        // Active = exact match OR (this is /admin AND pathname is /admin/* with
        // no other tab.href matching as a pathname prefix). The !tabs.some(...)
        // guard prevents the Overview tab from co-activating with a sibling
        // sub-route tab when pathname.startsWith("/admin/...") (Pitfall 4).
        const isActive =
          pathname === tab.href ||
          (tab.href === "/admin" &&
            pathname.startsWith("/admin/") &&
            !tabs.some(
              (t) => t.href !== "/admin" && pathname.startsWith(t.href),
            ))
        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              padding: PAD_MAP[size],
              fontSize: FONT_MAP[size],
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--fg)" : "var(--fg-muted)",
              borderBottom: isActive
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              marginBottom: -1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              transition: "color 0.12s",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && (
              <Badge size="xs" tone={isActive ? "primary" : "neutral"}>
                {tab.badge}
              </Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}

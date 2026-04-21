"use client"

// Breadcrumb: pathname-driven segments rendered with ChevronRight separators.
// Ported from New_Frontend/src/shell.jsx (lines 199-239). Prototype's
// router.page / router.params are replaced with usePathname() from next/navigation (D-09).
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { useApp } from "@/context/app-context"
import { t } from "@/lib/i18n"

interface BreadcrumbPart {
  label: string
  href?: string
}

export function Breadcrumb() {
  const { language } = useApp()
  const pathname = usePathname() || "/"
  const lang = language

  const parts: BreadcrumbPart[] = React.useMemo(() => {
    if (pathname === "/" || pathname === "/dashboard") {
      return [{ label: t("nav.dashboard", lang) }]
    }
    if (pathname === "/projects") {
      return [{ label: t("nav.projects", lang) }]
    }
    if (pathname.startsWith("/projects/")) {
      return [
        { label: t("nav.projects", lang), href: "/projects" },
        { label: "Project" },
      ]
    }
    if (pathname === "/my-tasks") {
      return [{ label: t("nav.myTasks", lang) }]
    }
    if (pathname === "/teams") {
      return [{ label: t("nav.teams", lang) }]
    }
    if (pathname === "/reports") {
      return [{ label: t("nav.reports", lang) }]
    }
    if (pathname === "/settings") {
      return [{ label: t("nav.settings", lang) }]
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return [{ label: t("nav.admin", lang) }]
    }

    // Fallback: capitalize the first pathname segment
    const segments = pathname.split("/").filter(Boolean)
    const first = segments[0] || ""
    return [
      {
        label: first ? first.charAt(0).toUpperCase() + first.slice(1) : "",
      },
    ]
  }, [pathname, lang])

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {parts.map((p, i) => {
        const isLast = i === parts.length - 1
        const textStyle: React.CSSProperties = {
          fontSize: 13,
          fontWeight: isLast ? 600 : 400,
          color: isLast ? "var(--fg)" : "var(--fg-muted)",
          cursor: p.href ? "pointer" : "default",
          textDecoration: "none",
        }
        return (
          <React.Fragment key={`${p.label}-${i}`}>
            {i > 0 && (
              <ChevronRight size={12} style={{ color: "var(--fg-subtle)" }} />
            )}
            {p.href && !isLast ? (
              <Link href={p.href} style={textStyle}>
                {p.label}
              </Link>
            ) : (
              <span style={textStyle}>{p.label}</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

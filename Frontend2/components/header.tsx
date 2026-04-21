"use client"

// Header: app-wide top bar with sidebar toggle, breadcrumb, search input, theme
// mode toggle (Moon/Sun), and language toggle. Ported from New_Frontend/src/shell.jsx
// (lines 157-197). Create/Notifications/Help buttons from the prototype are intentionally
// omitted in Phase 8 -- they will be added back in later phases when their handlers
// (project-create wizard, notification feed, help panel) exist. Keeping only controls
// whose behavior is wired today. Per D-01: no shadcn/ui. Per D-02: prototype token
// names used directly.

import * as React from "react"
import { PanelLeft, Search, Moon, Sun } from "lucide-react"

import { Input } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { t } from "@/lib/i18n"

import { Breadcrumb } from "./breadcrumb"

export function Header() {
  const app = useApp()
  const lang = app.language

  const iconButtonStyle: React.CSSProperties = {
    color: "var(--fg-muted)",
    padding: 6,
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  }

  return (
    <header
      style={{
        height: 52,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <button
        onClick={() => app.setSidebarCollapsed(!app.sidebarCollapsed)}
        title={lang === "tr" ? "Kenar çubuğu" : "Sidebar"}
        aria-label={lang === "tr" ? "Kenar çubuğunu aç/kapat" : "Toggle sidebar"}
        style={iconButtonStyle}
      >
        <PanelLeft size={16} />
      </button>

      <Breadcrumb />

      <div style={{ flex: 1 }} />

      <Input
        icon={<Search size={14} />}
        placeholder={t("common.search", lang)}
        kbdHint="⌘K"
        size="sm"
        style={{ width: 260 }}
      />

      <button
        onClick={() => app.setMode(app.mode === "light" ? "dark" : "light")}
        aria-label={
          app.mode === "light"
            ? lang === "tr"
              ? "Karanlık moda geç"
              : "Switch to dark mode"
            : lang === "tr"
              ? "Aydınlık moda geç"
              : "Switch to light mode"
        }
        title={
          app.mode === "light"
            ? lang === "tr"
              ? "Karanlık moda geç"
              : "Switch to dark mode"
            : lang === "tr"
              ? "Aydınlık moda geç"
              : "Switch to light mode"
        }
        style={iconButtonStyle}
      >
        {app.mode === "light" ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <button
        onClick={() => app.setLanguage(lang === "tr" ? "en" : "tr")}
        title="Language toggle"
        aria-label={lang === "tr" ? "Dili değiştir" : "Change language"}
        style={{
          color: "var(--fg-muted)",
          padding: "4px 8px",
          borderRadius: 6,
          display: "inline-flex",
          alignItems: "center",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        {lang.toUpperCase()}
      </button>
    </header>
  )
}

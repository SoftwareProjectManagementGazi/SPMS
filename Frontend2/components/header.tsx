"use client"

// Header: app-wide top bar with sidebar toggle, breadcrumb, search input, theme
// mode toggle (Moon/Sun), language toggle, and Create project button.
// Ported from New_Frontend/src/shell.jsx (lines 157-197).
// Plan 09: Added Create button (router.push('/projects/new') — deferred from Phase 8 per D-08-04)
// and statusBadge slot for PROJ-02 dynamic project status badge.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"
import { PanelLeft, Search, Moon, Sun, Plus } from "lucide-react"

import { Input, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { t } from "@/lib/i18n"

import { Breadcrumb } from "./breadcrumb"

interface HeaderProps {
  /** Rendered next to breadcrumb — PROJ-02 dynamic status badge from AppShell */
  statusBadge?: React.ReactNode
  /** Called when user clicks "Yeni proje" / "New project" Create button */
  onCreateProject?: () => void
}

export function Header({ statusBadge, onCreateProject }: HeaderProps) {
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

      {/* Breadcrumb + PROJ-02 status badge (badge is null except on /projects/{id}) */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <Breadcrumb />
        {statusBadge}
      </div>

      <div style={{ flex: 1 }} />

      <Input
        icon={<Search size={14} />}
        placeholder={t("common.search", lang)}
        kbdHint="⌘K"
        size="sm"
        style={{ width: 260 }}
      />

      {/* Create project button — wired to /projects/new (deferred from Phase 8, D-08-04) */}
      <Button
        variant="primary"
        size="sm"
        icon={<Plus size={14} />}
        onClick={onCreateProject}
      >
        {lang === "tr" ? "Yeni proje" : "New project"}
      </Button>

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

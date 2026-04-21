"use client"

// Header: app-wide top bar with sidebar toggle, breadcrumb, search input, Create
// button, notifications bell, help, theme mode toggle (Moon/Sun), and language toggle.
// Ported from New_Frontend/src/shell.jsx (lines 157-197). Prototype's
// window.SPMSData.NOTIFICATIONS unread count is deferred (hardcoded 0); real
// notifications wire up in a later phase. Per D-01: no shadcn/ui.
// Per D-02: prototype token names used directly.

import * as React from "react"
import {
  PanelLeft,
  Search,
  Plus,
  Bell,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react"

import { Input, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { t } from "@/lib/i18n"

import { Breadcrumb } from "./breadcrumb"

export function Header() {
  const app = useApp()
  const lang = app.language

  // Notification unread count is hardcoded to 0 for Phase 8; real notification
  // source wires up in a later phase. Bell icon still renders so layout is stable.
  const unread = 0

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

      <Button variant="primary" size="sm" icon={<Plus size={14} />}>
        {t("common.create", lang)}
      </Button>

      <button
        aria-label={t("nav.notifications", lang)}
        title={t("nav.notifications", lang)}
        style={{ ...iconButtonStyle, position: "relative" }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              background: "var(--priority-critical)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              minWidth: 14,
              height: 14,
              padding: "0 3px",
              borderRadius: 7,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 2px var(--bg)",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      <button
        aria-label={lang === "tr" ? "Yardım" : "Help"}
        title={lang === "tr" ? "Yardım" : "Help"}
        style={iconButtonStyle}
      >
        <HelpCircle size={16} />
      </button>

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

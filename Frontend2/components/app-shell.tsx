"use client"

// AppShell: horizontal flex layout frame used by the (shell) route group.
// Composes Sidebar + vertical stack (Header + scrollable main). Exact match to
// New_Frontend/src/app.jsx App component layout (lines 162-169).
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"

import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto" style={{ padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

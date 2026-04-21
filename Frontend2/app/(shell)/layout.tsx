import * as React from "react"

import { AppShell } from "@/components/app-shell"

// Route group layout for the authenticated workspace. The (shell) parentheses
// make this a Next.js route group -- it wraps its descendants in the AppShell
// (Sidebar + Header + scrollable main) without adding a path segment.
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

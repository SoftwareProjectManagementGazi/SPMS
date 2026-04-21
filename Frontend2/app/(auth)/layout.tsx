import * as React from "react"

// Auth route group layout — no AppShell, full-page unauthenticated layout
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { CreateTaskModal } from "./create-task-modal"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onCreateClick={() => setCreateModalOpen(true)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <CreateTaskModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  )
}

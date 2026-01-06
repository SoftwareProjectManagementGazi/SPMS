"use client"

import { AppShell } from "@/components/app-shell"
import { MemberView } from "@/components/dashboard/member-view"

export default function MyTasksPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">View and manage your assigned tasks</p>
        </div>
        <MemberView />
      </div>
    </AppShell>
  )
}

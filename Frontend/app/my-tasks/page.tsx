"use client"

import { AppShell } from "@/components/app-shell"
import { MemberView } from "@/components/dashboard/member-view"

export default function MyTasksPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Görevlerim</h1>
          <p className="text-muted-foreground">Görevlerini Görüntüle ve Yönet</p>
        </div>
        <MemberView />
      </div>
    </AppShell>
  )
}

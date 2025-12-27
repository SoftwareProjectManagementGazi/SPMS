"use client"

import * as React from "react"
import { AppShell } from "@/components/app-shell"
import { ManagerView } from "@/components/dashboard/manager-view"
import { MemberView } from "@/components/dashboard/member-view"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { currentUser } from "@/lib/mock-data"

export default function DashboardPage() {
  const [view, setView] = React.useState<"manager" | "member">(currentUser.role === "manager" ? "manager" : "member")

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {currentUser.name}</p>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as "manager" | "member")}>
            <TabsList>
              <TabsTrigger value="manager">Manager View</TabsTrigger>
              <TabsTrigger value="member">My Work</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {view === "manager" ? <ManagerView /> : <MemberView />}
      </div>
    </AppShell>
  )
}

"use client"

import * as React from "react"
import { AppShell } from "@/components/app-shell"
import { ManagerView } from "@/components/dashboard/manager-view"
import { MemberView } from "@/components/dashboard/member-view"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/services/auth-service" // Mock data yerine service kullanıyoruz
import { User } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [view, setView] = React.useState<"manager" | "member">("member")

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
        
        const roleName = userData.role.name.toLowerCase()
        
        if (roleName === "manager" || roleName === "admin") {
          setView("manager")
        } else {
          setView("member")
        }
      } catch (error) {
        console.error("Kullanıcı bilgileri alınamadı:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (!user) return null // Veya bir hata ekranı

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}</p>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as "manager" | "member")}>
            <TabsList>
              <TabsTrigger value="manager">Management</TabsTrigger>
              <TabsTrigger value="member">My Work</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {view === "manager" ? <ManagerView /> : <MemberView />}
      </div>
    </AppShell>
  )
}
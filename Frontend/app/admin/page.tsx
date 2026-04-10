"use client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ProcessTemplatesTab } from "@/components/admin/process-templates-tab"
import { SystemSettingsTab } from "@/components/admin/system-settings-tab"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const isAdmin = user?.role?.name?.toLowerCase() === "admin"

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Bu sayfaya erisim yetkiniz yok.")
      router.push("/")
    }
  }, [user, isAdmin, router])

  if (!user || !isAdmin) return null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Yonetim Paneli</h1>
        <Badge variant="secondary">Admin</Badge>
      </div>

      <Tabs defaultValue="process-templates">
        <TabsList>
          <TabsTrigger value="process-templates">Surec Sablonlari</TabsTrigger>
          <TabsTrigger value="settings">Sistem Ayarlari</TabsTrigger>
        </TabsList>

        <TabsContent value="process-templates" className="mt-6">
          <ProcessTemplatesTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SystemSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

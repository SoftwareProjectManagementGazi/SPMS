"use client"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { projectService } from "@/services/project-service"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useSystemConfig } from "@/context/system-config-context"
import type { Project } from "@/lib/types"

interface IntegrationSettingsProps {
  project: Project
  onUpdate: () => void
}

type TestStatus = null | "testing" | "success" | "failure"

export function IntegrationSettings({ project, onUpdate }: IntegrationSettingsProps) {
  const queryClient = useQueryClient()
  const { config: sysConfig } = useSystemConfig()
  const integrationsEnabled = sysConfig.integrations_enabled !== "false"

  const existingIntegration = project.process_config?.integrations || {}

  const [platform, setPlatform] = useState<string>(existingIntegration.platform || "")
  const [webhookUrl, setWebhookUrl] = useState<string>(existingIntegration.webhook_url || "")
  const [testStatus, setTestStatus] = useState<TestStatus>(null)

  const hasChanges =
    platform !== (existingIntegration.platform || "") ||
    webhookUrl !== (existingIntegration.webhook_url || "")

  const saveMutation = useMutation({
    mutationFn: () =>
      projectService.update(project.id, {
        process_config: {
          ...project.process_config,
          integrations: {
            platform: platform.toLowerCase(),
            webhook_url: webhookUrl,
          },
        },
      }),
    onSuccess: () => {
      toast.success("Entegrasyon ayarlari kaydedildi.")
      queryClient.invalidateQueries({ queryKey: ["project", project.id] })
      onUpdate()
    },
    onError: () => {
      toast.error("Entegrasyon ayarlari kaydedilemedi. Lutfen tekrar deneyin.")
    },
  })

  async function handleTestConnection() {
    if (!webhookUrl) return
    setTestStatus("testing")
    try {
      const res = await apiClient.post("/api/v1/integrations/test", {
        platform: platform.toLowerCase() || "slack",
        webhook_url: webhookUrl,
      })
      if (res.data?.status === "failure") {
        setTestStatus("failure")
      } else {
        setTestStatus("success")
      }
    } catch {
      setTestStatus("failure")
    }
  }

  if (!integrationsEnabled) {
    return (
      <div className="rounded-md border border-muted p-4 text-sm text-muted-foreground">
        Dis entegrasyonlar yonetici tarafindan devre disi birakilmistir.
      </div>
    )
  }

  const hasExistingIntegration =
    existingIntegration.platform || existingIntegration.webhook_url

  return (
    <div className="space-y-4">
      {!hasExistingIntegration && (
        <p className="text-sm text-muted-foreground">
          Henuz bir entegrasyon yapilandirilmamis. Platform secerek baslayin.
        </p>
      )}

      {/* Platform select */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-32 shrink-0">Platform</Label>
        <Select value={platform} onValueChange={(v) => { setPlatform(v); setTestStatus(null) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Platform secin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slack">Slack</SelectItem>
            <SelectItem value="teams">Microsoft Teams</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Webhook URL */}
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">Webhook URL</Label>
        <Input
          type="text"
          placeholder="https://hooks.slack.com/..."
          value={webhookUrl}
          onChange={(e) => { setWebhookUrl(e.target.value); setTestStatus(null) }}
        />
      </div>

      {/* Test connection */}
      <div className="flex items-center gap-3 mt-2">
        <Button
          variant="outline"
          disabled={!webhookUrl || testStatus === "testing"}
          onClick={handleTestConnection}
        >
          {testStatus === "testing" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Baglantiya Test Et
        </Button>

        {testStatus === "success" && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Baglanti basarili!</span>
          </div>
        )}
        {testStatus === "failure" && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>Baglanti basarisiz. URL'yi kontrol edin.</span>
          </div>
        )}
      </div>

      {/* Save */}
      <Button
        disabled={!hasChanges || saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Entegrasyonu Kaydet
      </Button>
    </div>
  )
}

"use client"
import React, { useEffect, useState } from "react"
import { useSystemConfig } from "@/context/system-config-context"
import { useMutation } from "@tanstack/react-query"
import { adminSettingsService } from "@/services/admin-settings-service"
import { toast } from "sonner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

interface LocalForm {
  default_sprint_duration_days: string
  max_task_limit: string
  default_notification_frequency: string
  primary_brand_color: string
  chart_theme: string
}

export function SystemSettingsTab() {
  const { config, isLoading, refetch } = useSystemConfig()

  const [form, setForm] = useState<LocalForm>({
    default_sprint_duration_days: "",
    max_task_limit: "",
    default_notification_frequency: "instant",
    primary_brand_color: "",
    chart_theme: "default",
  })

  // Sync form when config loads or changes
  useEffect(() => {
    if (!isLoading) {
      setForm({
        default_sprint_duration_days: config.default_sprint_duration_days ?? "14",
        max_task_limit: config.max_task_limit ?? "100",
        default_notification_frequency: config.default_notification_frequency ?? "instant",
        primary_brand_color: config.primary_brand_color ?? "",
        chart_theme: config.chart_theme ?? "default",
      })
    }
  }, [config, isLoading])

  const saveMutation = useMutation({
    mutationFn: (configUpdate: Record<string, string>) =>
      adminSettingsService.update(configUpdate),
    onSuccess: () => {
      toast.success("Ayarlar kaydedildi. Degisiklikler hemen uygulandi.")
      refetch()
    },
    onError: () => {
      toast.error("Ayarlar kaydedilemedi. Lutfen tekrar deneyin.")
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (configUpdate: Record<string, string>) =>
      adminSettingsService.update(configUpdate),
    onSuccess: () => {
      refetch()
    },
    onError: () => {
      toast.error("Ayar guncellenemedi.")
    },
  })

  // Dirty check for system params card
  const isParamsDirty =
    form.default_sprint_duration_days !== (config.default_sprint_duration_days ?? "14") ||
    form.max_task_limit !== (config.max_task_limit ?? "100") ||
    form.default_notification_frequency !== (config.default_notification_frequency ?? "instant")

  // Dirty check for theme card
  const isThemeDirty =
    form.primary_brand_color !== (config.primary_brand_color ?? "") ||
    form.chart_theme !== (config.chart_theme ?? "default")

  function saveParams() {
    saveMutation.mutate({
      default_sprint_duration_days: form.default_sprint_duration_days,
      max_task_limit: form.max_task_limit,
      default_notification_frequency: form.default_notification_frequency,
    })
  }

  function saveTheme() {
    saveMutation.mutate({
      primary_brand_color: form.primary_brand_color,
      chart_theme: form.chart_theme,
    })
  }

  function toggleReporting(checked: boolean) {
    toggleMutation.mutate({ reporting_module_enabled: String(checked) })
  }

  function toggleIntegrations(checked: boolean) {
    toggleMutation.mutate({ integrations_enabled: String(checked) })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const reportingEnabled = config.reporting_module_enabled !== "false"
  const integrationsEnabled = config.integrations_enabled === "true"

  return (
    <div className="space-y-6">
      {/* Card 1: Sistem Parametreleri */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Parametreleri</CardTitle>
          <CardDescription>
            Proje ve gorev yonetimi icin varsayilan degerler.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sprint-duration">Varsayilan Dongu (Sprint) Suresi</Label>
            <div className="flex items-center gap-2">
              <Input
                id="sprint-duration"
                type="number"
                min={1}
                value={form.default_sprint_duration_days}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, default_sprint_duration_days: e.target.value }))
                }
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">gun</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-limit">Maksimum Gorev Siniri</Label>
            <Input
              id="task-limit"
              type="number"
              min={1}
              value={form.max_task_limit}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, max_task_limit: e.target.value }))
              }
              className="w-32"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-freq">Varsayilan Bildirim Frekansi</Label>
            <Select
              value={form.default_notification_frequency}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, default_notification_frequency: value }))
              }
            >
              <SelectTrigger id="notif-freq" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Aninda</SelectItem>
                <SelectItem value="hourly">Saatlik Ozet</SelectItem>
                <SelectItem value="daily">Gunluk Ozet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={saveParams}
              disabled={!isParamsDirty || saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {saveMutation.isPending ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Modul Yonetimi */}
      <Card>
        <CardHeader>
          <CardTitle>Modul Yonetimi</CardTitle>
          <CardDescription>
            Aktif modulleri acip kapatarak sistemi ozellestirin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reporting-toggle">Raporlama Modulu</Label>
              <p className="text-sm text-muted-foreground">
                Kapatildiginda raporlar menu ogesi kaldirilir ve /reports 403 doner.
              </p>
            </div>
            <Switch
              id="reporting-toggle"
              checked={reportingEnabled}
              onCheckedChange={toggleReporting}
              disabled={toggleMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Tema ve Gorunum */}
      <Card>
        <CardHeader>
          <CardTitle>Tema ve Gorunum</CardTitle>
          <CardDescription>
            Degisiklikler aninda uygulanir; yeniden baslatma gerekmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-color">Ana Tema Rengi</Label>
            <div className="flex items-center gap-3">
              <Input
                id="brand-color"
                type="text"
                value={form.primary_brand_color}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, primary_brand_color: e.target.value }))
                }
                placeholder="#6366f1"
                className="w-40"
              />
              <div
                className="h-4 w-4 rounded-full border border-border shrink-0"
                style={{ backgroundColor: form.primary_brand_color || "transparent" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chart-theme">Grafik Temasi</Label>
            <Select
              value={form.chart_theme}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, chart_theme: value }))
              }
            >
              <SelectTrigger id="chart-theme" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Varsayilan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={saveTheme}
              disabled={!isThemeDirty || saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {saveMutation.isPending ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Dis Entegrasyonlar */}
      <Card>
        <CardHeader>
          <CardTitle>Dis Entegrasyonlar</CardTitle>
          <CardDescription>
            Harici sistem baglantilari ve webhook yonetimi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="integrations-toggle">Dis Entegrasyonlar Aktif</Label>
              <p className="text-sm text-muted-foreground">
                Kapatildiginda tum proje duzeyindeki webhook'lar askiya alinir.
              </p>
            </div>
            <Switch
              id="integrations-toggle"
              checked={integrationsEnabled}
              onCheckedChange={toggleIntegrations}
              disabled={toggleMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

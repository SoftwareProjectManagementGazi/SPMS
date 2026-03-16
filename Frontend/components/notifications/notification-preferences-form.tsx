"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { notificationService, type NotificationPreferences } from "@/services/notification-service"

const NOTIFICATION_TYPES = [
  { key: "TASK_ASSIGNED", label: "Görev Atama" },
  { key: "COMMENT_ADDED", label: "Yorum Eklendi" },
  { key: "DEADLINE_APPROACHING", label: "Son Tarih Yaklaşıyor" },
  { key: "STATUS_CHANGE", label: "Durum Değişikliği" },
  { key: "TASK_DELETED", label: "Görev Silindi" },
] as const

const DEADLINE_DAYS_OPTIONS = [1, 2, 3, 7] as const

export function NotificationPreferencesForm() {
  const queryClient = useQueryClient()

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => notificationService.getPreferences(),
  })

  // Local form state — initialised from query data
  const [emailEnabled, setEmailEnabled] = React.useState(true)
  const [deadlineDays, setDeadlineDays] = React.useState(3)
  const [perType, setPerType] = React.useState<
    Record<string, { in_app: boolean; email: boolean }>
  >({})

  // Sync local state when data arrives
  React.useEffect(() => {
    if (!preferences) return
    setEmailEnabled(preferences.email_enabled ?? true)
    setDeadlineDays(preferences.deadline_days ?? 3)
    const initialPerType: Record<string, { in_app: boolean; email: boolean }> = {}
    for (const { key } of NOTIFICATION_TYPES) {
      initialPerType[key] = {
        in_app: preferences.preferences?.[key]?.in_app ?? true,
        email: preferences.preferences?.[key]?.email ?? true,
      }
    }
    setPerType(initialPerType)
  }, [preferences])

  const updateMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      notificationService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] })
      toast("Tercihler kaydedildi")
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      email_enabled: emailEnabled,
      deadline_days: deadlineDays,
      preferences: perType,
    })
  }

  const handlePerTypeToggle = (
    notifKey: string,
    field: "in_app" | "email",
    value: boolean
  ) => {
    setPerType((prev) => ({
      ...prev,
      [notifKey]: {
        ...(prev[notifKey] ?? { in_app: true, email: true }),
        [field]: value,
      },
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Global email toggle */}
      <div>
        <p className="text-sm font-semibold mb-3">E-posta Bildirimleri</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="email-enabled" className="text-sm font-normal">
            Tüm e-posta bildirimlerini etkinleştir
          </Label>
          <Switch
            id="email-enabled"
            checked={emailEnabled}
            onCheckedChange={setEmailEnabled}
          />
        </div>
      </div>

      <Separator />

      {/* Deadline days */}
      <div>
        <p className="text-sm font-semibold mb-3">Son Tarih Uyarısı</p>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">
            Kaç gün önce uyarı alayım?
          </Label>
          <Select
            value={String(deadlineDays)}
            onValueChange={(v) => setDeadlineDays(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEADLINE_DAYS_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} gün
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Per-type toggles */}
      <div>
        <p className="text-sm font-semibold mb-3">Bildirim Türleri</p>
        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-xs text-muted-foreground pb-2">
            <span>Tür</span>
            <span className="text-center">Uygulama içi</span>
            <span className="text-center">E-posta</span>
          </div>

          {NOTIFICATION_TYPES.map(({ key, label }) => {
            const typePrefs = perType[key] ?? { in_app: true, email: true }
            const emailDisabled = !emailEnabled

            return (
              <div
                key={key}
                className="grid grid-cols-[1fr_80px_80px] gap-2 items-center py-2 border-t"
              >
                <span className="text-sm">{label}</span>

                {/* In-app toggle */}
                <div className="flex justify-center">
                  <Switch
                    checked={typePrefs.in_app}
                    onCheckedChange={(v) =>
                      handlePerTypeToggle(key, "in_app", v)
                    }
                  />
                </div>

                {/* Email toggle — visually disabled when global email is off */}
                <div
                  className={`flex justify-center ${
                    emailDisabled ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Switch
                    checked={typePrefs.email}
                    onCheckedChange={(v) =>
                      handlePerTypeToggle(key, "email", v)
                    }
                    disabled={emailDisabled}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  )
}

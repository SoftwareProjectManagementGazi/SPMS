"use client"

import * as React from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { authService } from "@/services/auth-service"
import { AvatarCropDialog } from "@/components/ui/avatar-crop-dialog"
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form"
import type { User } from "@/lib/types"

export default function SettingsPage() {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [originalEmail, setOriginalEmail] = React.useState("")
  const [currentPassword, setCurrentPassword] = React.useState("")

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [formSuccess, setFormSuccess] = React.useState(false)
  const [avatarCacheBust, setAvatarCacheBust] = React.useState(Date.now())
  const [cropFile, setCropFile] = React.useState<File | null>(null)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)

  const showCurrentPassword = email !== originalEmail

  React.useEffect(() => {
    authService
      .getCurrentUser()
      .then((u) => {
        setUser(u)
        setFullName(u.name ?? "")
        setEmail(u.email ?? "")
        setOriginalEmail(u.email ?? "")
      })
      .catch(() => {
        setError("Failed to load profile. Please try again later.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setIsSubmitting(true)
    setFormError(null)
    setFormSuccess(false)
    try {
      const updated = await authService.updateProfile({
        full_name: fullName,
        email: email !== originalEmail ? email : undefined,
        current_password: showCurrentPassword ? currentPassword : undefined,
      })
      setUser(updated)
      setFullName(updated.name ?? "")
      setEmail(updated.email ?? "")
      setOriginalEmail(updated.email ?? "")
      setCurrentPassword("")
      setFormSuccess(true)
      setTimeout(() => setFormSuccess(false), 3000)
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Değişiklikler kaydedilemedi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-selected after cancelling
    e.target.value = ""
    setCropFile(file)
  }

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropFile(null)
    const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" })
    try {
      const updated = await authService.uploadAvatar(file)
      setUser(updated)
      setAvatarCacheBust(Date.now())
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Fotoğraf yüklenemedi.")
    }
  }

  const handleCropCancel = () => setCropFile(null)

  const getAvatarSrc = (): string => {
    const base = user?.avatar || "/placeholder.svg"
    // Append cache-bust only for backend-served images
    if (base.startsWith("http")) return `${base}?t=${avatarCacheBust}`
    return base
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Kişisel bilgilerini güncelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : user ? (
              <>
                {/* Avatar section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getAvatarSrc()} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      Fotoğraf Değiştir
                    </Label>
                    <input
                      ref={avatarInputRef}
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                {/* Name and email fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                    />
                  </div>
                </div>

                {/* Conditional current password field when email changes */}
                {showCurrentPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="current-password">
                      Mevcut Şifre <span className="text-xs text-muted-foreground">(e-posta değişimi için gerekli)</span>
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {/* Feedback messages */}
                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}
                {formSuccess && (
                  <p className="text-sm text-green-600">Değişiklikler kaydedildi.</p>
                )}

                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    "Değişiklikleri Kaydet"
                  )}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Bildirimler</CardTitle>
            <CardDescription>Bildirim tercihlerinizi özelleştirin</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm />
          </CardContent>
        </Card>
      </div>
      {cropFile && (
        <AvatarCropDialog
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </AppShell>
  )
}

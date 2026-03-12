"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/auth-service"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Invalid or missing reset link.
        </div>
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Request a new password reset
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setIsSubmitting(true)
    try {
      await authService.confirmPasswordReset(token!, newPassword)
      setSuccess(true)
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.detail ||
        "This link has expired or has already been used. Request a new password reset."
      setError(serverMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          Password updated successfully! You can now log in.
        </div>
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          {error.includes("expired") || error.includes("already been used") ? (
            <div className="mt-2">
              <Link
                href="/forgot-password"
                className="underline underline-offset-4 hover:text-destructive/80"
              >
                Request a new password reset
              </Link>
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          disabled={isSubmitting}
          className="bg-background h-11"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          disabled={isSubmitting}
          className="bg-background h-11"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Şifreyi Güncelle
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Hero/Visuals */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[80px]" />
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          SPMS
        </div>
        <div className="relative z-10 max-w-md">
          <blockquote className="space-y-4">
            <footer className="text-sm text-zinc-400 font-medium">
              Software Project Management System
            </footer>
          </blockquote>
        </div>
        <div className="relative z-10 text-sm text-zinc-500">
          © 2024 SPMS
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="relative flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-background">
        <div className="mx-auto w-full max-w-[400px] space-y-8">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Yeni Şifre Belirle
            </h1>
            <p className="text-sm text-muted-foreground">
              En az 8 karakter uzunluğunda bir şifre gir.
            </p>
          </div>

          <Suspense fallback={<div className="text-sm text-muted-foreground text-center">Yükleniyor...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/auth-service"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await authService.requestPasswordReset(email)
    } catch {
      // Intentionally ignored — always show generic message to prevent user enumeration
    } finally {
      setIsSubmitting(false)
      setSubmitted(true)
    }
  }

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
              Şifreni Sıfırla
            </h1>
            <p className="text-sm text-muted-foreground">
              E-posta adresini gir, sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                If this email is registered, you&apos;ll receive a reset link shortly.
              </div>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isSubmitting}
                  className="bg-background h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sıfırlama Bağlantısı Gönder
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

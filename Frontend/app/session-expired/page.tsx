"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Clock, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authService } from "@/services/auth-service"

export default function SessionExpiredPage() {
  const router = useRouter()

  // If user somehow arrives here while still authenticated, send them back
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/projects")
    }
  }, [router])

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Hero */}
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
        <div className="relative z-10 text-sm text-zinc-500">© 2024 SPMS</div>
      </div>

      {/* Right Side - Content */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-background">
        <div className="mx-auto w-full max-w-[400px] space-y-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Oturum Süren Doldu
            </h1>
            <p className="text-sm text-muted-foreground">
              Güvenliğin için oturumun otomatik olarak sonlandırıldı. Devam etmek için tekrar giriş yapman gerekiyor.
            </p>
          </div>

          <Button
            asChild
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Tekrar Giriş Yap
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

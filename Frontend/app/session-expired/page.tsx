"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authService } from "@/services/auth-service"

const REDIRECT_AFTER = 3

export default function SessionExpiredPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(REDIRECT_AFTER)

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/projects")
      return
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.replace("/login")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
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

          {/* Hourglass animation */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg
                viewBox="0 0 40 40"
                className="h-10 w-10 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Hourglass outer frame */}
                <path d="M10 4 H30 L20 18 L30 36 H10 L20 22 Z" strokeLinejoin="round" />
                {/* Top sand — shrinking */}
                <clipPath id="top-clip">
                  <rect x="10" y="4" width="20" height="14" />
                </clipPath>
                <path
                  d="M12 6 H28 L20 17 Z"
                  fill="currentColor"
                  stroke="none"
                  style={{ transformOrigin: "20px 6px" }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1 1;1 0"
                    keyTimes="0;1"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>
                {/* Bottom sand — growing */}
                <path
                  d="M12 34 H28 L20 23 Z"
                  fill="currentColor"
                  stroke="none"
                  style={{ transformOrigin: "20px 34px" }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1 0;1 1"
                    keyTimes="0;1"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>
                {/* Falling sand particle */}
                <circle cx="20" cy="18" r="1" fill="currentColor" stroke="none">
                  <animate
                    attributeName="cy"
                    values="18;22"
                    dur="0.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0"
                    dur="0.6s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Oturum Süren Doldu
            </h1>
            <p className="text-sm text-muted-foreground">
              Güvenliğin için oturumun otomatik olarak sonlandırıldı.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {countdown} saniye içinde giriş sayfasına yönlendiriliyorsun...
            </p>
          </div>

          <Button
            onClick={() => router.replace("/login")}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Hemen Giriş Yap
          </Button>
        </div>
      </div>
    </div>
  )
}

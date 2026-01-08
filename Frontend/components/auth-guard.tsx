"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/services/auth-service"
import { Loader2 } from "lucide-react"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Auth kontrolü
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated()
      const isPublicPath = pathname === "/login" || pathname === "/signup"

      if (!isAuthenticated && !isPublicPath) {
        // Giriş yapmamış ve korumalı sayfadaysa -> Login'e at
        setAuthorized(false)
        router.push("/login")
      } else if (isAuthenticated && isPublicPath) {
         // Giriş yapmış ama Login sayfasına girmeye çalışıyorsa -> Dashboard'a at
         setAuthorized(true) // Redirect olana kadar true kalsın
         router.push("/projects") 
      } else {
        // Her şey yolunda
        setAuthorized(true)
      }
    }

    checkAuth()
  }, [router, pathname])

  // Kontrol yapılırken yükleniyor göster (Flash of content'i engeller)
  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
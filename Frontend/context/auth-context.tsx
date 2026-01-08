"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/services/auth-service"
import { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Kullanıcıyı yükle
  const loadUser = async () => {
    setIsLoading(true)
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to load user", error)
      setUser(null)
      authService.logout() // Token geçersizse temizle
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const login = async (token: string) => {
    authService.setToken(token)
    await loadUser()
    router.push("/projects")
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

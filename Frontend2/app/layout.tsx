import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { AppProvider } from "@/context/app-context"
import { AuthProvider } from "@/context/auth-context"

import "./globals.css"

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SPMS",
  description: "Software Project Management System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <AppProvider><AuthProvider>{children}</AuthProvider></AppProvider>
      </body>
    </html>
  )
}

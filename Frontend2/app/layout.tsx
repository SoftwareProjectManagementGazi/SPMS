import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"

import { AppProvider } from "@/context/app-context"

import "./globals.css"

const inter = Inter({
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
      <body className={`${inter.variable} ${geistMono.variable}`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}

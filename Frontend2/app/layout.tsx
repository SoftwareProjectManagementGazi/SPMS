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

// Synchronous theme init: runs before first paint so the browser sees
// data-mode/data-density from localStorage and applies the correct CSS tokens
// immediately. Without this, the page paints in light mode, React hydrates,
// then AppContext's useEffect flips to the user's preference — a visible
// flash for anyone with dark mode stored.
// localStorage values are JSON.stringify'd by AppContext#save, so we parse them.
const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var m=localStorage.getItem('spms.mode');var dn=localStorage.getItem('spms.density');var mode=m?JSON.parse(m):'light';var density=dn?JSON.parse(dn):'cozy';if(mode!=='light'&&mode!=='dark')mode='light';d.setAttribute('data-mode',mode);d.setAttribute('data-density',density);}catch(e){document.documentElement.setAttribute('data-mode','light');document.documentElement.setAttribute('data-density','cozy');}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <noscript>
          <style>{`html:not([data-mode]) body { visibility: visible !important; }`}</style>
        </noscript>
      </head>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <AppProvider><AuthProvider>{children}</AuthProvider></AppProvider>
      </body>
    </html>
  )
}

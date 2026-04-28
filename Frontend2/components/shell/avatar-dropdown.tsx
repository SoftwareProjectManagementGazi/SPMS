"use client"

// AvatarDropdown — header-mounted user menu (Phase 13 Plan 13-02 — PROF-03).
//
// REPLACES Phase 8 D-04 SidebarUserMenu (`Frontend2/components/sidebar.tsx`
// lines 149-289). Mounted in `Frontend2/components/header.tsx` between the
// language toggle and the closing </header>. The sidebar footer wrapper is
// removed in the same plan — sidebar becomes pure nav per CONTEXT D-D1.
//
// Surface:
//  - Trigger: 28px Avatar (initials derived from useAuth().user.name).
//  - Menu (260px, anchored top-right): MiniProfileHeader (32px Avatar +
//    name + role badge + email) + 5 menu items separated by hr lines.
//  - 5 items (CONTEXT D-D2): Profilim → /users/{id}, Ayarlar → /settings,
//    Yönetim Paneli → /admin (admin-only), Dil submenu (TR/EN inline radio),
//    Çıkış Yap → useAuth().logout() + router.push('/login') (Plan 14-18
//    Cluster F UAT Test 4 side-finding fix — the original D-D3 destination
//    /auth/login was NEVER backed by a real page; the auth route group has
//    only forgot-password / login / session-expired. Sending users to
//    /auth/login produced a 404 on every logout. The real route is /login
//    (Frontend2/app/(auth)/login/page.tsx).
//
// A11y (CONTEXT D-D7..D-D8):
//  - Trigger: aria-haspopup="menu", aria-expanded, aria-controls, aria-label.
//  - Menu container: role="menu", aria-orientation="vertical".
//  - Items: role="menuitem"; submenu options: role="menuitemradio".
//
// Dismiss (3-way per D-D7):
//  1. mousedown click-outside — exact pattern from SidebarUserMenu (Phase 8 D-04).
//  2. Escape keydown — closes the menu (and any open Dil submenu).
//  3. Pathname change via usePathname() effect — Next.js 16 removed
//     useRouter().events; the pathname effect is the canonical replacement
//     (RESEARCH §Pitfall 6, Phase 12 D-09 safePush precedent).
//
// Initials utility lifted into Frontend2/lib/initials.ts in this plan
// (third consumer beyond activity-feed; see "Don't Hand-Roll" table).

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LogOut,
  Settings,
  Shield,
  Globe,
  ChevronRight,
  Check,
  User,
} from "lucide-react"

import { Avatar, Badge } from "@/components/primitives"
import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"
import { getInitials } from "@/lib/initials"

export function AvatarDropdown() {
  const [open, setOpen] = React.useState(false)
  const [dilOpen, setDilOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)
  const { user, logout } = useAuth()
  const { language, setLanguage } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // Role check — case-insensitive (D-A10 / Plan 13-02 Test 5). Tolerates
  // both shape variants: `{ id, name }` object (auth-service canonical) and
  // a plain string fallback if a future seed regresses to a string role.
  const roleName =
    (typeof (user as { role?: unknown })?.role === "string"
      ? ((user as unknown as { role: string }).role)
      : (user as unknown as { role?: { name?: string } } | null)?.role?.name) || ""
  const isAdmin = roleName.toLowerCase() === "admin"

  // 1. Click-outside (mousedown) — Phase 8 D-04 verbatim.
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setDilOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // 2. Escape keydown.
  React.useEffect(() => {
    if (!open) return
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setDilOpen(false)
      }
    }
    document.addEventListener("keydown", escHandler)
    return () => document.removeEventListener("keydown", escHandler)
  }, [open])

  // 2b. ArrowDown / ArrowUp / Home / End keyboard navigation between menu items
  //     (Plan 13-09 D-G2 a11y polish — UI-SPEC §A.4 dropdown keyboard nav).
  //     Walks role="menuitem" + role="menuitemradio" elements in DOM order;
  //     wraps from last → first on ArrowDown and first → last on ArrowUp.
  //     Home / End jump to the first / last item respectively. preventDefault
  //     on the matched key so page scroll doesn't fire while the menu is open.
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (
        e.key !== "ArrowDown" &&
        e.key !== "ArrowUp" &&
        e.key !== "Home" &&
        e.key !== "End"
      ) {
        return
      }
      if (!ref.current) return
      const items = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"], [role="menuitemradio"]',
        ),
      )
      if (items.length === 0) return
      const active = document.activeElement as HTMLElement | null
      const idx = active ? items.indexOf(active) : -1
      let nextIdx = idx
      if (e.key === "ArrowDown") nextIdx = idx >= items.length - 1 ? 0 : idx + 1
      else if (e.key === "ArrowUp") nextIdx = idx <= 0 ? items.length - 1 : idx - 1
      else if (e.key === "Home") nextIdx = 0
      else if (e.key === "End") nextIdx = items.length - 1
      items[nextIdx]?.focus()
      e.preventDefault()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  // 3. Pathname change (Next.js 16 — RESEARCH §Pitfall 6 — usePathname effect;
  //    the legacy useRouter route-events API was removed in Next 16, so the
  //    pathname dependency is the canonical replacement). Closes the menu
  //    whenever the pathname changes — clicking a menu item that navigates
  //    also dismisses the menu.
  React.useEffect(() => {
    setOpen(false)
    setDilOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!user) return null

  // AuthUser shape (services/auth-service.ts):
  //  - `id: string`, `name: string`, `email: string`, `role: { name: string }`.
  // We deliberately read defensively in case a future server response slips
  // a number id or a missing name through.
  const userId = (user as { id?: string | number }).id ?? ""
  const userName = (user as { name?: string; full_name?: string }).name
    ?? (user as { full_name?: string }).full_name
    ?? user.email
    ?? ""

  const initials = getInitials(userName || user.email || "")
  const numericIdSeed = Number(userId) || (userName.length || 1)
  const avColor = (numericIdSeed % 8) + 1
  const triggerUser = { initials, avColor }
  const headerUser = { initials, avColor }

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "6px 10px",
    borderRadius: "var(--radius-sm)",
    fontSize: 12.5,
    textAlign: "left",
    background: "transparent",
    color: "inherit",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
  }

  const handleLogout = () => {
    setOpen(false)
    setDilOpen(false)
    logout()
    // Plan 14-18 (Cluster F UAT Test 4 side-finding): /auth/login was 404 —
    // the (auth) route group has /login at its root, not /auth/login. The
    // anonymous-redirect target in admin/layout.tsx is also /login (with
    // ?from=) so logout + admin-bounce share a single landing page.
    router.push("/login")
  }

  const handleNav = (href: string) => () => {
    setOpen(false)
    setDilOpen(false)
    router.push(href)
  }

  // Role badge tone — D-D5 + UI-SPEC §A.4 mapping.
  const roleNameLower = roleName.toLowerCase()
  const roleTone: "danger" | "info" | "neutral" = isAdmin
    ? "danger"
    : roleNameLower.includes("project manager") || roleNameLower.includes("manager")
      ? "info"
      : "neutral"

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="avatar-dropdown-menu"
        aria-label={T("Hesap menüsü", "Account menu")}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: "50%",
          display: "inline-flex",
        }}
      >
        <Avatar user={triggerUser} size={28} />
      </button>
      {open && (
        <div
          role="menu"
          id="avatar-dropdown-menu"
          aria-orientation="vertical"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 260,
            padding: 4,
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border)",
            zIndex: 100,
          }}
        >
          {/* MiniProfileHeader — UI-SPEC §A.1 */}
          <div
            style={{
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Avatar user={headerUser} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userName}
                </div>
                {roleName && (
                  <Badge size="xs" tone={roleTone}>
                    {roleName}
                  </Badge>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              margin: "4px 0",
            }}
          />
          {/* Profilim */}
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            className="hover-row"
            style={menuItemStyle}
            onClick={handleNav(`/users/${userId}`)}
          >
            <User size={13} />
            {T("Profilim", "My Profile")}
          </button>
          {/* Ayarlar */}
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            className="hover-row"
            style={menuItemStyle}
            onClick={handleNav("/settings")}
          >
            <Settings size={13} />
            {T("Ayarlar", "Settings")}
          </button>
          {/* Yönetim Paneli — admin only (D-D2) */}
          {isAdmin && (
            <button
              type="button"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              className="hover-row"
              style={menuItemStyle}
              onClick={handleNav("/admin")}
            >
              <Shield size={13} />
              {T("Yönetim Paneli", "Admin Panel")}
            </button>
          )}
          {/* Dil submenu trigger (in-place expand, not flyout) */}
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            aria-haspopup="true"
            aria-expanded={dilOpen}
            className="hover-row"
            style={menuItemStyle}
            onClick={() => setDilOpen(!dilOpen)}
          >
            <Globe size={13} />
            <span style={{ flex: 1 }}>{T("Dil", "Language")}</span>
            <ChevronRight
              size={12}
              style={{
                transform: dilOpen ? "rotate(90deg)" : "none",
                transition: "transform 150ms ease",
              }}
            />
          </button>
          {dilOpen && (
            <div style={{ padding: "2px 0 2px 24px" }}>
              {(["tr", "en"] as const).map((code) => (
                <button
                  type="button"
                  key={code}
                  role="menuitemradio"
                  aria-checked={language === code}
                  className="hover-row"
                  style={{
                    ...menuItemStyle,
                    background:
                      language === code ? "var(--accent)" : "transparent",
                    color:
                      language === code ? "var(--accent-fg)" : "inherit",
                  }}
                  onClick={() => {
                    setLanguage(code)
                    setDilOpen(false)
                    // Main menu intentionally stays open so users can confirm
                    // the language switch took effect (CONTEXT must_haves).
                  }}
                >
                  {language === code && <Check size={12} />}
                  <span
                    style={{
                      flex: 1,
                      marginLeft: language === code ? 0 : 16,
                    }}
                  >
                    {code === "tr" ? T("Türkçe", "Turkish") : T("İngilizce", "English")}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              margin: "4px 0",
            }}
          />
          {/* Çıkış Yap — Plan 14-18 (Cluster F): /login (real route);
              the original D-D3 target /auth/login was 404. */}
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            className="hover-row"
            style={{ ...menuItemStyle, color: "var(--priority-critical)" }}
            onClick={handleLogout}
          >
            <LogOut size={13} />
            {T("Çıkış Yap", "Sign Out")}
          </button>
        </div>
      )}
    </div>
  )
}

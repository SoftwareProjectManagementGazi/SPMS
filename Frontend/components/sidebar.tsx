"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { currentUser } from "@/lib/mock-data"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/my-tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">SP</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">SPMS</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className={cn("h-8 w-8", collapsed && "mx-auto")}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border p-3", collapsed ? "flex justify-center" : "")}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
            <AvatarFallback>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</span>
              <span className="text-xs text-sidebar-foreground/60">
                {currentUser.role === "manager" ? "Manager" : "Member"}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

"use client"
import { Search, Plus, Bell, HelpCircle, LogOut, User as UserIcon, Settings, CreditCard, Users, Keyboard, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { useEffect, useState } from "react" // Kaldırıldı
// import { User } from "@/lib/types" // Kaldırıldı
// import { authService } from "@/services/auth-service" // Kaldırıldı
import { useAuth } from "@/context/auth-context" // EKLENDİ
import { useRouter } from "next/navigation"

interface HeaderProps {
  onCreateClick: () => void
}

export function Header({ onCreateClick }: HeaderProps) {
  // ÖNCE:
  // const [user, setUser] = useState<User | null>(null)
  // useEffect(() => { ...fetchUser... }, [])

  // ŞİMDİ: Merkezi state'i kullan
  const { user, logout } = useAuth() 
  const router = useRouter()

  const handleLogout = () => {
    // authService.logout() // YERİNE:
    logout() // Context'teki logout'u çağır (state'i sıfırlar ve login'e atar)
    // router.push("/login") // logout() fonksiyonu içinde zaten redirect varsa buna gerek yok, ama AuthContext'inizde var.
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
       {/* ... Diğer kısımlar aynı ... */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tasks, projects, logs..." className="pl-10 bg-secondary border-0" />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Create
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            3
          </Badge>
        </Button>

        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {/* user? ifadesi context'ten gelen veriyi kullanır */}
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            {/* ... Menü öğeleri aynı ... */}
             <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
               {/* ... */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
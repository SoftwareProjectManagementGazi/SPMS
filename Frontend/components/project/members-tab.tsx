"use client"

import * as React from "react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Loader2, Search, UserPlus, UserMinus, Filter } from "lucide-react"
import { projectService } from "@/services/project-service"
import { teamService } from "@/services/team-service"
import { resolveAvatarUrl } from "@/services/auth-service"
import type { User } from "@/lib/types"

interface MembersTabProps {
  projectId: string
  currentUser: User | null
}

export function MembersTab({ projectId, currentUser }: MembersTabProps) {
  const queryClient = useQueryClient()
  const isManagerOrAdmin =
    currentUser?.role?.name === "Manager" || currentUser?.role?.name === "Admin"

  // ── member list ─────────────────────────────────────────────────────────────
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => projectService.getMembers(projectId),
  })

  // ── filters for current member list ─────────────────────────────────────────
  const [memberSearch, setMemberSearch] = React.useState("")
  const [roleFilters, setRoleFilters] = React.useState<string[]>([])

  const roleOptions = React.useMemo(
    () => Array.from(new Set(members.map((m) => m.role_name).filter(Boolean))).sort(),
    [members]
  )

  const filteredMembers = React.useMemo(() => {
    let list = members
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase()
      list = list.filter((m) => m.full_name.toLowerCase().includes(q))
    }
    if (roleFilters.length) {
      list = list.filter((m) => roleFilters.includes(m.role_name))
    }
    return list
  }, [members, memberSearch, roleFilters])

  // ── add member – debounced user search ──────────────────────────────────────
  const [addSearch, setAddSearch] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<{ id: number; full_name: string; email: string; avatar?: string }[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const searchDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const memberIdSet = React.useMemo(() => new Set(members.map((m) => m.id)), [members])

  const handleAddSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setAddSearch(q)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (q.length < 2) { setSearchResults([]); return }
    setIsSearching(true)
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await teamService.searchUsers(q)
        setSearchResults(
          results
            .filter((u) => !memberIdSet.has(u.id))
            .map((u) => ({ id: u.id, full_name: u.full_name, email: u.email, avatar: u.avatar }))
        )
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }

  // ── mutations ────────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (userId: number) => projectService.addMember(projectId, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] })
      setAddSearch("")
      setSearchResults([])
      toast.success("Member added")
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to add member"),
  })

  const [removeTarget, setRemoveTarget] = React.useState<{ id: number; name: string } | null>(null)
  const removeMutation = useMutation({
    mutationFn: (userId: number) => projectService.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks-paginated", projectId] })
      setRemoveTarget(null)
      toast.success("Member removed")
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to remove member"),
  })

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0] ?? "").join("").toUpperCase().slice(0, 2) || "?"

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 space-y-5">

      {/* ── Add member section (managers/admins only) ─────────────────────── */}
      {isManagerOrAdmin && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add member
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search by name or email (min 2 chars)…"
              value={addSearch}
              onChange={handleAddSearchChange}
            />
          </div>

          {isSearching && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching…
            </p>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="rounded-md border divide-y">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={resolveAvatarUrl(u.avatar)} />
                    <AvatarFallback className="text-xs">{getInitials(u.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addMutation.mutate(u.id)}
                    disabled={addMutation.isPending}
                  >
                    {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!isSearching && addSearch.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found matching "{addSearch}".</p>
          )}
        </div>
      )}

      {/* ── Filter bar for current members ───────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Filter members…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
        </div>

        {roleOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Role
                {roleFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                    {roleFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {roleOptions.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role}
                  checked={roleFilters.includes(role)}
                  onCheckedChange={() =>
                    setRoleFilters((prev) =>
                      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
                    )
                  }
                >
                  {role}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {(memberSearch || roleFilters.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setMemberSearch(""); setRoleFilters([]) }}
          >
            Clear
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredMembers.length} / {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Member list ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
        </div>
      ) : filteredMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          {members.length === 0 ? "No members yet." : "No members match your filters."}
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden divide-y">
          {filteredMembers.map((member) => {
            const isSelf = String(member.id) === currentUser?.id
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/40 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={resolveAvatarUrl(member.avatar_path)} />
                  <AvatarFallback className="text-sm">{getInitials(member.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">{member.full_name}</p>
                  {member.role_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{member.role_name}</p>
                  )}
                </div>
                {isSelf && (
                  <Badge variant="secondary" className="text-xs shrink-0">You</Badge>
                )}
                {isManagerOrAdmin && !isSelf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => setRemoveTarget({ id: member.id, name: member.full_name })}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
        title="Remove member"
        description={
          removeTarget
            ? `Remove ${removeTarget.name} from this project? Their incomplete tasks will be unassigned.`
            : "Remove this member from the project?"
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => { if (removeTarget) removeMutation.mutate(removeTarget.id) }}
      />
    </div>
  )
}

"use client"

import * as React from "react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { UserPlus } from "lucide-react"
import { projectService } from "@/services/project-service"
import { userService } from "@/services/user-service"
import type { User } from "@/lib/types"

interface MembersTabProps {
  projectId: string
  currentUser: User | null
}

export function MembersTab({ projectId, currentUser }: MembersTabProps) {
  const queryClient = useQueryClient()
  const isManagerOrAdmin =
    currentUser?.role?.name === "Manager" || currentUser?.role?.name === "Admin"

  const [removeTarget, setRemoveTarget] = React.useState<number | null>(null)
  const [addUserOpen, setAddUserOpen] = React.useState(false)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => projectService.getMembers(projectId),
  })

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
    enabled: isManagerOrAdmin,
  })

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) => projectService.addMember(projectId, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] })
      setAddUserOpen(false)
      toast.success("Member added")
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to add member"),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => projectService.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
      setRemoveTarget(null)
      toast.success("Member removed")
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to remove member"),
  })

  const memberIds = new Set(members.map((m) => m.id))

  return (
    <div className="space-y-4">
      {isManagerOrAdmin && (
        <div className="flex gap-2">
          <Popover open={addUserOpen} onOpenChange={setAddUserOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add member
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64" align="start">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {allUsers
                      .filter((u) => !memberIds.has(Number(u.id)))
                      .map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.name}
                          onSelect={() => addMemberMutation.mutate(Number(u.id))}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {u.name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 py-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar_path ?? undefined} />
                <AvatarFallback>{member.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{member.full_name}</p>
                <p className="text-xs text-muted-foreground">{member.role_name}</p>
              </div>
              {isManagerOrAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRemoveTarget(member.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
        title="Remove member"
        description="This will unassign their incomplete tasks in this project."
        confirmLabel="Remove"
        destructive
        onConfirm={() => { if (removeTarget !== null) removeMemberMutation.mutate(removeTarget) }}
      />
    </div>
  )
}

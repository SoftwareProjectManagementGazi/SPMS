"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Loader2, AlertCircle, UserMinus, UserPlus, ArrowLeft } from "lucide-react"
import { teamService, Team, TeamMember } from "@/services/team-service"
import { useAuth } from "@/context/auth-context"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const teamId = parseInt(params.id as string, 10)

  const [team, setTeam] = React.useState<Team | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Add member search state
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<TeamMember[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [addingUserId, setAddingUserId] = React.useState<number | null>(null)

  // Remove member confirm dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false)
  const [memberToRemove, setMemberToRemove] = React.useState<TeamMember | null>(null)
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Debounce timer ref
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    loadTeam()
  }, [teamId])

  const loadTeam = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const teams = await teamService.listMyTeams()
      const found = teams.find((t) => t.id === teamId)
      if (!found) {
        setError("Team not found or you do not have access.")
      } else {
        setTeam(found)
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load team")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await teamService.searchUsers(q)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const handleAddMember = async (member: TeamMember) => {
    setAddingUserId(member.id)
    try {
      await teamService.addMember(teamId, member.id)
      // Refresh team data
      await loadTeam()
      setSearchQuery("")
      setSearchResults([])
    } catch (err) {
      console.error("Failed to add member", err)
    } finally {
      setAddingUserId(null)
    }
  }

  const handleRemoveClick = (member: TeamMember) => {
    setMemberToRemove(member)
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return
    setIsRemoving(true)
    try {
      await teamService.removeMember(teamId, memberToRemove.id)
      setRemoveDialogOpen(false)
      setMemberToRemove(null)
      await loadTeam()
    } catch (err) {
      console.error("Failed to remove member", err)
    } finally {
      setIsRemoving(false)
    }
  }

  const isOwner = user && team ? parseInt(user.id, 10) === team.owner_id : false

  // Filter out already-added members from search results
  const filteredResults = searchResults.filter(
    (r) => !team?.members.some((m) => m.id === r.id)
  )

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (error || !team) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto space-y-4 p-6">
          <Button variant="ghost" onClick={() => router.push("/teams")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Team not found"}</AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" onClick={() => router.push("/teams")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          {team.description && (
            <p className="text-muted-foreground mt-1">{team.description}</p>
          )}
        </div>

        {/* Members Section */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({team.members.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <ul className="space-y-2">
                {team.members.map((member) => {
                  const isTeamOwner = member.id === team.owner_id
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member.avatar || "/placeholder-user.jpg"}
                            alt={member.full_name}
                          />
                          <AvatarFallback>
                            {member.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.full_name}
                            {isTeamOwner && (
                              <span className="ml-2 text-xs text-muted-foreground font-normal">
                                (Owner)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      {isOwner && !isTeamOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveClick(member)}
                        >
                          <UserMinus className="h-4 w-4" />
                          <span className="ml-1">Remove</span>
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Add Member Section (owner only) */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name or email (min 2 characters)..."
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {filteredResults.length > 0 && (
                <ul className="border rounded-md divide-y">
                  {filteredResults.map((result) => (
                    <li
                      key={result.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={result.avatar || "/placeholder-user.jpg"}
                            alt={result.full_name}
                          />
                          <AvatarFallback>
                            {result.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{result.full_name}</p>
                          <p className="text-xs text-muted-foreground">{result.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(result)}
                        disabled={addingUserId === result.id}
                      >
                        {addingUserId === result.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {searchQuery.length >= 2 && !isSearching && filteredResults.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No users found matching &quot;{searchQuery}&quot;.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Remove Member ConfirmDialog */}
        <ConfirmDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          title="Remove Team Member"
          description={
            memberToRemove
              ? `Are you sure you want to remove ${memberToRemove.full_name} from this team?`
              : "Are you sure you want to remove this member?"
          }
          confirmLabel={isRemoving ? "Removing..." : "Remove"}
          onConfirm={handleRemoveConfirm}
          destructive={true}
        />
      </div>
    </AppShell>
  )
}

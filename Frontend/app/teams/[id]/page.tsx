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

  // All users fetched once for client-side search — no per-keystroke requests
  const [allUsers, setAllUsers] = React.useState<TeamMember[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [addingUserId, setAddingUserId] = React.useState<number | null>(null)

  // Remove member confirm dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false)
  const [memberToRemove, setMemberToRemove] = React.useState<TeamMember | null>(null)
  const [isRemoving, setIsRemoving] = React.useState(false)

  React.useEffect(() => {
    loadTeam()
  }, [teamId])

  const loadTeam = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await teamService.getTeam(teamId)
      setTeam(data)
    } catch (err) {
      setError((err as Error).message || "Takım yüklenemedi.")
    } finally {
      setIsLoading(false)
    }
  }

  const isOwner = user && team ? parseInt(user.id, 10) === team.owner_id : false

  // Load all users once when the owner's add-member card becomes visible
  React.useEffect(() => {
    if (!isOwner || allUsers.length > 0) return
    teamService.getAllUsers().then(setAllUsers).catch(() => {})
  }, [isOwner])

  // Client-side filtering — instant, no network cost per keystroke
  const searchResults = React.useMemo(() => {
    if (searchQuery.length < 2 || !team) return []
    const q = searchQuery.toLowerCase()
    return allUsers.filter(
      (u) =>
        !team.members.some((m) => m.id === u.id) &&
        ((u.full_name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
  }, [searchQuery, allUsers, team])

  const handleAddMember = async (member: TeamMember) => {
    setAddingUserId(member.id)
    try {
      await teamService.addMember(teamId, member.id)
      await loadTeam()
      setSearchQuery("")
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

  const getInitials = (name: string) =>
    (name ?? "")
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase() || "?"

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
            Takımlara Dön
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error || "Takım bulunamadı."}</AlertDescription>
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
            Takımlara Dön
          </Button>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          {team.description && (
            <p className="text-muted-foreground mt-1">{team.description}</p>
          )}
        </div>

        {/* Members Section */}
        <Card>
          <CardHeader>
            <CardTitle>Üyeler ({team.members.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz üye yok.</p>
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
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.full_name} />
                          <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.full_name}
                            {isTeamOwner && (
                              <span className="ml-2 text-xs text-muted-foreground font-normal">(Sahip)</span>
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
                          <span className="ml-1">Çıkar</span>
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
                Üye Ekle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İsim veya e-posta ile ara (en az 2 karakter)..."
              />

              {searchResults.length > 0 && (
                <ul className="border rounded-md divide-y">
                  {searchResults.map((result) => (
                    <li
                      key={result.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={result.avatar || "/placeholder.svg"} alt={result.full_name} />
                          <AvatarFallback>{getInitials(result.full_name)}</AvatarFallback>
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
                          "Ekle"
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  &quot;{searchQuery}&quot; ile eşleşen kullanıcı bulunamadı.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Remove Member ConfirmDialog */}
        <ConfirmDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          title="Üyeyi Çıkar"
          description={
            memberToRemove
              ? `${memberToRemove.full_name} adlı üyeyi takımdan çıkarmak istediğinizden emin misiniz?`
              : "Bu üyeyi takımdan çıkarmak istediğinizden emin misiniz?"
          }
          confirmLabel={isRemoving ? "Çıkarılıyor..." : "Çıkar"}
          onConfirm={handleRemoveConfirm}
          destructive={true}
        />
      </div>
    </AppShell>
  )
}

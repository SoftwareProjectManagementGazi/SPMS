"use client"

import * as React from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Users, Plus, X } from "lucide-react"
import { teamService, Team } from "@/services/team-service"

export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [createName, setCreateName] = React.useState("")
  const [createDescription, setCreateDescription] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await teamService.listMyTeams()
      setTeams(data)
    } catch (err) {
      setError((err as Error).message || "Failed to load teams")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return
    setIsCreating(true)
    setCreateError(null)
    try {
      const newTeam = await teamService.createTeam({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      })
      setTeams((prev) => [...prev, newTeam])
      setCreateName("")
      setCreateDescription("")
      setShowCreateForm(false)
    } catch (err) {
      setCreateError((err as Error).message || "Failed to create team")
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Could not load teams. Please try again later.
              <br />
              <span className="text-xs opacity-70">{error}</span>
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-muted-foreground">
              Manage your teams and collaborate with members.
            </p>
          </div>
          <Button onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </>
            )}
          </Button>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create a New Team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enter team name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (optional)</Label>
                  <Input
                    id="team-description"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="What is this team for?"
                  />
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating || !createName.trim()}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Team"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setCreateName("")
                      setCreateDescription("")
                      setCreateError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {teams.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No teams yet</CardTitle>
              <CardDescription>
                You&apos;re not in any teams yet. Create your first team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <Link href={`/teams/${team.id}`} key={team.id} className="block group">
                <Card className="shadow-sm group-hover:shadow-md transition-shadow h-full cursor-pointer border-l-4 border-l-primary/0 group-hover:border-l-primary/100">
                  <CardHeader className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {team.name}
                        </CardTitle>
                        {team.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {team.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

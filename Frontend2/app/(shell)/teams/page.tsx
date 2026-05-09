"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Users, X, Loader2 } from "lucide-react"
import { useApp } from "@/context/app-context"
import { Button } from "@/components/primitives/button"
import { Input } from "@/components/primitives/input"
import { DataState } from "@/components/primitives/data-state"
import { teamService, type Team } from "@/services/team-service"

function getInitials(name: string): string {
  return (name ?? "")
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"
}

export default function TeamsPage() {
  const { language: lang } = useApp()
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const [teams, setTeams] = React.useState<Team[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [createName, setCreateName] = React.useState("")
  const [createDescription, setCreateDescription] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const loadTeams = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await teamService.listMyTeams()
      setTeams(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTeams()
  }, [loadTeams])

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
      setCreateError((err as Error).message || T("Takım oluşturulamadı.", "Failed to create team."))
    } finally {
      setIsCreating(false)
    }
  }

  const cancelCreate = () => {
    setShowCreateForm(false)
    setCreateName("")
    setCreateDescription("")
    setCreateError(null)
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
            {T("Takımlar", "Teams")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4, margin: "4px 0 0" }}>
            {T("Takımlarını yönet ve üyelerle iş birliği yap.", "Manage your teams and collaborate with members.")}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={showCreateForm ? <X size={14} /> : <Plus size={14} />}
          onClick={() => (showCreateForm ? cancelCreate() : setShowCreateForm(true))}
        >
          {showCreateForm ? T("İptal", "Cancel") : T("Takım Oluştur", "Create Team")}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            padding: 20,
            marginBottom: 20,
            background: "var(--surface)",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>
            {T("Yeni Takım Oluştur", "Create a New Team")}
          </p>
          <form onSubmit={handleCreateTeam}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-muted)", display: "block", marginBottom: 6 }}>
                {T("Takım Adı", "Team Name")} *
              </label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={T("Takım adını girin", "Enter team name")}
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-muted)", display: "block", marginBottom: 6 }}>
                {T("Açıklama (isteğe bağlı)", "Description (optional)")}
              </label>
              <Input
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder={T("Bu takım ne için?", "What is this team for?")}
              />
            </div>
            {createError && (
              <p style={{ fontSize: 12, color: "var(--danger, #e53e3e)", marginBottom: 12 }}>
                {createError}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isCreating || !createName.trim()}
                icon={isCreating ? <Loader2 size={13} className="animate-spin" /> : undefined}
              >
                {isCreating ? T("Oluşturuluyor…", "Creating…") : T("Oluştur", "Create")}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={cancelCreate}>
                {T("İptal", "Cancel")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <DataState
        loading={isLoading}
        error={error}
        onRetry={loadTeams}
        empty={!isLoading && teams.length === 0}
        emptyFallback={
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md, 8px)",
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--surface)",
            }}
          >
            <Users size={36} color="var(--fg-muted)" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>
              {T("Henüz takım yok", "No teams yet")}
            </p>
            <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 16 }}>
              {T("Herhangi bir takımda değilsin. İlk takımını oluştur.", "You're not in any teams yet. Create your first team.")}
            </p>
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCreateForm(true)}>
              {T("Takım Oluştur", "Create Team")}
            </Button>
          </div>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 12,
          }}
        >
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} lang={lang} />
          ))}
        </div>
      </DataState>
    </div>
  )
}

function TeamCard({ team, lang }: { team: Team; lang: string }) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)
  const [hovered, setHovered] = React.useState(false)

  return (
    <Link href={`/teams/${team.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `1px solid ${hovered ? "var(--accent, #6366f1)" : "var(--border)"}`,
          borderRadius: "var(--radius-md, 8px)",
          padding: 16,
          background: "var(--surface)",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: hovered ? "var(--shadow-sm, 0 1px 4px rgba(0,0,0,.08))" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: hovered ? "var(--accent, #6366f1)" : "var(--fg)",
                margin: 0,
                transition: "color 0.15s",
              }}
            >
              {team.name}
            </p>
            {team.description && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--fg-muted)",
                  margin: "4px 0 0",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {team.description}
              </p>
            )}
          </div>
        </div>

        {/* Member avatars */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex" }}>
            {team.members.slice(0, 5).map((m, i) => (
              <div
                key={m.id}
                title={m.full_name}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--accent-muted, #e0e7ff)",
                  color: "var(--accent, #6366f1)",
                  fontSize: 10,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--surface)",
                  marginLeft: i === 0 ? 0 : -6,
                  zIndex: team.members.length - i,
                  position: "relative",
                }}
              >
                {getInitials(m.full_name)}
              </div>
            ))}
            {team.members.length > 5 && (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--bg-subtle)",
                  color: "var(--fg-muted)",
                  fontSize: 10,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--surface)",
                  marginLeft: -6,
                  position: "relative",
                }}
              >
                +{team.members.length - 5}
              </div>
            )}
          </div>
          <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
            {team.members.length} {T("üye", team.members.length !== 1 ? "members" : "member")}
          </span>
        </div>
      </div>
    </Link>
  )
}

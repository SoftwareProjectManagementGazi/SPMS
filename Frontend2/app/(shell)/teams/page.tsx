"use client"

import * as React from "react"
import { Plus, Users, Loader2 } from "lucide-react"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/primitives/button"
import { DataState } from "@/components/primitives/data-state"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/primitives/modal"
import { teamService, type Team, type TeamsStats } from "@/services/team-service"
import { TeamStatsStrip } from "@/components/teams/team-stats-strip"
import { TeamCard } from "@/components/teams/team-card"
import { TeamList } from "@/components/teams/team-list"
import { TeamToolbar } from "@/components/teams/team-toolbar"
import { CreateTeamModal } from "@/components/teams/create-team-modal"

export default function TeamsPage() {
  const { language: lang } = useApp()
  const { user } = useAuth()
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const userRole = user?.role?.name?.toLowerCase() ?? ""
  const canCreateTeam = userRole === "admin" || userRole === "project manager"

  // ---------- State ----------
  const [teams, setTeams] = React.useState<Team[]>([])
  const [stats, setStats] = React.useState<TeamsStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  // Filters
  const [search, setSearch] = React.useState("")
  const [department, setDepartment] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")

  // Modals
  const [showCreate, setShowCreate] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Team | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // ---------- Loaders ----------
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

  const loadStats = React.useCallback(async () => {
    try {
      const s = await teamService.getStats()
      setStats(s)
    } catch {
      // stats opsiyonel — sessizce yut
      setStats(null)
    }
  }, [])

  React.useEffect(() => {
    loadTeams()
    loadStats()
  }, [loadTeams, loadStats])

  // ---------- Handlers ----------
  const handleCreated = (newTeam: Team) => {
    setTeams((prev) => [...prev, newTeam])
    loadStats()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await teamService.deleteTeam(deleteTarget.id)
      setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
      loadStats()
    } catch (err) {
      console.error("Failed to delete team", err)
    } finally {
      setIsDeleting(false)
    }
  }

  // ---------- Filtering ----------
  const filteredTeams = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return teams.filter((t) => {
      if (department && (t.department ?? "") !== department) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.department ?? "").toLowerCase().includes(q)
      )
    })
  }, [teams, search, department])

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* ---------- Header ---------- */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: -0.3 }}>
            {T("Takımlar", "Teams")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "4px 0 0" }}>
            {teams.length} {T("takım", teams.length === 1 ? "team" : "teams")},{" "}
            {stats?.total_members ?? 0} {T("üye", (stats?.total_members ?? 0) === 1 ? "member" : "members")}
          </p>
        </div>
        {canCreateTeam && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowCreate(true)}
          >
            {T("Takım Oluştur", "Create Team")}
          </Button>
        )}
      </div>

      {/* ---------- Stats strip ---------- */}
      <TeamStatsStrip stats={stats} teamCount={teams.length} loading={isLoading} lang={lang} />

      {/* ---------- Toolbar (search + department filter + view toggle) ---------- */}
      <TeamToolbar
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        lang={lang}
      />

      {/* ---------- List ---------- */}
      <DataState
        loading={isLoading}
        error={error}
        onRetry={loadTeams}
        empty={!isLoading && filteredTeams.length === 0}
        emptyFallback={
          teams.length === 0 ? (
            // Hiç takım yok
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
                {T(
                  "Herhangi bir takımda değilsin. İlk takımını oluştur.",
                  "You're not in any teams yet. Create your first team."
                )}
              </p>
              {canCreateTeam && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setShowCreate(true)}
                >
                  {T("Takım Oluştur", "Create Team")}
                </Button>
              )}
            </div>
          ) : (
            // Filtre sonuç vermedi
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "32px 24px",
                textAlign: "center",
                background: "transparent",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>
                {T("Eşleşen takım yok", "No matching teams")}
              </p>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 12 }}>
                {T(
                  "Arama veya filtreyi değiştirerek tekrar dene.",
                  "Try changing the search or filter."
                )}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setDepartment(null)
                }}
              >
                {T("Filtreleri Temizle", "Clear Filters")}
              </Button>
            </div>
          )
        }
      >
        {viewMode === "list" ? (
          <TeamList teams={filteredTeams} lang={lang} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {filteredTeams.map((team) => {
              const currentUserId = user ? parseInt(user.id, 10) : null
              const isOwner = currentUserId != null && team.owner_id === currentUserId
              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  lang={lang}
                  isOwner={isOwner}
                  onDelete={() => setDeleteTarget(team)}
                />
              )
            })}
          </div>
        )}
      </DataState>

      {/* ---------- Create team modal ---------- */}
      <CreateTeamModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
        lang={lang}
      />

      {/* ---------- Delete confirm modal ---------- */}
      <Modal open={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <ModalHeader>{T("Takımı Sil", "Delete Team")}</ModalHeader>
        <ModalBody>
          <p style={{ fontSize: 13, color: "var(--fg)", margin: 0, lineHeight: 1.6 }}>
            {deleteTarget
              ? T(
                  `"${deleteTarget.name}" takımını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
                  `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
                )
              : ""}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
          >
            {T("Vazgeç", "Cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            icon={isDeleting ? <Loader2 size={13} className="animate-spin" /> : undefined}
          >
            {isDeleting ? T("Siliniyor…", "Deleting…") : T("Sil", "Delete")}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
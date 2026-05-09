"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Loader2,
  Search,
  UserMinus,
  Shield,
  FolderKanban,
  Activity,
  CheckCircle,
  UserPlus,
  MessageCircle,
  Activity as ActivityIcon,
} from "lucide-react"
import Link from "next/link"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/primitives/button"
import { Input } from "@/components/primitives/input"
import { DataState } from "@/components/primitives/data-state"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/primitives/modal"
import {
  teamService,
  type Team,
  type TeamMember,
  type TeamProject,
  type TeamActivityItem,
  type TeamMemberStat,
} from "@/services/team-service"
import { projectService, type Project } from "@/services/project-service"
import { TeamDetailHero } from "@/components/teams/team-detail-hero"
import { TeamDetailTabs, type TeamTab } from "@/components/teams/team-detail-tabs"
import { TeamOverviewPanel } from "@/components/teams/team-overview-panel"

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || "#6366f1").replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getInitials(name: string): string {
  return (
    (name ?? "")
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}

function projectKey(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 3)
      .toUpperCase() || "PRJ"
  )
}

function timeAgo(iso: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const tr = lang === "tr"
  if (diff < 60) return tr ? "Az önce" : "Just now"
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return tr ? `${m} dak. önce` : `${m}m ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return tr ? `${h} saat önce` : `${h}h ago`
  }
  const d = Math.floor(diff / 86400)
  return tr ? `${d} gün önce` : `${d}d ago`
}

function getActivityMeta(action: string): {
  Icon: React.ComponentType<{ size?: number }>
  color: string
  bg: string
} {
  const a = action.toLowerCase()
  if (a.includes("complet") || (a.includes("task") && a.includes("done")))
    return { Icon: CheckCircle, color: "#15803d", bg: "#dcfce7" }
  if (a.includes("member") || a.includes("join") || a.includes("add"))
    return { Icon: UserPlus, color: "#475569", bg: "#f1f5f9" }
  if (a.includes("comment")) return { Icon: MessageCircle, color: "#0891b2", bg: "#cffafe" }
  return { Icon: ActivityIcon, color: "#6366f1", bg: "#e0e7ff" }
}

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const teamId = parseInt(params.id, 10)

  const { language: lang } = useApp()
  const { user } = useAuth()
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const [team, setTeam] = React.useState<Team | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const [projects, setProjects] = React.useState<TeamProject[]>([])
  const [activity, setActivity] = React.useState<TeamActivityItem[]>([])
  const [memberStats, setMemberStats] = React.useState<TeamMemberStat[]>([])

  // Proje atama için — tüm sistem projeleri (picker'da gösterilir)
  const [allProjects, setAllProjects] = React.useState<Project[]>([])
  const [projectQuery, setProjectQuery] = React.useState("")
  const [assigningProjectId, setAssigningProjectId] = React.useState<number | null>(null)
  const [unassigningProjectId, setUnassigningProjectId] = React.useState<number | null>(null)

  const [activeTab, setActiveTab] = React.useState<TeamTab>("overview")

  // Add-member search
  const [allUsers, setAllUsers] = React.useState<TeamMember[]>([])
  const [memberQuery, setMemberQuery] = React.useState("")
  const [addingId, setAddingId] = React.useState<number | null>(null)

  // Member ops
  const [removingId, setRemovingId] = React.useState<number | null>(null)
  const [leaderUpdatingId, setLeaderUpdatingId] = React.useState<number | null>(null)

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const currentUserId = user ? parseInt(user.id, 10) : null
  const isOwner = team != null && currentUserId != null && team.owner_id === currentUserId
  const color = team?.color || "#6366f1"

  // ---------- Load ----------
  const loadTeam = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const t = await teamService.getTeam(teamId)
      setTeam(t)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [teamId])

  const loadExtras = React.useCallback(async () => {
    const [proj, act, stats] = await Promise.allSettled([
      teamService.getProjects(teamId),
      teamService.getActivity(teamId),
      teamService.getMemberStats(teamId),
    ])
    setProjects(proj.status === "fulfilled" ? proj.value : [])
    setActivity(act.status === "fulfilled" ? act.value : [])
    setMemberStats(stats.status === "fulfilled" ? stats.value : [])
  }, [teamId])

  const loadProjects = React.useCallback(async () => {
    const result = await teamService.getProjects(teamId)
    setProjects(result)
  }, [teamId])

  React.useEffect(() => {
    if (!Number.isNaN(teamId)) {
      loadTeam()
      loadExtras()
    }
  }, [loadTeam, loadExtras, teamId])

  // Fetch all users when entering members tab (for add-member picker)
  React.useEffect(() => {
    if (activeTab === "members" && allUsers.length === 0) {
      teamService
        .listAllUsers()
        .then(setAllUsers)
        .catch(() => setAllUsers([]))
    }
  }, [activeTab, allUsers.length])

  // Fetch all system projects when owner enters projects tab (for assign picker)
  React.useEffect(() => {
    if (activeTab === "projects" && isOwner && allProjects.length === 0) {
      projectService
        .getAll()
        .then(setAllProjects)
        .catch(() => setAllProjects([]))
    }
  }, [activeTab, isOwner, allProjects.length])

  // ---------- Handlers ----------
  const handleAssignProject = async (projectId: number) => {
    if (!team) return
    setAssigningProjectId(projectId)
    try {
      await teamService.assignProject(team.id, projectId)
      await loadProjects()
      setProjectQuery("")
    } catch (err) {
      console.error("Failed to assign project", err)
    } finally {
      setAssigningProjectId(null)
    }
  }

  const handleUnassignProject = async (projectId: number) => {
    if (!team) return
    setUnassigningProjectId(projectId)
    try {
      await teamService.unassignProject(team.id, projectId)
      await loadProjects()
    } catch (err) {
      console.error("Failed to unassign project", err)
    } finally {
      setUnassigningProjectId(null)
    }
  }

  const handleAddMember = async (userId: number) => {
    if (!team) return
    setAddingId(userId)
    try {
      await teamService.addMember(team.id, userId)
      await loadTeam()
      setMemberQuery("")
    } catch (err) {
      console.error("Failed to add member", err)
    } finally {
      setAddingId(null)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!team) return
    setRemovingId(memberId)
    try {
      await teamService.removeMember(team.id, memberId)
      await loadTeam()
    } catch (err) {
      console.error("Failed to remove member", err)
    } finally {
      setRemovingId(null)
    }
  }

  const handleSetLeader = async (memberId: number | null) => {
    if (!team) return
    setLeaderUpdatingId(memberId ?? -1)
    try {
      await teamService.setLeader(team.id, memberId)
      await loadTeam()
    } catch (err) {
      console.error("Failed to update leader", err)
    } finally {
      setLeaderUpdatingId(null)
    }
  }

  const handleDelete = async () => {
    if (!team) return
    setIsDeleting(true)
    try {
      await teamService.deleteTeam(team.id)
      router.push("/teams")
    } catch (err) {
      console.error("Failed to delete team", err)
      setIsDeleting(false)
    }
  }

  // ---------- Filtered project list (for assign-project picker) ----------
  const filteredAvailableProjects = React.useMemo(() => {
    const assignedIds = new Set(projects.map((p) => p.id))
    const q = projectQuery.trim().toLowerCase()
    return allProjects
      .filter((p) => !assignedIds.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
      .slice(0, 8)
  }, [allProjects, projects, projectQuery])

  // ---------- Filtered user list (for add-member picker) ----------
  const filteredUsers = React.useMemo(() => {
    if (!team) return []
    const q = memberQuery.trim().toLowerCase()
    const memberIds = new Set(team.members.map((m) => m.id))
    return allUsers
      .filter((u) => !memberIds.has(u.id))
      .filter((u) => {
        if (!q) return true
        return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      })
      .slice(0, 8)
  }, [team, allUsers, memberQuery])

  // ---------- Render ----------
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <DataState loading={isLoading} error={error} onRetry={loadTeam} empty={!isLoading && !team}>
        {team && (
          <>
            <TeamDetailHero
              team={team}
              isOwner={isOwner}
              onAddMember={() => setActiveTab("members")}
              onOpenSettings={() => setShowDeleteConfirm(true)}
              lang={lang}
            />

            <TeamDetailTabs
              active={activeTab}
              onChange={setActiveTab}
              memberCount={team.members.length}
              projectCount={projects.length}
              activityCount={activity.length}
              color={color}
              lang={lang}
            />

            {/* ----- Tab content ----- */}
            {activeTab === "overview" && (
              <TeamOverviewPanel
                team={team}
                lang={lang}
                projects={projects}
                activity={activity}
                memberStats={memberStats}
              />
            )}

            {activeTab === "members" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Members list */}
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md, 8px)",
                    background: "var(--surface)",
                    overflow: "hidden",
                  }}
                >
                  {team.members.map((m, i) => {
                    const isLeader = team.leader_id === m.id
                    const isLastRow = i === team.members.length - 1
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          borderBottom: !isLastRow ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: hexToRgba(color, 0.12),
                            color: color,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(m.full_name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "var(--fg)",
                                margin: 0,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {m.full_name}
                            </p>
                            {isLeader && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: "#b45309",
                                  background: "#fef3c7",
                                  border: "1px solid #fde68a",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                }}
                              >
                                <Shield size={10} />
                                {T("Lider", "Lead")}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                            {m.email}
                          </p>
                        </div>
                        {isOwner && (
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                          >
                            <button
                              onClick={() => handleSetLeader(isLeader ? null : m.id)}
                              disabled={leaderUpdatingId === m.id || leaderUpdatingId === -1}
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: `1px solid ${isLeader ? "#fde68a" : "var(--border)"}`,
                                background: isLeader ? "#fef3c7" : "transparent",
                                color: isLeader ? "#b45309" : "var(--fg-muted)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              {leaderUpdatingId === m.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Shield size={11} />
                              )}
                              {isLeader ? T("Kaldır", "Unset") : T("Lider Yap", "Make Lead")}
                            </button>
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              disabled={removingId === m.id}
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                                background: "transparent",
                                color: "var(--fg-muted)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              {removingId === m.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <UserMinus size={11} />
                              )}
                              {T("Çıkar", "Remove")}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Add member */}
                {isOwner && (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md, 8px)",
                      background: "var(--surface)",
                      padding: 16,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--fg-muted)",
                        margin: "0 0 10px",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}
                    >
                      {T("Üye Ekle", "Add Member")}
                    </p>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={14}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--fg-muted)",
                          pointerEvents: "none",
                        }}
                      />
                      <Input
                        value={memberQuery}
                        onChange={(e) => setMemberQuery(e.target.value)}
                        placeholder={T("İsim veya e-posta ile ara…", "Search by name or email…")}
                        style={{ paddingLeft: 32 }}
                      />
                    </div>

                    {memberQuery.trim() !== "" && (
                      <div
                        style={{
                          marginTop: 10,
                          maxHeight: 240,
                          overflowY: "auto",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                        }}
                      >
                        {filteredUsers.length === 0 ? (
                          <p
                            style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0, padding: 12 }}
                          >
                            {T("Eşleşen kullanıcı yok.", "No matching users.")}
                          </p>
                        ) : (
                          filteredUsers.map((u, i) => (
                            <div
                              key={u.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 12px",
                                borderBottom:
                                  i < filteredUsers.length - 1
                                    ? "1px solid var(--border)"
                                    : "none",
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: "var(--accent-muted, #e0e7ff)",
                                  color: "var(--accent, #6366f1)",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(u.full_name)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "var(--fg)",
                                    margin: 0,
                                  }}
                                >
                                  {u.full_name}
                                </p>
                                <p
                                  style={{ fontSize: 11, color: "var(--fg-muted)", margin: 0 }}
                                >
                                  {u.email}
                                </p>
                              </div>
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => handleAddMember(u.id)}
                                disabled={addingId === u.id}
                                icon={
                                  addingId === u.id ? (
                                    <Loader2 size={11} className="animate-spin" />
                                  ) : undefined
                                }
                              >
                                {T("Ekle", "Add")}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Atanmış projeler listesi */}
                {projects.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed var(--border)",
                      borderRadius: "var(--radius-md, 8px)",
                      padding: "32px 24px",
                      textAlign: "center",
                    }}
                  >
                    <FolderKanban size={32} color="var(--fg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: "0 0 4px" }}>
                      {T("Henüz proje yok", "No projects yet")}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                      {T("Aşağıdan bu takıma bir proje ata.", "Assign a project to this team below.")}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {projects.map((p) => {
                      const pct = p.progress != null ? Math.round(p.progress * 100) : null
                      const key = projectKey(p.name)
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "14px 16px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md, 8px)",
                            background: "var(--surface)",
                          }}
                        >
                          <Link
                            href={`/projects/${p.id}`}
                            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: hexToRgba(color, 0.15),
                                color: color,
                                fontSize: 11,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {key}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                                  {p.name}
                                </p>
                                {p.status && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color: "var(--fg-muted)",
                                      background: "var(--bg-subtle, #f1f1ee)",
                                      border: "1px solid var(--border)",
                                      borderRadius: 999,
                                      padding: "2px 8px",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {p.status}
                                  </span>
                                )}
                              </div>
                              {pct != null && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                                  <div style={{ flex: 1, height: 5, background: "var(--bg-subtle, #f1f1ee)", borderRadius: 999, overflow: "hidden" }}>
                                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                                    {pct}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                          {isOwner && (
                            <button
                              onClick={() => handleUnassignProject(p.id)}
                              disabled={unassigningProjectId === p.id}
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                                background: "transparent",
                                color: "var(--fg-muted)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                flexShrink: 0,
                              }}
                            >
                              {unassigningProjectId === p.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <UserMinus size={11} />}
                              {T("Kaldır", "Remove")}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Proje Ata — sadece owner */}
                {isOwner && (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md, 8px)",
                      background: "var(--surface)",
                      padding: 16,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--fg-muted)",
                        margin: "0 0 10px",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}
                    >
                      {T("Proje Ata", "Assign Project")}
                    </p>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={14}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--fg-muted)",
                          pointerEvents: "none",
                        }}
                      />
                      <Input
                        value={projectQuery}
                        onChange={(e) => setProjectQuery(e.target.value)}
                        placeholder={T("Proje adı veya kodu ile ara…", "Search by project name or key…")}
                        style={{ paddingLeft: 32 }}
                      />
                    </div>

                    {projectQuery.trim() !== "" && (
                      <div
                        style={{
                          marginTop: 10,
                          maxHeight: 240,
                          overflowY: "auto",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                        }}
                      >
                        {filteredAvailableProjects.length === 0 ? (
                          <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0, padding: 12 }}>
                            {T("Eşleşen proje yok.", "No matching projects.")}
                          </p>
                        ) : (
                          filteredAvailableProjects.map((p, i) => (
                            <div
                              key={p.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 12px",
                                borderBottom: i < filteredAvailableProjects.length - 1 ? "1px solid var(--border)" : "none",
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  background: hexToRgba(color, 0.12),
                                  color: color,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {p.key}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p.name}
                                </p>
                                {p.status && (
                                  <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: 0 }}>{p.status}</p>
                                )}
                              </div>
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => handleAssignProject(p.id)}
                                disabled={assigningProjectId === p.id}
                                icon={assigningProjectId === p.id ? <Loader2 size={11} className="animate-spin" /> : undefined}
                              >
                                {T("Ata", "Assign")}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              activity.length === 0 ? (
                <EmptyTabPanel
                  Icon={Activity}
                  title={T("Aktivite yok", "No activity yet")}
                  desc={T("Takım aktiviteleri burada görünecek.", "Team activity will appear here.")}
                />
              ) : (
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md, 8px)",
                    background: "var(--surface)",
                    overflow: "hidden",
                  }}
                >
                  {activity.map((a, i) => {
                    const { Icon, color: iconColor, bg } = getActivityMeta(a.action)
                    const isLast = i === activity.length - 1
                    return (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                          padding: "14px 18px",
                          borderBottom: !isLast ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: bg,
                            color: iconColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: "var(--fg)", margin: 0, lineHeight: 1.5 }}>
                            {a.actor_name && (
                              <span style={{ fontWeight: 600 }}>{a.actor_name} </span>
                            )}
                            <span style={{ color: "var(--fg-muted)" }}>{a.action}</span>
                            {a.target_label && (
                              <span style={{ color: "var(--fg)" }}> — {a.target_label}</span>
                            )}
                          </p>
                          <p
                            style={{ fontSize: 11, color: "var(--fg-muted)", margin: "3px 0 0" }}
                          >
                            {timeAgo(a.created_at, lang)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </>
        )}
      </DataState>

      {/* Delete confirm */}
      <Modal open={showDeleteConfirm} onClose={() => !isDeleting && setShowDeleteConfirm(false)}>
        <ModalHeader>{T("Takımı Sil", "Delete Team")}</ModalHeader>
        <ModalBody>
          <p style={{ fontSize: 13, color: "var(--fg)", margin: 0, lineHeight: 1.6 }}>
            {team
              ? T(
                  `"${team.name}" takımını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
                  `Are you sure you want to delete "${team.name}"? This cannot be undone.`
                )
              : ""}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
          >
            {T("Vazgeç", "Cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
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

// Empty state for tabs with no data
function EmptyTabPanel({
  Icon,
  title,
  desc,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>
  title: string
  desc: string
}) {
  return (
    <div
      style={{
        border: "1px dashed var(--border)",
        borderRadius: "var(--radius-md, 8px)",
        padding: "48px 24px",
        textAlign: "center",
        background: "transparent",
      }}
    >
      <Icon size={36} color="var(--fg-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>{desc}</p>
    </div>
  )
}

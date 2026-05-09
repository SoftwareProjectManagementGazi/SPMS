"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, UserMinus, UserPlus, Loader2, Users, Trash2, LogOut, Crown, Shield } from "lucide-react"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/primitives/button"
import { Input } from "@/components/primitives/input"
import { DataState } from "@/components/primitives/data-state"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/primitives/modal"
import { teamService, type Team, type TeamMember } from "@/services/team-service"

function getInitials(name: string): string {
  return (name ?? "")
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"
}

type ConfirmAction = "remove" | "leave" | "delete"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { language: lang } = useApp()
  const { user } = useAuth()
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const teamId = parseInt(params.id as string, 10)

  const [team, setTeam] = React.useState<Team | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  // All users cache for client-side search
  const [allUsers, setAllUsers] = React.useState<TeamMember[]>([])
  const [allUsersLoaded, setAllUsersLoaded] = React.useState(false)

  // Search / add member
  const [searchQuery, setSearchQuery] = React.useState("")
  const [addingUserId, setAddingUserId] = React.useState<number | null>(null)

  // Leader state
  const [settingLeaderId, setSettingLeaderId] = React.useState<number | null | "clear">(null)

  // Confirm modal
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction | null>(null)
  const [memberToRemove, setMemberToRemove] = React.useState<TeamMember | null>(null)
  const [isConfirming, setIsConfirming] = React.useState(false)

  const loadTeam = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await teamService.getTeam(teamId)
      setTeam(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [teamId])

  React.useEffect(() => {
    loadTeam()
  }, [loadTeam])

  // Load all users once for fast client-side filtering
  React.useEffect(() => {
    teamService.listAllUsers()
      .then((users) => { setAllUsers(users); setAllUsersLoaded(true) })
      .catch(() => setAllUsersLoaded(true)) // graceful fallback — search still works via server
  }, [])

  const currentUserId = user ? parseInt(user.id, 10) : null
  const isOwner = !!(currentUserId && team && currentUserId === team.owner_id)
  const isMember = !!(currentUserId && team && team.members.some((m) => m.id === currentUserId))

  // Client-side filtered search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !team) return []
    const q = searchQuery.toLowerCase()
    const memberIds = new Set(team.members.map((m) => m.id))
    return allUsers
      .filter((u) => !memberIds.has(u.id) && u.id !== currentUserId)
      .filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 10)
  }, [searchQuery, allUsers, team, currentUserId])

  // --- Set / clear leader ---
  const handleSetLeader = async (memberId: number | null) => {
    const key = memberId ?? "clear"
    setSettingLeaderId(key)
    try {
      await teamService.setLeader(teamId, memberId)
      await loadTeam()
    } catch (err) {
      console.error("Failed to set leader", err)
    } finally {
      setSettingLeaderId(null)
    }
  }

  // --- Add member ---
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

  // --- Confirm dialog actions ---
  const openRemove = (member: TeamMember) => {
    setMemberToRemove(member)
    setConfirmAction("remove")
  }
  const openLeave = () => setConfirmAction("leave")
  const openDelete = () => setConfirmAction("delete")
  const closeConfirm = () => {
    if (isConfirming) return
    setConfirmAction(null)
    setMemberToRemove(null)
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    setIsConfirming(true)
    try {
      if (confirmAction === "remove" && memberToRemove) {
        await teamService.removeMember(teamId, memberToRemove.id)
        await loadTeam()
      } else if (confirmAction === "leave") {
        await teamService.leaveTeam(teamId)
        router.push("/teams")
        return
      } else if (confirmAction === "delete") {
        await teamService.deleteTeam(teamId)
        router.push("/teams")
        return
      }
      setConfirmAction(null)
      setMemberToRemove(null)
    } catch (err) {
      console.error("Action failed", err)
    } finally {
      setIsConfirming(false)
    }
  }

  // Confirm dialog text
  const confirmTitle = confirmAction === "remove"
    ? T("Üyeyi Çıkar", "Remove Member")
    : confirmAction === "leave"
    ? T("Takımdan Ayrıl", "Leave Team")
    : T("Takımı Sil", "Delete Team")

  const confirmBody = confirmAction === "remove" && memberToRemove
    ? T(
        `${memberToRemove.full_name} adlı üyeyi takımdan çıkarmak istediğinizden emin misiniz?`,
        `Are you sure you want to remove ${memberToRemove.full_name} from the team?`
      )
    : confirmAction === "leave"
    ? T("Bu takımdan ayrılmak istediğinizden emin misiniz? Tekrar katılabilmek için sahip tarafından eklenmeniz gerekir.", "Are you sure you want to leave this team? You will need to be re-added by the owner.")
    : T("Bu takımı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.", "Are you sure you want to delete this team? This action cannot be undone.")

  const confirmLabel = confirmAction === "remove"
    ? T("Çıkar", "Remove")
    : confirmAction === "leave"
    ? T("Ayrıl", "Leave")
    : T("Sil", "Delete")

  const confirmInProgressLabel = confirmAction === "remove"
    ? T("Çıkarılıyor…", "Removing…")
    : confirmAction === "leave"
    ? T("Ayrılıyor…", "Leaving…")
    : T("Siliniyor…", "Deleting…")

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      {/* Back button */}
      <button
        onClick={() => router.push("/teams")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
          color: "var(--fg-muted)", background: "transparent", border: "none",
          cursor: "pointer", padding: "4px 0", marginBottom: 16,
        }}
      >
        <ArrowLeft size={15} />
        {T("Takımlara Dön", "Back to Teams")}
      </button>

      <DataState loading={isLoading} error={error} onRetry={loadTeam}>
        {team && (
          <>
            {/* Title + action buttons */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                  {team.name}
                </h1>
                {team.description && (
                  <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "4px 0 0" }}>
                    {team.description}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {/* Non-owner members can leave */}
                {isMember && !isOwner && (
                  <Button variant="secondary" size="sm" icon={<LogOut size={13} />} onClick={openLeave}>
                    {T("Ayrıl", "Leave")}
                  </Button>
                )}
                {/* Owner can delete */}
                {isOwner && (
                  <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={openDelete}>
                    {T("Takımı Sil", "Delete Team")}
                  </Button>
                )}
              </div>
            </div>

            {/* Members section */}
            <div
              style={{
                border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)",
                background: "var(--surface)", marginBottom: 16,
              }}
            >
              <div
                style={{
                  padding: "14px 16px", borderBottom: "1px solid var(--border)",
                  fontSize: 14, fontWeight: 600, color: "var(--fg)",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <Users size={15} />
                {T("Üyeler", "Members")} ({team.members.length})
              </div>

              <div>
                {team.members.length === 0 ? (
                  <p style={{ padding: 16, fontSize: 13, color: "var(--fg-muted)" }}>
                    {T("Henüz üye yok.", "No members yet.")}
                  </p>
                ) : (
                  team.members.map((member, idx) => {
                    const isTeamOwner = member.id === team.owner_id
                    const isLeader = team.leader_id != null && member.id === team.leader_id
                    return (
                      <div
                        key={member.id}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          gap: 12, padding: "10px 16px",
                          borderBottom: idx < team.members.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Avatar circle */}
                          <div
                            style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: "var(--accent-muted, #e0e7ff)",
                              color: "var(--accent, #6366f1)",
                              fontSize: 11, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}
                          >
                            {getInitials(member.full_name)}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0 }}>
                                {member.full_name}
                              </p>
                              {/* Owner badge */}
                              {isTeamOwner && (
                                <span
                                  title={T("Takım Sahibi", "Team Owner")}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                    fontSize: 10, fontWeight: 600,
                                    color: "var(--accent, #6366f1)",
                                    background: "var(--accent-muted, #e0e7ff)",
                                    borderRadius: 4, padding: "1px 6px",
                                  }}
                                >
                                  <Crown size={9} />
                                  {T("Sahip", "Owner")}
                                </span>
                              )}
                              {/* Leader badge */}
                              {isLeader && (
                                <span
                                  title={T("Takım Lideri", "Team Leader")}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                    fontSize: 10, fontWeight: 600,
                                    color: "#b45309",
                                    background: "#fef3c7",
                                    borderRadius: 4, padding: "1px 6px",
                                  }}
                                >
                                  <Shield size={9} />
                                  {T("Lider", "Leader")}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {/* Owner actions */}
                        {isOwner && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {/* Set / clear leader */}
                            {isLeader ? (
                              <button
                                onClick={() => handleSetLeader(null)}
                                disabled={settingLeaderId === "clear"}
                                title={T("Liderliği Kaldır", "Remove Leader")}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 12, color: "#b45309",
                                  background: "#fef3c7", border: "1px solid #fde68a",
                                  borderRadius: "var(--radius-sm)", padding: "4px 8px",
                                  cursor: "pointer", opacity: settingLeaderId === "clear" ? 0.6 : 1,
                                }}
                              >
                                {settingLeaderId === "clear"
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <Shield size={11} />}
                                {T("Kaldır", "Unset")}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetLeader(member.id)}
                                disabled={settingLeaderId === member.id}
                                title={T("Lider Yap", "Make Leader")}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 12, color: "var(--fg-muted)",
                                  background: "transparent", border: "1px solid transparent",
                                  borderRadius: "var(--radius-sm)", padding: "4px 8px",
                                  cursor: "pointer", transition: "background 0.1s, color 0.1s",
                                  opacity: settingLeaderId === member.id ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#fef3c7"
                                  e.currentTarget.style.color = "#b45309"
                                  e.currentTarget.style.borderColor = "#fde68a"
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent"
                                  e.currentTarget.style.color = "var(--fg-muted)"
                                  e.currentTarget.style.borderColor = "transparent"
                                }}
                              >
                                {settingLeaderId === member.id
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <Shield size={11} />}
                                {T("Lider Yap", "Make Leader")}
                              </button>
                            )}

                            {/* Remove member — only for non-owners */}
                            {!isTeamOwner && (
                              <button
                                onClick={() => openRemove(member)}
                                title={T("Çıkar", "Remove")}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 12, color: "var(--danger, #e53e3e)",
                                  background: "transparent", border: "1px solid transparent",
                                  borderRadius: "var(--radius-sm)", padding: "4px 8px",
                                  cursor: "pointer", transition: "background 0.1s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "color-mix(in srgb, var(--danger, #e53e3e) 8%, transparent)"
                                  e.currentTarget.style.borderColor = "color-mix(in srgb, var(--danger, #e53e3e) 30%, transparent)"
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent"
                                  e.currentTarget.style.borderColor = "transparent"
                                }}
                              >
                                <UserMinus size={13} />
                                {T("Çıkar", "Remove")}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Add member section (owner only) */}
            {isOwner && (
              <div
                style={{
                  border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)",
                  background: "var(--surface)",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px", borderBottom: "1px solid var(--border)",
                    fontSize: 14, fontWeight: 600, color: "var(--fg)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <UserPlus size={15} />
                  {T("Üye Ekle", "Add Member")}
                  {!allUsersLoaded && (
                    <Loader2 size={12} className="animate-spin" style={{ color: "var(--fg-muted)", marginLeft: 4 }} />
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={T(
                      "İsim veya e-posta ile ara (en az 2 karakter)…",
                      "Search by name or email (min 2 chars)…"
                    )}
                  />

                  {searchQuery.length >= 2 && searchResults.length === 0 && (
                    <p style={{ marginTop: 10, fontSize: 13, color: "var(--fg-muted)" }}>
                      &ldquo;{searchQuery}&rdquo; {T("ile eşleşen kullanıcı bulunamadı.", "matched no users.")}
                    </p>
                  )}

                  {searchResults.length > 0 && (
                    <div
                      style={{
                        marginTop: 10, border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)", overflow: "hidden",
                      }}
                    >
                      {searchResults.map((result, idx) => (
                        <div
                          key={result.id}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            gap: 10, padding: "8px 12px",
                            borderBottom: idx < searchResults.length - 1 ? "1px solid var(--border)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: "var(--accent-muted, #e0e7ff)",
                                color: "var(--accent, #6366f1)",
                                fontSize: 10, fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}
                            >
                              {getInitials(result.full_name)}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0 }}>
                                {result.full_name}
                              </p>
                              <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: 0 }}>
                                {result.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="xs"
                            variant="secondary"
                            disabled={addingUserId === result.id}
                            onClick={() => handleAddMember(result)}
                            icon={addingUserId === result.id ? <Loader2 size={11} className="animate-spin" /> : undefined}
                          >
                            {T("Ekle", "Add")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DataState>

      {/* Unified confirm modal */}
      <Modal open={!!confirmAction} onClose={closeConfirm}>
        <ModalHeader>{confirmTitle}</ModalHeader>
        <ModalBody>
          <p style={{ fontSize: 13, color: "var(--fg)", margin: 0, lineHeight: 1.6 }}>
            {confirmBody}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={closeConfirm} disabled={isConfirming}>
            {T("Vazgeç", "Cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirming}
            icon={isConfirming ? <Loader2 size={13} className="animate-spin" /> : undefined}
          >
            {isConfirming ? confirmInProgressLabel : confirmLabel}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

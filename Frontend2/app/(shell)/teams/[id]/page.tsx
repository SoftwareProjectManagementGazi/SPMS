"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, UserMinus, UserPlus, Loader2, Users } from "lucide-react"
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

  // Search / add member
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<TeamMember[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [addingUserId, setAddingUserId] = React.useState<number | null>(null)
  const searchDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Remove member confirm
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false)
  const [memberToRemove, setMemberToRemove] = React.useState<TeamMember | null>(null)
  const [isRemoving, setIsRemoving] = React.useState(false)

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

  const isOwner = !!(user && team && parseInt(user.id, 10) === team.owner_id)

  // --- Search ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await teamService.searchUsers(q)
        setSearchResults(results.filter((u) => !team?.members.some((m) => m.id === u.id)))
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }

  // --- Add member ---
  const handleAddMember = async (member: TeamMember) => {
    setAddingUserId(member.id)
    try {
      await teamService.addMember(teamId, member.id)
      await loadTeam()
      setSearchQuery("")
      setSearchResults([])
    } catch (err) {
      console.error("Failed to add member", err)
    } finally {
      setAddingUserId(null)
    }
  }

  // --- Remove member ---
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

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      {/* Back button */}
      <button
        onClick={() => router.push("/teams")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--fg-muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={15} />
        {T("Takımlara Dön", "Back to Teams")}
      </button>

      <DataState loading={isLoading} error={error} onRetry={loadTeam}>
        {team && (
          <>
            {/* Title */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                {team.name}
              </h1>
              {team.description && (
                <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4, margin: "4px 0 0" }}>
                  {team.description}
                </p>
              )}
            </div>

            {/* Members section */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md, 8px)",
                background: "var(--surface)",
                marginBottom: 16,
              }}
            >
              {/* Section header */}
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--fg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Users size={15} />
                {T("Üyeler", "Members")} ({team.members.length})
              </div>

              {/* Member list */}
              <div>
                {team.members.length === 0 ? (
                  <p style={{ padding: 16, fontSize: 13, color: "var(--fg-muted)" }}>
                    {T("Henüz üye yok.", "No members yet.")}
                  </p>
                ) : (
                  team.members.map((member, idx) => {
                    const isTeamOwner = member.id === team.owner_id
                    return (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "10px 16px",
                          borderBottom: idx < team.members.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Avatar circle */}
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "var(--accent-muted, #e0e7ff)",
                              color: "var(--accent, #6366f1)",
                              fontSize: 11,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(member.full_name)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0 }}>
                              {member.full_name}
                              {isTeamOwner && (
                                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--fg-muted)", fontWeight: 400 }}>
                                  ({T("Sahip", "Owner")})
                                </span>
                              )}
                            </p>
                            <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {isOwner && !isTeamOwner && (
                          <button
                            onClick={() => handleRemoveClick(member)}
                            title={T("Çıkar", "Remove")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 12,
                              color: "var(--danger, #e53e3e)",
                              background: "transparent",
                              border: "1px solid transparent",
                              borderRadius: "var(--radius-sm)",
                              padding: "4px 8px",
                              cursor: "pointer",
                              transition: "background 0.1s",
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
                    )
                  })
                )}
              </div>
            </div>

            {/* Add member section (owner only) */}
            {isOwner && (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md, 8px)",
                  background: "var(--surface)",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--fg)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <UserPlus size={15} />
                  {T("Üye Ekle", "Add Member")}
                </div>
                <div style={{ padding: 16 }}>
                  <Input
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={T(
                      "İsim veya e-posta ile ara (en az 2 karakter)…",
                      "Search by name or email (min 2 chars)…"
                    )}
                  />

                  {isSearching && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, color: "var(--fg-muted)" }}>
                      <Loader2 size={13} className="animate-spin" />
                      {T("Aranıyor…", "Searching…")}
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                      }}
                    >
                      {searchResults.map((result, idx) => (
                        <div
                          key={result.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: "8px 12px",
                            borderBottom: idx < searchResults.length - 1 ? "1px solid var(--border)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

                  {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <p style={{ marginTop: 10, fontSize: 13, color: "var(--fg-muted)" }}>
                      &ldquo;{searchQuery}&rdquo; {T("ile eşleşen kullanıcı bulunamadı.", "matched no users.")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DataState>

      {/* Remove confirm dialog */}
      <Modal open={removeDialogOpen} onClose={() => !isRemoving && setRemoveDialogOpen(false)}>
        <ModalHeader>{T("Üyeyi Çıkar", "Remove Member")}</ModalHeader>
        <ModalBody>
          <p style={{ fontSize: 13, color: "var(--fg)", margin: 0 }}>
            {memberToRemove
              ? T(
                  `${memberToRemove.full_name} adlı üyeyi takımdan çıkarmak istediğinizden emin misiniz?`,
                  `Are you sure you want to remove ${memberToRemove.full_name} from the team?`
                )
              : T(
                  "Bu üyeyi takımdan çıkarmak istediğinizden emin misiniz?",
                  "Are you sure you want to remove this member from the team?"
                )}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRemoveDialogOpen(false)}
            disabled={isRemoving}
          >
            {T("Vazgeç", "Cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemoveConfirm}
            disabled={isRemoving}
            icon={isRemoving ? <Loader2 size={13} className="animate-spin" /> : undefined}
          >
            {isRemoving ? T("Çıkarılıyor…", "Removing…") : T("Çıkar", "Remove")}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

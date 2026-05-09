"use client"

import * as React from "react"
import { Loader2, Search, Check, ArrowLeft, ArrowRight, Shield, X } from "lucide-react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/primitives/modal"
import { Button } from "@/components/primitives/button"
import { Input } from "@/components/primitives/input"
import { teamService, type Team, type TeamMember } from "@/services/team-service"
import { DEPARTMENTS } from "./team-toolbar"

const TEAM_COLORS = [
  "#1e3a8a", // deep navy — Backend
  "#7c3aed", // violet — Frontend
  "#be185d", // raspberry — Tasarım
  "#0e7490", // teal — Kalite
  "#15803d", // forest — Altyapı
  "#c2410c", // burnt orange — Veri
  "#b45309", // amber
  "#374151", // slate
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (team: Team) => void
  lang: string
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

export function CreateTeamModal({ open, onClose, onCreated, lang }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const [step, setStep] = React.useState<1 | 2>(1)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [department, setDepartment] = React.useState<string>("")
  const [color, setColor] = React.useState(TEAM_COLORS[0])

  const [allUsers, setAllUsers] = React.useState<TeamMember[]>([])
  const [usersLoading, setUsersLoading] = React.useState(false)
  const [memberQuery, setMemberQuery] = React.useState("")
  const [selectedMembers, setSelectedMembers] = React.useState<TeamMember[]>([])
  const [leaderId, setLeaderId] = React.useState<number | null>(null)

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setStep(1)
      setName("")
      setDescription("")
      setDepartment("")
      setColor(TEAM_COLORS[0])
      setMemberQuery("")
      setSelectedMembers([])
      setLeaderId(null)
      setError(null)
    }
  }, [open])

  // Fetch all users when stepping into step 2
  React.useEffect(() => {
    if (open && step === 2 && allUsers.length === 0) {
      setUsersLoading(true)
      teamService
        .listAllUsers()
        .then(setAllUsers)
        .catch(() => setAllUsers([]))
        .finally(() => setUsersLoading(false))
    }
  }, [open, step, allUsers.length])

  const filteredUsers = React.useMemo(() => {
    const q = memberQuery.trim().toLowerCase()
    const selectedIds = new Set(selectedMembers.map((m) => m.id))
    return allUsers
      .filter((u) => !selectedIds.has(u.id))
      .filter((u) => {
        if (!q) return true
        return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      })
      .slice(0, 8)
  }, [allUsers, memberQuery, selectedMembers])

  const toggleMember = (m: TeamMember) => {
    setSelectedMembers((prev) =>
      prev.some((x) => x.id === m.id) ? prev.filter((x) => x.id !== m.id) : [...prev, m]
    )
  }

  const removeMember = (id: number) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id))
    if (leaderId === id) setLeaderId(null)
  }

  const canGoNext = step === 1 && name.trim().length > 0
  const canSubmit = name.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const team = await teamService.createTeam({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        department: department || undefined,
        leader_id: leaderId ?? undefined,
        member_ids: selectedMembers.map((m) => m.id),
      })
      onCreated(team)
      onClose()
    } catch (err) {
      setError((err as Error).message || T("Takım oluşturulamadı.", "Failed to create team."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !submitting && onClose()}>
      <ModalHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>{T("Yeni Takım Oluştur", "Create New Team")}</span>
          <span style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 500 }}>
            {T(`Adım ${step} / 2`, `Step ${step} of 2`)}
          </span>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: s <= step ? color : "var(--border)",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        {step === 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>{T("Takım Adı", "Team Name")} *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={T("ör. Frontend Takımı", "e.g. Frontend Team")}
                
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>{T("Açıklama", "Description")}</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={T("Bu takım ne için?", "What is this team for?")}
              />
            </div>

            {/* Department pills */}
            <div>
              <label style={labelStyle}>{T("Departman", "Department")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <button onClick={() => setDepartment("")} style={pillStyle(department === "")}>
                  {T("Yok", "None")}
                </button>
                {DEPARTMENTS.map((d) => (
                  <button key={d} onClick={() => setDepartment(d)} style={pillStyle(department === d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Color swatches */}
            <div>
              <label style={labelStyle}>{T("Takım Rengi", "Team Color")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    title={c}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: c,
                      border: color === c ? `2px solid var(--fg)` : `2px solid transparent`,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      transition: "transform 0.1s",
                      transform: color === c ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {color === c && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div
              style={{
                marginTop: 4,
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--surface)",
              }}
            >
              <div
                style={{
                  height: 32,
                  background: `linear-gradient(135deg, ${color} 0%, ${color}b3 100%)`,
                }}
              />
              <div style={{ padding: "10px 12px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                  {name.trim() || T("Takım adı önizleme", "Team name preview")}
                </p>
                {(description || department) && (
                  <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                    {[department, description].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Selected members chips */}
            <div>
              <label style={labelStyle}>
                {T("Seçili Üyeler", "Selected Members")} ({selectedMembers.length})
              </label>
              {selectedMembers.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                  {T("Henüz kimse seçilmedi.", "No one selected yet.")}
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedMembers.map((m) => {
                    const isLeader = leaderId === m.id
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 4px 4px 10px",
                          borderRadius: 999,
                          background: isLeader ? "#fef3c7" : "var(--bg-subtle, #f3f4f6)",
                          border: `1px solid ${isLeader ? "#fde68a" : "var(--border)"}`,
                          fontSize: 12,
                          color: "var(--fg)",
                        }}
                      >
                        {isLeader && <Shield size={11} color="#b45309" />}
                        <span>{m.full_name}</span>
                        <button
                          onClick={() => removeMember(m.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "var(--fg-muted)",
                            display: "inline-flex",
                            padding: 2,
                          }}
                          title={T("Kaldır", "Remove")}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Leader picker */}
            {selectedMembers.length > 0 && (
              <div>
                <label style={labelStyle}>{T("Takım Lideri (opsiyonel)", "Team Leader (optional)")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button onClick={() => setLeaderId(null)} style={pillStyle(leaderId === null)}>
                    {T("Yok", "None")}
                  </button>
                  {selectedMembers.map((m) => (
                    <button key={m.id} onClick={() => setLeaderId(m.id)} style={pillStyle(leaderId === m.id)}>
                      {m.full_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User picker */}
            <div>
              <label style={labelStyle}>{T("Üye Ekle", "Add Members")}</label>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--fg-muted)",
                  }}
                />
                <Input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder={T("İsim veya e-posta…", "Name or email…")}
                  style={{ paddingLeft: 32 }}
                />
              </div>

              <div
                style={{
                  marginTop: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  background: "var(--surface)",
                }}
              >
                {usersLoading ? (
                  <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
                    <Loader2 size={16} className="animate-spin" color="var(--fg-muted)" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p style={{ padding: 12, fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                    {memberQuery
                      ? T("Eşleşen kullanıcı yok.", "No matching users.")
                      : T("Tüm kullanıcılar eklendi.", "All users added.")}
                  </p>
                ) : (
                  filteredUsers.map((u, i) => (
                    <div
                      key={u.id}
                      onClick={() => toggleMember(u)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--border)" : "none",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle, #f9fafb)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0 }}>
                          {u.full_name}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: 0 }}>{u.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p style={{ fontSize: 12, color: "var(--danger, #e53e3e)", marginTop: 12 }}>{error}</p>
        )}
      </ModalBody>

      <ModalFooter>
        {step === 1 ? (
          <>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
              {T("İptal", "Cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!canGoNext}
              onClick={() => setStep(2)}
              icon={<ArrowRight size={13} />}
            >
              {T("Devam", "Next")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep(1)}
              disabled={submitting}
              icon={<ArrowLeft size={13} />}
            >
              {T("Geri", "Back")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              icon={submitting ? <Loader2 size={13} className="animate-spin" /> : undefined}
            >
              {submitting ? T("Oluşturuluyor…", "Creating…") : T("Takımı Oluştur", "Create Team")}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--fg-muted)",
  display: "block",
  marginBottom: 6,
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${active ? "var(--accent, #6366f1)" : "var(--border)"}`,
    background: active ? "var(--accent, #6366f1)" : "var(--surface)",
    color: active ? "#fff" : "var(--fg)",
    cursor: "pointer",
    transition: "background 0.1s, border-color 0.1s, color 0.1s",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  }
}
"use client"

import * as React from "react"
import { Check, Plus, Search } from "lucide-react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/primitives/modal"
import { Button } from "@/components/primitives/button"
import { teamService, type Team } from "@/services/team-service"
import { userService, type User } from "@/services/user-service"

interface Props {
  open: boolean
  onClose: () => void
  onAdded: () => void
  team: Team
  lang: string
}

const AVATAR_PALETTE = [
  "#1e40af", "#0891b2", "#15803d", "#7c3aed",
  "#dc2626", "#ea580c", "#db2777", "#b45309",
]

function getInitials(name: string): string {
  return (
    (name ?? "")
      .trim()
      .split(/\s+/)
      .map((n) => n[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}

function colorForId(id: number): string {
  return AVATAR_PALETTE[Math.abs(id) % AVATAR_PALETTE.length]
}

export function AddMemberModal({ open, onClose, onAdded, team, lang }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState<number[]>([])
  const [search, setSearch] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const teamColor = team.color || "#1e40af"
  const memberIds = team.members.map((m) => m.id)

  React.useEffect(() => {
    if (!open) return
    setSelected([])
    setSearch("")
    setError(null)
    setLoading(true)
    userService
      .list()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [open])

  const available = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter((u) => !memberIds.includes(u.id))
      .filter((u) =>
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      )
  }, [users, memberIds, search])

  function toggle(id: number) {
    setSelected((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]))
  }

  async function handleAdd() {
    if (selected.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      await Promise.all(
        selected.map((id) => teamService.addMember(team.id, id))
      )
      onAdded()
      onClose()
    } catch (err) {
      setError((err as Error).message || T("Bir hata oluştu", "Something went wrong"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} width={480}>
      <ModalHeader>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.2 }}>
            {T("Üye Ekle", "Add Member")}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
            {T(`${team.name} takımına yeni üye ekle`, `Add new members to ${team.name}`)}
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-muted)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T("İsim veya e-posta ara…", "Search by name or email…")}
            style={{
              width: "100%",
              padding: "8px 10px 8px 30px",
              fontSize: 13,
              fontFamily: "inherit",
              background: "var(--bg-input, var(--surface))",
              color: "var(--fg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            overflow: "hidden",
            background: "var(--surface)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {loading && (
            <div style={{ padding: 14, fontSize: 12, color: "var(--fg-muted)" }}>
              {T("Yükleniyor…", "Loading…")}
            </div>
          )}
          {!loading && available.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                fontSize: 12,
                color: "var(--fg-muted)",
              }}
            >
              {search
                ? T("Eşleşen kullanıcı yok", "No matching users")
                : T("Eklenebilecek kullanıcı yok", "No users available to add")}
            </div>
          )}
          {available.map((u, i) => {
            const checked = selected.includes(u.id)
            return (
              <div
                key={u.id}
                onClick={() => toggle(u.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: checked ? `${teamColor}10` : "transparent",
                  borderBottom: i < available.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!checked) e.currentTarget.style.background = "var(--bg-subtle, #faf9f6)"
                }}
                onMouseLeave={(e) => {
                  if (!checked) e.currentTarget.style.background = "transparent"
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `1.5px solid ${checked ? teamColor : "var(--border)"}`,
                    background: checked ? teamColor : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {checked && <Check size={11} color="#fff" />}
                </div>
                {/* Avatar — profile photo if uploaded, otherwise initials. */}
                <UserAvatarTile
                  id={u.id}
                  initials={getInitials(u.full_name)}
                  avatarUrl={u.avatar}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
                    {u.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--fg-muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {u.role?.name ?? ""}
                    {u.role?.name && u.email ? " · " : ""}
                    {u.email ?? ""}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--danger, #dc2626)",
              background: "var(--danger-subtle, #fef2f2)",
              border: "1px solid var(--danger, #dc2626)33",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            {error}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          {T("İptal", "Cancel")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          disabled={selected.length === 0 || submitting}
          onClick={handleAdd}
        >
          {submitting
            ? T("Ekleniyor…", "Adding…")
            : `${selected.length > 0 ? `${selected.length} ` : ""}${T("Üye Ekle", "Add")}`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function UserAvatarTile({
  id,
  initials,
  avatarUrl,
}: {
  id: number
  initials: string
  avatarUrl?: string | null
}) {
  const [imgFailed, setImgFailed] = React.useState(false)
  React.useEffect(() => setImgFailed(false), [avatarUrl])
  const showPhoto =
    !!avatarUrl && avatarUrl !== "/placeholder.svg" && !imgFailed
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: colorForId(id),
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {showPhoto ? (
        <img
          src={avatarUrl!}
          alt={initials}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        initials
      )}
    </div>
  )
}
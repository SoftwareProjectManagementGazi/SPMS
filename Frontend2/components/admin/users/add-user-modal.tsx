"use client"

// Phase 14 Plan 14-03 Task 2 — Single-user invite modal (D-B2).
//
// Modal width 480 (UI-SPEC §Spacing line 89). Form: 3 fields (email / role /
// name optional). Pydantic-mirror client validation per Pitfall 5 — same RFC
// 5322 lax regex used by csv-parse.ts (single source of truth on the wire,
// belt-and-suspenders here for snappy UX).
//
// On submit: useInviteUser.mutate({email, role, name?}) → on success closes
// modal + clears form (Toast handled by hook). On error: Toast from hook +
// optional inline error.

import * as React from "react"

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
import { useInviteUser } from "@/hooks/use-invite-user"
import type { AdminRole } from "@/services/admin-user-service"

export interface AddUserModalProps {
  open: boolean
  onClose: () => void
}

// Pydantic-mirror — same regex as csv-parse.ts (Pitfall 5).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export function AddUserModal({ open, onClose }: AddUserModalProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const inviteUser = useInviteUser()

  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<AdminRole>("Member")
  const [name, setName] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  // Reset on each modal open (avoid stale state across re-opens).
  React.useEffect(() => {
    if (open) {
      setEmail("")
      setRole("Member")
      setName("")
      setSubmitted(false)
    }
  }, [open])

  const emailTrim = email.trim()
  const emailValid = EMAIL_RE.test(emailTrim)
  const nameValid = name.length <= 100
  const formValid = emailValid && nameValid

  // Inline validation errors only after first submit attempt OR after the
  // user types (to avoid showing "required" on initial empty state).
  const showEmailRequired = submitted && !emailTrim
  const showEmailInvalid = submitted && emailTrim.length > 0 && !emailValid
  const showNameTooLong = !nameValid

  const handleSubmit = () => {
    setSubmitted(true)
    if (!formValid) return
    inviteUser.mutate(
      {
        email: emailTrim,
        role,
        name: name.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHeader>{adminUsersT("admin.users.modal_add_title", lang)}</ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="add-user-email"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg)",
              }}
            >
              {adminUsersT("admin.users.modal_add_email_label", lang)}
            </label>
            <Input
              id="add-user-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="[email protected]"
              size="md"
              style={{ width: "100%" }}
            />
            {showEmailRequired && (
              <span
                role="alert"
                style={{
                  fontSize: 11.5,
                  color: "var(--priority-critical)",
                }}
              >
                {adminUsersT("admin.users.modal_add_email_required", lang)}
              </span>
            )}
            {showEmailInvalid && (
              <span
                role="alert"
                style={{
                  fontSize: 11.5,
                  color: "var(--priority-critical)",
                }}
              >
                {adminUsersT("admin.users.modal_add_email_invalid", lang)}
              </span>
            )}
          </div>

          {/* Role */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="add-user-role"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg)",
              }}
            >
              {adminUsersT("admin.users.modal_add_role_label", lang)}
            </label>
            <select
              id="add-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              style={{
                height: 32,
                padding: "0 8px",
                fontSize: 13,
                background: "var(--surface)",
                color: "var(--fg)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                border: 0,
              }}
            >
              <option value="Admin">Admin</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Member">Member</option>
            </select>
          </div>

          {/* Name (optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="add-user-name"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg)",
              }}
            >
              {adminUsersT("admin.users.modal_add_name_label", lang)}
            </label>
            <Input
              id="add-user-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              size="md"
              style={{ width: "100%" }}
            />
            {showNameTooLong && (
              <span
                role="alert"
                style={{
                  fontSize: 11.5,
                  color: "var(--priority-critical)",
                }}
              >
                {adminUsersT("admin.users.modal_add_name_too_long", lang)}
              </span>
            )}
          </div>

          {/* Hidden submit so Enter inside any field triggers the form. */}
          <button type="submit" style={{ display: "none" }} />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {adminUsersT("admin.users.modal_add_cancel", lang)}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!formValid || inviteUser.isPending}
        >
          {adminUsersT("admin.users.modal_add_submit", lang)}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

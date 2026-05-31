"use client"

// Phase 15 Plan 15-11 — RoleEditModal (D-2.3 + D-2.6 + D-2.8).
//
// Sibling of RoleCreateModal. Differences:
//   - Pre-fills form fields from the supplied `role` prop on every open.
//   - System roles render a top-of-modal AlertBanner ("Sistem rolleri
//     düzenlenemez") AND all inputs/pickers are disabled. Save button is
//     also disabled. Backend rejects edits on `is_system_role=true` rows
//     with 422 SYSTEM_ROLE_PROTECTED — the UI hide is defense in depth.
//   - role=null is a defensive guard; the parent (admin/roles/page.tsx)
//     keeps editingRole in state and the modal is opened by setting it.
//     Rendering null avoids a brief flash of empty form during state
//     transitions.

import * as React from "react"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  AlertBanner,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useUpdateRole } from "@/hooks/use-update-role"
import { useRoles } from "@/hooks/use-roles"
import { isRoleNameTaken, validateRoleName } from "@/lib/admin/role-validation"
import { RoleIconPicker } from "./role-icon-picker"
import { RoleColorSwatch } from "./role-color-swatch"
import type { Role } from "@/services/admin-rbac-service"

export interface RoleEditModalProps {
  open: boolean
  role: Role | null
  onClose: () => void
}

export function RoleEditModal({ open, role, onClose }: RoleEditModalProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const updateRole = useUpdateRole()
  const rolesQuery = useRoles()

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [iconKey, setIconKey] = React.useState<string | null>(null)
  const [colorToken, setColorToken] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  // Pre-fill form whenever the modal opens with a role. The dependency on
  // role.id (not the whole role object) keeps the effect from re-running on
  // every parent re-render with the same role.
  React.useEffect(() => {
    if (open && role) {
      setName(role.name)
      setDescription(role.description || "")
      setIconKey(role.icon_key || null)
      setColorToken(role.color_token || null)
      setSubmitted(false)
    }
  }, [open, role])

  if (!role) return null

  const isSystem = role.is_system_role
  const validation = validateRoleName(name)
  // M-RB3 — inline duplicate check, excluding this role's own id so keeping the
  // current name isn't flagged; skipped for system roles (name is fixed/disabled).
  const duplicate =
    !isSystem &&
    validation.ok &&
    isRoleNameTaken(name, rolesQuery.data?.items ?? [], role.id)
  const formValid = validation.ok && !isSystem && !duplicate

  // M-RB1 — suppress the validation error for system roles: the field is
  // disabled and a system role's name (e.g. "Admin") trips the "reserved" rule,
  // producing a phantom error on an uneditable field if submit ever fires.
  const errorMessage =
    !isSystem && !validation.ok && submitted
      ? (() => {
          switch (validation.reason) {
            case "empty":
              return lang === "tr" ? "İsim boş olamaz" : "Name is required"
            case "too_long":
              return lang === "tr"
                ? "İsim 50 karakteri aşmamalı"
                : "Name must be 50 chars or fewer"
            case "invalid_chars":
              return lang === "tr" ? "Geçersiz karakter" : "Invalid characters"
            case "reserved":
              return lang === "tr"
                ? "Bu isim sistem rolü için ayrılmıştır"
                : "Reserved name"
          }
        })()
      : duplicate
        ? lang === "tr"
          ? "Bu isimde bir rol zaten var"
          : "A role with this name already exists"
        : null

  const handleSubmit = () => {
    setSubmitted(true)
    if (!formValid) return
    updateRole.mutate(
      {
        id: role.id,
        req: {
          name: name.trim(),
          description: description.trim() || undefined,
          icon_key: iconKey || undefined,
          color_token: colorToken || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  // No-op handlers for the icon picker / color swatch when system role —
  // visual selection state is preserved (the role's existing icon/color is
  // shown) but clicks do nothing.
  const noopIcon = (_k: string) => {
    /* system role: no-op */
  }
  const noopColor = (_t: string) => {
    /* system role: no-op */
  }

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHeader>
        {lang === "tr" ? "Rolü düzenle" : "Edit role"}
      </ModalHeader>
      <ModalBody>
        {isSystem && (
          <div style={{ marginBottom: 12 }}>
            <AlertBanner tone="warning">
              {lang === "tr"
                ? "Sistem rolleri düzenlenemez"
                : "System roles cannot be edited"}
            </AlertBanner>
          </div>
        )}
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
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="role-edit-name"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "İsim" : "Name"}
            </label>
            <Input
              id="role-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSystem}
              style={{ width: "100%" }}
            />
            {errorMessage && (
              <span
                role="alert"
                style={{
                  fontSize: 11.5,
                  color: "var(--priority-critical)",
                }}
              >
                {errorMessage}
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="role-edit-description"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "Açıklama" : "Description"}
            </label>
            <Input
              id="role-edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSystem}
              style={{ width: "100%" }}
            />
          </div>

          {/* Icon picker — disabled-equivalent for system roles via no-op handler */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "İkon" : "Icon"}
            </label>
            <div style={{ opacity: isSystem ? 0.55 : 1, pointerEvents: isSystem ? "none" : "auto" }}>
              <RoleIconPicker
                value={iconKey}
                onChange={isSystem ? noopIcon : setIconKey}
              />
            </div>
          </div>

          {/* Color swatch */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "Renk" : "Color"}
            </label>
            <div style={{ opacity: isSystem ? 0.55 : 1, pointerEvents: isSystem ? "none" : "auto" }}>
              <RoleColorSwatch
                value={colorToken}
                onChange={isSystem ? noopColor : setColorToken}
              />
            </div>
          </div>

          {/* Hidden submit so Enter inside any field triggers the form. */}
          <button type="submit" style={{ display: "none" }} />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {lang === "tr" ? "İptal" : "Cancel"}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!formValid || updateRole.isPending}
        >
          {lang === "tr" ? "Kaydet" : "Save"}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

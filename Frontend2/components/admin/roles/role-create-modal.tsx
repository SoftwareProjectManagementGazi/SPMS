"use client"

// Phase 15 Plan 15-11 — RoleCreateModal (D-2.6 + D-2.8).
//
// "Yeni rol oluştur" modal. Mounts when AdminRolesPage's NewRoleModalTrigger
// fires its onClick. Form: name (regex + reserved validation) + description
// (optional) + icon picker (8 lucide icons) + color swatch (6 oklch tokens).
//
// On submit:
//   - validateRoleName runs client-side; backend Pydantic re-validates as
//     defense in depth. Backend rejection on a name that passes the client
//     check (e.g., race condition between two admins creating "Designer"
//     simultaneously) surfaces via useCreateRole's existing 409 toast.
//   - useCreateRole().mutate({...}) is invoked with the trimmed payload.
//   - onSuccess closes the modal; the toast comes from the hook.
//
// Layout matches AddUserModal verbatim — Modal width 480, Input + label
// pairs in a flex column with gap 14, Save/Cancel in ModalFooter.

import * as React from "react"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useCreateRole } from "@/hooks/use-create-role"
import { validateRoleName } from "@/lib/admin/role-validation"
import { RoleIconPicker } from "./role-icon-picker"
import { RoleColorSwatch } from "./role-color-swatch"

export interface RoleCreateModalProps {
  open: boolean
  onClose: () => void
}

export function RoleCreateModal({ open, onClose }: RoleCreateModalProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const createRole = useCreateRole()

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [iconKey, setIconKey] = React.useState<string | null>("user")
  const [colorToken, setColorToken] = React.useState<string | null>("--fg-muted")
  const [submitted, setSubmitted] = React.useState(false)

  // Reset on each modal open — avoid stale state across re-opens.
  React.useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setIconKey("user")
      setColorToken("--fg-muted")
      setSubmitted(false)
    }
  }, [open])

  const validation = validateRoleName(name)
  const formValid = validation.ok

  // Localized validation copy. The discriminated union over `reason` is the
  // ONLY place this switch lives — adding a new reason in role-validation.ts
  // forces the consumer to handle it (TS exhaustiveness).
  const errorMessage =
    !validation.ok && submitted
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
      : null

  const handleSubmit = () => {
    setSubmitted(true)
    if (!formValid) return
    createRole.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        icon_key: iconKey || undefined,
        color_token: colorToken || undefined,
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
      <ModalHeader>
        {lang === "tr" ? "Yeni rol oluştur" : "Create new role"}
      </ModalHeader>
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
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="role-create-name"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "İsim" : "Name"}{" "}
              <span aria-hidden="true">*</span>
            </label>
            <Input
              id="role-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === "tr" ? "Tasarımcı" : "Designer"}
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
              htmlFor="role-create-description"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "Açıklama" : "Description"}
            </label>
            <Input
              id="role-create-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                lang === "tr"
                  ? "Bu rolün ne yaptığını kısaca açıkla"
                  : "Briefly describe what this role does"
              }
              style={{ width: "100%" }}
            />
          </div>

          {/* Icon picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "İkon" : "Icon"}
            </label>
            <RoleIconPicker value={iconKey} onChange={setIconKey} />
          </div>

          {/* Color swatch */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
            >
              {lang === "tr" ? "Renk" : "Color"}
            </label>
            <RoleColorSwatch value={colorToken} onChange={setColorToken} />
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
          disabled={!formValid || createRole.isPending}
        >
          {lang === "tr" ? "Kaydet" : "Save"}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

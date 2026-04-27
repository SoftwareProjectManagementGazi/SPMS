"use client"

// Phase 14 Plan 14-05 — Per-row MoreH menu (UI-SPEC §Surface F lines 436-437).
//
// EXACTLY 2 menu items per CONTEXT D-B5 — NO transfer-ownership:
//   1. Arşivle (or "Arşivden çıkar" if status === "ARCHIVED") — calls existing
//      PATCH /projects/{id} { status: "ARCHIVED" | "ACTIVE" } via the existing
//      useUpdateProjectStatus mutation. ConfirmDialog tone="warning" per
//      UI-SPEC §Color line 212.
//   2. Sil — destructive flow with TWO-STEP typing confirm (must type the
//      project key) per UI-SPEC §Color line 213 + threat T-14-05-01. Uses the
//      shared Modal primitive (Plan 14-01) instead of ConfirmDialog because we
//      need a custom Input field inside the body that ConfirmDialog can't host.
//
// Per-project ownership (PM-ship) is NOT manageable here — D-B5 explicitly
// excludes it; ownership is managed in Settings > Üyeler (Phase 9 D-17).
//
// Consumes Plan 14-01's shared MoreMenu primitive — DOES NOT rebuild.

import * as React from "react"
import { AlertTriangle } from "lucide-react"

import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import {
  MoreMenu,
  type MoreMenuItem,
} from "@/components/admin/shared/more-menu"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@/components/primitives"
import {
  useUpdateProjectStatus,
  useDeleteProject,
} from "@/hooks/use-projects"
import { useApp } from "@/context/app-context"
import { adminProjectsT } from "@/lib/i18n/admin-projects-keys"

export interface AdminProjectRowActionsProject {
  id: number
  key: string
  name: string
  status: string
}

export interface AdminProjectRowActionsProps {
  project: AdminProjectRowActionsProject
}

export function AdminProjectRowActions({
  project,
}: AdminProjectRowActionsProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const updateStatusM = useUpdateProjectStatus()
  const deleteM = useDeleteProject()

  // ConfirmDialog state for Archive / Unarchive flows.
  const [archiveOpen, setArchiveOpen] = React.useState(false)
  // Modal state for Sil (two-step typing confirm).
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  // The user-typed project-key value. Confirm CTA enables only on exact match.
  const [keyInput, setKeyInput] = React.useState("")

  const isArchived = project.status === "ARCHIVED"
  const keyMatches = keyInput === project.key

  // ---- EXACTLY 2 menu items per D-B5 (Arşivle + Sil — NO transfer) ----
  const items: MoreMenuItem[] = [
    {
      id: "archive",
      label: isArchived
        ? adminProjectsT("admin.projects.unarchive", lang)
        : adminProjectsT("admin.projects.archive", lang),
      onClick: () => setArchiveOpen(true),
    },
    {
      id: "delete",
      label: adminProjectsT("admin.projects.delete", lang),
      onClick: () => {
        setKeyInput("")  // reset typing state on each open
        setDeleteOpen(true)
      },
      destructive: true,
    },
  ]

  // ---- Archive confirm body (warning tone) ----
  const archiveTitle = isArchived
    ? adminProjectsT("admin.projects.unarchive_modal_title", lang)
    : adminProjectsT("admin.projects.archive_modal_title", lang)
  const archiveBodyTpl = isArchived
    ? adminProjectsT("admin.projects.unarchive_modal_body", lang)
    : adminProjectsT("admin.projects.archive_modal_body", lang)
  const archiveBody = archiveBodyTpl.replace("{name}", project.name)

  const handleArchiveConfirm = () => {
    setArchiveOpen(false)
    updateStatusM.mutate({
      id: project.id,
      status: isArchived ? "ACTIVE" : "ARCHIVED",
    })
  }

  // ---- Delete two-step typing confirm body (danger tone) ----
  const deleteBody = adminProjectsT(
    "admin.projects.delete_modal_body",
    lang,
  ).replace("{name}", project.name)
  const typingPrompt = adminProjectsT(
    "admin.projects.delete_modal_typing_prompt",
    lang,
  ).replace("{key}", project.key)

  const handleDeleteConfirm = () => {
    if (!keyMatches) return
    setDeleteOpen(false)
    setKeyInput("")
    deleteM.mutate(project.id)
  }

  return (
    <span style={{ display: "inline-flex" }}>
      {/* MoreMenu primitive defaults aria-label to "İşlemler" — leave the
          default so the trigger reads as a generic actions menu (matches
          Plan 14-03 user-row + UI-SPEC accessibility convention). */}
      <MoreMenu items={items} />

      {/* Archive — ConfirmDialog tone="warning" per UI-SPEC §Color line 212 */}
      <ConfirmDialog
        open={archiveOpen}
        title={archiveTitle}
        body={archiveBody}
        confirmLabel={
          isArchived
            ? adminProjectsT("admin.projects.unarchive", lang)
            : adminProjectsT("admin.projects.archive", lang)
        }
        cancelLabel={adminProjectsT("admin.cancel", lang)}
        tone="warning"
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveOpen(false)}
      />

      {/* Sil — two-step typing confirm via Modal (ConfirmDialog can't host
          a custom Input field; UI-SPEC §Color line 213 requires the typed-key
          gate so the primary CTA stays disabled until project.key matches). */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        width={420}
      >
        <ModalHeader>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <AlertTriangle
              size={14}
              color="var(--priority-critical)"
            />
            {adminProjectsT("admin.projects.delete_modal_title", lang)}
          </span>
        </ModalHeader>
        <ModalBody>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              fontSize: 13,
              color: "var(--fg-muted)",
              lineHeight: 1.5,
            }}
          >
            <p style={{ margin: 0 }}>{deleteBody}</p>
            <p style={{ margin: 0 }}>{typingPrompt}</p>
            <Input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={project.key}
              size="sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(false)}
          >
            {adminProjectsT("admin.cancel", lang)}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!keyMatches}
            onClick={handleDeleteConfirm}
          >
            {adminProjectsT("admin.projects.delete", lang)}
          </Button>
        </ModalFooter>
      </Modal>
    </span>
  )
}

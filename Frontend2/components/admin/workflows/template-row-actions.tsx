"use client"

// Phase 14 Plan 14-06 — Per-card MoreH menu for the /admin/workflows
// (Şablonlar) tab (UI-SPEC §Surface G + CONTEXT D-B1 / D-B6).
//
// THREE menu items (CONTEXT D-B1 — every action functional):
//   1. Düzenle  → router.push("/workflow-editor?templateId={id}") — Phase 12
//      D-09 redirect, no confirm, no backend call from this surface.
//   2. Klonla   → useCloneTemplate.mutate({id, nameSuffix}) → Toast on success.
//      Clone is client-side composed (GET source + POST new) because no
//      backend /clone endpoint exists; CONTEXT D-B1 / Plan 14-06 forbid
//      adding one.
//   3. Sil      → impact-aware destructive flow per D-B6. When the template
//      has zero active projects we show a plain ConfirmDialog tone="danger"
//      (single click + danger CTA). When N > 0 we escalate to a Modal with
//      a warning body ("{name} {N} projede kullanılıyor…") and a SECONDARY
//      checkbox "Yine de sil"; the danger CTA stays disabled until the
//      checkbox is checked. Defense-in-depth alongside the backend's 204
//      delete (built-in templates raise 403 server-side).
//
// Consumes Plan 14-01's shared MoreMenu primitive — does NOT rebuild.
// active_project_count is passed in by the parent <AdminTemplateCard/>
// after the parent computes it client-side from the existing useProjects()
// cache (no backend extension needed).

import * as React from "react"
import { useRouter } from "next/navigation"
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
} from "@/components/primitives"
import { useCloneTemplate, useDeleteTemplate } from "@/hooks/use-projects"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { adminWorkflowsT } from "@/lib/i18n/admin-workflows-keys"

export interface TemplateRowActionsTemplate {
  id: number
  name: string
  is_builtin: boolean
}

export interface TemplateRowActionsProps {
  template: TemplateRowActionsTemplate
  /** Number of ACTIVE (non-archived, non-deleted) projects currently using
   *  this template. Computed by the parent <AdminTemplateCard/> from the
   *  existing useProjects() cache so we don't need a new backend route. */
  activeProjectCount: number
}

export function TemplateRowActions({
  template,
  activeProjectCount,
}: TemplateRowActionsProps) {
  const router = useRouter()
  const { language } = useApp()
  const { showToast } = useToast()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const cloneM = useCloneTemplate()
  const deleteM = useDeleteTemplate()

  // Two confirm states:
  //   - confirmOpenSimple: ConfirmDialog branch (usage_count === 0).
  //   - confirmOpenInUse:  Modal branch (usage_count > 0) with secondary checkbox.
  const [confirmOpenSimple, setConfirmOpenSimple] = React.useState(false)
  const [confirmOpenInUse, setConfirmOpenInUse] = React.useState(false)
  // "Yine de sil" — secondary checkbox, only meaningful in the in-use branch.
  const [yineDeSil, setYineDeSil] = React.useState(false)

  const inUse = activeProjectCount > 0
  // canDelete is the danger-CTA gate. Always true in the simple branch
  // (because the user already clicked Sil and confirmed); gated by the
  // "Yine de sil" checkbox in the in-use branch.
  const canDelete = !inUse || yineDeSil

  // ---- 3 menu items (Düzenle / Klonla / Sil) ----
  const items: MoreMenuItem[] = [
    {
      id: "edit",
      label: adminWorkflowsT("admin.workflows.edit", lang),
      onClick: () => {
        router.push(`/workflow-editor?templateId=${template.id}`)
      },
    },
    {
      id: "clone",
      label: adminWorkflowsT("admin.workflows.clone", lang),
      onClick: () => {
        cloneM.mutate(
          {
            id: template.id,
            nameSuffix: adminWorkflowsT(
              "admin.workflows.clone_name_suffix",
              lang,
            ),
          },
          {
            onSuccess: () => {
              showToast({
                variant: "success",
                message: adminWorkflowsT(
                  "admin.workflows.clone_success_toast",
                  lang,
                ).replace("{name}", template.name),
              })
            },
            onError: (err: unknown) => {
              const detail =
                (err as { response?: { data?: { detail?: string } } })
                  ?.response?.data?.detail ??
                (err as Error)?.message ??
                "unknown"
              showToast({
                variant: "error",
                message: adminWorkflowsT(
                  "admin.workflows.clone_error_toast",
                  lang,
                ).replace("{error}", detail),
              })
            },
          },
        )
      },
    },
    {
      id: "delete",
      label: adminWorkflowsT("admin.workflows.delete", lang),
      destructive: true,
      onClick: () => {
        // Branch on usage at click time — UI-SPEC §Color line 211 + D-B6:
        // in-use templates require the secondary "Yine de sil" gate.
        setYineDeSil(false)
        if (inUse) {
          setConfirmOpenInUse(true)
        } else {
          setConfirmOpenSimple(true)
        }
      },
    },
  ]

  const handleDeleteFire = () => {
    if (!canDelete) return // belt-and-braces — should be unreachable when CTA is disabled
    setConfirmOpenSimple(false)
    setConfirmOpenInUse(false)
    setYineDeSil(false)
    deleteM.mutate(template.id, {
      onSuccess: () => {
        showToast({
          variant: "success",
          message: adminWorkflowsT(
            "admin.workflows.delete_success_toast",
            lang,
          ).replace("{name}", template.name),
        })
      },
      onError: (err: unknown) => {
        const detail =
          (err as { response?: { data?: { detail?: string } } })
            ?.response?.data?.detail ??
          (err as Error)?.message ??
          "unknown"
        showToast({
          variant: "error",
          message: adminWorkflowsT(
            "admin.workflows.delete_error_toast",
            lang,
          ).replace("{error}", detail),
        })
      },
    })
  }

  // ---- Plain ConfirmDialog body (usage_count === 0) ----
  const deleteBodySimple = adminWorkflowsT(
    "admin.workflows.delete_modal_body",
    lang,
  ).replace("{name}", template.name)

  // ---- Modal body (usage_count > 0) — impact warning + secondary checkbox ----
  const deleteBodyInUse = adminWorkflowsT(
    "admin.workflows.delete_modal_body_in_use",
    lang,
  )
    .replace("{name}", template.name)
    .replace("{count}", String(activeProjectCount))

  return (
    <span style={{ display: "inline-flex" }}>
      <MoreMenu items={items} />

      {/* Branch 1: usage_count === 0 → plain ConfirmDialog tone="danger". */}
      <ConfirmDialog
        open={confirmOpenSimple}
        title={adminWorkflowsT("admin.workflows.delete_modal_title", lang)}
        body={deleteBodySimple}
        confirmLabel={adminWorkflowsT("admin.workflows.delete", lang)}
        cancelLabel={adminWorkflowsT("admin.cancel", lang)}
        tone="danger"
        onConfirm={handleDeleteFire}
        onCancel={() => setConfirmOpenSimple(false)}
      />

      {/* Branch 2: usage_count > 0 → Modal with warning body + "Yine de sil"
          secondary checkbox + danger CTA gated on the checkbox.
          ConfirmDialog can't host a custom Checkbox in its body (it accepts
          only a string), so we escape to the Modal primitive (Plan 14-01)
          which provides Header / Body / Footer slots. Same defense-in-depth
          pattern Plan 14-05 used for the Sil typing gate. */}
      <Modal
        open={confirmOpenInUse}
        onClose={() => {
          setConfirmOpenInUse(false)
          setYineDeSil(false)
        }}
        width={460}
      >
        <ModalHeader>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <AlertTriangle size={14} color="var(--priority-critical)" />
            {adminWorkflowsT("admin.workflows.delete_modal_title", lang)}
          </span>
        </ModalHeader>
        <ModalBody>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontSize: 13,
              color: "var(--fg-muted)",
              lineHeight: 1.5,
            }}
          >
            <p style={{ margin: 0 }}>{deleteBodyInUse}</p>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                color: "var(--fg)",
              }}
            >
              <input
                type="checkbox"
                checked={yineDeSil}
                onChange={(e) => setYineDeSil(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  cursor: "pointer",
                  accentColor: "var(--priority-critical)",
                }}
              />
              <span>
                {adminWorkflowsT(
                  "admin.workflows.delete_in_use_checkbox_label",
                  lang,
                )}
              </span>
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setConfirmOpenInUse(false)
              setYineDeSil(false)
            }}
          >
            {adminWorkflowsT("admin.cancel", lang)}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!canDelete}
            onClick={handleDeleteFire}
          >
            {adminWorkflowsT("admin.workflows.delete", lang)}
          </Button>
        </ModalFooter>
      </Modal>
    </span>
  )
}

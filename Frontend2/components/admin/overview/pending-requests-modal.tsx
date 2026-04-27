"use client"

// Phase 14 Plan 14-02 Task 2 — Pending Requests "Tümünü gör" Modal
// (UI-SPEC §Surface B + Modal anatomy + Plan 14-01 Modal primitive).
//
// Width: 640 per UI-SPEC §Spacing line 89. Body: scrollable list reading
// usePendingJoinRequests(50) — for v2.0 we ship a single 50-row scroll
// (no offset pagination yet; the volume of pending requests is bounded by
// org size). The pagination control is a v2.1 candidate.

import * as React from "react"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  DataState,
  Avatar,
  type AvatarUser,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminT } from "@/lib/i18n/admin-keys"
import { usePendingJoinRequests } from "@/hooks/use-pending-join-requests"
import { useApproveJoinRequest } from "@/hooks/use-approve-join-request"
import { useRejectJoinRequest } from "@/hooks/use-reject-join-request"
import { formatRelativeTime } from "@/lib/activity-date-format"
import { getInitials } from "@/lib/initials"
import type { PendingJoinRequest } from "@/services/admin-join-request-service"

interface PendingRequestsModalProps {
  open: boolean
  onClose: () => void
}

export function PendingRequestsModal({
  open,
  onClose,
}: PendingRequestsModalProps) {
  const { language } = useApp()
  // Modal pulls a wider list than the card (50 vs 5). When the user closes
  // the modal the cache stays warm; reopening is instant.
  const q = usePendingJoinRequests(50)
  const approveM = useApproveJoinRequest()
  const rejectM = useRejectJoinRequest()
  const items: PendingJoinRequest[] = q.data?.items ?? []

  const dashGlue = adminT("admin.overview.pending_requests_dash", language)
  const userGlue = adminT("admin.overview.pending_requests_glue_user", language)
  const projectSuffix = adminT(
    "admin.overview.pending_requests_glue_project_suffix",
    language,
  )

  return (
    <Modal open={open} onClose={onClose} width={640}>
      <ModalHeader>
        {adminT("admin.overview.pending_requests_modal_title", language)}
      </ModalHeader>
      <ModalBody>
        <DataState
          loading={q.isLoading}
          error={q.error}
          empty={!q.isLoading && items.length === 0}
          emptyFallback={
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                fontSize: 12.5,
                color: "var(--fg-subtle)",
              }}
            >
              {adminT("admin.overview.pending_requests_empty", language)}
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((r, i) => {
              const pmName = r.requestedBy?.full_name || ""
              const userName = r.targetUser?.full_name || ""
              const projectName = r.project?.name || ""
              const pmFirst = pmName.split(" ")[0] || pmName
              const userFirst = userName.split(" ")[0] || userName
              const pmAv: AvatarUser = {
                initials: getInitials(pmName) || "?",
                avColor: ((r.requestedBy?.id ?? 0) % 8) + 1,
              }
              const userAv: AvatarUser = {
                initials: getInitials(userName) || "?",
                avColor: ((r.targetUser?.id ?? 0) % 8) + 1,
              }
              const time = r.created_at
                ? formatRelativeTime(r.created_at, language)
                : ""

              return (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    padding: "14px 4px",
                    borderBottom:
                      i < items.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    alignItems: "center",
                  }}
                >
                  {/* Avatars (PM → user) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Avatar
                      user={pmAv}
                      size={26}
                      href={
                        r.requestedBy?.id
                          ? `/users/${r.requestedBy.id}`
                          : undefined
                      }
                    />
                    <span style={{ color: "var(--fg-subtle)", fontSize: 11 }}>
                      →
                    </span>
                    <Avatar
                      user={userAv}
                      size={26}
                      href={
                        r.targetUser?.id
                          ? `/users/${r.targetUser.id}`
                          : undefined
                      }
                    />
                  </div>

                  {/* Primary line + optional note + relative time */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{pmFirst}</span>{" "}
                      <span style={{ color: "var(--fg-muted)" }}>
                        {dashGlue}
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>{userFirst}</span>{" "}
                      <span style={{ color: "var(--fg-muted)" }}>
                        {userGlue}
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>{projectName}</span>
                      {projectSuffix && (
                        <span style={{ color: "var(--fg-muted)" }}>
                          {" "}
                          {projectSuffix}
                        </span>
                      )}
                    </div>
                    {r.note && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--fg-muted)",
                          marginTop: 4,
                          padding: 6,
                          background: "var(--surface-2)",
                          borderRadius: 4,
                          fontStyle: "italic",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        &quot;{r.note}&quot;
                      </div>
                    )}
                    {time && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--fg-subtle)",
                          marginTop: 4,
                        }}
                        className="mono"
                      >
                        {time}
                      </div>
                    )}
                  </div>

                  {/* Approve / Reject — same hooks as the top-5 card */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={approveM.isPending}
                      onClick={() => approveM.mutate(r.id)}
                    >
                      {adminT(
                        "admin.overview.pending_requests_approve",
                        language,
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={rejectM.isPending}
                      onClick={() => rejectM.mutate(r.id)}
                    >
                      {adminT(
                        "admin.overview.pending_requests_reject",
                        language,
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </DataState>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {adminT("admin.overview.pending_requests_modal_close", language)}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

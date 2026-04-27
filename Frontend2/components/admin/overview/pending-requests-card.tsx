"use client"

// Phase 14 Plan 14-02 Task 2 — Pending Requests Card (top-5 + Tümünü gör
// modal). UI-SPEC §Surface B + prototype admin.jsx lines 63-99.
//
// D-W2: Approve/Reject use the Plan 14-01 optimistic-update hooks
// (useApproveJoinRequest / useRejectJoinRequest) — onMutate snapshots cache,
// onError reverts, onSuccess success toast.
//
// Primary-line glue: verbatim prototype TR sandwich
// "<b>{pm}</b> — <b>{user}</b> kullanıcısını <b>{project}</b> projesine
// eklemek istiyor". EN sandwich:
// "<b>{pm}</b> requested <b>{user}</b> to join <b>{project}</b>".
// Glue spans kept in admin-keys.ts under admin.overview.pending_requests_*.

import * as React from "react"
import { ArrowRight } from "lucide-react"

import {
  Card,
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
import { PendingRequestsModal } from "./pending-requests-modal"

export function PendingRequestsCard() {
  const { language } = useApp()
  const [modalOpen, setModalOpen] = React.useState(false)

  const q = usePendingJoinRequests(5)
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
    <>
      <Card padding={0}>
        {/* Header — title + Tümünü gör */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {adminT("admin.overview.pending_requests_title", language)}
          </div>
          <div style={{ flex: 1 }} />
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setModalOpen(true)}
          >
            {adminT("admin.overview.pending_requests_view_all", language)}
          </Button>
        </div>

        {/* Body — DataState fallback + row list */}
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
          <div>
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
                    padding: "14px 16px",
                    borderBottom:
                      i < items.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  {/* Avatars (PM → user) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
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
                    <ArrowRight
                      size={13}
                      style={{ color: "var(--fg-subtle)" }}
                    />
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

                  {/* Primary line + optional italic note + time */}
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

                  {/* Approve / Reject (D-W2 optimistic via Plan 14-01 hooks) */}
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
      </Card>

      <PendingRequestsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}

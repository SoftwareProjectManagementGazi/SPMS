"use client"

// Reports migration v2 Wave 3 — TeamLoadCard.
//
// Faithful port of the prototype Team Load card
// (New_Frontend/src/pages/misc.jsx:397-410): list of 6 user rows with
// Avatar + name + ProgressBar + percent. Threshold colors from prototype
// line 405 (>85 red / >65 amber / else blue) map onto our oklch tokens.
//
// Capability gating: page composer reads caps.team_load and passes
// `applicable`. When false (no members) we render an inline capability
// AlertBanner inside the card body so the slot is reserved in the grid;
// returning null would collapse the layout vertically.

import * as React from "react"
import { Card, ProgressBar, Avatar, AlertBanner, DataState } from "@/components/primitives"
import type { AvatarUser } from "@/components/primitives/avatar"
import { useApp } from "@/context/app-context"
import { useTeamLoad } from "@/hooks/use-team-load"
import type { ReportFilters, TeamLoadEntry } from "@/services/report-service"

export interface TeamLoadCardProps {
  filters: ReportFilters
  /** Capability gate from useChartCapabilities.
   *  false → AlertBanner (no members); true → list; null → idle/loading. */
  applicable: boolean | null
  /** Cap on visible rows (prototype defaults to 6). */
  limit?: number
}

const RED_THRESHOLD = 85
const AMBER_THRESHOLD = 65

function loadColor(load: number): string {
  if (load > RED_THRESHOLD) return "var(--priority-critical)"
  if (load > AMBER_THRESHOLD) return "var(--status-review)"
  return "var(--status-progress)"
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Stable avColor derivation so the same user keeps the same colour across
 *  renders even though the BE response doesn't include one. Sums the
 *  character codes of the user_id string (or full_name as fallback) and
 *  buckets into the 8 --av-* tokens. */
function avColorFor(entry: TeamLoadEntry): number {
  const seed =
    entry.userId != null && entry.userId !== 0
      ? String(entry.userId)
      : entry.fullName
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return (sum % 8) + 1
}

function TeamRow({ entry }: { entry: TeamLoadEntry }) {
  const user: AvatarUser = {
    initials: initialsOf(entry.fullName),
    avColor: avColorFor(entry),
  }
  // Prototype shows the FIRST NAME only — same convention so the row fits
  // on narrow widths without ellipsis.
  const firstName = entry.fullName.split(/\s+/)[0] || entry.fullName
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 0",
        fontSize: 12,
      }}
    >
      <Avatar user={user} size={22} />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {firstName}
      </span>
      <ProgressBar
        value={entry.loadPct}
        height={6}
        style={{ width: 140 }}
        color={loadColor(entry.loadPct)}
      />
      <span
        className="mono"
        style={{ width: 34, textAlign: "right", color: "var(--fg-muted)" }}
      >
        {entry.loadPct}%
      </span>
    </div>
  )
}

export function TeamLoadCard({
  filters,
  applicable,
  limit = 6,
}: TeamLoadCardProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const query = useTeamLoad(filters, applicable === true)

  const rows = (query.data?.loadEntries ?? []).slice(0, limit)
  const empty = !rows.length

  return (
    <Card padding={16}>
      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
        {T("Takım Yükü", "Team Load")}
      </h3>
      {applicable === false ? (
        <AlertBanner tone="info">
          {T(
            "Takım Yükü için projeye en az bir üye eklenmelidir.",
            "Team Load requires the project to have at least one member.",
          )}
        </AlertBanner>
      ) : (
        <DataState
          // Reports v2 audit FE-2: when capabilities are still loading
          // (applicable === null) the hook is disabled, so query.isLoading
          // is false → DataState would skip to empty/no-data. Force-loading
          // until caps resolve avoids the misleading "No active tasks"
          // flash before we know whether the card should render at all.
          loading={applicable === null || query.isLoading}
          loadingFallback={
            <div aria-busy="true" aria-label="Yükleniyor" style={{ minHeight: 160 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 22, marginBottom: 12, borderRadius: 4 }}
                />
              ))}
            </div>
          }
          error={query.error}
          empty={empty}
          emptyFallback={
            <div
              style={{
                color: "var(--fg-subtle)",
                fontSize: 12,
                padding: "32px 0",
                textAlign: "center",
              }}
            >
              {T(
                "Aktif görev yok — yük göstergesi boş.",
                "No active tasks — load indicator empty.",
              )}
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((entry) => (
              <TeamRow key={entry.userId} entry={entry} />
            ))}
          </div>
        </DataState>
      )}
    </Card>
  )
}

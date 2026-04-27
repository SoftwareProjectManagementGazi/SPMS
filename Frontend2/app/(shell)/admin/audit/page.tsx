"use client"

// Phase 14 Plan 14-07 — /admin/audit (Audit) sub-route page.
//
// URL-driven filter state (D-C5 — bookmarklenebilir audit links):
//   ?from={iso}&to={iso}&actor_id={n}&action_prefix={str}&size={50}&offset={n}
//
// On filter changes we call router.replace(?...) so the URL stays in sync.
// localStorage is NOT used here (different from /admin/users where filters
// use localStorage — D-C5 specifies URL for /admin/audit because audit
// links are commonly shared in tickets).
//
// Lazy load (D-C6): the AdminAuditTable is dynamic-imported with ssr:false
// + DataState loading fallback. This keeps the /admin Overview bundle
// small — the audit table + its row component graph isn't needed until
// the user navigates to this tab.
//
// useSearchParams Suspense (Next.js 16): per the workflow-editor pattern
// (Frontend2/app/(shell)/workflow-editor/page.tsx), the inner component
// that calls useSearchParams() is wrapped in <Suspense fallback={null}/>
// to avoid the CSR-bailout build error.

import * as React from "react"
import dynamic from "next/dynamic"
import {
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation"

import { Card, DataState } from "@/components/primitives"
import type { AdminAuditFilter } from "@/services/admin-audit-service"

import { AdminAuditToolbar } from "@/components/admin/audit/admin-audit-toolbar"
import { AuditFilterChips } from "@/components/admin/audit/audit-filter-chips"
import { AuditFilterModal } from "@/components/admin/audit/audit-filter-modal"

// D-C6 lazy load — the table component is the heaviest part of this
// surface (it pulls in ActivityRow + the audit-row grid + pagination).
// Dynamic import with ssr:false + a DataState loading fallback keeps the
// /admin Overview bundle small.
const AdminAuditTable = dynamic(
  () =>
    import("@/components/admin/audit/admin-audit-table").then(
      (m) => m.AdminAuditTable,
    ),
  {
    ssr: false,
    loading: () => (
      <Card padding={0}>
        <DataState loading>{null}</DataState>
      </Card>
    ),
  },
)

// ---------------------------------------------------------------------------
// URL <-> filter encoding
// ---------------------------------------------------------------------------

const DEFAULT_SIZE = 50

function parseFilterFromParams(
  params: URLSearchParams,
): AdminAuditFilter {
  const filter: AdminAuditFilter = {}
  const from = params.get("from")
  const to = params.get("to")
  const actorId = params.get("actor_id")
  const actionPrefix = params.get("action_prefix")
  const size = params.get("size")
  const offset = params.get("offset")

  if (from) filter.date_from = from
  if (to) filter.date_to = to
  if (actorId) {
    const n = parseInt(actorId, 10)
    if (!Number.isNaN(n)) filter.actor_id = n
  }
  if (actionPrefix) filter.action_prefix = actionPrefix
  filter.limit = size ? parseInt(size, 10) || DEFAULT_SIZE : DEFAULT_SIZE
  filter.offset = offset ? parseInt(offset, 10) || 0 : 0
  return filter
}

function filterToParams(f: AdminAuditFilter): URLSearchParams {
  const p = new URLSearchParams()
  if (f.date_from) p.set("from", f.date_from)
  if (f.date_to) p.set("to", f.date_to)
  if (f.actor_id !== undefined) p.set("actor_id", String(f.actor_id))
  if (f.action_prefix) p.set("action_prefix", f.action_prefix)
  if (f.limit && f.limit !== DEFAULT_SIZE) p.set("size", String(f.limit))
  if (f.offset && f.offset !== 0) p.set("offset", String(f.offset))
  return p
}

// ---------------------------------------------------------------------------
// Page (Suspense wrapper required for useSearchParams in Next.js 16)
// ---------------------------------------------------------------------------

export default function AdminAuditPage() {
  return (
    <React.Suspense fallback={null}>
      <AdminAuditPageInner />
    </React.Suspense>
  )
}

function AdminAuditPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? "/admin/audit"

  // Re-derive the filter on every searchParams change so the URL is the
  // single source of truth. Bookmark-paste lands directly on the right
  // filter set (D-C5).
  const filter = React.useMemo<AdminAuditFilter>(
    () => parseFilterFromParams(searchParams ?? new URLSearchParams()),
    [searchParams],
  )

  const [modalOpen, setModalOpen] = React.useState(false)

  // ---- Filter mutation helpers ----
  //
  // Two semantics depending on caller intent:
  //
  // 1. updateFilter(partial) — MERGE the partial into the existing filter
  //    (chip × clears, toolbar Son 24 saat, pagination chevrons). Default
  //    behavior resets offset to 0 except when the caller explicitly
  //    passes only an offset (pagination chevron) per D-Z2.
  //
  // 2. replaceFilter(next)   — REPLACE the whole filter (modal Uygula and
  //    Temizle send the full intended shape; we don't merge with the
  //    pre-existing facets because the user just decided what they want).
  //
  // Both encode to URL via router.replace so the URL stays the source of
  // truth (D-C5).
  const writeFilter = React.useCallback(
    (next: AdminAuditFilter) => {
      const qs = filterToParams(next).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname],
  )

  const updateFilter = React.useCallback(
    (next: Partial<AdminAuditFilter>) => {
      const keys = Object.keys(next)
      const isOffsetOnlyChange = keys.length === 1 && "offset" in next
      const merged: AdminAuditFilter = {
        ...filter,
        ...next,
        // Default-reset offset on any non-pagination change (D-Z2).
        offset: isOffsetOnlyChange ? next.offset : next.offset ?? 0,
      }
      writeFilter(merged)
    },
    [filter, writeFilter],
  )

  const replaceFilter = React.useCallback(
    (next: AdminAuditFilter) => {
      // Modal-driven full replace. Force offset=0 since filter contents
      // changed (D-Z2) unless the caller explicitly set one.
      writeFilter({ ...next, offset: next.offset ?? 0 })
    },
    [writeFilter],
  )

  // Chip × clear — facet-scoped resets via updateFilter.
  const onClearChip = React.useCallback(
    (facet: "actor" | "action" | "date_range") => {
      if (facet === "actor") {
        updateFilter({ actor_id: undefined })
      } else if (facet === "action") {
        updateFilter({ action_prefix: undefined })
      } else if (facet === "date_range") {
        updateFilter({ date_from: undefined, date_to: undefined })
      }
    },
    [updateFilter],
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card padding={0}>
        <AdminAuditToolbar
          filter={filter}
          onUpdate={updateFilter}
          onOpenFilterModal={() => setModalOpen(true)}
        />
      </Card>

      <AuditFilterChips filter={filter} onClear={onClearChip} />

      <AdminAuditTable filter={filter} onUpdate={updateFilter} />

      <AuditFilterModal
        open={modalOpen}
        filter={filter}
        onApply={(next) => replaceFilter(next)}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}

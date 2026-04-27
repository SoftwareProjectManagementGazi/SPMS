"use client"

// Phase 14 Plan 14-05 — /admin/projects (Projeler) sub-route page.
//
// Composes the Projects tab end-to-end:
//   1. Toolbar — search + Dışa aktar (soft-disabled v2.1) + Yeni proje (router.push)
//   2. AdminProjectsTable — verbatim 8-col grid with archived rows + per-row MoreH
//
// Filter state persisted to localStorage key `spms.admin.projects.filter` per
// Phase 11 D-21 + CONTEXT D-C5 (same pattern as Plan 14-03 Users tab).
//
// CSV export (Dışa aktar): SOFT-DISABLED with tooltip "v2.1'de aktif olacak".
// Plan 14-01 only shipped /api/v1/admin/users.csv; the admin/projects.csv
// endpoint is deferred to v2.1. Defense in depth (button is disabled + tinted
// + tooltip) until the backend route lands.
//
// Yeni proje: router.push("/projects/new") — admins use the existing project
// create wizard from Phase 10 (NOT a fresh modal). Per UI-SPEC §Surface F line
// 427, "Yeni proje" is the verbatim copy + redirect target.

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Download, Plus } from "lucide-react"

import { Button, Input } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useLocalStoragePref } from "@/hooks/use-local-storage-pref"
import { adminProjectsT } from "@/lib/i18n/admin-projects-keys"

import { AdminProjectsTable } from "@/components/admin/projects/admin-projects-table"

const FILTER_STORAGE_KEY = "admin.projects.filter"

interface AdminProjectsFilter {
  q: string
}

const DEFAULT_FILTER: AdminProjectsFilter = {
  q: "",
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  // Filter state — persisted to localStorage so the search query survives
  // tab switches. The `spms.` prefix is added by useLocalStoragePref.
  const [filter, setFilter] = useLocalStoragePref<AdminProjectsFilter>(
    FILTER_STORAGE_KEY,
    DEFAULT_FILTER,
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow), var(--inset-card)",
        }}
      >
        <Input
          icon={<Search size={13} />}
          placeholder={adminProjectsT(
            "admin.projects.search_placeholder",
            lang,
          )}
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
          size="sm"
          style={{ width: 240 }}
        />
        <div style={{ flex: 1 }} />
        {/* Dışa aktar — SOFT-DISABLED. Plan 14-01 shipped /admin/users.csv only;
            /admin/projects.csv is deferred to v2.1. Defense in depth: disabled
            attribute + tooltip + no onClick (no .csv backend route to call). */}
        <span
          title={adminProjectsT(
            "admin.projects.export_disabled_tooltip",
            lang,
          )}
        >
          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={13} />}
            disabled
          >
            {adminProjectsT("admin.projects.export_button", lang)}
          </Button>
        </span>
        <Button
          size="sm"
          variant="primary"
          icon={<Plus size={13} />}
          onClick={() => router.push("/projects/new")}
        >
          {adminProjectsT("admin.projects.new_project", lang)}
        </Button>
      </div>

      <AdminProjectsTable filter={filter} />
    </div>
  )
}

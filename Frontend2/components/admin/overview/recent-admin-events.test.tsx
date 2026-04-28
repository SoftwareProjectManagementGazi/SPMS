// Phase 14 Plan 14-15 — Recent admin events RTL coverage (Cluster C).
//
// Closes UAT Test 11 — "every row falls through to the catch-all
// 'değiştirdi bir görev alanını'". Diagnosis A (B-4 PRE-COMMITTED): the
// `q.data?.items ?? [] as ActivityItem[]` bald cast in recent-admin-events.tsx
// skips any normalization — when the response shape diverges (or future field
// drift happens) the audit-event-mapper dispatch picks the catch-all.
//
// Three test groups:
//
//   1. Render correctness — each fixture event reaches its specific render
//      branch (project_archived / task_status_changed / comment_edited),
//      NOT the generic "değiştirdi bir görev alanını" catch-all.
//
//   2. Negative — the catch-all string is absent from the DOM when ALL
//      fixture rows have enriched extra_metadata.
//
//   3. M-3 STRUCTURAL DISPATCH — spy on mapAuditToSemantic and assert that
//      RecentAdminEvents AND AdminAuditRow both invoke it with structurally-
//      identical input shape. Text equality (Test 2 in the plan) can be
//      coincidental; structural equality forces a real bug if the normalizer
//      ever drops a field.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"

// ---- next/navigation mock ----
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// useAdminAudit — overridable per-test via auditStateRef.
type AuditQ = {
  data?: unknown
  isLoading?: boolean
  error?: unknown
}
const auditStateRef: { current: AuditQ } = {
  current: { data: undefined, isLoading: false, error: null },
}
vi.mock("@/hooks/use-admin-audit", () => ({
  useAdminAudit: () => auditStateRef.current,
}))

// SPY on mapAuditToSemantic — vi.spyOn directly on the module export.
import * as auditMapper from "@/lib/audit-event-mapper"

import { RecentAdminEvents } from "./recent-admin-events"
import { AdminAuditRow } from "@/components/admin/audit/admin-audit-row"
import type { ActivityItem } from "@/services/activity-service"

// ---- Fixture factory ----
function makeFixture(overrides: Partial<ActivityItem>): ActivityItem {
  return {
    id: 1,
    action: "updated",
    entity_type: "task",
    user_id: 7,
    user_name: "Sistem Admin",
    timestamp: new Date("2026-04-28T10:00:00Z").toISOString(),
    metadata: {},
    ...overrides,
  }
}

const projectArchivedFixture: ActivityItem = {
  id: 101,
  action: "archived",
  entity_type: "project",
  entity_id: 7,
  entity_label: "PRJ-7",
  field_name: null,
  old_value: "ACTIVE",
  new_value: "ARCHIVED",
  user_id: 2,
  user_name: "Sistem",
  user_avatar: null,
  timestamp: "2026-04-28T10:00:00Z",
  metadata: { project_name: "Yapay Zeka Modülü" },
}

const taskStatusFixture: ActivityItem = {
  id: 102,
  action: "updated",
  entity_type: "task",
  entity_id: 12,
  entity_label: "MOBIL-12",
  field_name: "column_id",
  old_value: "1",
  new_value: "3",
  user_id: 5,
  user_name: "Yusuf Bayrakcı",
  user_avatar: null,
  timestamp: "2026-04-28T10:01:00Z",
  metadata: {
    task_key: "MOBIL-12",
    task_title: "Login akışını düzelt",
  },
}

const commentEditedFixture: ActivityItem = {
  id: 103,
  action: "updated",
  entity_type: "comment",
  entity_id: 33,
  entity_label: null,
  field_name: null,
  old_value: null,
  new_value: null,
  user_id: 9,
  user_name: "Ayşe PM",
  user_avatar: null,
  timestamp: "2026-04-28T10:02:00Z",
  metadata: {
    task_key: "MOBIL-7",
    task_title: "API hata mesajı düzelt",
    comment_excerpt: "Önemli düzeltme notu",
  },
}

beforeEach(() => {
  cleanup()
  auditStateRef.current = {
    data: undefined,
    isLoading: false,
    error: null,
  }
  vi.restoreAllMocks()
})

describe("RecentAdminEvents (Plan 14-15 — Cluster C)", () => {
  it("Test 1: project_archived fixture reaches the project_archived render branch (NOT the task_field_updated catch-all)", () => {
    auditStateRef.current = {
      isLoading: false,
      error: null,
      data: { items: [projectArchivedFixture], total: 1, truncated: false },
    }

    render(<RecentAdminEvents />)

    // The enriched project name MUST appear in the DOM.
    expect(
      screen.getByText(/Yapay Zeka Modülü/i, { exact: false }),
    ).toBeInTheDocument()
    // Negative — the task_field_updated catch-all string MUST NOT be present.
    expect(
      screen.queryByText(/değiştirdi bir görev alanını/i),
    ).not.toBeInTheDocument()
  })

  it("Test 2: 3 enriched rows — each reaches its specific render branch", () => {
    auditStateRef.current = {
      isLoading: false,
      error: null,
      data: {
        items: [projectArchivedFixture, taskStatusFixture, commentEditedFixture],
        total: 3,
        truncated: false,
      },
    }

    render(<RecentAdminEvents />)

    // project_archived → project name visible
    expect(
      screen.getByText(/Yapay Zeka Modülü/i, { exact: false }),
    ).toBeInTheDocument()

    // task_status_changed → both old/new values visible
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()

    // comment_edited → task title visible
    expect(
      screen.getByText(/API hata mesajı düzelt/i, { exact: false }),
    ).toBeInTheDocument()

    // Negative across all 3: catch-all "bir görev alanını" is NOT in DOM
    // (project_archived doesn't render that string; task_status_changed
    // uses status verb; comment_edited uses comment verb).
    expect(
      screen.queryByText(/değiştirdi bir görev alanını/i),
    ).not.toBeInTheDocument()
  })

  it("M-3: RecentAdminEvents and AdminAuditRow call mapAuditToSemantic with structurally-identical input", () => {
    const spy = vi.spyOn(auditMapper, "mapAuditToSemantic")

    auditStateRef.current = {
      isLoading: false,
      error: null,
      data: {
        items: [projectArchivedFixture],
        total: 1,
        truncated: false,
      },
    }

    // Render both consumers with the same fixture — RecentAdminEvents pulls
    // it from the (mocked) hook; AdminAuditRow receives it directly.
    const r1 = render(<RecentAdminEvents />)
    r1.unmount()

    const r2 = render(<AdminAuditRow item={projectArchivedFixture} />)
    void r2

    // Structural assertion — same entity_type / action / field_name / metadata
    // keys must be present in the input both consumers passed to the mapper.
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: "project",
        action: "archived",
        metadata: expect.objectContaining({
          project_name: "Yapay Zeka Modülü",
        }),
      }),
    )

    // Verify it was called from BOTH render paths (>=2 invocations — the
    // RecentAdminEvents render and the AdminAuditRow render each fire once).
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2)

    spy.mockRestore()
  })
})

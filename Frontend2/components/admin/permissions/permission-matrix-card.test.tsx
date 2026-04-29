// Phase 14 Plan 14-04 (placeholder) → Phase 15 Plan 15-10 (RBAC active)
// — PermissionMatrixCard RTL tests.
//
// Atomic flip per D-2.7 + Pitfall 7: every Phase 14 14-04 case that asserted
// the placeholder defense (disabled toggles, v3.0 Badge present, Kopyala
// disabled) is FLIPPED to assert the active-state opposite. New cases verify
// the per-row scope badge (D-3.4) and Sistem column badge (D-2.4) shipped
// in this same atomic uplift.
//
// Cases:
//   1 (FLIPPED) — Toggles for non-Admin/Guest cells are NOT disabled.
//   2 (FLIPPED) — Card header has NO 'v3.0' text (Badge gone).
//   3 (FLIPPED) — 'Kopyala' button is ENABLED.
//   4 (NEW) — Sistem badge appears for is_system_role=true columns.
//   5 (NEW) — Per-row PermissionScopeBadge renders for each perm scope.
//   6 — Admin column toggles remain disabled (D-1.5 super-role).
//   7 — Guest column toggles remain disabled (D-2.4 read-only).
//   8 (NEW) — Loading state renders DataState fallback.
//   9 (NEW) — Error state renders AlertBanner.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/hooks/use-permission-matrix", () => ({
  usePermissionMatrix: vi.fn(),
}))
vi.mock("@/hooks/use-update-permission-cell", () => ({
  useUpdatePermissionCell: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  })),
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { usePermissionMatrix } from "@/hooks/use-permission-matrix"
import { PermissionMatrixCard } from "./permission-matrix-card"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockMatrix = {
  roles: [
    { id: 1, name: "Admin", is_system_role: true },
    { id: 2, name: "Project Manager", is_system_role: true },
    { id: 3, name: "Member", is_system_role: true },
    { id: 4, name: "Guest", is_system_role: true },
  ],
  permissions: [
    {
      id: 10,
      key: "task.create",
      label_tr: "Görev oluştur",
      label_en: "Create task",
      scope: "project" as const,
    },
    {
      id: 11,
      key: "admin.users.invite",
      label_tr: "Kullanıcı davet et",
      label_en: "Invite user",
      scope: "system" as const,
    },
  ],
  cells: [
    { role_id: 2, permission_id: 10, granted: true },
    { role_id: 3, permission_id: 10, granted: true },
  ],
}

describe("PermissionMatrixCard (Plan 15-10 — atomic uplift)", () => {
  beforeEach(() => {
    ;(usePermissionMatrix as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockMatrix,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
    })
  })

  it("Case 1 (FLIPPED) — PM toggle is ENABLED for non-system-role columns", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    const pmTaskCell = screen.getByLabelText("task.create for Project Manager")
    expect(pmTaskCell).not.toBeDisabled()
  })

  it("Case 2 (FLIPPED) — NO v3.0 Badge in card header (atomic uplift layer 3)", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    expect(screen.queryByText(/v3\.0/i)).not.toBeInTheDocument()
  })

  it("Case 3 (FLIPPED) — 'Kopyala' button is ENABLED (atomic uplift layer 5)", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    const kopyala = screen.getByRole("button", { name: /Kopyala/i })
    expect(kopyala).not.toBeDisabled()
  })

  it("Case 4 (NEW) — 'Sistem' badge renders for is_system_role=true columns", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    // 4 system roles in mockMatrix → at least 4 Sistem badges in headers.
    const sistemBadges = screen.getAllByText("Sistem")
    expect(sistemBadges.length).toBeGreaterThanOrEqual(4)
  })

  it("Case 5a (NEW) — '(proje)' scope badge renders for project-scoped perm", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    expect(screen.getByText("(proje)")).toBeInTheDocument()
  })

  it("Case 5b (NEW) — '(sistem)' scope badge renders for system-scoped perm", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    expect(screen.getByText("(sistem)")).toBeInTheDocument()
  })

  it("Case 6 — Admin column toggles are disabled (D-1.5 super-role retained)", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    const adminTaskCell = screen.getByLabelText("task.create for Admin")
    expect(adminTaskCell).toBeDisabled()
  })

  it("Case 7 — Guest column toggles are disabled (D-2.4 read-only retained)", () => {
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    const guestTaskCell = screen.getByLabelText("task.create for Guest")
    expect(guestTaskCell).toBeDisabled()
  })

  it("Case 8 (NEW) — loading state renders DataState fallback (no matrix)", () => {
    ;(usePermissionMatrix as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null,
    })
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    // DataState shows "Yükleniyor…" by default in TR; the matrix grid is
    // not rendered (no perm rows or "Kopyala" button).
    expect(screen.queryByRole("button", { name: /Kopyala/i })).toBeNull()
  })

  it("Case 9 (NEW) — error state renders AlertBanner (no matrix)", () => {
    ;(usePermissionMatrix as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new Error("network"),
    })
    render(<PermissionMatrixCard />, { wrapper: makeWrapper() })
    // Error AlertBanner copy in TR — exact match against the i18n string.
    expect(screen.getByText(/İzin matrisi alınamadı/i)).toBeInTheDocument()
  })

  it("Case 10 (NEW) — renders all permission rows from the API matrix", () => {
    const { container } = render(<PermissionMatrixCard />, {
      wrapper: makeWrapper(),
    })
    const rows = container.querySelectorAll("[data-permission-row-key]")
    // mockMatrix has 2 perms — the count is dynamic now (was hardcoded to
    // 14 in Phase 14 14-04).
    expect(rows.length).toBe(2)
  })
})

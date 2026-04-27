// Phase 14 Plan 14-05 Task 1 — AdminProjectsTable RTL tests.
//
// Verifies 4 mandatory cases per <behavior>:
//   1. Loading: useProjects returns isLoading=true → DataState loading rendered.
//   2. 3 mock projects (1 archived) → 3 rows rendered, archived row has 0.6 opacity.
//   3. Per-row MoreH menu has EXACTLY 2 items "Arşivle" + "Sil" — D-B5 absence:
//      queryByText("Transfer") and queryByText("Sahipliği") both return null.
//   4. Click Sil → Modal opens with disabled primary delete button until the
//      typed key matches `project.key` (two-step typing confirm).
//
// MoreMenu is NOT stubbed in cases 3 + 4 — we want the real menu open + items
// rendered so we can assert presence/absence. We DO stub the per-row Modal
// portal mechanics by reading native `<dialog>` / `role="dialog"` attributes.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

// ---- next/navigation mock ----
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/projects",
  useSearchParams: () => new URLSearchParams(),
}))

// ---- next/link mock ----
vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

// ---- useApp / useAuth mocks ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, email: "[email protected]", role: { name: "Admin" } },
    token: "x",
    isLoading: false,
  }),
}))

// ---- useToast mock ----
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

// ---- useProjects mock — overridable per-test ----
type ProjectsQ = {
  data?: unknown
  isLoading?: boolean
  error?: unknown
}
const projectsStateRef: { current: ProjectsQ } = {
  current: { data: [], isLoading: false, error: null },
}
vi.mock("@/hooks/use-projects", () => ({
  useProjects: () => projectsStateRef.current,
  useUpdateProjectStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteProject: () => ({ mutate: vi.fn(), isPending: false }),
}))

// We use the REAL MoreMenu component so menu-item presence/absence assertions
// are meaningful. No mock for "@/components/admin/shared/more-menu".

// SUT — imported AFTER all mocks are wired
import { AdminProjectsTable } from "./admin-projects-table"

const MOCK_PROJECTS = [
  {
    id: 11,
    key: "ALPHA",
    name: "Alpha Project",
    status: "ACTIVE",
    methodology: "scrum",
    managerId: 5,
    managerName: "Alice Admin",
    managerAvatar: null,
    progress: 0.62,
    columns: [],
    boardColumns: [],
    description: null,
    startDate: "2026-01-01",
    endDate: null,
    processTemplateId: null,
    processConfig: null,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: 22,
    key: "BETA",
    name: "Beta Kanban",
    status: "ACTIVE",
    methodology: "kanban",
    managerId: 6,
    managerName: "Bob PM",
    managerAvatar: null,
    progress: 0.3,
    columns: [],
    boardColumns: [],
    description: null,
    startDate: "2026-02-01",
    endDate: null,
    processTemplateId: null,
    processConfig: null,
    createdAt: "2026-02-10T09:00:00Z",
  },
  {
    id: 33,
    key: "GAMMA",
    name: "Gamma Archived",
    status: "ARCHIVED",
    methodology: "waterfall",
    managerId: 7,
    managerName: "Carol Lead",
    managerAvatar: null,
    progress: 1.0,
    columns: [],
    boardColumns: [],
    description: null,
    startDate: "2025-09-01",
    endDate: "2026-01-30",
    processTemplateId: null,
    processConfig: null,
    createdAt: "2025-09-01T08:00:00Z",
  },
]

describe("AdminProjectsTable (Plan 14-05 Task 1)", () => {
  beforeEach(() => {
    projectsStateRef.current = { data: [], isLoading: false, error: null }
  })

  it("Case 1 — isLoading=true → renders DataState loading copy", () => {
    projectsStateRef.current = { isLoading: true, data: undefined }
    render(<AdminProjectsTable filter={{ q: "" }} />)
    // DataState's default TR loading copy
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument()
  })

  it("Case 2 — renders 3 projects; archived row has opacity 0.6", () => {
    projectsStateRef.current = { isLoading: false, data: MOCK_PROJECTS }
    render(<AdminProjectsTable filter={{ q: "" }} />)
    // All 3 names rendered.
    expect(screen.getByText("Alpha Project")).toBeInTheDocument()
    expect(screen.getByText("Beta Kanban")).toBeInTheDocument()
    expect(screen.getByText("Gamma Archived")).toBeInTheDocument()

    // The archived row uses opacity 0.6 inline. We grab the row container by
    // walking up from the project name to the row wrapper that owns the
    // gridTemplateColumns style — its style.opacity should be "0.6".
    const archivedNameNode = screen.getByText("Gamma Archived")
    // Walk up until a div with role=row OR with grid template columns inline
    // appears.
    let cur: HTMLElement | null = archivedNameNode
    let foundRowWithOpacity = false
    while (cur && cur.parentElement) {
      const op = cur.style.opacity
      if (op && parseFloat(op) <= 0.65) {
        foundRowWithOpacity = true
        break
      }
      cur = cur.parentElement
    }
    expect(foundRowWithOpacity).toBe(true)
  })

  it("Case 3 — MoreH on row 1 opens menu with EXACTLY Arşivle + Sil; NO transfer-ownership", () => {
    projectsStateRef.current = { isLoading: false, data: MOCK_PROJECTS }
    render(<AdminProjectsTable filter={{ q: "" }} />)

    // Click the FIRST row's MoreH trigger button. The shared MoreMenu primitive
    // renders the trigger as a ghost icon Button with aria-label="İşlemler".
    // Note: Turkish dotless-i / dotted-I makes /i flag matching unreliable in
    // JS regex, so we look up the trigger by its literal aria-label string.
    const triggers = screen.getAllByLabelText("İşlemler")
    expect(triggers.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(triggers[0])

    // After click, exactly 2 visible menu items should appear: Arşivle + Sil.
    // We assert presence of both AND absence of the D-B5 banned phrases.
    const menus = screen.getAllByRole("menu")
    expect(menus.length).toBeGreaterThanOrEqual(1)
    const items = within(menus[0]).getAllByRole("menuitem")
    // Exactly 2 menu items per D-B5 (Arşivle + Sil — NO transfer).
    expect(items).toHaveLength(2)
    // Item labels visible in the menu.
    expect(within(menus[0]).getByText("Arşivle")).toBeInTheDocument()
    expect(within(menus[0]).getByText("Sil")).toBeInTheDocument()
    // D-B5 absence assertions — these strings MUST NOT appear in the menu.
    expect(within(menus[0]).queryByText(/transfer/i)).toBeNull()
    expect(within(menus[0]).queryByText(/sahipli/i)).toBeNull()
    expect(within(menus[0]).queryByText(/ownership/i)).toBeNull()
  })

  it("Case 4 — Sil click opens Modal with two-step key-typing confirm; primary CTA disabled until match", () => {
    projectsStateRef.current = { isLoading: false, data: MOCK_PROJECTS }
    render(<AdminProjectsTable filter={{ q: "" }} />)

    // Open MoreH on row 1 (Alpha — key="ALPHA")
    // Note: Turkish dotless-i / dotted-I makes /i flag matching unreliable in
    // JS regex, so we look up the trigger by its literal aria-label string.
    const triggers = screen.getAllByLabelText("İşlemler")
    fireEvent.click(triggers[0])

    // Click "Sil" inside the menu.
    const menus = screen.getAllByRole("menu")
    const silItem = within(menus[0]).getByText("Sil")
    fireEvent.click(silItem)

    // Modal opens — find the dialog node.
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()
    // The instructions copy mentions the project key to type ("ALPHA").
    expect(within(dialog).getByText(/ALPHA/)).toBeInTheDocument()

    // The Sil button (variant=danger) inside the modal MUST be disabled
    // before the user types the key.
    const confirmBtn = within(dialog).getByRole("button", { name: /^sil$/i })
    expect(confirmBtn).toBeDisabled()

    // Type a wrong value first → still disabled.
    const keyInput = within(dialog).getByPlaceholderText("ALPHA")
    fireEvent.change(keyInput, { target: { value: "ALPH" } })
    expect(confirmBtn).toBeDisabled()

    // Type the exact project key → CTA enables.
    fireEvent.change(keyInput, { target: { value: "ALPHA" } })
    expect(confirmBtn).not.toBeDisabled()
  })
})

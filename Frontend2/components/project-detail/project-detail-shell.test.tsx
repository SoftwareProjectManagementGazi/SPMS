import * as React from "react"
import { describe, expect, it, beforeEach, vi } from "vitest"
import { act, fireEvent, renderHook } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"
import { ProjectDetailShell } from "./project-detail-shell"
import {
  ProjectDetailProvider,
  useProjectDetail,
} from "./project-detail-context"

// Stub the lazy-loaded settings tab so the suspense path resolves synchronously
// in unit tests — the real sub-tab content is verified by Task 2 tests.
vi.mock("./settings-tab", () => ({
  SettingsTab: () => <div>Settings stub</div>,
}))

// Stub the HTTP client — Plan 11-05 BoardTab fires GET /tasks/project/{id}
// and /projects/{id}/columns on mount. Return empty arrays so the BoardTab
// can render columns with zero cards (no toolbar errors, no net requests).
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

// Plan 12-02: SummaryStrip uses next/navigation's useRouter for the "Düzenle"
// button. The shell test isn't running inside a Next.js app shell, so stub
// the navigation module like the other unit tests do.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

describe("ProjectDetailShell", () => {
  it("renders all 8 tabs with Turkish labels by default", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText("Pano")).toBeInTheDocument()
    expect(getByText("Liste")).toBeInTheDocument()
    expect(getByText("Zaman Çizelgesi")).toBeInTheDocument()
    expect(getByText("Takvim")).toBeInTheDocument()
    expect(getByText("Aktivite")).toBeInTheDocument()
    expect(getByText("Yaşam Döngüsü")).toBeInTheDocument()
    expect(getByText("Üyeler")).toBeInTheDocument()
    expect(getByText("Ayarlar")).toBeInTheDocument()
  })

  it("defaults to the Pano (board) tab and mounts the BoardTab toolbar", () => {
    // Plan 11-05 wired the Board tab into the shell — the placeholder is gone.
    // Assert on a unique BoardToolbar element (the Sıkı density button) which
    // is not rendered by any other tab.
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText("Sıkı")).toBeInTheDocument()
    expect(getByText("Detaylı")).toBeInTheDocument()
  })

  it("shows the Faz 13 stub on the Aktivite tab", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Aktivite"))
    expect(getByText(/Faz 13'te aktive edilecek/)).toBeInTheDocument()
  })

  it("mounts the real LifecycleTab on the Yaşam Döngüsü tab (Plan 12-02 + 12-04)", () => {
    // The Phase 11 stub was replaced by <LifecycleTab/> in Plan 12-02. Plan
    // 12-04 then replaced the sub-tab placeholder div with the real Tabs
    // primitive (Genel Bakış / Kilometre Taşları / Geçmiş / Artefaktlar).
    // The mock projects fixture supplies a workflow with 3 nodes, so the
    // SummaryStrip renders with the "Düzenle" button + the Tabs primitive
    // mounts the Overview sub-tab content by default.
    const { getByText, getAllByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Yaşam Döngüsü"))
    // SummaryStrip "Düzenle" button is reliable — mode-chip + active-phase
    // badge depend on the BFS BUT "Düzenle" is unconditional.
    expect(getAllByText(/Düzenle/).length).toBeGreaterThan(0)
    // Plan 12-04: 4-sub-tab Tabs primitive renders the four labels.
    expect(getByText("Genel Bakış")).toBeInTheDocument()
    expect(getByText("Kilometre Taşları")).toBeInTheDocument()
    expect(getByText("Geçmiş")).toBeInTheDocument()
    expect(getByText("Artefaktlar")).toBeInTheDocument()
  })

  it("shows the project manager card on the Üyeler tab", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Üyeler"))
    // mockProjects[0].managerName === "Ayşe"
    expect(getByText("Ayşe")).toBeInTheDocument()
    expect(getByText("Yönetici")).toBeInTheDocument()
  })
})

// UAT bug fix — toggle pill must reopen the backlog panel after the panel's X
// button closed it. Pre-fix path used `() => setOpen(!open)` which could
// capture a stale `open` between renders. Post-fix uses the functional
// updater `setOpen((prev) => !prev)` so the close → reopen sequence is
// guaranteed to flip the state correctly. This RTL test exercises the full
// open → close (panel X) → reopen (toggle) flow end-to-end.
describe("ProjectDetailShell — backlog toggle close → reopen (UAT regression)", () => {
  beforeEach(() => {
    try {
      window.localStorage.clear()
    } catch {
      /* ignore */
    }
    // jsdom defaults innerWidth to 1024 (narrow). Force wide viewport so the
    // backlog panel is allowed to mount (D-54 narrow auto-close otherwise
    // forces effectiveOpen=false regardless of stored intent).
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1600,
    })
    window.dispatchEvent(new Event("resize"))
  })

  it("opens, closes via X, then reopens via toggle pill", () => {
    const { container, getAllByRole, queryByLabelText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )

    // Locate the toggle by its aria-label (Turkish default — matches the
    // BacklogToggle component's label string when language === "tr").
    const findToggle = (): HTMLButtonElement => {
      const btn = container.querySelector(
        'button[aria-label="Backlog\'u aç/kapat"]'
      ) as HTMLButtonElement | null
      if (!btn) throw new Error("Backlog toggle pill not found in DOM")
      return btn
    }

    // Initially closed (D-14 default, no localStorage value): the toggle is
    // present but the BacklogPanel renders null.
    const toggle = findToggle()
    expect(toggle).toBeInTheDocument()
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(queryByLabelText("Backlog paneli")).toBeNull()

    // 1) Click toggle → panel opens
    act(() => {
      fireEvent.click(toggle)
    })
    expect(queryByLabelText("Backlog paneli")).toBeInTheDocument()
    expect(findToggle().getAttribute("aria-expanded")).toBe("true")

    // 2) Click the panel's X button (aria-label="Kapat") → panel closes
    const closeButtons = getAllByRole("button", { name: "Kapat" })
    expect(closeButtons.length).toBeGreaterThan(0)
    act(() => {
      fireEvent.click(closeButtons[0])
    })
    expect(queryByLabelText("Backlog paneli")).toBeNull()
    expect(findToggle().getAttribute("aria-expanded")).toBe("false")

    // 3) Click toggle again → panel REOPENS (the bug was: it didn't).
    act(() => {
      fireEvent.click(findToggle())
    })
    expect(queryByLabelText("Backlog paneli")).toBeInTheDocument()
    expect(findToggle().getAttribute("aria-expanded")).toBe("true")
  })
})

describe("useProjectDetail", () => {
  it("throws when used outside a ProjectDetailProvider", () => {
    // Silence the error boundary log from renderHook — the thrown error IS the
    // assertion target, React will still warn once.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useProjectDetail())).toThrow(
      /ProjectDetailProvider/
    )
    spy.mockRestore()
  })

  it("exposes searchQuery, densityMode, phaseFilter and their setters", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProjectDetailProvider projectId={42}>{children}</ProjectDetailProvider>
    )
    const { result } = renderHook(() => useProjectDetail(), { wrapper })
    expect(result.current.projectId).toBe(42)
    expect(result.current.searchQuery).toBe("")
    expect(typeof result.current.setSearchQuery).toBe("function")
    expect(result.current.densityMode === "compact" || result.current.densityMode === "rich").toBe(true)
    expect(typeof result.current.setDensityMode).toBe("function")
    expect(result.current.phaseFilter).toBeNull()
    expect(typeof result.current.setPhaseFilter).toBe("function")
  })
})

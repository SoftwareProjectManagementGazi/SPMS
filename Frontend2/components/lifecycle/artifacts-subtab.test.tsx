// Unit tests for components/lifecycle/artifacts-subtab.tsx (Phase 12 Plan 12-06).
//
// Per Plan 12-06 Task 1 <behavior> Tests 1-10 covering:
//   1. Row table render — 5 artifacts as rows w/ name + status chip + son güncelleme + Avatar + more-kebab
//   2. Inline expand on click — clicking row toggles expanded panel below; sibling rows remain visible
//   3. Status SegmentedControl save — selecting "Tamam" + Kaydet, PATCH /artifacts/{id} body { status: 'done' }
//   4. Assignee path selection — when user.id === artifact.assignee_id, save uses /artifacts/{id}/mine
//   5. Single file upload — selecting 2 files, only first uploaded; useUploadArtifactFile.mutate called once
//   6. File 413 error — AlertBanner shows 'Dosya boyutu sınırı aşıldı (max 10MB).'
//   7. PM delete on 'not-created' — Sil in more-kebab; click DELETEs without confirmation
//   8. PM delete on 'draft' — soft warning ConfirmDialog appears
//   9. Custom add via inline-add row — Yeni Artefakt Ekle reveals MilestoneInlineAddRow-like pattern with name Input
//   10. Empty state — 'Bu metodoloji için tanımlı artefakt bulunamadı.'

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ArtifactsSubTab } from "./artifacts-subtab"
import type { WorkflowConfig } from "@/services/lifecycle-service"

// Mock i18n — Turkish-first.
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// Toast mock.
const showToastMock = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Auth mock — drive assignee-path selection in Test 4.
const authUserMock = vi.fn(() => ({
  user: { id: "1", name: "PM", email: "pm@x.io", role: { name: "Member" } },
  token: "x",
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
}))
vi.mock("@/context/auth-context", () => ({
  useAuth: () => authUserMock(),
}))

// Permission gate.
const transitionAuthorityMock = vi.fn(() => true)
vi.mock("@/hooks/use-transition-authority", () => ({
  useTransitionAuthority: (...args: unknown[]) => transitionAuthorityMock(...args),
}))

// API client mock for service layer.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from "@/lib/api-client"
const apiGet = apiClient.get as unknown as ReturnType<typeof vi.fn>
const apiPost = apiClient.post as unknown as ReturnType<typeof vi.fn>
const apiPatch = apiClient.patch as unknown as ReturnType<typeof vi.fn>
const apiDelete = apiClient.delete as unknown as ReturnType<typeof vi.fn>

function makeQc() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function wrap(node: React.ReactElement, qc?: QueryClient) {
  const client = qc ?? makeQc()
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>
}

const baseProject = {
  id: 7,
  key: "MOBIL",
  managerId: 1,
  methodology: "SCRUM",
}

function makeWorkflow(): WorkflowConfig {
  return {
    mode: "flexible",
    nodes: [
      { id: "planning", name: "Planlama", x: 0, y: 0, isInitial: true },
      { id: "execution", name: "Yürütme", x: 0, y: 0 },
      { id: "closure", name: "Kapanış", x: 0, y: 0, isFinal: true },
    ],
    edges: [],
    groups: [],
  }
}

const SCRUM_ARTIFACTS = [
  {
    id: 101,
    project_id: 7,
    name: "Sprint Planı",
    status: "not-created",
    assignee_id: 1,
    file_id: null,
    note: "",
    updated_at: "2026-04-20T00:00:00Z",
  },
  {
    id: 102,
    project_id: 7,
    name: "Sprint Backlog",
    status: "draft",
    assignee_id: 2,
    file_id: null,
    note: "",
    updated_at: "2026-04-21T00:00:00Z",
  },
  {
    id: 103,
    project_id: 7,
    name: "Daily Notes",
    status: "not-created",
    assignee_id: null,
    file_id: null,
    note: "",
    updated_at: "2026-04-22T00:00:00Z",
  },
  {
    id: 104,
    project_id: 7,
    name: "Sprint Review",
    status: "not-created",
    assignee_id: null,
    file_id: null,
    note: "",
    updated_at: "2026-04-23T00:00:00Z",
  },
  {
    id: 105,
    project_id: 7,
    name: "Retrospective",
    status: "not-created",
    assignee_id: null,
    file_id: null,
    note: "",
    updated_at: "2026-04-24T00:00:00Z",
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  showToastMock.mockReset()
  transitionAuthorityMock.mockReturnValue(true)
  authUserMock.mockReturnValue({
    user: { id: "1", name: "PM", email: "pm@x.io", role: { name: "Member" } },
    token: "x",
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })
  apiGet.mockReset()
  apiPost.mockReset()
  apiPatch.mockReset()
  apiDelete.mockReset()
  apiGet.mockResolvedValue({ data: [] })
})

describe("ArtifactsSubTab", () => {
  it("Test 1: row table render — 5 artifacts as rows with name + status + updated + Avatar + kebab", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Sprint Planı")).toBeInTheDocument()
      expect(screen.getByText("Sprint Backlog")).toBeInTheDocument()
      expect(screen.getByText("Daily Notes")).toBeInTheDocument()
      expect(screen.getByText("Sprint Review")).toBeInTheDocument()
      expect(screen.getByText("Retrospective")).toBeInTheDocument()
    })
  })

  it("Test 2: inline expand on click — clicking a row toggles expanded panel below it", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Sprint Planı")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Sprint Planı"))

    // Inline expand should reveal Kaydet + Kapat buttons + status SegmentedControl options
    await waitFor(() => {
      expect(screen.getByText("Kaydet")).toBeInTheDocument()
      expect(screen.getByText("Kapat")).toBeInTheDocument()
    })

    // Sibling rows still in DOM
    expect(screen.getByText("Sprint Backlog")).toBeInTheDocument()
  })

  it("Test 3: status SegmentedControl save — Tamam + Kaydet, PATCH /artifacts/{id} body { status: 'done' }", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })
    apiPatch.mockResolvedValueOnce({
      data: {
        ...SCRUM_ARTIFACTS[2],
        status: "done",
        updated_at: "2026-04-25T00:00:00Z",
      },
    })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Daily Notes")).toBeInTheDocument()
    })

    // Use Daily Notes (id=103, assignee_id=null) — PM path expected because
    // user is not the assignee.
    fireEvent.click(screen.getByText("Daily Notes"))
    await waitFor(() => {
      expect(screen.getByText("Tamam")).toBeInTheDocument()
    })

    // Click "Tamam" segmented option
    fireEvent.click(screen.getByText("Tamam"))

    // Click Kaydet
    fireEvent.click(screen.getByText("Kaydet"))

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledTimes(1)
    })

    const [url, body] = apiPatch.mock.calls[0]
    expect(url).toBe("/artifacts/103")
    expect(body).toMatchObject({ status: "done" })
    // Critical: revision NOT sent (T-12-06-03)
    expect((body as Record<string, unknown>).revision).toBeUndefined()
  })

  it("Test 4: assignee path selection — when user.id === artifact.assignee_id, save uses /artifacts/{id}/mine", async () => {
    // Artifact assignee_id=1 matches user.id=1 (mocked above) → assignee path expected
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })
    apiPatch.mockResolvedValueOnce({
      data: { ...SCRUM_ARTIFACTS[0], status: "draft" },
    })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Sprint Planı")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Sprint Planı"))
    // Wait for SegmentedControl to render (it has a button labeled Yok / Taslak / Tamam)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Tamam" })).toBeInTheDocument()
    })

    // Sprint Backlog row also shows "Taslak" as a status label, so disambiguate
    // by selecting the SegmentedControl button (role=button) over the span label.
    fireEvent.click(screen.getByRole("button", { name: "Taslak" }))
    fireEvent.click(screen.getByText("Kaydet"))

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledTimes(1)
    })
    const [url] = apiPatch.mock.calls[0]
    // Assignee path with /mine suffix
    expect(url).toBe("/artifacts/101/mine")
  })

  it("Test 5: single file upload — selecting 2 files only uploads the first; mutate called once", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })
    apiPost.mockResolvedValueOnce({
      data: { ...SCRUM_ARTIFACTS[0], file_id: 99 },
    })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Sprint Planı")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Sprint Planı"))

    // Locate the hidden file input
    const fileInput = await waitFor(() => {
      const inputs = document.querySelectorAll('input[type="file"]')
      expect(inputs.length).toBeGreaterThan(0)
      return inputs[0] as HTMLInputElement
    })

    const file1 = new File(["a"], "first.pdf", { type: "application/pdf" })
    const file2 = new File(["bb"], "second.pdf", { type: "application/pdf" })

    // Simulate change with 2 files. Only the first is consumed.
    Object.defineProperty(fileInput, "files", {
      value: [file1, file2],
      configurable: true,
    })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledTimes(1)
    })
    const [url] = apiPost.mock.calls[0]
    expect(url).toBe("/artifacts/101/file")
  })

  it("Test 6: file 413 error — AlertBanner shows 10MB limit message", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })
    apiPost.mockRejectedValueOnce({
      response: { status: 413, data: { detail: "Too big" } },
    })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Sprint Planı")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Sprint Planı"))

    const fileInput = await waitFor(() => {
      const inputs = document.querySelectorAll('input[type="file"]')
      expect(inputs.length).toBeGreaterThan(0)
      return inputs[0] as HTMLInputElement
    })

    const file = new File(["x".repeat(100)], "big.pdf", {
      type: "application/pdf",
    })
    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(
        screen.getByText(/Dosya boyutu sınırı aşıldı.*10MB/),
      ).toBeInTheDocument()
    })
  })

  it("Test 7: PM delete on 'not-created' — Sil click issues DELETE without confirmation", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })
    apiDelete.mockResolvedValueOnce({ data: null })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Daily Notes")).toBeInTheDocument()
    })

    // Daily Notes (id=103) status='not-created'. Open kebab and click Sil
    const kebabs = screen.getAllByRole("button", {
      name: /Daha Fazla|Daha fazla|More|Kebab/i,
    })
    // 5 artifacts → at least 5 kebabs. Click the third (Daily Notes index 2).
    expect(kebabs.length).toBeGreaterThanOrEqual(5)
    fireEvent.click(kebabs[2])

    // Sil item appears
    const silBtn = await waitFor(() => screen.getByText("Sil"))
    fireEvent.click(silBtn)

    // No ConfirmDialog appears for 'not-created'; DELETE issued directly
    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledTimes(1)
    })
    expect(apiDelete.mock.calls[0][0]).toBe("/artifacts/103")
  })

  it("Test 8: PM delete on 'draft' shows soft warning ConfirmDialog", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Sprint Backlog")).toBeInTheDocument()
    })

    // Sprint Backlog (id=102) is status='draft'. Open kebab → click Sil → ConfirmDialog appears
    const kebabs = screen.getAllByRole("button", {
      name: /Daha Fazla|Daha fazla|More|Kebab/i,
    })
    // Index 1 = Sprint Backlog
    fireEvent.click(kebabs[1])

    const silBtn = await waitFor(() => screen.getByText("Sil"))
    fireEvent.click(silBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/Bu artefakt taslak durumunda/i),
      ).toBeInTheDocument()
    })
  })

  it("Test 9: custom add via inline-add row — Yeni Artefakt Ekle reveals form with name Input + Save/Cancel", async () => {
    apiGet.mockResolvedValueOnce({ data: SCRUM_ARTIFACTS })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Sprint Planı")).toBeInTheDocument()
    })

    // The Yeni Artefakt Ekle button (or "Özel Ekle" alias).
    const addBtn = screen.getByRole("button", {
      name: /Yeni Artefakt|Özel Ekle/,
    })
    fireEvent.click(addBtn)

    // Name input + Save / Cancel become visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Artefakt adı/)).toBeInTheDocument()
    })
    expect(screen.getByText("Kaydet")).toBeInTheDocument()
    expect(screen.getByText("İptal")).toBeInTheDocument()
  })

  it("Test 10: empty state — no artifacts → 'Bu metodoloji için tanımlı artefakt bulunamadı.'", async () => {
    apiGet.mockResolvedValueOnce({ data: [] })

    render(
      wrap(
        <ArtifactsSubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
        />,
      ),
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Bu metodoloji için tanımlı artefakt bulunamadı/),
      ).toBeInTheDocument()
    })
  })
})

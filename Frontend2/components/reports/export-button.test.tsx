// Reports migration v2 Wave 5 — ExportButton tests.
//
// Real DOM assertions on observable behaviour. Mocks reportService at the
// module boundary so we exercise the actual ExportButton wiring (handler
// branching, loading state propagation, message channel callbacks). The
// `window.open` and `URL.createObjectURL` paths are stubbed at the JSDOM
// boundary so the test can verify which one each button triggers without
// trying to open a real popup.

import * as React from "react"
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/services/report-service", () => ({
  reportService: {
    exportPdf: vi.fn(),
    exportExcel: vi.fn(),
  },
}))
import { reportService } from "@/services/report-service"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { ExportButton, type ExportMessage } from "./export-button"

const FILTERS = { projectId: 42, dateFrom: "2026-04-20", dateTo: "2026-05-20" }
const FAKE_PDF = new Blob(["%PDF-1.4"], { type: "application/pdf" })
const FAKE_XLSX = new Blob(["PK"], {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
})

// Capture URL.createObjectURL / revokeObjectURL / window.open behaviour so
// we can assert what each button triggers without polluting JSDOM globals
// across tests.
let createdUrls: string[] = []
let revokedUrls: string[] = []
let openedUrls: string[] = []
const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL
const originalOpen = window.open

beforeEach(() => {
  vi.clearAllMocks()
  createdUrls = []
  revokedUrls = []
  openedUrls = []
  URL.createObjectURL = vi.fn((blob: Blob) => {
    const url = `blob:fake-${createdUrls.length}-${blob.size}`
    createdUrls.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url: string) => {
    revokedUrls.push(url)
  })
  // Default: window.open succeeds (returns a truthy stub Window).
  window.open = vi.fn((url?: string | URL) => {
    openedUrls.push(String(url))
    return { closed: false } as Window
  }) as typeof window.open
})

afterAll(() => {
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
  window.open = originalOpen
})

describe("ExportButton", () => {
  it("renders 3 buttons in TR: Önizle, PDF, Excel", () => {
    render(<ExportButton filters={FILTERS} />)
    expect(screen.getByRole("button", { name: /PDF'i yeni sekmede aç/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /PDF olarak indir/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Excel olarak indir/i })).toBeInTheDocument()
    expect(screen.getByText("Önizle")).toBeInTheDocument()
    expect(screen.getByText("PDF")).toBeInTheDocument()
    expect(screen.getByText("Excel")).toBeInTheDocument()
  })

  it("[Önizle] calls reportService.exportPdf, opens a blob URL in a new tab, and reports success", async () => {
    ;(reportService.exportPdf as any).mockResolvedValue(FAKE_PDF)
    const onMessage = vi.fn()
    render(<ExportButton filters={FILTERS} onMessage={onMessage} />)

    fireEvent.click(screen.getByRole("button", { name: /PDF'i yeni sekmede aç/i }))

    await waitFor(() =>
      expect(reportService.exportPdf).toHaveBeenCalledWith(FILTERS),
    )
    await waitFor(() => expect(openedUrls.length).toBe(1))
    // The URL opened is the blob URL we created — no force-download path.
    expect(openedUrls[0]).toMatch(/^blob:fake-/)
    expect(createdUrls.length).toBe(1)
    // No <a download> click was made for this path.
    expect(document.querySelectorAll("a[download]").length).toBe(0)
    // Success message dispatched.
    await waitFor(() =>
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "success",
          text: expect.stringMatching(/yeni sekmede açıldı/i),
        }),
      ),
    )
  })

  it("[Önizle] surfaces a distinct error when window.open is popup-blocked", async () => {
    ;(reportService.exportPdf as any).mockResolvedValue(FAKE_PDF)
    // Popup blocker stub.
    window.open = vi.fn(() => null) as typeof window.open
    const onMessage = vi.fn()
    render(<ExportButton filters={FILTERS} onMessage={onMessage} />)

    fireEvent.click(screen.getByRole("button", { name: /PDF'i yeni sekmede aç/i }))

    await waitFor(() => expect(onMessage).toHaveBeenCalled())
    const msg: ExportMessage = onMessage.mock.calls[0][0]
    expect(msg.variant).toBe("error")
    expect(msg.text).toMatch(/popup engellendi/i)
    // The blob URL was revoked immediately since the new tab never opened.
    expect(revokedUrls.length).toBe(1)
  })

  it("[PDF] downloads via anchor click and reports success", async () => {
    ;(reportService.exportPdf as any).mockResolvedValue(FAKE_PDF)
    const onMessage = vi.fn()
    render(<ExportButton filters={FILTERS} onMessage={onMessage} />)

    fireEvent.click(screen.getByRole("button", { name: /PDF olarak indir/i }))

    await waitFor(() =>
      expect(reportService.exportPdf).toHaveBeenCalledWith(FILTERS),
    )
    // window.open NOT called — that's the Önizle path, not download.
    expect(window.open).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "success",
          text: expect.stringMatching(/PDF indirildi/i),
        }),
      ),
    )
  })

  it("[Excel] downloads via the excel endpoint and reports success", async () => {
    ;(reportService.exportExcel as any).mockResolvedValue(FAKE_XLSX)
    const onMessage = vi.fn()
    render(<ExportButton filters={FILTERS} onMessage={onMessage} />)

    fireEvent.click(screen.getByRole("button", { name: /Excel olarak indir/i }))

    await waitFor(() =>
      expect(reportService.exportExcel).toHaveBeenCalledWith(FILTERS),
    )
    // PDF endpoint NOT called from the Excel path.
    expect(reportService.exportPdf).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "success",
          text: expect.stringMatching(/Excel indirildi/i),
        }),
      ),
    )
  })

  it("reports failure when the backend export throws", async () => {
    ;(reportService.exportPdf as any).mockRejectedValue(new Error("boom"))
    const onMessage = vi.fn()
    render(<ExportButton filters={FILTERS} onMessage={onMessage} />)

    fireEvent.click(screen.getByRole("button", { name: /PDF olarak indir/i }))

    await waitFor(() =>
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          text: expect.stringMatching(/Rapor oluşturulamadı/i),
        }),
      ),
    )
  })

  it("disables ALL 3 buttons when disabled prop is true (project not selected)", () => {
    render(<ExportButton filters={{ ...FILTERS, projectId: null }} disabled />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBe(3)
    for (const b of buttons) expect(b).toBeDisabled()
  })

  it("disables the other 2 buttons while one is in flight (single-busy lock)", async () => {
    // Hold the promise pending so we can observe the in-flight state.
    let resolvePdf: ((b: Blob) => void) | undefined
    ;(reportService.exportPdf as any).mockImplementation(
      () =>
        new Promise<Blob>((res) => {
          resolvePdf = res
        }),
    )
    render(<ExportButton filters={FILTERS} />)

    fireEvent.click(screen.getByRole("button", { name: /PDF olarak indir/i }))
    await waitFor(() => {
      const buttons = screen.getAllByRole("button")
      // All 3 disabled while in flight.
      for (const b of buttons) expect(b).toBeDisabled()
    })
    // Resolve so the component cleans up.
    resolvePdf?.(FAKE_PDF)
    await waitFor(() => expect(screen.getAllByRole("button")[0]).not.toBeDisabled())
  })
})

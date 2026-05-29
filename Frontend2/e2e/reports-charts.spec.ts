import { test, expect } from "@playwright/test"
import { setupMockBackend, jsonResponse } from "./support/mock-auth"

/**
 * Reports page /reports (Reports v2) — rebuilt to actually run.
 *
 * Mocks /projects (one project → the page auto-selects it into ?projectId) and
 * /projects/{id}/chart-capabilities. Every chart card renders its heading via
 * ChartCard regardless of data; cfd is gated OFF so the CFD card shows its
 * capability banner (the test accepts svg OR banner). Other /reports/* data
 * endpoints fall through to the harness defaults.
 */

const PROJECT = {
  id: 1,
  key: "PRJ",
  name: "E2E Project",
  description: null,
  start_date: "2026-01-01",
  end_date: null,
  status: "ACTIVE",
  methodology: "SCRUM",
  process_template_id: null,
  manager_id: null,
  manager_name: null,
  manager_avatar: null,
  columns: [
    { id: 1, name: "To Do" },
    { id: 2, name: "In Progress" },
    { id: 3, name: "Done" },
  ],
  process_config: {},
  created_at: "2026-01-01T00:00:00Z",
}

// cfd:false → the CFD card renders its capability banner (the test accepts
// svg OR banner); everything else applicable so the cards mount their charts.
const CAPS = {
  burndown: true,
  iteration: true,
  cfd: false,
  lead_cycle: true,
  phase_progress: true,
  team_load: true,
  summary: true,
}

test.describe("Reports page @reports-v2", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      routes: {
        "/projects/1/chart-capabilities": (r) => jsonResponse(r, CAPS),
        "/projects": (r) => jsonResponse(r, [PROJECT]),
      },
    })
    await page.goto("/reports")
  })

  test("loads /reports with heading, ProjectPicker, ExportButton group", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: /Raporlar|Reports/ }),
    ).toBeVisible({ timeout: 15_000 })

    await expect(
      page.getByRole("combobox", { name: /Proje seç|Select project/ }).first(),
    ).toBeVisible()

    await expect(
      page.getByRole("button", { name: /PDF'i yeni sekmede aç|Open PDF in new tab/i }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /PDF olarak indir|Download as PDF/i }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Excel olarak indir|Download as Excel/i }),
    ).toBeVisible()
  })

  test("4 StatCards row renders the prototype labels", async ({ page }) => {
    await expect(page.getByText(/Sprint Velocity/i).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/Döngü Süresi|Cycle time/i).first()).toBeVisible()
    await expect(page.getByText(/^Tamamlanan$|^Completed$/i).first()).toBeVisible()
    await expect(page.getByText(/^Engeller$|^Blockers$/i).first()).toBeVisible()
  })

  test("Burndown card renders its heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 3, name: /^Burndown( — .+)?$/i }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test("Team Load card renders its heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 3, name: /Takım Yükü|Team Load/i }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test("CFD card renders SVG or capability banner", async ({ page }) => {
    const svg = page.locator(".chart-card-cfd-svg").first()
    const banner = page.getByText(
      /yalnızca Kanban projeleri için geçerlidir|only available for Kanban projects/i,
    )
    await expect(svg.or(banner)).toBeVisible({ timeout: 15_000 })
  })

  test("Lead/Cycle row renders both chart cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 3, name: /^Lead Time$/i }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByRole("heading", { level: 3, name: /^Cycle Time$/i }),
    ).toBeVisible()
  })

  test("Phase Progress card renders its heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 3, name: /Faz İlerlemesi|Phase Progress/i }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test("the page auto-selects the first project into the URL", async ({
    page,
  }) => {
    await page.waitForURL(/[?&]projectId=\d+/, { timeout: 15_000 })
    const url = new URL(page.url())
    expect(url.searchParams.get("projectId")).toMatch(/^\d+$/)
  })

  test("refresh on /reports?range=7 hydrates the DateRangeFilter from the URL", async ({
    page,
  }) => {
    await page.goto("/reports?projectId=1&range=7")

    await expect(
      page.getByRole("heading", { level: 1, name: /Raporlar|Reports/ }),
    ).toBeVisible({ timeout: 15_000 })

    const after = new URL(page.url())
    expect(after.searchParams.get("range")).toBe("7")

    // The 7-day SegmentedControl chip is marked active (aria-pressed=true).
    const seven = page.getByRole("button", { name: /Son 7 gün|Last 7 days/ })
    await expect(seven).toBeVisible()
    await expect(seven).toHaveAttribute("aria-pressed", "true")
  })
})

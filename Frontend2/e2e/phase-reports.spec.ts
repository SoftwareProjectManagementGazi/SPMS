import { test, expect } from "@playwright/test"
import { setupMockBackend, jsonResponse } from "./support/mock-auth"

/**
 * Faz Raporları (Phase Reports) section on /reports (Plan 13-08) — rebuilt to run.
 *
 * Mocks /projects (so the page renders + auto-selects) and chart-capabilities.
 * Verifies the section heading, both outer tabs, the cascading picker contract
 * (phase select disabled until a project is picked), and the archived-tab swap.
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

const CAPS = {
  burndown: true,
  iteration: true,
  cfd: true,
  lead_cycle: true,
  phase_progress: true,
  team_load: true,
  summary: true,
}

test.describe("Phase reports section @phase-13", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      routes: {
        "/projects/1/chart-capabilities": (r) => jsonResponse(r, CAPS),
        "/projects": (r) => jsonResponse(r, [PROJECT]),
      },
    })
    await page.goto("/reports")
  })

  test("Faz Raporları section renders with both outer tabs", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: /Faz Raporları|Phase Reports/,
      }),
    ).toBeVisible({ timeout: 15_000 })

    await expect(
      page.getByRole("button", {
        name: /Aktif \+ Tamamlanan|Active \+ Completed/,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Arşivlenmiş|Archived/ }),
    ).toBeVisible()
  })

  test("cascading picker — phase select disabled until project picked", async ({
    page,
  }) => {
    const phaseSel = page.getByRole("combobox", {
      name: /Faz seç|Select phase/,
    })
    await expect(phaseSel).toBeVisible({ timeout: 15_000 })
    await expect(phaseSel).toBeDisabled()
  })

  test("clicking Arşivlenmiş tab keeps the section picker visible", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Arşivlenmiş|Archived/ }).click()
    // Two "Proje seç" comboboxes exist (global + section); the section's is last.
    await expect(
      page
        .getByRole("combobox", { name: /Proje seç|Select project/ })
        .last(),
    ).toBeVisible()
  })
})

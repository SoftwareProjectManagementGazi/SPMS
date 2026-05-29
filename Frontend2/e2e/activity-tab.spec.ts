import { test, expect } from "@playwright/test"
import { setupMockBackend, jsonResponse } from "./support/mock-auth"

/**
 * Project Activity tab (Plan 13-04) — rebuilt to actually run.
 *
 * The project shell defaults to the Board tab and ignores ?tab (it's
 * useState("board"), not URL-driven), so the test clicks the "Aktivite" tab to
 * reach the ActivityTab. The board still mounts first, so /projects/1/columns
 * is mocked as an array (BoardTab does columnsMeta.forEach — a non-array there
 * crashes the page). The Lifecycle filter chip is always rendered by the
 * ActivityFilter SegmentedControl, so the previous skip escape-hatch is gone.
 */

const PROJECT = {
  id: 1,
  key: "PRJ",
  name: "E2E Project",
  description: null,
  start_date: "2026-01-01",
  end_date: null,
  status: "ACTIVE",
  methodology: "KANBAN",
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

const COLUMNS = [
  { id: 1, name: "To Do", wip_limit: 0, order_index: 0 },
  { id: 2, name: "In Progress", wip_limit: 0, order_index: 1 },
  { id: 3, name: "Done", wip_limit: 0, order_index: 2 },
]

test.describe("Activity tab @phase-13", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      routes: {
        // One handler for /projects/1 and all its sub-resources so a sub-path
        // never falls through to the project object (which broke columnsMeta).
        "/projects/1": (route, path) => {
          if (path === "/projects/1") return jsonResponse(route, PROJECT)
          if (path === "/projects/1/columns") return jsonResponse(route, COLUMNS)
          if (path.startsWith("/projects/1/activity")) {
            return jsonResponse(route, { items: [], total: 0 })
          }
          return jsonResponse(route, []) // labels / members / sprints / etc.
        },
      },
    })
    await page.goto("/projects/1")
    // The shell starts on Board; switch to the Activity tab.
    await page.getByRole("button", { name: /Aktivite|Activity/ }).click()
  })

  test("project Activity tab mounts the timeline (or empty state)", async ({
    page,
  }) => {
    // The timeline container always mounts when the Activity tab is active (it
    // wraps the empty/loaded DataState), so it's the deterministic signal.
    await expect(page.locator(".activity-timeline").first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test("Lifecycle filter chip persists to localStorage across reload", async ({
    page,
  }) => {
    // "Yaşam Döngüsü" is BOTH a project tab (in the tab bar, above) and the
    // activity filter chip (in the content, below). Both carry aria-pressed, so
    // disambiguate by DOM order: the chip is the last one.
    const chip = page
      .getByRole("button", { name: /Yaşam Döngüsü|Lifecycle/ })
      .last()
    await expect(chip).toBeVisible({ timeout: 15_000 })
    await chip.click()

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("spms.activity.filter.1"),
    )
    expect(stored).toBeTruthy()
    expect(stored).toContain('"type":"lifecycle"')

    // localStorage persists across reload (the shell resets to Board on reload,
    // but the persisted filter is what useLocalStoragePref rehydrates from when
    // the user returns to Activity).
    await page.reload()
    const stored2 = await page.evaluate(() =>
      window.localStorage.getItem("spms.activity.filter.1"),
    )
    expect(stored2).toContain('"type":"lifecycle"')
  })
})

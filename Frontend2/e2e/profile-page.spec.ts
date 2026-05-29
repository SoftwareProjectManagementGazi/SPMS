import { test, expect } from "@playwright/test"
import { setupMockBackend, MEMBER_ME, jsonResponse } from "./support/mock-auth"

/**
 * User Profile page /users/[id] (Plans 13-05 / 13-06) — rebuilt to actually run.
 *
 * getUser() reads /auth/users (username = full_name) and 404s the page if the id
 * isn't found, so that's mocked. useUserSummary feeds the 3 StatCards. Tab
 * deep-links activate the Projects / Activity tabs (grid/empty/timeline).
 */

const USERS = [
  { id: 1, email: "user1@e2e.local", username: "E2E User One", avatar_url: null },
]

const SUMMARY = {
  stats: { active_tasks: 3, completed_last_30d: 2, project_count: 1 },
  projects: [{ id: 1, key: "PRJ", name: "E2E Project", status: "ACTIVE" }],
  recent_activity: [],
}

test.describe("Profile page @phase-13", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      me: MEMBER_ME,
      routes: {
        "/auth/users": (r) => jsonResponse(r, USERS),
        "/users/1/summary": (r) => jsonResponse(r, SUMMARY),
      },
    })
    await page.goto("/users/1")
  })

  test("/users/[id] renders header, StatCards, and 3 tabs", async ({ page }) => {
    // ProfileHeader <h1> = the user's name.
    await expect(
      page.getByRole("heading", { level: 1, name: /E2E User One/ }),
    ).toBeVisible({ timeout: 15_000 })

    await expect(
      page.getByText(/Atanan Görevler|Assigned Tasks/).first(),
    ).toBeVisible()
    await expect(
      page.getByText(/^Tamamlanan$|^Completed$/).first(),
    ).toBeVisible()
    await expect(
      page.getByText(/^Projeler$|^Projects$/).first(),
    ).toBeVisible()

    await expect(page.getByRole("button", { name: /Görevler|Tasks/ })).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Projeler|Projects/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Aktivite|Activity/ }),
    ).toBeVisible()
  })

  test("?tab=projects deep-link activates the Projects tab", async ({ page }) => {
    await page.goto("/users/1?tab=projects")
    const empty = page.getByText(/Henüz proje yok|No projects yet/)
    const grid = page.locator(".profile-projects-grid")
    await expect(empty.or(grid)).toBeVisible({ timeout: 15_000 })
  })

  test("?tab=activity deep-link activates the Activity tab", async ({ page }) => {
    await page.goto("/users/1?tab=activity")
    // The timeline container always mounts (it wraps the empty/loaded state);
    // a timeline.or(empty) check would match both and trip strict mode.
    await expect(page.locator(".activity-timeline").first()).toBeVisible({
      timeout: 15_000,
    })
  })
})

import { test, expect } from "@playwright/test"

/**
 * Phase 13 Plan 13-10 — User Profile page smoke (PROF-02 / PROF-04).
 *
 * Verifies the /users/[id] route shipped in Plans 13-05 + 13-06 mounts
 * cleanly and that the ?tab=… query-param routing activates the right tab:
 *   - /users/1 loads header (h1) + 3 StatCards + Tasks/Projects/Activity tabs
 *   - /users/1?tab=projects activates the Projects tab (grid OR empty state)
 *   - /users/1?tab=activity activates the Activity tab (timeline OR empty)
 *
 * Skip-guard pattern: Phase 11 D-50 — no test-DB seeder, so the spec gates
 * on /api/v1/health and skips when the backend is unreachable. With a
 * future seeder these specs validate the real behavior end-to-end.
 */

test.describe("Profile page @phase-13", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 13",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/users/1").catch(() => {})
    const apiOk = await page
      .evaluate(async () => {
        try {
          const r = await fetch("/api/v1/health")
          return r.ok
        } catch {
          return false
        }
      })
      .catch(() => false)
    test.skip(!apiOk, "no seeded test backend (Phase 11 D-50 skip-guard)")
  })

  test("/users/[id] renders header, StatCards, and 3 tabs", async ({
    page,
  }) => {
    // ProfileHeader renders an <h1> with the user name (Plan 13-05).
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 })

    // 3 StatCards row — labels rendered as text inside StatCard primitive
    // (app/(shell)/users/[id]/page.tsx lines 173/183/192). aria-label
    // wrappers ALSO surface the same strings; getByText with .first() is
    // robust against the dual rendering.
    await expect(
      page.getByText(/Atanan Görevler|Assigned Tasks/).first(),
    ).toBeVisible()
    await expect(
      page.getByText(/^Tamamlanan$|^Completed$/).first(),
    ).toBeVisible()
    await expect(
      page.getByText(/^Projeler$|^Projects$/).first(),
    ).toBeVisible()

    // Tabs primitive — Görevler default + Projeler + Aktivite. getByRole
    // tab matches the Tabs primitive's accessible role.
    await expect(
      page.getByRole("tab", { name: /Görevler|Tasks/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("tab", { name: /Projeler|Projects/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("tab", { name: /Aktivite|Activity/ }),
    ).toBeVisible()
  })

  test("?tab=projects deep-link activates Projects tab", async ({ page }) => {
    await page.goto("/users/1?tab=projects")

    // ProfileProjectsTab renders either the .profile-projects-grid or the
    // empty fallback "Henüz proje yok." (profile-projects-tab.tsx line 90).
    const empty = page.getByText(/Henüz proje yok|No projects yet/)
    const grid = page.locator(".profile-projects-grid")
    await expect(empty.or(grid)).toBeVisible({ timeout: 10_000 })
  })

  test("?tab=activity deep-link activates Activity tab", async ({ page }) => {
    await page.goto("/users/1?tab=activity")

    // ActivityTab renders .activity-timeline (activity-tab.tsx line 134) or
    // ActivityEmpty's "Henüz aktivite yok." / "Bu filtreyle eşleşen olay yok."
    // (activity-empty.tsx lines 52 + 67).
    const timeline = page.locator(".activity-timeline").first()
    const empty = page.getByText(
      /Bu filtreyle eşleşen olay yok|No events match this filter|Henüz aktivite yok|No activity yet/,
    )
    await expect(timeline.or(empty)).toBeVisible({ timeout: 10_000 })
  })
})

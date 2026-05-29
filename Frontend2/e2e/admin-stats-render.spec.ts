import { test, expect } from "@playwright/test"
import { setupMockBackend } from "./support/mock-auth"

/**
 * Admin Stats render E2E (Plan 14-08) — rebuilt to actually run.
 *
 * Previously self-skipped via the /api/v1/health probe. Now authenticates as
 * admin against a mocked backend so the three lazy-loaded chart components mount
 * and their titles render.
 */

test.describe("Admin Stats render @phase-14", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      routes: {
        // Non-empty data so each chart card mounts past its empty-state and
        // renders its <h3> title (an empty payload collapses the card to a
        // "no data yet" message with no heading).
        "/admin/stats": (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              active_users_trend: [
                { date: "2026-04-01", count: 5 },
                { date: "2026-04-02", count: 7 },
              ],
              methodology_distribution: { scrum: 3, kanban: 2, waterfall: 1 },
              project_velocities: [
                {
                  project_id: 1,
                  key: "PRJ",
                  name: "E2E Project",
                  progress: 0.5,
                  velocity_history: [3, 5, 8],
                },
              ],
            }),
          }),
      },
    })
    await page.goto("/admin/stats")
  })

  test("/admin/stats mounts ActiveUsersTrend + MethodologyBars + VelocityGrid", async ({
    page,
  }) => {
    // Renders only once the admin role guard passes.
    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 15_000 })

    // The 3 lazy-loaded chart cards mount and render their <h3> titles.
    await expect(
      page
        .getByRole("heading", {
          level: 3,
          name: /Aktif kullanıcı eğilimi|Active users trend/,
        })
        .first(),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page
        .getByRole("heading", {
          level: 3,
          name: /Metodoloji Kullanımı|Methodology usage/,
        })
        .first(),
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page
        .getByRole("heading", {
          level: 3,
          name: /Tamamlama hızı|Throughput/,
        })
        .first(),
    ).toBeVisible({ timeout: 10_000 })

    // The trend chart mounts its recharts surface (or the empty fallback when
    // there's no data — both prove the component rendered, not a crash).
    const rechartsOrEmpty = page.locator(".recharts-surface, .recharts-wrapper")
    const emptyFallback = page.getByText(
      /Henüz aktivite yok|No active users yet|Henüz proje yok|empty/i,
    )
    await expect(
      rechartsOrEmpty.first().or(emptyFallback.first()),
    ).toBeVisible({ timeout: 10_000 })
  })
})

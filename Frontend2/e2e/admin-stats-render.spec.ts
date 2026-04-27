import { test, expect } from "@playwright/test"

/**
 * Phase 14 Plan 14-12 — Admin Stats render E2E (Plan 14-08).
 *
 * Verifies /admin/stats (İstatistik) mounts the 3 lazy-loaded chart
 * components shipped in Plan 14-08:
 *   - ActiveUsersTrendChart (recharts ResponsiveContainer + LineChart) — top-left.
 *   - MethodologyBars (pure CSS bars per Scrum / Kanban / Waterfall) — top-right.
 *   - VelocityCardsGrid (pure CSS cards, top-30 cap) — bottom row, full width.
 *
 * Lazy-load contract (D-C6): all 3 components are dynamic-imported with
 * ssr:false. The Suspense fallback renders DataState loading spinners; we
 * wait for the chart titles to appear (post-mount) rather than asserting
 * the loading state.
 *
 * Skip-guard pattern: Phase 11 D-50.
 */

test.describe("Admin Stats render @phase-14", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 14",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/stats").catch(() => {})
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

  test("/admin/stats mounts ActiveUsersTrend + MethodologyBars + VelocityGrid", async ({
    page,
  }) => {
    // Page heading from the shared admin layout.
    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 10_000 })

    // Active users trend — admin.stats.active_users_title key.
    // TR: "Aktif kullanıcı eğilimi"  EN: "Active users trend".
    // The card renders the title as an <h3>.
    await expect(
      page
        .getByRole("heading", {
          level: 3,
          name: /Aktif kullanıcı eğilimi|Active users trend/,
        })
        .first(),
    ).toBeVisible({ timeout: 15_000 })

    // Methodology distribution — admin.stats.methodology_title key.
    // TR: "Metodoloji Kullanımı"  EN: "Methodology usage".
    await expect(
      page
        .getByRole("heading", {
          level: 3,
          name: /Metodoloji Kullanımı|Methodology usage/,
        })
        .first(),
    ).toBeVisible({ timeout: 10_000 })

    // Velocity per project — admin.stats.velocity_title key.
    // TR: "Proje başına velocity"  EN: "Velocity per project".
    await expect(
      page
        .getByRole("heading", {
          level: 3,
          name: /Proje başına velocity|Velocity per project/,
        })
        .first(),
    ).toBeVisible({ timeout: 10_000 })

    // Recharts surface — the ActiveUsersTrendChart wraps a recharts
    // ResponsiveContainer, which renders an <svg class="recharts-surface">.
    // When data is empty the chart still mounts the container (per
    // active-users-trend-chart.tsx) — assertion holds in both empty and
    // populated states. Use .first() since recharts may insert multiple
    // SVG layers (legend, brush, etc.) in some configurations.
    const rechartsOrEmpty = page.locator(".recharts-surface, .recharts-wrapper")
    const emptyFallback = page.getByText(
      /Henüz aktivite yok|No active users yet|Henüz proje yok|empty/i,
    )
    await expect(rechartsOrEmpty.first().or(emptyFallback.first())).toBeVisible({
      timeout: 10_000,
    })
  })
})

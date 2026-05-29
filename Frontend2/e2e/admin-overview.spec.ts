import { test, expect } from "@playwright/test"
import { setupMockBackend, jsonResponse } from "./support/mock-auth"

/**
 * Admin Overview tab E2E (Plan 14-02) — rebuilt to actually run.
 *
 * Previously every test self-skipped via a `fetch('/api/v1/health')` probe that
 * always failed (no such route), so the whole suite was decorative (a fake
 * pass). This version authenticates against a mocked backend (support/mock-auth)
 * so the real /admin page renders and the assertions execute.
 */

test.describe("Admin Overview tab @phase-14", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      routes: {
        // 3 pending join requests → the Pending stat card must render "3"
        // (this asserts the data pipeline, not just element visibility).
        "/admin/join-requests": (route) =>
          jsonResponse(route, { items: [], total: 3 }),
      },
    })
    await page.goto("/admin")
  })

  test("/admin renders 5 StatCards + Pending Requests Card", async ({ page }) => {
    // Admin layout heading — only renders once the admin role guard passes.
    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 15_000 })

    // All 5 StatCards are present (each wrapper sets aria-label="<Label>: <Value>").
    for (const selector of [
      "[aria-label^='Kullanıcı:'], [aria-label^='Users:']",
      "[aria-label^='Aktif Proje:'], [aria-label^='Active projects:']",
      "[aria-label^='Onay Bekleyen:'], [aria-label^='Pending:']",
      "[aria-label^='Şablon:'], [aria-label^='Templates:']",
      "[aria-label^='Depolama:'], [aria-label^='Storage:']",
    ]) {
      await expect(page.locator(selector).first()).toBeVisible()
    }

    // The Pending card value reflects the mocked total=3 — proves the count
    // flows from the API through the hook into the card (not a static element).
    await expect(
      page.locator("[aria-label='Onay Bekleyen: 3'], [aria-label='Pending: 3']"),
    ).toBeVisible()

    // The Storage card renders its (static) value.
    await expect(
      page.locator(
        "[aria-label='Depolama: 12.4 GB'], [aria-label='Storage: 12.4 GB']",
      ),
    ).toBeVisible()

    // Pending Requests card → the unique "Tümünü gör" / "View all" trigger.
    await expect(
      page.getByRole("button", { name: /Tümünü gör|View all/ }),
    ).toBeVisible()
  })

  test("Tümünü gör opens the All-Pending modal", async ({ page }) => {
    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 15_000 })

    await page
      .getByRole("button", { name: /Tümünü gör|View all/ })
      .first()
      .click()

    await expect(
      page.getByText(/Tüm bekleyen istekler|All pending requests/).first(),
    ).toBeVisible({ timeout: 5_000 })
  })
})

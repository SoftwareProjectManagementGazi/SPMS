import { test, expect } from "@playwright/test"
import { setupMockBackend } from "./support/mock-auth"

/**
 * Admin Audit filter E2E (Plan 14-07, D-C5) — rebuilt to actually run.
 *
 * Previously self-skipped via the /api/v1/health probe. Now authenticates as
 * admin against a mocked backend so the audit toolbar renders and the URL-driven
 * filter contract (?from=YYYY-MM-DD) can be exercised end-to-end.
 */

test.describe("Admin Audit filter @phase-14", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page)
    await page.goto("/admin/audit")
  })

  test("/admin/audit renders the audit toolbar", async ({ page }) => {
    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 15_000 })

    await expect(
      page.getByRole("button", { name: /^Filtre$|^Filter$/ }),
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole("button", { name: /^JSON$/ })).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Son 24 saat|Last 24h/ }),
    ).toBeVisible()
  })

  test("Filtre opens AuditFilterModal; Uygula with date_from encodes URL (D-C5)", async ({
    page,
  }) => {
    const filterBtn = page.getByRole("button", { name: /^Filtre$|^Filter$/ })
    await expect(filterBtn).toBeVisible({ timeout: 15_000 })
    await filterBtn.click()

    await expect(
      page.getByText(/Audit Filtresi|Audit Filter/).first(),
    ).toBeVisible({ timeout: 5_000 })

    const dateInputs = page.locator("input[type='date']")
    await expect(dateInputs.first()).toBeVisible()
    await dateInputs.first().fill("2026-04-01")

    await page.getByRole("button", { name: /^Uygula$|^Apply$/ }).click()

    // The encoded URL is the source of truth (D-C5: audit links are shared).
    await expect(page).toHaveURL(/from=2026-04-01/, { timeout: 5_000 })
  })
})

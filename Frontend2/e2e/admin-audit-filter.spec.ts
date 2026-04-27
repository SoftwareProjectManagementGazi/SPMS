import { test, expect } from "@playwright/test"

/**
 * Phase 14 Plan 14-12 — Admin Audit filter E2E (Plan 14-07, D-C5 + D-Z2).
 *
 * Verifies /admin/audit (Audit) renders:
 *   - The audit toolbar (Filter button + JSON button + Son 24 saat shortcut).
 *   - The AuditFilterModal opens on "Filtre" click and renders its 4 fields
 *     (date_from / date_to / actor / action_prefix).
 *   - Setting date_from + clicking Uygula encodes the URL search param
 *     (?from=YYYY-MM-DD) per the URL-driven filter contract (D-C5 — audit
 *     links are commonly shared in tickets so the URL must be the source of
 *     truth, not localStorage).
 *
 * Skip-guard pattern: Phase 11 D-50.
 */

test.describe("Admin Audit filter @phase-14", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 14",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/audit").catch(() => {})
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

  test("/admin/audit renders the audit toolbar", async ({ page }) => {
    // Page heading — shared admin layout title (admin.layout.title).
    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 10_000 })

    // Toolbar: "Filtre" / "Filter" button (admin.audit.filter_button key).
    await expect(
      page.getByRole("button", { name: /^Filtre$|^Filter$/ }),
    ).toBeVisible({ timeout: 10_000 })

    // JSON export button (admin.audit.json_button key — same TR/EN).
    await expect(
      page.getByRole("button", { name: /^JSON$/ }),
    ).toBeVisible()

    // Son 24 saat / Last 24h shortcut (admin.audit.last_24h key).
    await expect(
      page.getByRole("button", { name: /Son 24 saat|Last 24h/ }),
    ).toBeVisible()
  })

  test("Filtre opens AuditFilterModal; Uygula with date_from encodes URL (D-C5)", async ({
    page,
  }) => {
    // Wait for toolbar.
    const filterBtn = page.getByRole("button", { name: /^Filtre$|^Filter$/ })
    await expect(filterBtn).toBeVisible({ timeout: 10_000 })
    await filterBtn.click()

    // Modal title — admin.audit.filter_modal_title key.
    // TR: "Audit Filtresi"  EN: "Audit Filter".
    await expect(
      page.getByText(/Audit Filtresi|Audit Filter/).first(),
    ).toBeVisible({ timeout: 5_000 })

    // 4 fields: locate the date_from input (type="date") and fill it.
    // The form labels read "Başlangıç" / "From" (admin.audit.filter_date_from).
    // Use the input type as the most robust selector since the modal has
    // 2 type=date inputs (from + to) — index 0 is the date_from per the
    // markup order in audit-filter-modal.tsx.
    const dateInputs = page.locator("input[type='date']")
    await expect(dateInputs.first()).toBeVisible()
    await dateInputs.first().fill("2026-04-01")

    // Click Uygula / Apply (admin.audit.filter_apply key).
    await page.getByRole("button", { name: /^Uygula$|^Apply$/ }).click()

    // Modal closes; URL search params include ?from=2026-04-01 per the
    // filterToParams encoder in admin/audit/page.tsx.
    await expect(page).toHaveURL(/from=2026-04-01/, { timeout: 5_000 })
  })
})

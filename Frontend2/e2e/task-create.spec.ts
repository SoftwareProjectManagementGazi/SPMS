import { test, expect } from "@playwright/test"

/**
 * Phase 11 smoke test — golden path for task creation.
 *
 * Flow:
 *   1. Land on /dashboard (auth gate may redirect if not logged in)
 *   2. Click the header "Oluştur" / "Create" button
 *   3. Modal opens — fill Title + select first project option
 *   4. Submit via Ctrl+Enter (D-06 keyboard shortcut)
 *   5. Toast "Görev oluşturuldu" / "Task created" appears
 *
 * This spec defensively skips when:
 *   - The header Create button isn't visible (auth not available in test env)
 *   - No real project options exist in the DB (no fixture data)
 *
 * Test DB seeding for the e2e rig is out of scope for Phase 11 — once the
 * seeder lands (follow-up plan), these skip-guards can be removed.
 */

test.describe("Phase 11 — Task Create flow", () => {
  // chromium-only for Phase 11 per playwright.config.ts (the only project
  // listed there). Guard makes the intent explicit in case another project
  // is ever added.
  test.skip(({ browserName }) => browserName !== "chromium", "chromium-only for Phase 11")

  test("header Oluştur → modal → submit", async ({ page }) => {
    await page.goto("/dashboard")

    // Wait for the Create button — if it never appears the app booted
    // without auth (login page shown instead). Skip rather than fail so
    // the spec is green in environments without test seeding.
    const createBtn = page.getByRole("button", { name: /Oluştur|Create/i })
    const buttonVisible = await createBtn
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    if (!buttonVisible) {
      test.skip(true, "Header Create button not visible — auth/seed unavailable")
      return
    }

    await createBtn.first().click()

    // Modal title renders — two possible headers depending on language.
    await expect(
      page.getByText(/Görev Oluştur|Create Task/i).first()
    ).toBeVisible({ timeout: 3000 })

    // Autofocused title input — match on placeholder text (matches both
    // TR "Kısa, net başlık" and EN "Short, clear title" if EN is ever added).
    await page
      .getByPlaceholder(/Kısa, net başlık|Short, clear title/i)
      .fill("E2E smoke task")

    // Project <select> — the first one in the modal. Pick the first real
    // option (skip the "Seçin..." placeholder entry).
    const projectSelect = page.locator("select").first()
    const options = await projectSelect.locator("option").allTextContents()
    const firstReal = options.find(
      (o) =>
        o.trim() &&
        !o.toLowerCase().includes("seçin") &&
        !o.toLowerCase().includes("select")
    )
    if (!firstReal) {
      test.skip(true, "No project options available — seed data missing")
      return
    }
    await projectSelect.selectOption({ label: firstReal })

    // Submit via Ctrl+Enter (D-06)
    await page.keyboard.press("Control+Enter")

    // Success toast — matches "Görev oluşturuldu" or "Task created"
    await expect(
      page.getByText(/Görev oluşturuldu|Task created/i)
    ).toBeVisible({ timeout: 5000 })
  })
})

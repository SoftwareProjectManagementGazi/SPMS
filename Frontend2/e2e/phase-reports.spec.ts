import { test, expect } from "@playwright/test"

/**
 * Phase 13 Plan 13-10 — Faz Raporları section smoke (REPT-04).
 *
 * Verifies the PhaseReportsSection shipped in Plan 13-08 mounts on /reports
 * with both outer tabs and the cascading project + phase picker enforces
 * the "phase select disabled until project picked" contract (D-E1).
 *
 *   - Section heading "Faz Raporları" renders (phase-reports-section.tsx
 *     line 202).
 *   - Outer Tabs: "Aktif + Tamamlanan" (default) + "Arşivlenmiş".
 *   - Phase picker is disabled while no project is selected
 *     (phase-reports-section.tsx line 252 — disabled prop tied to
 *     !pickerProject).
 *   - Switching to "Arşivlenmiş" re-renders the section content with the
 *     same picker shape.
 *
 * Skip-guard pattern: Phase 11 D-50. No test-DB seeder yet — guard fires
 * when /api/v1/health is unreachable.
 */

test.describe("Phase reports section @phase-13", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 13",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/reports").catch(() => {})
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

  test("Faz Raporları section renders with both outer tabs", async ({
    page,
  }) => {
    // Section heading is an <h3> (phase-reports-section.tsx line 201).
    await expect(
      page.getByRole("heading", { level: 3, name: /Faz Raporları|Phase Reports/ }),
    ).toBeVisible({ timeout: 10_000 })

    // 2 outer tabs (D-E1).
    await expect(
      page.getByRole("tab", { name: /Aktif \+ Tamamlanan|Active \+ Completed/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("tab", { name: /Arşivlenmiş|Archived/ }),
    ).toBeVisible()
  })

  test("cascading picker — phase select disabled until project picked", async ({
    page,
  }) => {
    // Faz seç combobox is disabled by default (phase-reports-section.tsx
    // line 252 — disabled={!pickerProject || phaseOptions.length === 0}).
    const phaseSel = page.getByRole("combobox", {
      name: /Faz seç|Select phase/,
    })
    await expect(phaseSel).toBeVisible({ timeout: 10_000 })
    await expect(phaseSel).toBeDisabled()
  })

  test("clicking Arşivlenmiş tab switches the section", async ({ page }) => {
    await page
      .getByRole("tab", { name: /Arşivlenmiş|Archived/ })
      .click()

    // Section still renders the project picker after the outer tab swap.
    // Two project pickers exist on /reports — the global ProjectPicker at
    // the page top + the PhaseReportsSection picker inside the tab body.
    // Use .last() to target the section-internal one.
    await expect(
      page.getByRole("combobox", { name: /Proje seç|Select project/ }).last(),
    ).toBeVisible()
  })
})

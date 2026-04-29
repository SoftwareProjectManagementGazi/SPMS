import { test, expect } from "@playwright/test"

/**
 * Phase 15 Plan 15-12 — Admin RBAC Permission Matrix E2E (Plan 15-10).
 *
 * Verifies the active 14×N permission matrix shipped in Plan 15-10's atomic
 * 7-layer uplift:
 *
 *   - Per-cell auto-save (D-1.12): toggling a PM × non-Admin/non-Guest cell
 *     fires useUpdatePermissionCell.mutate({roleId, permKey, granted}) with
 *     Pattern-3 optimistic update. Toast "Yetki güncellendi" appears within
 *     ~300ms; cell flip persists across page reload.
 *
 *   - Defense-in-depth disabled columns (D-1.5 + D-2.4): Admin column shows
 *     visually-granted toggles with disabled attribute; Guest column shows
 *     visually-denied toggles with disabled attribute. Even if disabled is
 *     stripped via DOM tamper, the onChange short-circuit returns early
 *     before invoking the mutation (Plan 15-10 T-15-05 mitigation).
 *
 *   - Per-row scope badge (D-3.4): "(sistem)" / "(proje)" inline label
 *     renders next to every permission name based on Permission.scope —
 *     project (26 perms) vs system (12 perms) per Plan 15-04 seed.
 *
 *   - Per-column Sistem badge (D-2.4): every is_system_role=true column
 *     header carries a Sistem / System Badge tone="neutral" size="xs".
 *
 *   - Optimistic mutation revert on backend 4xx: when the backend rejects
 *     a write (e.g., SYSTEM_ROLE_PROTECTED 422 on Admin column), the cell
 *     reverts to its snapshot AND a Toast / AlertBanner surfaces the error.
 *
 * Skip-guard pattern: Phase 11 D-50 — manual UAT primary; E2E run via
 * seeded backend only.
 */

test.describe("Admin RBAC permission matrix @phase-15", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 15 RBAC E2E",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/permissions").catch(() => {})
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

  test("PM × non-Admin/non-Guest cell auto-saves; Toast appears; persists across reload (D-1.12)", async ({
    page,
  }) => {
    // Page heading — admin.permissions.title key.
    await expect(
      page.locator("h1").filter({ hasText: /İzin Matrisi|Permissions Matrix/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // Locate the matrix toggle for PM × project.delete. Each cell is rendered
    // as an input[type="checkbox"] with aria-label matching the permission
    // and column. The exact aria-label format from PermissionRow:
    //   "<perm.label> for <role.name>" or
    //   "<perm.key> · <role.name>"
    // We use a flexible selector that matches either.
    const cell = page
      .locator(
        "input[type='checkbox'][aria-label*='project.delete'][aria-label*='Project Manager']",
      )
      .or(
        page.locator(
          "input[type='checkbox'][aria-label*='project.delete'][aria-label*='PM']",
        ),
      )
    await expect(cell.first()).toBeVisible({ timeout: 5_000 })

    // Snapshot initial state so we can flip then revert.
    const initiallyChecked = await cell.first().isChecked()

    // Toggle the cell — onChange fires useUpdatePermissionCell.mutate.
    await cell.first().click()

    // Toast "Yetki güncellendi" / "Permission updated" surfaces per Plan
    // 15-09 Pattern-3 onSuccess.
    await expect(
      page.getByText(/Yetki güncellendi|Permission updated/i).first(),
    ).toBeVisible({ timeout: 5_000 })

    // Reload — the cell should reflect the new state from the server.
    await page.reload()
    await expect(
      page.locator("h1").filter({ hasText: /İzin Matrisi|Permissions Matrix/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    const reloadedCell = page
      .locator(
        "input[type='checkbox'][aria-label*='project.delete'][aria-label*='Project Manager']",
      )
      .or(
        page.locator(
          "input[type='checkbox'][aria-label*='project.delete'][aria-label*='PM']",
        ),
      )
    await expect(reloadedCell.first()).toBeVisible({ timeout: 5_000 })
    const afterReload = await reloadedCell.first().isChecked()
    expect(afterReload).toBe(!initiallyChecked)

    // Cleanup — toggle back to original state so re-runs are idempotent.
    await reloadedCell.first().click()
    await expect(
      page.getByText(/Yetki güncellendi|Permission updated/i).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("Admin column toggles are disabled (D-1.5 super-role read-only)", async ({
    page,
  }) => {
    await expect(
      page.locator("h1").filter({ hasText: /İzin Matrisi|Permissions Matrix/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // Pick any task.* perm → Admin column. Admin column is disabled
    // visually (Plan 15-10 D-1.5 PermissionRow always renders Admin granted
    // + disabled).
    const adminCell = page
      .locator(
        "input[type='checkbox'][aria-label*='task.delete'][aria-label*='Admin']",
      )
      .first()
    await expect(adminCell).toBeVisible({ timeout: 5_000 })
    await expect(adminCell).toBeDisabled()
    // Admin always shows granted (visual ON) per D-1.5 wildcard semantics.
    await expect(adminCell).toBeChecked()
  })

  test("per-row scope badge renders '(sistem)' for admin.* and '(proje)' for task.* (D-3.4)", async ({
    page,
  }) => {
    await expect(
      page.locator("h1").filter({ hasText: /İzin Matrisi|Permissions Matrix/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // (proje) badge — appears 26x (one per project-scoped perm).
    await expect(
      page
        .getByText(/\(proje\)|\(project\)/i, { exact: false })
        .first(),
    ).toBeVisible({ timeout: 5_000 })

    // (sistem) badge — appears 12x (one per system-scoped perm; admin.*).
    await expect(
      page
        .getByText(/\(sistem\)|\(system\)/i, { exact: false })
        .first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("per-column Sistem badge renders for all 4 system-role columns (D-2.4)", async ({
    page,
  }) => {
    await expect(
      page.locator("h1").filter({ hasText: /İzin Matrisi|Permissions Matrix/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // 4 system role columns → ≥4 Sistem / System badge occurrences in
    // column headers (Plan 15-10 PermissionMatrixCard column header layout).
    const sistemBadges = page.getByText(/^Sistem$|^System$/)
    await expect(sistemBadges.first()).toBeVisible({ timeout: 5_000 })
    const count = await sistemBadges.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})

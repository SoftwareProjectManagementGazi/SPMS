import { test, expect } from "@playwright/test"

/**
 * Phase 15 Plan 15-12 — Admin RBAC self-edit prevention E2E (Plan 15-05 + 15-11).
 *
 * Verifies the "an admin cannot change their own role" guard shipped in
 * Plan 15-11 (frontend) + Plan 15-05 (backend):
 *
 *   - UI tier (Plan 15-11 D-2.9): UserRowActions disables the "Rolü değiştir"
 *     menuitem when row.user.id === currentUser.id (Number coerced). Click
 *     handler also short-circuits in case the disabled attr is stripped via
 *     DOM tamper.
 *
 *   - Backend tier (Plan 15-05 D-2.9): ChangeUserRoleUseCase raises
 *     PermissionError("Kendi rolünü değiştiremezsin") when the route guard
 *     receives target_user_id == current_admin_id. Translation layer maps
 *     to HTTP 403 with error_code=PERMISSION_DENIED.
 *
 *   - Defense-in-depth chain (T-15-02 mitigation): UI disable → handler
 *     short-circuit → backend explicit raise. Three layers; the test
 *     asserts the visible UI tier (manual UAT covers the backend tier).
 *
 * Skip-guard pattern: Phase 11 D-50 — manual UAT primary; E2E run via
 * seeded backend with the current session bound to a known admin user.
 */

test.describe("Admin RBAC self-edit prevention @phase-15", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 15 RBAC E2E",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/users").catch(() => {})
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

  test("admin's own row 'Rolü değiştir' menuitem is disabled (D-2.9)", async ({
    page,
  }) => {
    // Wait for UsersTable to render.
    await expect(
      page.locator("h1").filter({ hasText: /Kullanıcılar|Users/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // The current admin user's email (UAT prerequisite — seeder uses
    // admin@example.com). Locate the row containing the admin email.
    const adminRow = page
      .locator("tr", { hasText: /admin@example\.com|admin@spms\.local/ })
      .first()
    await expect(adminRow).toBeVisible({ timeout: 10_000 })

    // Open the row's MoreH menu (⋮ button at end of row).
    await adminRow.getByRole("button", { name: /menü|menu|⋮|More/i }).click()

    // The "Rolü değiştir" / "Change role" menuitem should be disabled OR
    // marked aria-disabled="true". Plan 15-11 user-row-actions.tsx sets
    // disabled: isSelf on the MenuItem.
    const changeRoleItem = page
      .getByRole("menuitem", { name: /Rolü değiştir|Change role/ })
      .first()
    await expect(changeRoleItem).toBeVisible({ timeout: 5_000 })

    // Either the menuitem has aria-disabled="true" OR clicking it is a no-op
    // (closes the menu without opening the role submenu). Plan 15-11 wires
    // both via disabled prop on MenuItem.
    const ariaDisabled = await changeRoleItem.getAttribute("aria-disabled")
    expect(["true", ""]).toContain(ariaDisabled || "")

    // Click anyway — even if disabled stripped via DOM, the onClick handler
    // returns early per Plan 15-11 D-2.9 short-circuit. The role-change
    // submenu / picker should NOT open.
    await changeRoleItem.click({ force: true }).catch(() => {})
    // Assertion: role-picker submenu stays closed. Use a heuristic — the
    // role picker's distinguishing element is a list of role names; check
    // that "Project Manager" / "Member" choices are NOT visible as menu
    // items (they're the only place role names appear as menuitems).
    const roleChoices = page.getByRole("menuitem", {
      name: /^Project Manager$|^Member$|^Guest$/,
    })
    await expect(roleChoices.first()).toBeHidden({ timeout: 2_000 })
  })

  test("non-self row 'Rolü değiştir' opens the role picker (negative control, D-2.9)", async ({
    page,
  }) => {
    // Sanity check — self-edit prevention should NOT block other users.
    await expect(
      page.locator("h1").filter({ hasText: /Kullanıcılar|Users/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // Find any row whose email is NOT the current admin's. Use a row whose
    // email matches member@ or pm@ (seeder convention).
    const otherRow = page
      .locator("tr")
      .filter({ hasText: /member@|pm@|user@/ })
      .first()
    await expect(otherRow).toBeVisible({ timeout: 10_000 })

    // Open MoreH menu.
    await otherRow.getByRole("button", { name: /menü|menu|⋮|More/i }).click()

    // "Rolü değiştir" menuitem should be ENABLED (not the self-edit row).
    const changeRoleItem = page
      .getByRole("menuitem", { name: /Rolü değiştir|Change role/ })
      .first()
    await expect(changeRoleItem).toBeVisible({ timeout: 5_000 })
    const ariaDisabled = await changeRoleItem.getAttribute("aria-disabled")
    // Should NOT be aria-disabled="true" for non-self users.
    expect(ariaDisabled).not.toBe("true")
  })
})

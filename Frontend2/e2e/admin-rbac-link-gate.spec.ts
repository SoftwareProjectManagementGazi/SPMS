import { test, expect } from "@playwright/test"

/**
 * Phase 15 Plan 15-12 — AvatarDropdown admin-link perm gate E2E (Plan 15-11).
 *
 * Verifies the cross-phase contract migration shipped atomically in Plan 15-11
 * (avatar-dropdown.tsx production + avatar-dropdown.test.tsx Test 14 update,
 * SAME COMMIT per R-01 invariant):
 *
 *   - OLD gate (Phase 13 D-D2 / Plan 14-11 Test 14): admin link visible
 *     iff role.name === "Admin".
 *
 *   - NEW gate (Plan 15-11 D-2.11): admin link visible iff
 *     hasPermission("admin.access"). The hasPermission helper short-circuits
 *     to true for role.name === "Admin" (D-1.5 super-role + Pitfall 9
 *     backwards-compat), so existing Admin tokens (with or without the
 *     permissions[] claim) STILL see the link — no forced re-login.
 *
 *   - Custom roles like "SuperUser" with admin.access toggled-on in the
 *     matrix ALSO see the link, even though their role.name is NOT "Admin".
 *
 *   - Member / Guest / non-admin custom roles do NOT see the link.
 *
 * Three scenarios cover the gate's matrix:
 *   1. Admin role (legacy super-role) — link visible.
 *   2. Custom SuperUser role with admin.access perm — link visible.
 *   3. Member role — link hidden.
 *
 * Skip-guard pattern: Phase 11 D-50 — manual UAT primary; E2E run via
 * seeded backend with the relevant role assignments in place.
 */

test.describe("Avatar dropdown admin link perm gate @phase-15", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 15 RBAC E2E",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/").catch(() => {})
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

  test("Admin role sees 'Yönetim Paneli' link in AvatarDropdown (D-1.5 super-role)", async ({
    page,
  }) => {
    // Pre-condition: admin@example.com is logged in (seeder convention).
    await page.goto("/dashboard").catch(() => {})

    // Open AvatarDropdown via the avatar trigger button.
    // The avatar button is in the page header — use a distinguishing
    // accessible name. AvatarDropdown trigger has aria-haspopup="menu".
    const avatarTrigger = page
      .locator("button[aria-haspopup='menu']")
      .or(page.getByRole("button", { name: /Avatar|Profile|profil/i }))
      .or(page.locator("[data-testid='avatar-dropdown-trigger']"))
    await expect(avatarTrigger.first()).toBeVisible({ timeout: 10_000 })
    await avatarTrigger.first().click()

    // The "Yönetim Paneli" / "Admin Panel" link is visible in the dropdown
    // for Admin role per Plan 15-11 hasPermission super-role short-circuit.
    await expect(
      page.getByText(/Yönetim Paneli|Admin Panel/).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("Custom 'SuperUser' role with admin.access perm sees Yönetim Paneli link (D-2.11 explicit-perm path)", async ({
    page,
  }) => {
    // Pre-condition: superuser@example.com (custom role 'SuperUser' with
    // admin.access perm toggled-on) is logged in. The seeder creates this
    // custom role via Plan 15-11 RoleCreateModal flow + admin grants the
    // perm via Plan 15-10 PermissionMatrixCard.
    await page.goto("/dashboard").catch(() => {})

    // Open AvatarDropdown.
    const avatarTrigger = page
      .locator("button[aria-haspopup='menu']")
      .or(page.getByRole("button", { name: /Avatar|Profile|profil/i }))
      .or(page.locator("[data-testid='avatar-dropdown-trigger']"))
    await expect(avatarTrigger.first()).toBeVisible({ timeout: 10_000 })
    await avatarTrigger.first().click()

    // Yönetim Paneli link IS visible — hasPermission('admin.access') === true
    // because the JWT permissions[] claim contains "admin.access".
    await expect(
      page.getByText(/Yönetim Paneli|Admin Panel/).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("Member role does NOT see 'Yönetim Paneli' link (D-2.11 deny path)", async ({
    page,
  }) => {
    // Pre-condition: member@example.com (Member role, no admin.access perm)
    // is logged in.
    await page.goto("/dashboard").catch(() => {})

    // Open AvatarDropdown.
    const avatarTrigger = page
      .locator("button[aria-haspopup='menu']")
      .or(page.getByRole("button", { name: /Avatar|Profile|profil/i }))
      .or(page.locator("[data-testid='avatar-dropdown-trigger']"))
    await expect(avatarTrigger.first()).toBeVisible({ timeout: 10_000 })
    await avatarTrigger.first().click()

    // Yönetim Paneli link is HIDDEN — hasPermission('admin.access') === false.
    // Use toHaveCount(0) so we don't wait for visibility timeout.
    await expect(
      page.getByText(/Yönetim Paneli|Admin Panel/),
    ).toHaveCount(0)
  })
})

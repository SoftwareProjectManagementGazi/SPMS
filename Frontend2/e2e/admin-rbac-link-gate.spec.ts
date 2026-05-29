import { test, expect } from "@playwright/test"
import {
  setupMockBackend,
  ADMIN_ME,
  MEMBER_ME,
  jwtWithPermissions,
} from "./support/mock-auth"

/**
 * AvatarDropdown admin-link perm gate E2E (Plan 15-11 D-2.11) — rebuilt to run.
 *
 * The "Yönetim Paneli" link is gated by hasPermission("admin.access")
 * (avatar-dropdown.tsx). hasPermission short-circuits true for role "Admin"
 * (D-1.5) and otherwise checks the JWT permissions[] claim. Three cases:
 *   1. Admin role → visible (super-role short-circuit).
 *   2. Custom "SuperUser" role whose token carries admin.access → visible.
 *   3. Member role with no such perm → hidden.
 */

const SUPERUSER_ME = {
  id: 4,
  email: "superuser@e2e.local",
  full_name: "E2E SuperUser",
  is_active: true,
  role: { name: "SuperUser", description: "Custom elevated role" },
}

// Target the avatar trigger by its aria-label, NOT a bare aria-haspopup='menu'
// (the Next.js dev-tools indicator button also carries aria-haspopup='menu').
const AVATAR_TRIGGER =
  "button[aria-label='Hesap menüsü'], button[aria-label='Account menu']"

test.describe("Avatar dropdown admin link perm gate @phase-15", () => {
  test("Admin role sees 'Yönetim Paneli' link (D-1.5 super-role)", async ({
    page,
  }) => {
    await setupMockBackend(page, { me: ADMIN_ME })
    await page.goto("/dashboard")

    await expect(page.locator(AVATAR_TRIGGER).first()).toBeVisible({
      timeout: 15_000,
    })
    await page.locator(AVATAR_TRIGGER).first().click()

    // Scope to the dropdown menu — "Yönetim Paneli" also exists in the sidebar
    // nav, so a page-wide check would not actually test the dropdown gate.
    await expect(
      page
        .locator("#avatar-dropdown-menu")
        .getByText(/Yönetim Paneli|Admin Panel/),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("custom 'SuperUser' role with admin.access perm sees the link (D-2.11 explicit-perm path)", async ({
    page,
  }) => {
    await setupMockBackend(page, {
      me: SUPERUSER_ME,
      token: jwtWithPermissions(["admin.access"]),
    })
    await page.goto("/dashboard")

    await expect(page.locator(AVATAR_TRIGGER).first()).toBeVisible({
      timeout: 15_000,
    })
    await page.locator(AVATAR_TRIGGER).first().click()

    // Scope to the dropdown menu — "Yönetim Paneli" also exists in the sidebar
    // nav, so a page-wide check would not actually test the dropdown gate.
    await expect(
      page
        .locator("#avatar-dropdown-menu")
        .getByText(/Yönetim Paneli|Admin Panel/),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("Member role does NOT see the link (D-2.11 deny path)", async ({
    page,
  }) => {
    await setupMockBackend(page, { me: MEMBER_ME })
    await page.goto("/dashboard")

    const trigger = page.locator(AVATAR_TRIGGER).first()
    await expect(trigger).toBeVisible({ timeout: 15_000 })
    await trigger.click()
    // The dropdown is open, but it must NOT contain the admin link. Scope to
    // the menu (the sidebar nav has its own "Yönetim Paneli" link).
    await expect(
      page.locator("#avatar-dropdown-menu"),
    ).toBeVisible({ timeout: 5_000 })
    await expect(
      page
        .locator("#avatar-dropdown-menu")
        .getByText(/Yönetim Paneli|Admin Panel/),
    ).toHaveCount(0)
  })
})

import { test, expect } from "@playwright/test"
import { setupMockBackend, ADMIN_ME, jsonResponse } from "./support/mock-auth"

/**
 * Admin RBAC self-edit prevention E2E (Plan 15-11 D-2.9) — rebuilt to run.
 *
 * UserRowActions disables the "Rolü değiştir" menu item when the row's user is
 * the logged-in admin (isSelf = currentUser.id === row.user.id), so an admin
 * can't demote themselves out of the panel.
 *
 * The mocked list has two rows: the admin (id 1 = /auth/me id → self) and a
 * member (id 2 → not self). The self row's item must be disabled; the other
 * enabled. Each row's MoreMenu trigger is a button whose aria-label is the
 * change-role label; the menu items are role="menuitem" with the disabled attr.
 */

const USERS = {
  items: [
    {
      id: 1,
      email: "admin@example.com",
      full_name: "Admin User",
      is_active: true,
      role: { name: "Admin" },
    },
    {
      id: 2,
      email: "member@example.com",
      full_name: "Member User",
      is_active: true,
      role: { name: "Member" },
    },
  ],
  total: 2,
}

const CHANGE_ROLE = /Rolü değiştir|Change role/

test.describe("Admin RBAC self-edit prevention @phase-15", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      me: ADMIN_ME, // id 1 → matches the first row → that row is "self"
      routes: {
        "/admin/users": (route) => jsonResponse(route, USERS),
        "/admin/roles": (route) => jsonResponse(route, { items: [], total: 0 }),
      },
    })
    await page.goto("/admin/users")
  })

  test("admin's own row 'Rolü değiştir' item is disabled (D-2.9)", async ({
    page,
  }) => {
    // Two per-row MoreMenu triggers (aria-label = change-role label); row 0 is
    // the admin (self), row 1 the member.
    const triggers = page.getByRole("button", { name: CHANGE_ROLE })
    await expect(triggers.nth(0)).toBeVisible({ timeout: 15_000 })
    await triggers.nth(0).click()

    const changeRoleItem = page.getByRole("menuitem", { name: CHANGE_ROLE })
    await expect(changeRoleItem).toBeVisible({ timeout: 5_000 })
    // kills mutation: dropping the isSelf guard would leave this enabled.
    await expect(changeRoleItem).toBeDisabled()
  })

  test("non-self row 'Rolü değiştir' item is enabled (negative control, D-2.9)", async ({
    page,
  }) => {
    const triggers = page.getByRole("button", { name: CHANGE_ROLE })
    await expect(triggers.nth(1)).toBeVisible({ timeout: 15_000 })
    await triggers.nth(1).click()

    const changeRoleItem = page.getByRole("menuitem", { name: CHANGE_ROLE })
    await expect(changeRoleItem).toBeVisible({ timeout: 5_000 })
    // The member row is NOT self → the item must be actionable.
    await expect(changeRoleItem).toBeEnabled()
  })
})

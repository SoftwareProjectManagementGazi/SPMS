import { test, expect } from "@playwright/test"
import { setupMockBackend, MEMBER_ME } from "./support/mock-auth"

/**
 * Avatar dropdown (PROF-03) — rebuilt to actually run.
 *
 * Opens the header AvatarDropdown and verifies the always-visible menu items
 * plus the logout flow. Fix: the logout target is /login — the original
 * /auth/login (D-D3) was a 404 and was changed in Plan 14-18; the skip-guard
 * had hidden that the old assertion was stale.
 */

test.describe("Avatar dropdown @phase-13", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, { me: MEMBER_ME })
    await page.goto("/dashboard")
  })

  test("trigger opens menu with all menu items", async ({ page }) => {
    const trigger = page.getByRole("button", {
      name: /Hesap menüsü|Account menu/,
    })
    await expect(trigger).toBeVisible({ timeout: 15_000 })
    await trigger.click()

    await expect(page.getByRole("menu")).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: /Profilim|My Profile/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: /^Ayarlar$|^Settings$/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: /^Dil$|^Language$/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: /Çıkış Yap|Sign Out/ }),
    ).toBeVisible()
  })

  test("logout flow clears token and lands on /login", async ({ page }) => {
    const trigger = page.getByRole("button", {
      name: /Hesap menüsü|Account menu/,
    })
    await expect(trigger).toBeVisible({ timeout: 15_000 })
    await trigger.click()

    await page.getByRole("menuitem", { name: /Çıkış Yap|Sign Out/ }).click()

    await page.waitForURL(/\/login/, { timeout: 10_000 })
    const tokenAfter = await page.evaluate(() =>
      window.localStorage.getItem("auth_token"),
    )
    expect(tokenAfter).toBeNull()
  })
})

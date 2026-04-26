import { test, expect } from "@playwright/test"

/**
 * Phase 13 Plan 13-10 — Avatar dropdown smoke (PROF-03).
 *
 * Verifies the header AvatarDropdown shipped in Plan 13-02 opens, exposes
 * the menu items, and the logout flow lands on /auth/login + clears the
 * localStorage auth_token.
 *
 *   - Trigger button has aria-label "Hesap menüsü" / "Account menu"
 *     (avatar-dropdown.tsx line 216).
 *   - Menu role + items rendered as role="menuitem" buttons.
 *   - Logout calls useAuth().logout() (clears localStorage auth_token —
 *     Phase 10 D-09) then router.push('/auth/login') per CONTEXT D-D3.
 *
 * Skip-guard pattern: Phase 11 D-50. No test-DB seeder yet — guard fires
 * when /api/v1/health is unreachable.
 */

test.describe("Avatar dropdown @phase-13", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 13",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard").catch(() => {})
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

  test("trigger opens menu with all menu items", async ({ page }) => {
    const trigger = page.getByRole("button", {
      name: /Hesap menüsü|Account menu/,
    })
    await expect(trigger).toBeVisible({ timeout: 10_000 })

    await trigger.click()

    // Menu container has role="menu" (avatar-dropdown.tsx line 230).
    await expect(page.getByRole("menu")).toBeVisible()

    // 5 items per CONTEXT D-D2. Yönetim Paneli is admin-only — skip a hard
    // assertion on it here; this spec asserts the always-visible items.
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

  test("logout flow clears token and lands on /auth/login (D-D3)", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", {
      name: /Hesap menüsü|Account menu/,
    })
    await expect(trigger).toBeVisible({ timeout: 10_000 })
    await trigger.click()

    await page
      .getByRole("menuitem", { name: /Çıkış Yap|Sign Out/ })
      .click()

    // CONTEXT D-D3 — sign-out target is /auth/login (NOT legacy /login).
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })

    // useAuth().logout clears the auth_token key (AUTH_TOKEN_KEY constant
    // matches legacy Frontend/lib/constants.ts per Phase 10 D-02).
    const tokenAfter = await page.evaluate(() =>
      window.localStorage.getItem("auth_token"),
    )
    expect(tokenAfter).toBeNull()
  })
})

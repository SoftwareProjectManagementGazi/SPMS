import { test, expect } from "@playwright/test"
import { setupMockBackend, ADMIN_ME, MEMBER_ME } from "./support/mock-auth"

/**
 * Admin route guard E2E (D-C3) — rebuilt to actually run.
 *
 * Previously self-skipped via the /api/v1/health probe. Now each scenario sets
 * up its own auth state against a mocked backend:
 *   - anonymous (no cookie) → middleware bounces to /login, no /admin DOM.
 *   - member (logged in, not admin) → client role guard bounces to /dashboard
 *     with the access-denied toast.
 *   - admin → /admin renders with all 8 NavTabs + header buttons.
 *
 * Fix: the previous assertion expected "/auth/login", but middleware.ts and the
 * admin layout both redirect to "/login" (the (auth) route group serves /login
 * at its root). The skip-guard hid that mismatch; this asserts the real target.
 */

test.describe("Admin route guard @phase-14", () => {
  test("anonymous user redirects to /login when hitting /admin/users (Pitfall 10)", async ({
    page,
    context,
  }) => {
    // No setupMockBackend → no auth_session cookie → middleware must bounce.
    await context.clearCookies()

    await page.goto("/admin/users")

    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain("/login")
    // Middleware forwards the attempted path so post-login can return there.
    expect(page.url()).toContain("from=")

    // Pitfall 10: the /admin layout heading must NOT render, even briefly.
    await expect(page.locator("h1:has-text('Yönetim Konsolu')")).toHaveCount(0)
    await expect(page.locator("h1:has-text('Admin Console')")).toHaveCount(0)
  })

  test("member user redirects to /dashboard with access-denied toast (Pitfall 3)", async ({
    page,
  }) => {
    await setupMockBackend(page, { me: MEMBER_ME })
    await page.goto("/admin")

    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    await expect(
      page
        .getByText(
          /Bu sayfaya erişim yetkiniz yok|You don't have permission to access this page/,
        )
        .first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("admin user renders Yönetim Konsolu + 8 NavTabs (D-C2)", async ({
    page,
  }) => {
    await setupMockBackend(page, { me: ADMIN_ME })
    await page.goto("/admin")

    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 15_000 })

    // 8 NavTabs by canonical href (route contract, locale-independent).
    // .first() because the overview body also links to some admin routes
    // (e.g. "Audit'a git →"), so a bare href selector is non-unique.
    await expect(page.locator("a[href='/admin']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/users']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/roles']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/permissions']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/projects']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/workflows']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/audit']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/stats']").first()).toBeVisible()

    // Page-header buttons (D-B6).
    await expect(
      page.getByRole("button", { name: /Rapor al|^Export$/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Denetim günlüğü|Audit log/ }),
    ).toBeVisible()
  })
})

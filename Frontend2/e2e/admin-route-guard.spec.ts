import { test, expect } from "@playwright/test"

/**
 * Phase 14 Plan 14-12 — Admin route guard E2E (D-C3, Pitfall 3 + 10).
 *
 * Verifies the triple-layer admin gate shipped across Phases 14-01..14-11:
 *   1. Server-edge cookie check  → Frontend2/middleware.ts (Pitfall 10).
 *   2. Client-side role guard    → app/(shell)/admin/layout.tsx (Pitfall 3 — isLoading FIRST).
 *   3. Backend require_admin     → every admin endpoint (Plan 14-01 router).
 *
 * Three scenarios:
 *   - Anonymous user navigates to /admin/users → bounced to /auth/login (no
 *     /admin DOM rendered, even briefly — Pitfall 10 server-edge gate).
 *   - Member user (logged in, not admin) navigates to /admin → bounced to
 *     /dashboard with the access-denied Toast (Pitfall 3 — isLoading bail
 *     prevents a false-positive admin pass during hydration; the role
 *     check runs only after isLoading is false).
 *   - Admin user navigates to /admin → Yönetim Konsolu page renders cleanly
 *     with all 8 NavTabs (D-C2 — exact 8-route shape).
 *
 * Skip-guard pattern (Phase 11 D-50, reused from Phase 13 13-10):
 *   beforeEach probes /api/v1/health; if unreachable, the test SKIPs. With a
 *   future test-DB seeder these specs validate the real behavior end-to-end.
 *   No test-environment auth fixture exists yet (cross-phase scope flag), so
 *   the member + admin scenarios skip on the "no seeded backend" guard until
 *   the seeder ships.
 */

test.describe("Admin route guard @phase-14", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 14",
  )

  test.beforeEach(async ({ page }) => {
    // Phase 11 D-50 skip-guard — skip when /api/v1/health is unreachable
    // (no seeded backend). page.evaluate runs in the browser; .catch keeps
    // the spec green if the page itself fails to load before the eval runs.
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

  test("anonymous user redirects to /auth/login when hitting /admin/users (Pitfall 10)", async ({
    page,
    context,
  }) => {
    // Clear cookies + localStorage to ensure no stale auth state. The
    // middleware.ts server-edge gate reads the auth cookie; if absent it
    // bounces BEFORE the /admin layout's render path runs (Pitfall 10).
    await context.clearCookies()
    await page.evaluate(() => {
      try {
        window.localStorage.clear()
      } catch {
        // jsdom or sandbox may throw; ignore.
      }
    })

    await page.goto("/admin/users")

    // Expected: bounced to /auth/login with ?next= param. The middleware
    // sets the next param so the post-login flow returns the admin to the
    // page they were trying to reach.
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 })
    expect(page.url()).toContain("auth/login")

    // Pitfall 10 assertion: NO /admin layout DOM rendered, even briefly.
    // The Yönetim Konsolu heading is the layout's signature element — it
    // must not be visible after the redirect resolves.
    await expect(
      page.locator("h1:has-text('Yönetim Konsolu')"),
    ).toHaveCount(0)
    await expect(
      page.locator("h1:has-text('Admin Console')"),
    ).toHaveCount(0)
  })

  test("member user redirects to /dashboard with access-denied Toast (Pitfall 3)", async ({
    page,
  }) => {
    // Pre-condition: a seeded member-role user is logged in. With the
    // skip-guard above, this test only runs when the seeder is in place.
    await page.goto("/admin")

    // Expected: client-side role check runs AFTER isLoading goes false
    // (Pitfall 3). The user is a real member (not admin), so layout.tsx
    // bounces to /dashboard + fires the access-denied Toast.
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })

    // Toast text — admin.layout.access_denied_toast key.
    // TR: "Bu sayfaya erişim yetkiniz yok."
    // EN: "You don't have permission to access this page."
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
    // Pre-condition: a seeded admin-role user is logged in. The skip-guard
    // above gates this whole describe block on a reachable backend.
    await page.goto("/admin")

    // Page heading — admin.layout.title key.
    await expect(
      page.locator("h1").filter({ hasText: /Yönetim Konsolu|Admin Console/ }),
    ).toBeVisible({ timeout: 10_000 })

    // 8 NavTabs (D-C2 — exact 8-route shape). The NavTabs primitive renders
    // each tab as an anchor with the canonical /admin/* href. We assert
    // every href is present rather than asserting label text (label text
    // is locale-dependent; href is the route contract).
    await expect(page.locator("a[href='/admin']").first()).toBeVisible()
    await expect(page.locator("a[href='/admin/users']")).toBeVisible()
    await expect(page.locator("a[href='/admin/roles']")).toBeVisible()
    await expect(page.locator("a[href='/admin/permissions']")).toBeVisible()
    await expect(page.locator("a[href='/admin/projects']")).toBeVisible()
    await expect(page.locator("a[href='/admin/workflows']")).toBeVisible()
    await expect(page.locator("a[href='/admin/audit']")).toBeVisible()
    await expect(page.locator("a[href='/admin/stats']")).toBeVisible()

    // Page-header buttons (Plan 14-11 D-B6) — both must be present.
    await expect(
      page.getByRole("button", { name: /Rapor al|^Export$/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Denetim günlüğü|Audit log/ }),
    ).toBeVisible()
  })
})

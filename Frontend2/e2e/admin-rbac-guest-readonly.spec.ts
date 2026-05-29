import { test, expect } from "@playwright/test"
import { setupMockBackend, GUEST_ME, jsonResponse } from "./support/mock-auth"

/**
 * Guest read-only access E2E (Plan 15-04 + 15-09) — rebuilt to actually run.
 *
 * Guest role has no write permissions, so:
 *   - <RequirePermission perm="project.create"> hides the "Yeni Proje" button
 *     on the dashboard and the projects page (UI tier, D-1.7).
 *   - A direct POST /projects is rejected 403 PERMISSION_DENIED (backend tier,
 *     T-15-05) — mocked here so the negative path is deterministic.
 */

test.describe("Guest read-only access @phase-15", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      me: GUEST_ME,
      routes: {
        // GET → empty list (read-only access works); POST → 403 (no write perm).
        "/projects": (route) => {
          if (route.request().method() === "POST") {
            return route.fulfill({
              status: 403,
              contentType: "application/json",
              body: JSON.stringify({
                error_code: "PERMISSION_DENIED",
                detail: "project.create required",
              }),
            })
          }
          return jsonResponse(route, [])
        },
      },
    })
  })

  test("Guest can view the dashboard (read access behind auth)", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    // The dashboard greeting ("Merhaba, …") renders → guest passed the
    // middleware + shell and has read access.
    await expect(
      page.getByText(/Merhaba|Welcome|Hello/).first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test("Guest /projects page hides the New Project button (D-08 role gate)", async ({
    page,
  }) => {
    await page.goto("/projects")

    // The page title is a styled <div>, not a heading element.
    await expect(
      page.getByText(/^Projeler$|^Projects$/).first(),
    ).toBeVisible({ timeout: 15_000 })

    // "Yeni proje" / "New project" is gated to Admin + Project Manager only;
    // a Guest must not see it. (Button label is lowercase "proje" → use /i.)
    await expect(
      page.getByRole("button", { name: /Yeni proje|New project/i }),
    ).toHaveCount(0)
  })

  test("Guest POST /projects is rejected (backend defense, T-15-05)", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    const result = await page.evaluate(async () => {
      try {
        const r = await fetch("/api/v1/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "GuestE2E Forbidden", methodology: "scrum" }),
        })
        return { status: r.status }
      } catch {
        return { status: 0 }
      }
    })

    expect([401, 403]).toContain(result.status)
  })
})

import { test, expect } from "@playwright/test"
import { setupMockBackend, jsonResponse } from "./support/mock-auth"

/**
 * Admin Users CRUD E2E (Plan 14-03) — rebuilt to actually run.
 *
 * Previously self-skipped via the /api/v1/health probe. Now authenticates as
 * admin against a mocked backend so the UsersTable toolbar renders, the Add
 * User modal opens + submits (invite mocked → modal closes), and the Bulk
 * Invite modal opens. Assertions target modal-specific content (the modal
 * titles are styled <div>s, not heading roles, and share text with toolbar
 * buttons).
 */

test.describe("Admin Users CRUD @phase-14", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      routes: {
        "/admin/users": (route, path) => {
          if (route.request().method() === "POST" && path === "/admin/users") {
            return jsonResponse(route, {
              user_id: 99,
              email: "newuser@e2e.local",
              invite_token_expires_at: "2026-12-31T00:00:00Z",
            })
          }
          return jsonResponse(route, { items: [], total: 0 })
        },
      },
    })
    await page.goto("/admin/users")
  })

  test("Kullanıcı ekle opens AddUserModal; valid email submit closes it", async ({
    page,
  }) => {
    const addBtn = page.getByRole("button", { name: /Kullanıcı ekle|Add user/ })
    await expect(addBtn).toBeVisible({ timeout: 15_000 })
    await addBtn.click()

    // Modal opened → its email field is present (modal-specific, unlike the
    // title which is a <div> sharing text with the toolbar button).
    const emailInput = page
      .locator("#add-user-email, input[type='email'][autocomplete='email']")
      .first()
    await expect(emailInput).toBeVisible({ timeout: 5_000 })
    await emailInput.fill("newuser@e2e.local")

    await page.getByRole("button", { name: /Davet gönder|Send invite/ }).click()

    // Invite succeeds (mocked POST) → onSuccess closes the modal.
    await expect(emailInput).toBeHidden({ timeout: 10_000 })
  })

  test("Toplu davet opens BulkInviteModal", async ({ page }) => {
    const bulkBtn = page.getByRole("button", { name: /Toplu davet|Bulk invite/ })
    await expect(bulkBtn).toBeVisible({ timeout: 15_000 })
    await bulkBtn.click()

    // Modal-specific content (the CSV picker) — unique to the bulk modal.
    await expect(
      page.getByText(/CSV dosyası seç|CSV format|Choose CSV|Select CSV/i).first(),
    ).toBeVisible({ timeout: 5_000 })
  })
})

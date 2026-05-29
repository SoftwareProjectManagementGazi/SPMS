import { test, expect } from "@playwright/test"
import { setupMockBackend, jsonResponse } from "./support/mock-auth"

/**
 * Admin RBAC roles CRUD E2E (Plans 15-10 / 15-11) — rebuilt to actually run.
 *
 * Mocks /admin/roles with a stateful custom-role store so the full
 * create → edit → delete lifecycle is real: POST appends, GET returns the
 * store, PATCH mutates, DELETE removes; the page's TanStack invalidations
 * refetch GET after each mutation so cards appear/vanish.
 *
 * The 4 system role cards (Admin / Project Manager / Member / Guest) are
 * hardcoded in the page and carry the Sistem badge with no edit/delete
 * buttons; only custom (is_system_role:false) roles expose Düzenle/Sil.
 */

test.describe("Admin RBAC roles CRUD @phase-15", () => {
  test.beforeEach(async ({ page }) => {
    // Per-test stateful custom-role store (fresh closure each test).
    let customRoles: Array<Record<string, unknown>> = []
    let nextId = 100

    await setupMockBackend(page, {
      routes: {
        "/admin/roles": (route, path) => {
          const method = route.request().method()
          if (method === "POST" && path === "/admin/roles") {
            const body = route.request().postDataJSON() as Record<string, unknown>
            const role = {
              id: nextId++,
              name: body.name,
              description: body.description ?? null,
              icon_key: body.icon_key ?? null,
              color_token: body.color_token ?? null,
              is_system_role: false,
            }
            customRoles.push(role)
            return jsonResponse(route, role)
          }
          if (method === "PATCH" && path.startsWith("/admin/roles/")) {
            const id = Number(path.split("/").pop())
            const body = route.request().postDataJSON() as Record<string, unknown>
            const role = customRoles.find((r) => r.id === id)
            if (role) Object.assign(role, body)
            return jsonResponse(route, role ?? {})
          }
          if (method === "DELETE" && path.startsWith("/admin/roles/")) {
            const id = Number(path.split("/").pop())
            customRoles = customRoles.filter((r) => r.id !== id)
            return route.fulfill({ status: 204, body: "" })
          }
          // GET /admin/roles → only custom roles (system cards are hardcoded).
          return jsonResponse(route, {
            items: customRoles,
            total: customRoles.length,
          })
        },
      },
    })
    await page.goto("/admin/roles")
  })

  test("4 system role cards render with Sistem badge + no edit buttons (D-2.3)", async ({
    page,
  }) => {
    for (const name of ["Admin", "Project Manager", "Member", "Guest"]) {
      await expect(
        page.getByText(name, { exact: true }).first(),
      ).toBeVisible({ timeout: 15_000 })
    }
    // Per-card Sistem badge.
    await expect(
      page.getByText(/^Sistem$|^System$/).first(),
    ).toBeVisible()
    // System cards expose no edit affordance; no custom roles exist either.
    await expect(
      page.getByRole("button", { name: /^Düzenle$|^Edit$/ }),
    ).toHaveCount(0)
  })

  test("reserved name 'Admin' shows the inline reserved-name error (D-2.6)", async ({
    page,
  }) => {
    await page.locator("[data-testid='new-role-modal-trigger']").click()
    const nameInput = page.locator("#role-create-name")
    await expect(nameInput).toBeVisible({ timeout: 10_000 })

    await nameInput.fill("Admin")
    // Save is disabled for an invalid name; submit via Enter to surface the
    // inline error (handleSubmit sets submitted=true then bails on !formValid).
    await nameInput.press("Enter")

    await expect(
      page
        .getByText(/Bu isim sistem rolü için ayrılmıştır|Reserved name/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test("custom role create → card appears → edit → delete (D-2.2, D-2.8)", async ({
    page,
  }) => {
    const customRoleName = `DesignerE2E_${Date.now().toString(36).slice(-6)}`

    // --- CREATE ---
    await page.locator("[data-testid='new-role-modal-trigger']").click()
    const nameInput = page.locator("#role-create-name")
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill(customRoleName)
    await page.locator("#role-create-description").fill("E2E designer role")

    const groups = page.getByRole("radiogroup")
    await groups.nth(0).getByRole("radio", { name: /Briefcase/i }).click()
    await groups.nth(1).getByRole("radio", { name: /^warning$/i }).click()

    await page.getByRole("button", { name: /^Kaydet$|^Save$/ }).click()

    await expect(
      page.getByText(/Rol oluşturuldu|Role created/i).first(),
    ).toBeVisible({ timeout: 5_000 })

    const newCard = page.locator("[data-role-card-id]", {
      hasText: customRoleName,
    })
    await expect(newCard).toBeVisible({ timeout: 10_000 })

    // --- EDIT ---
    await newCard.getByRole("button", { name: /^Düzenle$|^Edit$/ }).click()
    const editDesc = page.locator("#role-edit-description")
    await expect(editDesc).toBeVisible({ timeout: 5_000 })
    await editDesc.fill("Updated by E2E")
    await page.getByRole("button", { name: /^Kaydet$|^Save$/ }).click()
    await expect(
      page.getByText(/Rol güncellendi|Role updated/i).first(),
    ).toBeVisible({ timeout: 5_000 })

    // --- DELETE (with Member-migration confirm, D-2.2) ---
    await newCard.getByRole("button", { name: /^Sil$|^Delete$/ }).click()
    await expect(
      page
        .getByText(/kullanıcıyı Member rolüne taşıyacak|move .* to Member/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 })
    // Confirm — the dialog's danger button (last "Sil" in DOM).
    await page.getByRole("button", { name: /^Sil$|^Delete$/ }).last().click()

    // Card vanishes after the delete + refetch.
    await expect(
      page.getByText(customRoleName, { exact: true }),
    ).toHaveCount(0, { timeout: 10_000 })
  })
})

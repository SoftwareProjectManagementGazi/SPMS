import { test, expect } from "@playwright/test"
import { setupMockBackend, jsonResponse } from "./support/mock-auth"

/**
 * Admin RBAC permission matrix E2E (Plan 15-10) — rebuilt to actually run.
 *
 * Mocks GET/PATCH /admin/permissions/matrix. The PM × project.delete cell is
 * stateful so the auto-save → reload persistence path is real: the PATCH flips
 * the server state and the reload's refetch returns it.
 */

const ROLES = [
  { id: 1, name: "Admin", is_system_role: true },
  { id: 2, name: "Project Manager", is_system_role: true },
  { id: 3, name: "Member", is_system_role: true },
  { id: 4, name: "Guest", is_system_role: true },
]

const PERMISSIONS = [
  { id: 10, key: "project.delete", scope: "project", label_tr: "Proje sil", label_en: "Delete project" },
  { id: 11, key: "task.delete", scope: "project", label_tr: "Görev sil", label_en: "Delete task" },
  { id: 12, key: "admin.users.invite", scope: "system", label_tr: "Kullanıcı davet et", label_en: "Invite user" },
]

const PM_DELETE_CELL =
  "input[type='checkbox'][aria-label*='project.delete'][aria-label*='Project Manager']"

test.describe("Admin RBAC permission matrix @phase-15", () => {
  test.beforeEach(async ({ page }) => {
    // PM × project.delete starts OFF; the PATCH flips it so the post-mutation
    // refetch + page.reload both observe the persisted value.
    let pmProjectDelete = false

    await setupMockBackend(page, {
      routes: {
        "/admin/permissions/matrix": (route) => {
          if (route.request().method() === "PATCH") {
            const body = route.request().postDataJSON() as {
              role_id: number
              perm_key: string
              granted: boolean
            }
            if (body.role_id === 2 && body.perm_key === "project.delete") {
              pmProjectDelete = body.granted
            }
            return route.fulfill({ status: 204, body: "" })
          }
          const cells = pmProjectDelete
            ? [{ role_id: 2, permission_id: 10, granted: true }]
            : []
          return jsonResponse(route, {
            roles: ROLES,
            permissions: PERMISSIONS,
            cells,
          })
        },
      },
    })
    await page.goto("/admin/permissions")
  })

  test("PM × project.delete cell auto-saves, toasts, and persists across reload (D-1.12)", async ({
    page,
  }) => {
    const cell = page.locator(PM_DELETE_CELL).first()
    await expect(cell).toBeVisible({ timeout: 15_000 })
    expect(await cell.isChecked()).toBe(false)

    await cell.click()

    await expect(
      page.getByText(/Yetki güncellendi|Permission updated/i).first(),
    ).toBeVisible({ timeout: 5_000 })

    // Reload → the persisted state comes back from the (stateful) backend.
    await page.reload()
    const reloaded = page.locator(PM_DELETE_CELL).first()
    await expect(reloaded).toBeVisible({ timeout: 15_000 })
    // kills mutation: a no-op PATCH / no persistence leaves this unchecked.
    expect(await reloaded.isChecked()).toBe(true)
  })

  test("Admin column toggles are disabled and visually granted (D-1.5)", async ({
    page,
  }) => {
    const adminCell = page
      .locator(
        "input[type='checkbox'][aria-label*='task.delete'][aria-label*='Admin']",
      )
      .first()
    await expect(adminCell).toBeVisible({ timeout: 15_000 })
    await expect(adminCell).toBeDisabled()
    await expect(adminCell).toBeChecked()
  })

  test("per-row scope badges render (sistem) and (proje) (D-3.4)", async ({
    page,
  }) => {
    await expect(
      page.getByText(/\(proje\)|\(project\)/).first(),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByText(/\(sistem\)|\(system\)/).first(),
    ).toBeVisible()
  })

  test("each system-role column header carries a Sistem badge (D-2.4)", async ({
    page,
  }) => {
    const sistemBadges = page.getByText(/^Sistem$|^System$/)
    await expect(sistemBadges.first()).toBeVisible({ timeout: 15_000 })
    expect(await sistemBadges.count()).toBeGreaterThanOrEqual(4)
  })
})

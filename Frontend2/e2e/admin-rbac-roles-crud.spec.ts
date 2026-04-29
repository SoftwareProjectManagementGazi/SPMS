import { test, expect } from "@playwright/test"

/**
 * Phase 15 Plan 15-12 — Admin RBAC Roles CRUD E2E (Plans 15-05 / 15-10 / 15-11).
 *
 * Verifies the Roller (Roles) tab full CRUD lifecycle that landed in Wave 2:
 *
 *   - System role cards (Admin / Project Manager / Member / Guest) render with
 *     the Sistem badge AND hide their Düzenle/Sil action buttons. Backend
 *     defends in depth via SYSTEM_ROLE_PROTECTED 422 (Plan 15-06 D-2.3).
 *
 *   - "Yeni rol oluştur" trigger opens RoleCreateModal (Plan 15-11 D-2.6/2.8):
 *     name input + description input + 8-icon radiogroup + 6-color radiogroup
 *     + Save button. Validation rejects reserved names (validateRoleName per
 *     D-2.6) inline; backend RESERVED_ROLE_NAMES set is the second-tier guard.
 *
 *   - Custom role create → edit → delete flow with Member fallback dialog
 *     body explicitly stating "<N> kullanıcı Member rolüne taşıyacak" per
 *     D-2.2 (Plan 15-06 single-transaction Member migration).
 *
 *   - The role-card grid re-renders the new card on success (TanStack
 *     Query invalidation cascade — useDeleteRole invalidates roles + matrix
 *     + admin/users per Plan 15-09 D-2.2).
 *
 * Skip-guard pattern (Phase 11 D-50, reused from Phase 13 13-10 + Phase 14
 * 14-12): beforeEach probes /api/v1/health; if unreachable the spec skips.
 * The skip-guard PROTECTS the test from running against an unseeded backend
 * (which would falsely RED on missing test fixtures); manual UAT is the
 * primary acceptance method and the E2E is regression-only safety net for
 * the future seeded-DB CI lane.
 */

test.describe("Admin RBAC roles CRUD @phase-15", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 15 RBAC E2E",
  )

  test.beforeEach(async ({ page }) => {
    // Phase 11 D-50 skip-guard — manual UAT primary; E2E run via seeded
    // backend only. /api/v1/health probe in the browser keeps the spec
    // green when no test DB is mounted.
    await page.goto("/admin/roles").catch(() => {})
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

  test("4 system role cards render with Sistem badge + hide Düzenle/Sil (D-2.3, D-2.4)", async ({
    page,
  }) => {
    // Page heading — admin.roles.title key.
    await expect(
      page.locator("h1").filter({ hasText: /Roller|Roles/ }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // 4 system role names — Admin / Project Manager / Member / Guest.
    // Each card carries a Sistem / System badge per D-2.4 (per-column badge
    // wired in Plan 15-10 / role-card.tsx isSystemRole prop).
    const systemRoles = ["Admin", "Project Manager", "Member", "Guest"]
    for (const name of systemRoles) {
      // Role name is rendered in card header as a heading-level element.
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible({
        timeout: 5_000,
      })
    }

    // Sistem / System badge appears at least once (per system role card →
    // 4 occurrences) per D-2.4 isSystemRole prop in role-card.tsx.
    await expect(
      page.getByText(/Sistem|System/, { exact: true }).first(),
    ).toBeVisible()

    // Düzenle (Edit) / Sil (Delete) buttons are HIDDEN on system role cards
    // (Plan 15-10 role-card.tsx: action buttons render only when onEdit /
    // onDelete props are set — system roles set neither). The "Yeni rol
    // oluştur" trigger button is the only Düzenle-style button visible at
    // page load; we assert NO row-level edit menu is shown for the 4
    // system roles by counting the relevant buttons.
    const editButtons = page.getByRole("button", { name: /^Düzenle$|^Edit$/ })
    // 0 edit buttons across the 4 system role cards (custom role count
    // depends on seeder; acceptance criterion is system-role-only assert).
    await expect(editButtons).toHaveCount(0)
  })

  test("custom role create with icon + color → card appears, then edit, then delete with Member fallback (D-2.2, D-2.6, D-2.8)", async ({
    page,
  }) => {
    // Click "Yeni rol oluştur" trigger (NewRoleModalTrigger, Plan 15-10).
    // data-testid="new-role-modal-trigger" exposes it for E2E.
    const trigger = page
      .locator("[data-testid='new-role-modal-trigger']")
      .or(page.getByRole("button", { name: /Yeni rol oluştur|New role/ }))
    await expect(trigger.first()).toBeVisible({ timeout: 10_000 })
    await trigger.first().click()

    // RoleCreateModal opens — modal heading "Yeni rol oluştur" / "New role".
    await expect(
      page
        .getByRole("heading", { name: /Yeni rol oluştur|New role/ })
        .first(),
    ).toBeVisible({ timeout: 5_000 })

    // Fill name (D-2.6 validateRoleName: 1-50 char, Latin/TR, non-reserved).
    // Use a unique suffix so re-runs don't 409 on duplicate.
    const uniqueSuffix = Date.now().toString(36).slice(-6)
    const customRoleName = `DesignerE2E_${uniqueSuffix}`
    await page
      .getByLabel(/İsim|Name/)
      .first()
      .fill(customRoleName)
    await page
      .getByLabel(/Açıklama|Description/)
      .first()
      .fill("E2E test designer role")

    // Pick Briefcase icon (8-icon radiogroup, Plan 15-11 role-icon-picker).
    // Each radio is a button[role="radio"] inside role="radiogroup".
    const iconRadiogroup = page.getByRole("radiogroup").first()
    await expect(iconRadiogroup).toBeVisible({ timeout: 3_000 })
    // Briefcase has aria-label="Briefcase" on its radio button.
    await iconRadiogroup
      .getByRole("radio", { name: /Briefcase/i })
      .click()

    // Pick warning color (6-token radiogroup, Plan 15-11 role-color-swatch).
    const colorRadiogroup = page.getByRole("radiogroup").nth(1)
    await colorRadiogroup
      .getByRole("radio", { name: /warning|--warning/i })
      .click()

    // Submit — Save button label "Kaydet" (TR) / "Save" (EN).
    await page.getByRole("button", { name: /^Kaydet$|^Save$/ }).click()

    // Card appears in role grid post-mutation (useCreateRole invalidates
    // ["admin","roles"] which AdminRolesPage subscribes to via useRoles).
    await expect(
      page.getByText(customRoleName, { exact: true }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // EDIT — open RoleEditModal via the new card's Düzenle button.
    // Custom role cards expose Düzenle/Sil per Plan 15-10 (onEdit/onDelete
    // props set in roles/page.tsx for is_system_role === false rows).
    const newCard = page
      .locator("[data-testid^='role-card-']", {
        hasText: customRoleName,
      })
      .first()
    await newCard
      .getByRole("button", { name: /^Düzenle$|^Edit$/ })
      .click()

    // RoleEditModal opens — title "Rolü düzenle" / "Edit role".
    await expect(
      page
        .getByRole("heading", { name: /Rolü düzenle|Edit role/ })
        .first(),
    ).toBeVisible({ timeout: 5_000 })

    // Update description.
    const descInput = page.getByLabel(/Açıklama|Description/).first()
    await descInput.fill("")
    await descInput.fill("Updated by E2E")
    await page.getByRole("button", { name: /^Kaydet$|^Save$/ }).click()

    // Toast "Rol güncellendi" / "Role updated" surfaces.
    await expect(
      page.getByText(/Rol güncellendi|Role updated/i).first(),
    ).toBeVisible({ timeout: 5_000 })

    // DELETE — open RoleDeleteConfirm via the card's Sil button.
    await newCard
      .getByRole("button", { name: /^Sil$|^Delete$/ })
      .click()

    // ConfirmDialog body explicitly states the Member migration (D-2.2).
    // Body text: "Bu rolü silmek <N> kullanıcıyı Member rolüne taşıyacak."
    await expect(
      page
        .getByText(/kullanıcıyı Member rolüne taşıyacak|move .* to Member/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 })

    // Confirm deletion — danger-tone confirm button "Sil" / "Delete".
    await page
      .getByRole("button", { name: /^Sil$|^Delete$/ })
      .last()
      .click()

    // Card vanishes post-delete (useDeleteRole invalidates roles cache).
    await expect(
      page.getByText(customRoleName, { exact: true }),
    ).toBeHidden({ timeout: 10_000 })
  })

  test("create role with reserved name 'Admin' shows ROLE_NAME_INVALID inline (D-2.6 + Pitfall 5)", async ({
    page,
  }) => {
    // Open RoleCreateModal.
    const trigger = page
      .locator("[data-testid='new-role-modal-trigger']")
      .or(page.getByRole("button", { name: /Yeni rol oluştur|New role/ }))
    await trigger.first().click()
    await expect(
      page
        .getByRole("heading", { name: /Yeni rol oluştur|New role/ })
        .first(),
    ).toBeVisible({ timeout: 5_000 })

    // Reserved names are case-insensitive deny-listed per Plan 15-11
    // role-validation.ts RESERVED_ROLE_NAMES = ["admin", "project manager",
    // "member", "guest"]. Backend RESERVED_ROLE_NAMES mirrors via Pydantic
    // (Pitfall 5 — defense in depth).
    await page.getByLabel(/İsim|Name/).first().fill("Admin")

    // Submit — discriminated-union returns reason="reserved" → inline
    // localized error renders. Form does NOT POST (Save button disabled).
    const saveBtn = page.getByRole("button", { name: /^Kaydet$|^Save$/ })
    // Either Save is disabled OR clicking surfaces the inline error.
    const isDisabled = await saveBtn.isDisabled().catch(() => false)
    if (!isDisabled) {
      await saveBtn.click()
    }

    // Inline error per D-2.6 — TR copy "Bu isim sistem rolü için ayrılmıştır"
    // / EN "This name is reserved for a system role".
    await expect(
      page
        .getByText(
          /Bu isim sistem rolü için ayrılmıştır|reserved for a system role|reserved/i,
        )
        .first(),
    ).toBeVisible({ timeout: 5_000 })
  })
})

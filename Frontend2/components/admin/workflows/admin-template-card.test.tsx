// Phase 14 Plan 14-06 Task 1 — AdminTemplateCard RTL tests.
//
// Verifies 4 mandatory cases per <behavior>:
//   1. Renders template card with name + Custom badge (when is_builtin=false).
//   2. Mode badge tone correct for "sequential-locked" — Locked label text + a
//      tone class/style hint (we assert the visible English label "Locked"
//      because the badge renders the label string the consumer wires).
//   3. Per-card MoreH menu has EXACTLY 3 items (Düzenle + Klonla + Sil).
//   4. Sil with active_project_count=5 → Modal opens with "5" in the body AND
//      a secondary "Yine de sil" checkbox AND the danger CTA is disabled until
//      the checkbox is checked.
//
// We use the REAL MoreMenu primitive (not a mock) so menu-item presence
// assertions are meaningful. Hooks are mocked to avoid network and to keep
// the suite hermetic — pattern verbatim from Plan 14-05 admin-projects-table.
//
// Note: Turkish dotless-i / dotted-İ casefolding makes /işlemler/i flag
// matching unreliable in JS regex; we look up the trigger by literal string
// "İşlemler" (the shared MoreMenu primitive's default ariaLabel) per Plan
// 14-05 P05's locale-stable convention.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

// ---- next/navigation mock ----
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/workflows",
  useSearchParams: () => new URLSearchParams(),
}))

// ---- next/link mock ----
vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

// ---- useApp / useAuth mocks ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, email: "[email protected]", role: { name: "Admin" } },
    token: "x",
    isLoading: false,
  }),
}))

// ---- useToast mock ----
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

// ---- mutation hook mocks ----
vi.mock("@/hooks/use-projects", () => ({
  useCloneTemplate: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTemplate: () => ({ mutate: vi.fn(), isPending: false }),
}))

// We use the REAL MoreMenu component so menu-item presence assertions
// are meaningful. No mock for "@/components/admin/shared/more-menu".

// SUT — imported AFTER all mocks are wired
import { AdminTemplateCard } from "./admin-template-card"

const CUSTOM_TEMPLATE = {
  id: 11,
  name: "ISO Audit",
  is_builtin: false,
  description: "Custom template for ISO 27001 audits.",
  // sequential-locked → mode badge tone="warning", label "Locked"
  behavioral_flags: { process_mode: "sequential-locked" },
}

const BUILTIN_TEMPLATE = {
  id: 22,
  name: "Scrum",
  is_builtin: true,
  description: "Sprint-based iterative dev.",
  behavioral_flags: { process_mode: "flexible" },
}

describe("AdminTemplateCard (Plan 14-06 Task 1)", () => {
  beforeEach(() => {
    // No per-test setup currently needed — mock factories are pure.
  })

  it("Case 1 — renders name + Custom badge when is_builtin=false", () => {
    render(
      <AdminTemplateCard template={CUSTOM_TEMPLATE} activeProjectCount={0} />,
    )
    // Name visible
    expect(screen.getByText("ISO Audit")).toBeInTheDocument()
    // Custom badge present (TR — useApp().language === "tr")
    expect(screen.getByText("Özel")).toBeInTheDocument()
    // Description visible
    expect(
      screen.getByText("Custom template for ISO 27001 audits."),
    ).toBeInTheDocument()
  })

  it("Case 1b — built-in template does NOT render Custom badge", () => {
    render(
      <AdminTemplateCard template={BUILTIN_TEMPLATE} activeProjectCount={2} />,
    )
    expect(screen.getByText("Scrum")).toBeInTheDocument()
    expect(screen.queryByText("Özel")).toBeNull()
    expect(screen.queryByText("Custom")).toBeNull()
  })

  it("Case 2 — sequential-locked mode renders the 'Locked' label (tone='warning' branch)", () => {
    render(
      <AdminTemplateCard template={CUSTOM_TEMPLATE} activeProjectCount={1} />,
    )
    // Mode badge label — our i18n keeps both TR and EN strings as "Locked"
    // (UI-SPEC §Surface G lines 448-450 — verbatim English-only). The badge
    // is rendered as a separate element; the mere presence of the label
    // confirms the deriveMode → "sequential-locked" branch wired correctly.
    expect(screen.getByText("Locked")).toBeInTheDocument()
    // Footer counter "1 proje" — confirms activeProjectCount prop wires through
    expect(screen.getByText(/1\s+proje/)).toBeInTheDocument()
  })

  it("Case 3 — MoreH on the card opens menu with EXACTLY 3 items: Düzenle, Klonla, Sil", () => {
    render(
      <AdminTemplateCard template={CUSTOM_TEMPLATE} activeProjectCount={0} />,
    )
    // The shared MoreMenu primitive defaults aria-label to "İşlemler".
    // Locale-stable lookup per Plan 14-05's convention.
    const trigger = screen.getByLabelText("İşlemler")
    fireEvent.click(trigger)

    const menus = screen.getAllByRole("menu")
    expect(menus.length).toBeGreaterThanOrEqual(1)
    const items = within(menus[0]).getAllByRole("menuitem")
    expect(items).toHaveLength(3)
    // Each label visible inside the open menu
    expect(within(menus[0]).getByText("Düzenle")).toBeInTheDocument()
    expect(within(menus[0]).getByText("Klonla")).toBeInTheDocument()
    expect(within(menus[0]).getByText("Sil")).toBeInTheDocument()
  })

  it("Case 4 — Sil click with activeProjectCount=5 opens Modal with 5-in-body, secondary checkbox, and danger CTA disabled until checked", () => {
    render(
      <AdminTemplateCard template={CUSTOM_TEMPLATE} activeProjectCount={5} />,
    )
    // Open MoreH
    const trigger = screen.getByLabelText("İşlemler")
    fireEvent.click(trigger)

    // Click Sil inside the menu
    const menus = screen.getAllByRole("menu")
    const silItem = within(menus[0]).getByText("Sil")
    fireEvent.click(silItem)

    // Modal opens — find dialog by role
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()

    // Body mentions the count "5" (TR template body — "{name} {count} projede kullanılıyor…")
    expect(within(dialog).getByText(/5/)).toBeInTheDocument()
    // The "Yine de sil" secondary checkbox is visible inside the dialog body
    expect(within(dialog).getByText("Yine de sil")).toBeInTheDocument()

    // The danger CTA inside the modal: button labeled "Sil" must be DISABLED
    // until the secondary checkbox is checked. There are multiple "Sil" texts
    // potentially (menu item + modal CTA); within the dialog scope only the
    // CTA exists because the menu closed when the user clicked Sil.
    const confirmBtn = within(dialog).getByRole("button", { name: /^sil$/i })
    expect(confirmBtn).toBeDisabled()

    // Tick the "Yine de sil" checkbox → CTA enables
    const yineDeCheckbox = within(dialog).getByRole("checkbox")
    fireEvent.click(yineDeCheckbox)
    expect(confirmBtn).not.toBeDisabled()

    // Untick → CTA disables again (defense check the gate is reactive)
    fireEvent.click(yineDeCheckbox)
    expect(confirmBtn).toBeDisabled()
  })

  it("Case 5 — Sil with activeProjectCount=0 opens plain ConfirmDialog WITHOUT the 'Yine de sil' checkbox", () => {
    render(
      <AdminTemplateCard template={CUSTOM_TEMPLATE} activeProjectCount={0} />,
    )
    // Open MoreH then click Sil
    fireEvent.click(screen.getByLabelText("İşlemler"))
    const menus = screen.getAllByRole("menu")
    fireEvent.click(within(menus[0]).getByText("Sil"))

    // ConfirmDialog uses a non-role-dialog container in this codebase, but the
    // delete title text "Şablonu sil" must appear AND the "Yine de sil"
    // checkbox label must NOT (because the in-use Modal branch is gated off).
    expect(screen.getByText("Şablonu sil")).toBeInTheDocument()
    expect(screen.queryByText("Yine de sil")).toBeNull()
  })
})

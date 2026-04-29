// Phase 15 Plan 15-11 Task 1.4 — RoleCreateModal RTL tests.
//
// Mirrors AddUserModal test pattern (Phase 14 14-03). Covers:
//   1. Modal renders fields when open=true
//   2. Empty submit shows 'İsim gerekli' validation error
//   3. Reserved name 'Admin' submit shows 'sistem rolü için ayrılmıştır' error
//   4. Invalid characters '@!$' shows 'Geçersiz karakter' error
//   5. Valid submit fires useCreateRole.mutate with the trimmed payload
//   6. onSuccess closes the modal (mutate's options.onSuccess is invoked)
//   7. Modal does NOT render when open=false
//   8. Icon picker default is 'user'; color swatch default is '--fg-muted'
//
// Mock: useCreateRole hook (mocked to expose mutate spy + isPending flag).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

const createMutateMock = vi.fn()
const createStateRef = { isPending: false }
vi.mock("@/hooks/use-create-role", () => ({
  useCreateRole: () => ({
    mutate: createMutateMock,
    isPending: createStateRef.isPending,
  }),
}))

import { RoleCreateModal } from "./role-create-modal"

describe("RoleCreateModal (Plan 15-11 — D-2.6 / D-2.8)", () => {
  beforeEach(() => {
    createMutateMock.mockReset()
    createStateRef.isPending = false
  })

  it("Case 1 — open=true renders name + description + icon picker + color swatch", () => {
    render(<RoleCreateModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Yeni rol oluştur/i)).toBeInTheDocument()
    // Name + description inputs reachable by their labels.
    expect(screen.getByLabelText(/^isim$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/açıklama/i)).toBeInTheDocument()
    // Icon picker (8 radios) + Color swatch (6 radios) = 14 radios in the radiogroups.
    const iconGroup = screen.getByRole("radiogroup", { name: /ikon/i })
    expect(iconGroup).toBeInTheDocument()
    const colorGroup = screen.getByRole("radiogroup", { name: /renk/i })
    expect(colorGroup).toBeInTheDocument()
  })

  it("Case 2 — open=false renders nothing", () => {
    const { container } = render(<RoleCreateModal open={false} onClose={vi.fn()} />)
    // Modal primitive returns null when !open.
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it("Case 3 — empty name submit shows 'İsim boş olamaz' validation error", () => {
    render(<RoleCreateModal open={true} onClose={vi.fn()} />)
    const saveBtn = screen.getByRole("button", { name: /kaydet/i })
    // The Save button is disabled while invalid; click it anyway via fireEvent
    // (vitest fires the handler regardless), and verify validation surfaces.
    fireEvent.click(saveBtn)
    expect(screen.getByText(/İsim boş olamaz/i)).toBeInTheDocument()
    expect(createMutateMock).not.toHaveBeenCalled()
  })

  it("Case 4 — reserved name 'Admin' submit shows 'sistem rolü için ayrılmıştır' error", () => {
    render(<RoleCreateModal open={true} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText(/^isim$/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "Admin" } })
    const form = nameInput.closest("form")!
    fireEvent.submit(form)
    expect(screen.getByText(/sistem rolü için ayrılmıştır/i)).toBeInTheDocument()
    expect(createMutateMock).not.toHaveBeenCalled()
  })

  it("Case 5 — invalid characters '@!' shows 'Geçersiz karakter' error", () => {
    render(<RoleCreateModal open={true} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText(/^isim$/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "Admin@!" } })
    const form = nameInput.closest("form")!
    fireEvent.submit(form)
    expect(screen.getByText(/Geçersiz karakter/i)).toBeInTheDocument()
    expect(createMutateMock).not.toHaveBeenCalled()
  })

  it("Case 6 — valid submit fires useCreateRole.mutate with trimmed payload", async () => {
    render(<RoleCreateModal open={true} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText(/^isim$/i) as HTMLInputElement
    const descInput = screen.getByLabelText(/açıklama/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "  Designer  " } })
    fireEvent.change(descInput, { target: { value: "  Custom role  " } })

    const saveBtn = await waitFor(() => {
      const btn = screen.getByRole("button", { name: /kaydet/i })
      expect(btn).not.toBeDisabled()
      return btn
    })
    fireEvent.click(saveBtn)

    expect(createMutateMock).toHaveBeenCalledTimes(1)
    const [payload, options] = createMutateMock.mock.calls[0]
    expect(payload).toEqual({
      name: "Designer",
      description: "Custom role",
      icon_key: "user",
      color_token: "--fg-muted",
    })
    expect(options).toMatchObject({ onSuccess: expect.any(Function) })
  })

  it("Case 7 — onSuccess invokes the supplied onClose prop", () => {
    const onClose = vi.fn()
    render(<RoleCreateModal open={true} onClose={onClose} />)
    const nameInput = screen.getByLabelText(/^isim$/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "Designer" } })
    const form = nameInput.closest("form")!
    fireEvent.submit(form)

    expect(createMutateMock).toHaveBeenCalled()
    const [, options] = createMutateMock.mock.calls[0]
    // Manually invoke the onSuccess callback the modal passed in — the modal
    // delegates the close to that callback.
    options.onSuccess()
    expect(onClose).toHaveBeenCalled()
  })

  it("Case 8 — picking a different icon updates aria-checked", () => {
    render(<RoleCreateModal open={true} onClose={vi.fn()} />)
    const briefcase = screen.getByRole("radio", { name: /briefcase/i })
    expect(briefcase.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(briefcase)
    expect(briefcase.getAttribute("aria-checked")).toBe("true")
  })

  it("Case 9 — picking a different color swatch updates aria-checked", () => {
    render(<RoleCreateModal open={true} onClose={vi.fn()} />)
    const info = screen.getByRole("radio", { name: /^info$/i })
    expect(info.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(info)
    expect(info.getAttribute("aria-checked")).toBe("true")
  })
})

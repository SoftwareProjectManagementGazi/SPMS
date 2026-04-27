// Phase 14 Plan 14-03 Task 2 — AddUserModal RTL tests.
//
// Verifies 4 mandatory cases per <behavior>:
//   1. Renders 3 form fields (email / role / name) + Submit + Cancel.
//   2. Empty email submit → validation error "Email gerekli".
//   3. Invalid email "foo" → validation error "Geçersiz email".
//   4. Valid submit → useInviteUser.mutate called with correct payload.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"

// ---- useApp / useToast / next mocks ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// ---- useInviteUser mock — overridable ----
const inviteMutateMock = vi.fn()
const inviteStateRef = { isPending: false }
vi.mock("@/hooks/use-invite-user", () => ({
  useInviteUser: () => ({
    mutate: inviteMutateMock,
    isPending: inviteStateRef.isPending,
  }),
}))

import { AddUserModal } from "./add-user-modal"

describe("AddUserModal (Plan 14-03 Task 2)", () => {
  beforeEach(() => {
    inviteMutateMock.mockReset()
    inviteStateRef.isPending = false
  })

  it("Case 1 — renders email + role + name fields + Submit + Cancel", () => {
    render(<AddUserModal open={true} onClose={vi.fn()} />)
    // Email + Name inputs (label-tied)
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/ad soyad/i),
    ).toBeInTheDocument()
    // Role select
    expect(screen.getByLabelText(/^rol$/i)).toBeInTheDocument()
    // Submit + Cancel buttons
    expect(
      screen.getByRole("button", { name: /davet gönder/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /vazgeç/i }),
    ).toBeInTheDocument()
  })

  it("Case 2 — empty email submit shows 'Email gerekli' validation error", () => {
    render(<AddUserModal open={true} onClose={vi.fn()} />)
    // Submit button is disabled when form invalid — try anyway by clicking.
    // The submit handler sets `submitted=true` before the early-return on
    // !formValid, which is what reveals the error message.
    const submitBtn = screen.getByRole("button", { name: /davet gönder/i })
    // Disabled prevents click in browsers but vitest fires handler anyway.
    // Use form submit instead — submit via Enter on the email input.
    const email = screen.getByLabelText(/^email$/i) as HTMLInputElement
    // Trigger validation by submitting the form directly.
    const form = email.closest("form")
    expect(form).not.toBeNull()
    fireEvent.submit(form!)
    expect(screen.getByText(/email gerekli/i)).toBeInTheDocument()
    // Mutation NOT called on empty
    expect(inviteMutateMock).not.toHaveBeenCalled()
  })

  it("Case 3 — invalid email 'foo' shows 'Geçersiz email' error", () => {
    render(<AddUserModal open={true} onClose={vi.fn()} />)
    const email = screen.getByLabelText(/^email$/i) as HTMLInputElement
    fireEvent.change(email, { target: { value: "foo" } })
    const form = email.closest("form")
    fireEvent.submit(form!)
    expect(screen.getByText(/geçersiz email/i)).toBeInTheDocument()
    expect(inviteMutateMock).not.toHaveBeenCalled()
  })

  it("Case 4 — valid submit calls useInviteUser.mutate with correct payload", async () => {
    render(<AddUserModal open={true} onClose={vi.fn()} />)
    const email = screen.getByLabelText(/^email$/i) as HTMLInputElement
    const role = screen.getByLabelText(/^rol$/i) as HTMLSelectElement
    const name = screen.getByLabelText(/ad soyad/i) as HTMLInputElement

    fireEvent.change(email, { target: { value: "newuser@testexample.com" } })
    fireEvent.change(role, { target: { value: "Project Manager" } })
    fireEvent.change(name, { target: { value: "Yeni Kullanıcı" } })

    // Confirm input values reflect React state (sanity check)
    expect(email.value).toBe("newuser@testexample.com")
    expect(role.value).toBe("Project Manager")
    expect(name.value).toBe("Yeni Kullanıcı")

    // Wait for the Submit button to no longer be disabled (state propagation
    // can lag in jsdom for batched updates).
    const submitBtn = await waitFor(() => {
      const btn = screen.getByRole("button", { name: /davet gönder/i })
      expect(btn).not.toBeDisabled()
      return btn
    })

    fireEvent.click(submitBtn)

    expect(inviteMutateMock).toHaveBeenCalledTimes(1)
    expect(inviteMutateMock).toHaveBeenCalledWith(
      {
        email: "newuser@testexample.com",
        role: "Project Manager",
        name: "Yeni Kullanıcı",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})

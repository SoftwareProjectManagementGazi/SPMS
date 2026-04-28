// Phase 14 Plan 14-18 (Cluster F, M-5 closure) — login page redirect
// param honoring tests.
//
// The original Frontend2/app/(auth)/login/page.tsx:25 ALWAYS pushed
// /dashboard after a successful login, ignoring any ?from= or ?next=
// parameter. This made the admin-layout anonymous-redirect bounce
// look correct (URL preserved as /login?from=/admin/users) but the
// post-login push always landed on /dashboard regardless of intent.
//
// Plan 14-18 fix: add a useSearchParams() reader + safe-redirect guard:
//   - Honor `?from=...` first, then `?next=...` (legacy fallback).
//   - Reject any value that doesn't start with `/` OR contains `://`
//     (open-redirect protection — an attacker cannot craft
//     `?from=https://evil.example.com/phishing`).
//   - Default to /dashboard when both are absent or unsafe.
//
// Tests:
//   1. ?from=/admin/users → router.push called with /admin/users
//   2. ?next=/admin/projects (legacy fallback when ?from absent)
//      → router.push called with /admin/projects
//   3. No params → router.push called with /dashboard
//   4. ?from=https://evil.example.com/x → router.push called with
//      /dashboard (open-redirect guard)
//   5. ?from=//attacker.com/x (protocol-relative URL) → /dashboard
//      (defensive — startsWith('/') passes but should still be rejected
//      because '//attacker.com' is a protocol-relative URL)

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// --- next/navigation mock ---------------------------------------------
const pushMock = vi.fn()
let mockSearchParams = new URLSearchParams()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
}))

// --- next/link mock ---------------------------------------------------
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}))

// --- useAuth mock -----------------------------------------------------
const loginMock = vi.fn()
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ login: loginMock }),
}))

// --- LogoMark stub (it imports next/image which is fine but adds noise)
vi.mock("@/components/logo-mark", () => ({
  LogoMark: () => <span data-testid="logo-mark" />,
}))

// SUT — imported AFTER mocks
import LoginPage from "./page"

beforeEach(() => {
  pushMock.mockClear()
  loginMock.mockClear()
  loginMock.mockResolvedValue(undefined)
  mockSearchParams = new URLSearchParams()
})

async function submitLogin() {
  // Use type=email + type=password selectors — the page renders 2 Input
  // components with these underlying types (they render real <input>s).
  const emailInput = document.querySelector(
    'input[type="email"]',
  ) as HTMLInputElement
  const passwordInput = document.querySelector(
    'input[type="password"]',
  ) as HTMLInputElement
  fireEvent.change(emailInput, { target: { value: "[email protected]" } })
  fireEvent.change(passwordInput, { target: { value: "password123" } })
  const form = emailInput.closest("form")!
  fireEvent.submit(form)
  await waitFor(() => expect(pushMock).toHaveBeenCalled())
}

describe("LoginPage redirect honoring (Plan 14-18 M-5)", () => {
  it("Test 1 — ?from=/admin/users → router.push('/admin/users')", async () => {
    mockSearchParams = new URLSearchParams("from=/admin/users")
    render(<LoginPage />)
    await submitLogin()
    expect(pushMock).toHaveBeenCalledWith("/admin/users")
    expect(pushMock).not.toHaveBeenCalledWith("/dashboard")
  })

  it("Test 2 — ?next=/admin/projects (legacy fallback) → router.push('/admin/projects')", async () => {
    mockSearchParams = new URLSearchParams("next=/admin/projects")
    render(<LoginPage />)
    await submitLogin()
    expect(pushMock).toHaveBeenCalledWith("/admin/projects")
  })

  it("Test 3 — no params → defaults to /dashboard (existing contract)", async () => {
    mockSearchParams = new URLSearchParams()
    render(<LoginPage />)
    await submitLogin()
    expect(pushMock).toHaveBeenCalledWith("/dashboard")
  })

  it("Test 4 — ?from=https://evil.example.com/x → guarded to /dashboard (open-redirect)", async () => {
    mockSearchParams = new URLSearchParams(
      "from=https://evil.example.com/phishing",
    )
    render(<LoginPage />)
    await submitLogin()
    expect(pushMock).toHaveBeenCalledWith("/dashboard")
    expect(pushMock).not.toHaveBeenCalledWith(
      "https://evil.example.com/phishing",
    )
  })

  it("Test 5 — ?from=//attacker.com/x (protocol-relative URL) → guarded to /dashboard", async () => {
    mockSearchParams = new URLSearchParams("from=//attacker.com/exfiltrate")
    render(<LoginPage />)
    await submitLogin()
    expect(pushMock).toHaveBeenCalledWith("/dashboard")
  })
})

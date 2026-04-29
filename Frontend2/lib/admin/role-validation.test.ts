// Phase 15 Plan 15-11 Task 1.1 — role-validation.ts unit tests.
//
// Mirror of backend Pydantic regex at Backend/app/application/dtos/role_dtos.py.
// Backend is authoritative on the wire — client validation is the snappy-UX
// accelerator. The grammar:
//
//   - 1-50 character length (after .trim())
//   - allowed chars: A-Z a-z 0-9 space underscore hyphen + Turkish letters
//     ÇĞİÖŞÜ çğıöşü
//   - reserved names rejected case-insensitive: Admin, Project Manager,
//     Member, Guest
//
// 7 cases total — exhaustive coverage of the validation surface area.

import { describe, it, expect } from "vitest"
import {
  ROLE_NAME_RE,
  ROLE_NAME_MIN,
  ROLE_NAME_MAX,
  RESERVED_ROLE_NAMES,
  validateRoleName,
} from "./role-validation"

describe("validateRoleName (Plan 15-11 — D-2.6)", () => {
  it("Case 1 — empty string returns reason='empty'", () => {
    expect(validateRoleName("")).toEqual({ ok: false, reason: "empty" })
    expect(validateRoleName("   ")).toEqual({ ok: false, reason: "empty" })
  })

  it("Case 2 — name longer than 50 chars returns reason='too_long'", () => {
    const longName = "a".repeat(51)
    expect(validateRoleName(longName)).toEqual({ ok: false, reason: "too_long" })
  })

  it("Case 3 — name with invalid characters returns reason='invalid_chars'", () => {
    expect(validateRoleName("Admin@Role")).toEqual({ ok: false, reason: "invalid_chars" })
    expect(validateRoleName("Tasarımcı!")).toEqual({ ok: false, reason: "invalid_chars" })
    expect(validateRoleName("Test#Role")).toEqual({ ok: false, reason: "invalid_chars" })
  })

  it("Case 4 — reserved name 'Admin' rejected (case-insensitive)", () => {
    expect(validateRoleName("Admin")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("admin")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("ADMIN")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("AdMiN")).toEqual({ ok: false, reason: "reserved" })
  })

  it("Case 5 — reserved name 'Project Manager' / 'Member' / 'Guest' rejected", () => {
    expect(validateRoleName("Project Manager")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("project manager")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("Member")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("MEMBER")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("Guest")).toEqual({ ok: false, reason: "reserved" })
    expect(validateRoleName("guest")).toEqual({ ok: false, reason: "reserved" })
  })

  it("Case 6 — valid Latin name accepted (e.g. 'Designer')", () => {
    expect(validateRoleName("Designer")).toEqual({ ok: true })
    expect(validateRoleName("QA Lead")).toEqual({ ok: true })
    expect(validateRoleName("Tech-Lead")).toEqual({ ok: true })
    expect(validateRoleName("DevOps_Engineer")).toEqual({ ok: true })
    expect(validateRoleName("Lead 2024")).toEqual({ ok: true })
  })

  it("Case 7 — valid Turkish characters accepted ('Tasarımcı', 'Mühendis', 'Çözüm')", () => {
    expect(validateRoleName("Tasarımcı")).toEqual({ ok: true })
    expect(validateRoleName("Mühendis")).toEqual({ ok: true })
    expect(validateRoleName("Çözüm Ortağı")).toEqual({ ok: true })
    expect(validateRoleName("İK Uzmanı")).toEqual({ ok: true })
    expect(validateRoleName("Ürün Sahibi")).toEqual({ ok: true })
  })

  it("Case 8 — leading/trailing whitespace trimmed before validation", () => {
    expect(validateRoleName("  Designer  ")).toEqual({ ok: true })
    expect(validateRoleName("  Admin  ")).toEqual({ ok: false, reason: "reserved" })
  })

  it("Case 9 — exposed constants match the backend contract", () => {
    expect(ROLE_NAME_MIN).toBe(1)
    expect(ROLE_NAME_MAX).toBe(50)
    expect(ROLE_NAME_RE).toBeInstanceOf(RegExp)
    expect(RESERVED_ROLE_NAMES).toEqual(["admin", "project manager", "member", "guest"])
  })
})

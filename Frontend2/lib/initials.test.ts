// Unit tests for lib/initials.ts (Phase 13 Plan 13-02).
//
// Per Plan 13-02 Task 1 <behavior> Tests 13-16:
//   13. single name → first letter
//   14. two names → both letters
//   15. three names → only first two
//   16. lowercase input → uppercased

import { describe, it, expect } from "vitest"

import { getInitials } from "./initials"

describe("getInitials", () => {
  it("returns first letter for a single name", () => {
    expect(getInitials("Yusuf")).toBe("Y")
  })

  it("returns first+last letter for two names", () => {
    expect(getInitials("Yusuf Bayrakcı")).toBe("YB")
  })

  it("takes only the first two names when three are supplied", () => {
    expect(getInitials("Ali Veli Selami")).toBe("AV")
  })

  it("uppercases lowercase input", () => {
    expect(getInitials("ali veli")).toBe("AV")
  })

  it("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("")
  })

  it("collapses repeated spaces (filters empty tokens)", () => {
    expect(getInitials("Ali   Veli")).toBe("AV")
  })
})

// Phase 13 Plan 13-01 Task 2 — activity-date-format unit tests.
//
// Uses vi.useFakeTimers() so "now" is deterministic across the suite.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { formatActivityDate, formatRelativeTime } from "./activity-date-format"

const FIXED_NOW = new Date("2026-04-26T12:00:00Z")

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("formatActivityDate", () => {
  it("Test 11: today returns Bugün (TR)", () => {
    expect(formatActivityDate(FIXED_NOW, "tr")).toBe("Bugün")
    expect(formatActivityDate(FIXED_NOW, "en")).toBe("Today")
  })

  it("Test 12: yesterday returns Dün (TR)", () => {
    const yesterday = new Date(FIXED_NOW.getTime() - 24 * 3_600_000)
    expect(formatActivityDate(yesterday, "tr")).toBe("Dün")
    expect(formatActivityDate(yesterday, "en")).toBe("Yesterday")
  })

  it("Test 13: 5 days ago returns Bu Hafta", () => {
    const fiveDaysAgo = new Date(FIXED_NOW.getTime() - 5 * 86_400_000)
    expect(formatActivityDate(fiveDaysAgo, "tr")).toBe("Bu Hafta")
    expect(formatActivityDate(fiveDaysAgo, "en")).toBe("This Week")
  })

  it("Test 14: 10 days ago returns exact date matching DD MMM YYYY format", () => {
    const tenDaysAgo = new Date(FIXED_NOW.getTime() - 10 * 86_400_000)
    const tr = formatActivityDate(tenDaysAgo, "tr")
    const en = formatActivityDate(tenDaysAgo, "en")
    // tr: "16 Nis 2026"; en: "Apr 16, 2026"
    expect(tr).toMatch(/\d{1,2}\s+\w+\s+\d{4}/)
    expect(en).toMatch(/\w+\s+\d{1,2},?\s+\d{4}/)
  })

  it("invalid input returns empty string", () => {
    expect(formatActivityDate("not a date", "tr")).toBe("")
  })
})

describe("formatRelativeTime", () => {
  it("Test 15: <1 minute returns az önce / just now", () => {
    const thirtySecondsAgo = new Date(FIXED_NOW.getTime() - 30_000)
    expect(formatRelativeTime(thirtySecondsAgo, "tr")).toBe("az önce")
    expect(formatRelativeTime(thirtySecondsAgo, "en")).toBe("just now")
  })

  it("Test 16: 2 hours ago returns 2 sa / 2h", () => {
    const twoHoursAgo = new Date(FIXED_NOW.getTime() - 2 * 3_600_000)
    expect(formatRelativeTime(twoHoursAgo, "tr")).toBe("2 sa")
    expect(formatRelativeTime(twoHoursAgo, "en")).toBe("2h")
  })

  it("5 minutes ago returns 5 dk / 5m", () => {
    const fiveMinAgo = new Date(FIXED_NOW.getTime() - 5 * 60_000)
    expect(formatRelativeTime(fiveMinAgo, "tr")).toBe("5 dk")
    expect(formatRelativeTime(fiveMinAgo, "en")).toBe("5m")
  })

  it("3 days ago returns 3 gün / 3d", () => {
    const threeDaysAgo = new Date(FIXED_NOW.getTime() - 3 * 86_400_000)
    expect(formatRelativeTime(threeDaysAgo, "tr")).toBe("3 gün")
    expect(formatRelativeTime(threeDaysAgo, "en")).toBe("3d")
  })

  it("older than 7 days returns short-month exact date", () => {
    const tenDaysAgo = new Date(FIXED_NOW.getTime() - 10 * 86_400_000)
    const tr = formatRelativeTime(tenDaysAgo, "tr")
    const en = formatRelativeTime(tenDaysAgo, "en")
    // tr: "16 Nis"; en: "Apr 16"
    expect(tr).toMatch(/\d{1,2}\s+\w+/)
    expect(en).toMatch(/\w+\s+\d{1,2}/)
  })

  it("invalid input returns empty string", () => {
    expect(formatRelativeTime("garbage", "tr")).toBe("")
  })
})

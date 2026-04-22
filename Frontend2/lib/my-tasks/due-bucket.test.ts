import { describe, it, expect } from "vitest"
import { dueBucket } from "./due-bucket"

describe("dueBucket", () => {
  // Fixed reference to make transitions deterministic regardless of host TZ.
  // 2026-04-22 12:00 UTC ⇒ todayStart varies by TZ but the test inputs all
  // use UTC timestamps that fall on the same calendar day as `now`.
  const now = new Date("2026-04-22T12:00:00Z")

  it("null due = 'none'", () => {
    expect(dueBucket(null, now)).toBe("none")
  })

  it("invalid ISO string = 'none'", () => {
    expect(dueBucket("not a date", now)).toBe("none")
  })

  it("yesterday = 'overdue'", () => {
    expect(dueBucket("2026-04-21T10:00:00Z", now)).toBe("overdue")
  })

  it("same day = 'today'", () => {
    expect(dueBucket("2026-04-22T18:00:00Z", now)).toBe("today")
  })

  it("3 days from now = 'this_week'", () => {
    expect(dueBucket("2026-04-25T10:00:00Z", now)).toBe("this_week")
  })

  it("10 days from now = 'later'", () => {
    expect(dueBucket("2026-05-02T10:00:00Z", now)).toBe("later")
  })
})

// Unit tests for the shared milestone status derivation (lib/milestones/status).
// Clock is pinned so the date-relative DELAYED derivation is deterministic.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { effectiveStatus, statusTone, statusLabel } from "./status"

const FIXED_NOW = new Date("2026-05-31T12:00:00Z")

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("effectiveStatus", () => {
  it("keeps COMPLETED/DONE regardless of dates", () => {
    expect(effectiveStatus("COMPLETED", null, "2020-01-01")).toBe("COMPLETED")
    expect(effectiveStatus("DONE", null, "2099-01-01")).toBe("DONE")
  })

  it("derives DELAYED when the target date is past and not completed", () => {
    expect(effectiveStatus("IN_PROGRESS", null, "2026-05-01")).toBe("DELAYED")
    expect(effectiveStatus("PENDING", null, "2026-05-01")).toBe("DELAYED")
  })

  it("PENDING with no start date displays as IN_PROGRESS", () => {
    expect(effectiveStatus("PENDING", null, "2099-01-01")).toBe("IN_PROGRESS")
  })

  it("PENDING with a future start date stays PENDING", () => {
    expect(effectiveStatus("PENDING", "2099-01-01", "2099-12-01")).toBe(
      "PENDING",
    )
  })
})

describe("statusLabel + statusTone", () => {
  it("translates COMPLETED (TR/EN) and tones it success", () => {
    expect(statusLabel("COMPLETED", null, undefined, true)).toBe("Tamamlandı")
    expect(statusLabel("COMPLETED", null, undefined, false)).toBe("Done")
    expect(statusTone("COMPLETED", null, undefined)).toBe("success")
  })

  it("translates the derived DELAYED status and tones it warning", () => {
    expect(statusLabel("IN_PROGRESS", null, "2026-05-01", true)).toBe(
      "Gecikmeli",
    )
    expect(statusLabel("IN_PROGRESS", null, "2026-05-01", false)).toBe("Delayed")
    expect(statusTone("IN_PROGRESS", null, "2026-05-01")).toBe("warning")
  })

  it("falls back to Pending/Bekliyor for a future PENDING milestone", () => {
    expect(statusLabel("PENDING", "2099-01-01", "2099-12-01", true)).toBe(
      "Bekliyor",
    )
    expect(statusLabel("PENDING", "2099-01-01", "2099-12-01", false)).toBe(
      "Pending",
    )
    expect(statusTone("PENDING", "2099-01-01", "2099-12-01")).toBe("neutral")
  })
})

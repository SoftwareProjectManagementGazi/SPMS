// Unit tests for Frontend2/lib/audit-formatter.ts (Phase 11 Plan 09).
// The helper is intentionally pure (no React imports) so the audit-log
// localization logic can be exercised without a DOM or router context.

import { describe, it, expect } from "vitest"
import { formatAuditEntry, type UserLite, type FormatContext } from "./audit-formatter"

const users = new Map<number, UserLite>([
  [1, { id: 1, name: "Ayşe" }],
  [2, { id: 2, name: "Barış" }],
])

const ctx: FormatContext = {
  users,
  columnMap: { todo: "Yapılacak", progress: "Devam Eden" },
  phaseMap: { "phase-a": "Tasarım", "phase-b": "Geliştirme" },
}

describe("formatAuditEntry (tr)", () => {
  it("status change uses column map for both old and new value", () => {
    const s = formatAuditEntry(
      {
        field_name: "status",
        old_value: "todo",
        new_value: "progress",
        user_id: 1,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("Ayşe")
    expect(s).toContain("durumu")
    expect(s).toContain("Yapılacak")
    expect(s).toContain("Devam Eden")
  })

  it("assignee change resolves user ids via users map", () => {
    const s = formatAuditEntry(
      {
        field_name: "assignee_id",
        old_value: "1",
        new_value: "2",
        user_id: 1,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("atananı")
    expect(s).toContain("Ayşe")
    expect(s).toContain("Barış")
  })

  it("created action returns the creation message", () => {
    const s = formatAuditEntry(
      { user_id: 1, action: "created", timestamp: "2026-04-22T00:00:00Z" },
      "tr",
      ctx,
    )
    expect(s).toBe("Ayşe görevi oluşturdu")
  })

  it("unknown user yields the Bilinmeyen kullanıcı placeholder", () => {
    const s = formatAuditEntry(
      {
        field_name: "priority",
        old_value: "low",
        new_value: "high",
        user_id: 999,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("Bilinmeyen kullanıcı")
  })

  it("null old_value renders as em-dash placeholder", () => {
    const s = formatAuditEntry(
      {
        field_name: "points",
        old_value: null,
        new_value: "5",
        user_id: 1,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("'—'")
    expect(s).toContain("'5'")
  })

  it("English localization uses English labels and verbs", () => {
    const s = formatAuditEntry(
      {
        field_name: "priority",
        old_value: "low",
        new_value: "high",
        user_id: 1,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "en",
      ctx,
    )
    expect(s).toContain("Ayşe")
    expect(s).toContain("priority")
    expect(s).toContain("from")
    expect(s).toContain("to")
  })

  it("phase_id change uses phaseMap for both values", () => {
    const s = formatAuditEntry(
      {
        field_name: "phase_id",
        old_value: "phase-a",
        new_value: "phase-b",
        user_id: 1,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("Tasarım")
    expect(s).toContain("Geliştirme")
  })

  it("deleted action returns the deletion message", () => {
    const s = formatAuditEntry(
      { user_id: 2, action: "deleted", timestamp: "2026-04-22T00:00:00Z" },
      "tr",
      ctx,
    )
    expect(s).toBe("Barış görevi sildi")
  })

  it("prefers the backend-denormalized user_name over the (incomplete) users map", () => {
    const s = formatAuditEntry(
      {
        field_name: "priority",
        old_value: "low",
        new_value: "high",
        user_id: 999, // not in the users map
        user_name: "Cem Yılmaz",
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("Cem Yılmaz")
    expect(s).not.toContain("Bilinmeyen kullanıcı")
  })

  it("falls back to the users map when user_name is blank", () => {
    const s = formatAuditEntry(
      {
        field_name: "priority",
        old_value: "low",
        new_value: "high",
        user_id: 1,
        user_name: "   ", // whitespace-only → ignored
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("Ayşe")
  })

  it("description changes strip rich-text HTML tags from the value", () => {
    const s = formatAuditEntry(
      {
        field_name: "description",
        old_value: "<p>eski</p>",
        new_value: "<p><strong>yeni</strong> açıklama</p>",
        user_id: 1,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).not.toContain("<strong>")
    expect(s).not.toContain("<p>")
    expect(s).toContain("yeni açıklama")
    expect(s).toContain("eski")
  })

  it("truncates a long value to a 60-char preview with an ellipsis", () => {
    const long = "A".repeat(200)
    const s = formatAuditEntry(
      {
        field_name: "description",
        old_value: "—",
        new_value: long,
        user_id: 1,
        action: "updated",
        timestamp: "2026-04-22T00:00:00Z",
      },
      "tr",
      ctx,
    )
    expect(s).toContain("…")
    // The full 200-char value must NOT appear verbatim.
    expect(s).not.toContain(long)
    expect(s).toContain("A".repeat(60))
    expect(s).not.toContain("A".repeat(61))
  })
})

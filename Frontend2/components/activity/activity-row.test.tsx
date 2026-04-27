// Phase 13 Plan 13-04 Task 2 — RTL coverage for ActivityRow.
//
// Tests 9–13 from the plan's <behavior> block:
//   9.  task_status_changed renders 2 status badges + ArrowRight icon
//  10.  comment with 200-char body renders ≤161 chars (160 + ellipsis)
//  11.  parametric — every SemanticEventType renders without crashing and the
//       eventMeta verb appears in the DOM
//  12.  Avatar receives href="/users/{user_id}" (Plan 13-03 contract)
//  13.  Reference click routes via router.push when projectId + taskKey present

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

// next/navigation router mock — captured per-test via the spy below.
const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}))

// Language stays Turkish-first for verb assertions.
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { ActivityRow } from "./activity-row"
import type { ActivityItem } from "@/services/activity-service"
import { eventMeta } from "@/lib/activity/event-meta"
import type { SemanticEventType } from "@/lib/audit-event-mapper"

const isoNow = () => new Date().toISOString()

function makeEvent(overrides: Partial<ActivityItem>): ActivityItem {
  return {
    id: 1,
    action: "created",
    entity_type: "task",
    user_id: 7,
    user_name: "Yusuf Bayrakcı",
    timestamp: isoNow(),
    ...overrides,
  }
}

beforeEach(() => {
  pushSpy.mockReset()
})

describe("ActivityRow", () => {
  it("Test 9: renders task_status_changed with 2 status badges + ArrowRight", () => {
    const ev = makeEvent({
      action: "updated",
      entity_type: "task",
      field_name: "column_id",
      old_value: "1",
      new_value: "3",
      entity_label: "MOBIL-12",
      metadata: { task_key: "MOBIL-12" },
    })
    render(<ActivityRow event={ev} projectId={42} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    // Check for the verb — confirms the mapper resolved the type
    expect(
      screen.getByText(/durumunu değiştirdi/i, { exact: false }),
    ).toBeInTheDocument()
  })

  it("Test 10: clamps comment preview to 160 chars + ellipsis", () => {
    const longBody = "x".repeat(200)
    const ev = makeEvent({
      entity_type: "comment",
      action: "created",
      new_value: longBody,
      metadata: { task_key: "MOBIL-3" },
    })
    render(<ActivityRow event={ev} projectId={42} />)
    // The clamped body is everywhere "x" — match a 160-x sequence followed by …
    const node = screen.getByText((content) =>
      /^x{160}…$/.test(content),
    )
    expect(node).toBeInTheDocument()
    // Length is exactly 161 characters (160 x + the ellipsis char).
    expect(node.textContent).toHaveLength(161)
  })

  it("Test 10b: strips HTML tags from comment body before clamping (T-13-04-01)", () => {
    const ev = makeEvent({
      entity_type: "comment",
      action: "created",
      // 30 char raw text after HTML strip; body should not include "<script>"
      new_value: "<script>alert(1)</script>hello world preview safe",
      metadata: { task_key: "MOBIL-3" },
    })
    render(<ActivityRow event={ev} projectId={42} />)
    expect(screen.queryByText(/<script>/)).toBeNull()
    expect(
      screen.getByText(/alert\(1\)hello world preview safe/),
    ).toBeInTheDocument()
  })

  it("Test 11: parametric — every SemanticEventType renders verb without crashing", () => {
    const variants: { semantic: SemanticEventType; ev: Partial<ActivityItem> }[] =
      [
        {
          semantic: "task_created",
          ev: { entity_type: "task", action: "created" },
        },
        {
          semantic: "task_status_changed",
          ev: {
            entity_type: "task",
            action: "updated",
            field_name: "column_id",
            old_value: "1",
            new_value: "2",
          },
        },
        {
          semantic: "task_assigned",
          ev: {
            entity_type: "task",
            action: "updated",
            field_name: "assignee_id",
            new_value: "Other User",
          },
        },
        {
          semantic: "comment_created",
          ev: {
            entity_type: "comment",
            action: "created",
            new_value: "ok",
          },
        },
        {
          semantic: "task_deleted",
          ev: { entity_type: "task", action: "deleted" },
        },
        {
          semantic: "phase_transition",
          ev: { entity_type: "project", action: "phase_transition" },
        },
        {
          semantic: "milestone_created",
          ev: { entity_type: "milestone", action: "created" },
        },
        {
          semantic: "milestone_updated",
          ev: { entity_type: "milestone", action: "updated" },
        },
        {
          semantic: "artifact_status_changed",
          ev: {
            entity_type: "artifact",
            action: "updated",
            field_name: "status",
          },
        },
        {
          semantic: "phase_report_created",
          ev: { entity_type: "phase_report", action: "created" },
        },
      ]

    // Smoke: assert each variant prints its TR verb at least once.
    for (const { semantic, ev } of variants) {
      const verb = eventMeta[semantic].verb("tr")
      const { unmount } = render(
        <ActivityRow
          event={makeEvent({ id: Math.random(), ...ev })}
          projectId={42}
        />,
      )
      // Use a regex for partial match because the line interpolates the actor name + verb
      expect(
        screen.getByText(new RegExp(verb, "i"), { exact: false }),
      ).toBeInTheDocument()
      unmount()
    }
  })

  it("Test 12: Avatar in row uses href={`/users/${user_id}`} (Plan 13-03 D-D4)", () => {
    const ev = makeEvent({
      entity_type: "task",
      action: "created",
      user_id: 5,
      entity_label: "MOBIL-1",
      metadata: { task_key: "MOBIL-1" },
    })
    const { container } = render(<ActivityRow event={ev} projectId={42} />)
    // The actor avatar is wrapped in a <Link> — assert at least one anchor
    // points to /users/5
    const link = container.querySelector('a[href="/users/5"]')
    expect(link).not.toBeNull()
  })

  it("Test 13: clicking the taskKey reference navigates via router.push", () => {
    const ev = makeEvent({
      entity_type: "task",
      action: "created",
      entity_label: "MOBIL-7",
      metadata: { task_key: "MOBIL-7" },
    })
    render(<ActivityRow event={ev} projectId={42} />)
    fireEvent.click(screen.getByText("MOBIL-7"))
    expect(pushSpy).toHaveBeenCalledWith("/projects/42/tasks/MOBIL-7")
  })

  it("Test 13b: phase reference navigates to lifecycle history when projectId + phase_id present", () => {
    const ev = makeEvent({
      entity_type: "project",
      action: "phase_transition",
      entity_label: "Yürütme",
      metadata: { phase_id: "execution" },
    })
    render(<ActivityRow event={ev} projectId={42} />)
    fireEvent.click(screen.getByText("Yürütme"))
    expect(pushSpy).toHaveBeenCalledWith(
      "/projects/42?tab=lifecycle&sub=history",
    )
  })

  it("Test 14: returns null when audit shape is unrecognised (mapAuditToSemantic null)", () => {
    const ev = makeEvent({
      entity_type: "label",
      action: "created",
      user_id: null,
    })
    const { container } = render(<ActivityRow event={ev} />)
    expect(container.firstChild).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Phase 14 Plan 14-10 Task 2 — 5 NEW render branches per D-D4 + admin-table
  // variant per D-D5 + cross-phase regression for Pitfall 1.
  // ---------------------------------------------------------------------------

  it("P14-T1: task_field_updated renders title + localized field name + old/new labels", () => {
    const ev = makeEvent({
      entity_type: "task",
      action: "updated",
      field_name: "due_date",
      metadata: {
        task_key: "MOBIL-12",
        task_title: "Login akışını düzelt",
        field_name: "due_date",
        old_value_label: "2026-04-25",
        new_value_label: "2026-05-01",
      },
    })
    render(<ActivityRow event={ev} projectId={42} />)
    expect(
      screen.getByText(/Login akışını düzelt/i, { exact: false }),
    ).toBeInTheDocument()
    // TR localization for due_date → "son tarih" (audit-field-labels.ts)
    expect(
      screen.getByText(/son tarih/i, { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText("2026-04-25")).toBeInTheDocument()
    expect(screen.getByText("2026-05-01")).toBeInTheDocument()
  })

  it("P14-T1b: task_field_updated falls back gracefully when task_title missing (D-D6)", () => {
    const ev = makeEvent({
      entity_type: "task",
      action: "updated",
      field_name: "priority",
      // No task_title — backward-compat case for old audit rows.
      metadata: {
        field_name: "priority",
        old_value_label: "Düşük",
        new_value_label: "Yüksek",
      },
    })
    const { container } = render(<ActivityRow event={ev} />)
    // Render must NOT crash + must show the verb + one of the label values.
    expect(container.firstChild).not.toBeNull()
    expect(
      screen.getByText(/değiştirdi/i, { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText("Düşük")).toBeInTheDocument()
    expect(screen.getByText("Yüksek")).toBeInTheDocument()
  })

  it("P14-T2: project_archived renders project name + archive verb", () => {
    const ev = makeEvent({
      entity_type: "project",
      action: "archived",
      metadata: { project_name: "Bankacılık Modülü" },
    })
    render(<ActivityRow event={ev} />)
    expect(screen.getByText(/arşivledi/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Bankacılık Modülü/i, { exact: false }),
    ).toBeInTheDocument()
  })

  it("P14-T3: project_status_changed renders project name + old/new status", () => {
    const ev = makeEvent({
      entity_type: "project",
      action: "updated",
      field_name: "status",
      metadata: {
        project_name: "Mobil Uygulama",
        old_value_label: "ACTIVE",
        new_value_label: "ARCHIVED",
      },
    })
    render(<ActivityRow event={ev} />)
    expect(
      screen.getByText(/Mobil Uygulama/i, { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
    expect(screen.getByText("ARCHIVED")).toBeInTheDocument()
  })

  it("P14-T4: comment_edited renders task title + comment_excerpt", () => {
    const ev = makeEvent({
      entity_type: "comment",
      action: "updated",
      metadata: {
        task_key: "MOBIL-7",
        task_title: "API hata mesajı düzelt",
        comment_excerpt: "Önemli düzeltme notu",
      },
    })
    render(<ActivityRow event={ev} />)
    expect(
      screen.getByText(/API hata mesajı düzelt/i, { exact: false }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Önemli düzeltme notu/i, { exact: false }),
    ).toBeInTheDocument()
  })

  it("P14-T5: user_role_changed renders target user + source/target role", () => {
    const ev = makeEvent({
      entity_type: "user",
      action: "role_changed",
      user_id: 1,
      user_name: "Admin Ayşe",
      metadata: {
        target_user_name: "kullanici_adi",
        source_role: "Member",
        target_role: "Project Manager",
      },
    })
    render(<ActivityRow event={ev} />)
    expect(
      screen.getByText(/rolünü değiştirdi/i, { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText("kullanici_adi")).toBeInTheDocument()
    expect(screen.getByText("Member")).toBeInTheDocument()
    expect(screen.getByText("Project Manager")).toBeInTheDocument()
  })

  it("P14-T5b: user_invited renders invited email", () => {
    const ev = makeEvent({
      entity_type: "user",
      action: "invited",
      user_name: "Admin Ayşe",
      metadata: {
        user_email: "mehmet@example.com",
      },
    })
    render(<ActivityRow event={ev} />)
    expect(screen.getByText(/davet etti/i)).toBeInTheDocument()
    expect(screen.getByText("mehmet@example.com")).toBeInTheDocument()
  })

  it("P14-T6: project_join_request_created renders target user + project name", () => {
    const ev = makeEvent({
      entity_type: "project_join_request",
      action: "created",
      user_name: "Ayşe (PM)",
      metadata: {
        target_user_name: "yeni_uye",
        project_name: "Bankacılık",
      },
    })
    render(<ActivityRow event={ev} />)
    expect(screen.getByText("yeni_uye")).toBeInTheDocument()
    expect(
      screen.getByText(/Bankacılık/i, { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText(/talep etti/i)).toBeInTheDocument()
  })

  it("P14-T7: variant=admin-table renders compactly without an Avatar Link", () => {
    const ev = makeEvent({
      entity_type: "task",
      action: "updated",
      field_name: "due_date",
      user_id: 99,
      metadata: {
        task_title: "Compact row",
        field_name: "due_date",
        old_value_label: "2026-04-25",
        new_value_label: "2026-05-01",
      },
    })
    const { container } = render(
      <ActivityRow event={ev} variant="admin-table" />,
    )
    // The default variant wraps the Avatar in <Link href="/users/{id}">.
    // The admin-table variant must NOT render that anchor.
    expect(container.querySelector('a[href="/users/99"]')).toBeNull()
    // The line content (verb / labels) is still present.
    expect(
      screen.getByText(/değiştirdi/i, { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText("2026-04-25")).toBeInTheDocument()
    expect(screen.getByText("2026-05-01")).toBeInTheDocument()
  })

  it("P14-T8: Pitfall 1 cross-phase regression — task_status_changed render path still works (non-extended payload)", () => {
    // EXACTLY the Phase 13-shaped payload — no Phase 14 extra metadata keys.
    // Plan 14-10 must not break the existing render path.
    const ev = makeEvent({
      entity_type: "task",
      action: "updated",
      field_name: "column_id",
      old_value: "1",
      new_value: "3",
      entity_label: "MOBIL-12",
      metadata: { task_key: "MOBIL-12" },
    })
    render(<ActivityRow event={ev} projectId={42} />)
    // Existing badge pair still renders (Phase 13 D-B5 contract).
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(
      screen.getByText(/durumunu değiştirdi/i, { exact: false }),
    ).toBeInTheDocument()
  })

  // Sanity: within() helper imported but not used elsewhere — silence linter
  void within
})

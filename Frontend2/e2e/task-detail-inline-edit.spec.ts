import { test, expect } from "@playwright/test"
import { setupMockBackend, MEMBER_ME, jsonResponse } from "./support/mock-auth"

/**
 * Task Detail — inline priority edit (D-38), rebuilt to actually run.
 *
 * The previous version was a fake pass: it looked for a native <select>
 * (`page.locator("select")`) that does not exist — the priority control is a
 * button-popover (role="listbox" of role="option" buttons) — so the central
 * assertions sat behind `if (selectVisible) { … }` and never executed, and
 * three `test.skip()` escape hatches silently green-passed when the page didn't
 * load. This version mocks the backend (support/mock-auth), drives the REAL
 * popover, and unconditionally asserts the optimistic commit.
 */

const PROJECT_DTO = {
  id: 1,
  key: "PRJ",
  name: "E2E Project",
  description: null,
  start_date: "2026-01-01",
  end_date: null,
  status: "ACTIVE",
  methodology: "KANBAN",
  process_template_id: null,
  manager_id: null,
  manager_name: null,
  manager_avatar: null,
  columns: [
    { id: 1, name: "To Do" },
    { id: 2, name: "Done" },
  ],
  process_config: {},
  created_at: "2026-01-01T00:00:00Z",
}

function taskDTO(priority: string) {
  return {
    id: 101,
    task_key: "PRJ-101",
    title: "E2E Priority Task",
    description: "",
    status: "todo",
    priority,
    assignee_id: null,
    reporter_id: null,
    parent_task_id: null,
    project_id: 1,
    sprint_id: null,
    phase_id: null,
    points: null,
    due_date: null,
    labels: [],
    watcher_count: 0,
    type: "task",
    created_at: "2026-01-01T00:00:00Z",
  }
}

test.describe("Task Detail — inline priority edit (D-38)", () => {
  test.beforeEach(async ({ page }) => {
    // Stateful: the task starts MEDIUM and flips to HIGH once the PATCH lands,
    // so the onSettled refetch keeps (rather than reverts) the optimistic value.
    let priority = "MEDIUM"

    await setupMockBackend(page, {
      me: MEMBER_ME,
      routes: {
        "/projects/1": (route) => jsonResponse(route, PROJECT_DTO),
        "/tasks": (route, path) => {
          const method = route.request().method()
          if (path === "/tasks/101") {
            if (method === "PATCH") {
              priority = "HIGH"
              return jsonResponse(route, taskDTO("HIGH"))
            }
            return jsonResponse(route, taskDTO(priority))
          }
          // /tasks/project/1 (sibling tasks) + /tasks/101/* sub-resources.
          return jsonResponse(route, [])
        },
      },
    })

    await page.goto("/projects/1/tasks/101")
  })

  test("priority popover commits the new value optimistically (no native select)", async ({
    page,
  }) => {
    // The task loaded (title heading renders task.title).
    await expect(
      page.getByRole("heading", { name: "E2E Priority Task" }),
    ).toBeVisible({ timeout: 15_000 })

    // There is NO native <select> for priority (the old test's false premise).
    await expect(page.locator("select")).toHaveCount(0)

    // The Priority trigger button — aria-label is the field name; the visible
    // text is the current priority chip.
    const trigger = page.getByRole("button", { name: /^Öncelik$|^Priority$/ })
    await expect(trigger).toBeVisible()
    // Starts at Medium → proves the High change below is real, not pre-existing.
    await expect(trigger).not.toContainText(/Yüksek|High/)

    // Open the real popover (role="listbox", not a <select>).
    await trigger.click()
    const listbox = page.getByRole("listbox", {
      name: /Öncelik seç|Select priority/,
    })
    await expect(listbox).toBeVisible()

    // Choose "High" → fires PATCH /tasks/101 + optimistic cache update; closes.
    await listbox.getByRole("option").filter({ hasText: /Yüksek|High/ }).click()

    // The trigger now reflects the committed priority (kills the fake pass:
    // a no-op onSelect would leave it on Medium).
    await expect(trigger).toContainText(/Yüksek|High/)
    await expect(listbox).toBeHidden()
  })
})

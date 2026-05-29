import { test, expect } from "@playwright/test"
import { setupMockBackend, MEMBER_ME, jsonResponse } from "./support/mock-auth"

/**
 * Task creation golden path (Phase 11) — rebuilt to actually run.
 *
 * The header "Oluştur" button opens the TaskCreateModal (useTaskModal). The
 * modal's project <select> is fed by /projects (mocked with one project) and
 * submit (Ctrl+Enter, D-06) POSTs /tasks → the modal's onSuccess shows the
 * "Görev oluşturuldu" toast. The previous auth/seed skip escape-hatches are gone.
 */

const PROJECT = {
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

test.describe("Task Create flow @phase-11", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockBackend(page, {
      me: MEMBER_ME,
      routes: {
        "/projects": (route) => jsonResponse(route, [PROJECT]),
        "/tasks": (route, path) => {
          if (route.request().method() === "POST" && path === "/tasks") {
            return jsonResponse(
              route,
              {
                id: 500,
                task_key: "PRJ-500",
                title: "E2E smoke task",
                description: "",
                status: "todo",
                priority: "MEDIUM",
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
              },
              201,
            )
          }
          return jsonResponse(route, [])
        },
      },
    })
    await page.goto("/dashboard")
  })

  test("header Oluştur → modal → submit creates a task (toast)", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /^Oluştur$|^Create$/ })
      .first()
      .click()

    // Modal opened.
    await expect(
      page.getByText(/Görev Oluştur|Create Task/i).first(),
    ).toBeVisible({ timeout: 5_000 })

    // Title (autofocused).
    await page
      .getByPlaceholder(/Kısa, net başlık|Short, clear title/i)
      .fill("E2E smoke task")

    // Project <select> — choose the mocked project (option value = id).
    await page.locator("select").first().selectOption("1")

    // Submit via Ctrl+Enter (D-06).
    await page.keyboard.press("Control+Enter")

    // onSuccess toast.
    await expect(
      page.getByText(/Görev oluşturuldu|Task created/i),
    ).toBeVisible({ timeout: 5_000 })
  })
})

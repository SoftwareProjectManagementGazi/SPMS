import type { Page, Route } from "@playwright/test"

/**
 * E2E auth + mocked-backend harness.
 *
 * The app has three auth layers (see Frontend2/middleware.ts + admin/layout.tsx):
 *   1. Next.js middleware — redirects to /login unless an `auth_session` cookie
 *      is present (presence only; the value is never validated).
 *   2. Client AuthProvider — on mount reads localStorage `auth_token` and calls
 *      GET /auth/me; the result populates `user` (with `role`).
 *   3. Client role guard (admin layout) — requires `user.role.name === "admin"`.
 *
 * All page data is fetched client-side (TanStack Query + axios → :8000/api/v1),
 * so Playwright `page.route` can intercept everything. This harness:
 *   - sets the presence cookie (passes layer 1),
 *   - seeds the token before app scripts run (so AuthProvider is "logged in"),
 *   - mocks GET /auth/me as the given user (passes layers 2 + 3 and prevents the
 *     401 → /session-expired redirect),
 *   - intercepts every other /api/v1 call with caller routes + safe defaults so
 *     no request hits a non-existent backend and hangs.
 */

const FRONTEND_ORIGIN = "http://localhost:3000"

export const ADMIN_ME = {
  id: 1,
  email: "admin@e2e.local",
  full_name: "E2E Admin",
  is_active: true,
  role: { name: "admin", description: "Administrator" },
}

export const MEMBER_ME = {
  id: 2,
  email: "member@e2e.local",
  full_name: "E2E Member",
  is_active: true,
  role: { name: "Member", description: "Member" },
}

export function jsonResponse(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  })
}

export type RouteHandler = (route: Route, path: string) => unknown | Promise<unknown>

interface MockBackendOptions {
  me?: Record<string, unknown>
  token?: string
  /** Path-prefix → handler. Path is relative to /api/v1 (e.g. "/tasks/101"). */
  routes?: Record<string, RouteHandler>
}

export async function setupMockBackend(
  page: Page,
  { me = ADMIN_ME, token = "e2e.test.token", routes = {} }: MockBackendOptions = {},
) {
  await page.context().addCookies([
    { name: "auth_session", value: "1", url: FRONTEND_ORIGIN },
  ])

  await page.addInitScript((t) => {
    window.localStorage.setItem("auth_token", t as string)
  }, token)

  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "")

    if (path === "/auth/me") return jsonResponse(route, me)

    for (const [prefix, handler] of Object.entries(routes)) {
      if (path === prefix || path.startsWith(prefix)) return handler(route, path)
    }

    // Safe defaults so unmocked calls resolve instantly instead of failing
    // against a backend that isn't running. Shapes must match what the hooks
    // read: the notifications infinite query reduces `page.notifications.length`,
    // while admin collections read `{items,total}`.
    if (/^\/notifications/.test(path)) {
      return jsonResponse(route, { notifications: [], total: 0, unread_count: 0 })
    }
    if (/join-request|pending|activity|audit/i.test(path)) {
      return jsonResponse(route, { items: [], total: 0 })
    }
    return jsonResponse(route, [])
  })
}

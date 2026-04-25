// Unit tests for Frontend2/lib/api-client.ts
// (Phase 12 Plan 12-10 — Bug Z UAT fix).
//
// The Bug Z fix introduces an `expectedFailureCodes` axios-config opt-in.
// When set, the global response interceptor skips its `console.error('API
// Error:...')` call for status codes in that list. The Dashboard
// ActivityFeed widget passes `expectedFailureCodes: [403]` because the
// /api/v1/activity endpoint is admin-only (Phase 10 BL-01) and non-admin
// users predictably get 403 — they should NOT see "API Error: Object"
// noise in their console.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Stub axios.create so we can capture the registered interceptors and
// invoke them directly. Pre-fix and post-fix code paths both register a
// response interceptor with `(success, error)` arity; we capture the
// error handler and call it with synthetic axios error objects.
const responseHandlers: Array<{
  success: (r: unknown) => unknown
  error: (e: unknown) => unknown
}> = []

vi.mock("axios", () => {
  const create = () => ({
    interceptors: {
      request: {
        use: () => 0,
      },
      response: {
        use: (success: (r: unknown) => unknown, error: (e: unknown) => unknown) => {
          responseHandlers.push({ success, error })
          return responseHandlers.length - 1
        },
      },
    },
  })
  return {
    default: { create },
    create,
  }
})

vi.mock("@/lib/constants", () => ({
  AUTH_TOKEN_KEY: "auth_token",
  SESSION_EXPIRED_KEY: "session_expired",
}))

describe("api-client response interceptor", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    responseHandlers.length = 0
    // Re-import to register interceptors with our stubbed axios.
    vi.resetModules()
    await import("./api-client")
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it("Bug Z: 403 with expectedFailureCodes=[403] does NOT log to console.error", () => {
    expect(responseHandlers.length).toBe(1)
    const handler = responseHandlers[0].error
    const err = {
      response: { status: 403, data: { detail: "admin only" } },
      config: { url: "/activity", expectedFailureCodes: [403] },
      message: "Request failed with status code 403",
    }
    // Handler returns Promise.reject — catch it so the test doesn't fail
    // on an unhandled rejection.
    handler(err).catch(() => {})
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it("Bug Z: 403 WITHOUT expectedFailureCodes still logs to console.error", () => {
    expect(responseHandlers.length).toBe(1)
    const handler = responseHandlers[0].error
    const err = {
      response: { status: 403, data: { detail: "forbidden" } },
      config: { url: "/projects" },
      message: "Request failed with status code 403",
    }
    handler(err).catch(() => {})
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it("Bug Z: 500 with expectedFailureCodes=[403] still logs (not in opt-in list)", () => {
    expect(responseHandlers.length).toBe(1)
    const handler = responseHandlers[0].error
    const err = {
      response: { status: 500, data: { detail: "server error" } },
      config: { url: "/activity", expectedFailureCodes: [403] },
      message: "Request failed with status code 500",
    }
    handler(err).catch(() => {})
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it("Bug Z: network error (no response) still logs", () => {
    expect(responseHandlers.length).toBe(1)
    const handler = responseHandlers[0].error
    const err = {
      response: undefined,
      config: { url: "/activity", expectedFailureCodes: [403] },
      message: "Network Error",
    }
    handler(err).catch(() => {})
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it("Bug Z: 403 with multiple expected codes [403, 404] also stays silent", () => {
    expect(responseHandlers.length).toBe(1)
    const handler = responseHandlers[0].error
    const err = {
      response: { status: 404, data: { detail: "not found" } },
      config: { url: "/activity", expectedFailureCodes: [403, 404] },
      message: "Request failed with status code 404",
    }
    handler(err).catch(() => {})
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})

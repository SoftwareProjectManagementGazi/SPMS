// Phase 14 Plan 14-13 (Cluster A — UAT 401 fix) — RTL unit test for the
// authenticated-blob-download helper. The helper exists because the previous
// downloadCsv() pattern in csv-export.ts uses an anchor-trigger click which
// the browser fires as a plain GET — bypassing the axios JWT interceptor —
// so backend require_admin returns 401 for /admin/users.csv,
// /admin/summary.pdf, and /admin/audit.json.
//
// This file locks the contract:
//
//   1. The helper reads the bearer token from localStorage using the
//      AUTH_TOKEN_KEY constant (NEVER a hardcoded literal — B-1 fix).
//   2. The helper applies the SAME quoted-token guard as
//      Frontend2/lib/api-client.ts:18 — when localStorage holds a
//      JSON-stringified token (literal quotes inside the string), JSON.parse
//      unwraps it BEFORE the `Bearer ` prefix. Without this guard the
//      backend receives `Bearer "<token>"` and rejects.
//   3. Blob lifecycle is correct:
//      createObjectURL → appendChild(<a>) → click() → removeChild → (next
//      tick) revokeObjectURL.
//   4. Non-2xx response → throws Error containing the status; no DOM
//      mutation happens (no createElement, no appendChild, no createObjectURL).
//   5. Optional `filename` argument sets <a>.download.
//   6. SSR safety — when document is undefined, the helper resolves to
//      undefined without throwing.

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest"

import { AUTH_TOKEN_KEY } from "@/lib/constants"
import { downloadAuthenticated } from "./download-authenticated"

// ---- jsdom helpers ---------------------------------------------------

// Capture every <a> the helper appends so we can assert .click() ordering
// without losing the actual element to a removeChild before the test reads it.
let appendedAnchors: HTMLAnchorElement[] = []
let clickedAnchors: HTMLAnchorElement[] = []
let removedAnchors: HTMLAnchorElement[] = []
let createObjectURLCalls: Array<Blob | MediaSource> = []
let revokeObjectURLCalls: string[] = []

const installDomSpies = () => {
  appendedAnchors = []
  clickedAnchors = []
  removedAnchors = []
  createObjectURLCalls = []
  revokeObjectURLCalls = []

  // URL.createObjectURL / revokeObjectURL — jsdom does not implement these.
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn((blob: Blob) => {
      createObjectURLCalls.push(blob)
      return `blob:mock/${createObjectURLCalls.length}`
    }),
  })
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn((u: string) => {
      revokeObjectURLCalls.push(u)
    }),
  })

  // Spy appendChild + removeChild on document.body to record ordering.
  const realAppend = document.body.appendChild.bind(document.body)
  const realRemove = document.body.removeChild.bind(document.body)
  vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => {
    if ((node as HTMLElement).tagName === "A") {
      appendedAnchors.push(node as HTMLAnchorElement)
      // Patch click on the appended anchor so we can record the call.
      const anchor = node as HTMLAnchorElement
      const realClick = anchor.click.bind(anchor)
      anchor.click = () => {
        clickedAnchors.push(anchor)
        try {
          realClick()
        } catch {
          // jsdom click doesn't actually navigate; swallow.
        }
      }
    }
    return realAppend(node as ChildNode)
  })
  vi.spyOn(document.body, "removeChild").mockImplementation((node: Node) => {
    if ((node as HTMLElement).tagName === "A") {
      removedAnchors.push(node as HTMLAnchorElement)
    }
    return realRemove(node as ChildNode)
  })
}

const uninstallDomSpies = () => {
  vi.restoreAllMocks()
  delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL
  delete (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL
}

// ---- fetch helpers ----------------------------------------------------

const mockFetchOk = (blobBody: Blob) => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    blob: async () => blobBody,
  }))
  globalThis.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

const mockFetchError = (status: number, statusText: string) => {
  const fetchMock = vi.fn(async () => ({
    ok: false,
    status,
    statusText,
    blob: async () => new Blob([], { type: "text/plain" }),
  }))
  globalThis.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

// ---- specs -----------------------------------------------------------

describe("downloadAuthenticated", () => {
  beforeEach(() => {
    installDomSpies()
    window.localStorage.clear()
  })

  afterEach(async () => {
    // Drain any pending setTimeout(() => URL.revokeObjectURL(...), 0) the
    // helper scheduled — without this the deferred revoke fires AFTER we
    // delete the URL.revokeObjectURL spy, producing an uncaught
    // TypeError that vitest reports as a test-file error (despite all
    // assertions passing).
    //
    // Strategy: if fake timers were installed by the test (Test 3), drain
    // them and then switch to real timers BEFORE the macrotask yield —
    // otherwise the await never resolves. If fake timers weren't installed,
    // a single real-time macrotask yield is sufficient to flush the queued
    // setTimeout(..., 0).
    if (vi.isFakeTimers()) {
      vi.runAllTimers()
      vi.useRealTimers()
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    uninstallDomSpies()
  })

  it("Test 1 — sends Authorization: Bearer <token> read from AUTH_TOKEN_KEY constant", async () => {
    // Stub localStorage with a plain (NON-JSON-stringified) token.
    window.localStorage.setItem(AUTH_TOKEN_KEY, "abc.def.ghi")
    const fetchMock = mockFetchOk(
      new Blob(["payload"], { type: "application/octet-stream" }),
    )

    await downloadAuthenticated("/api/v1/admin/users.csv")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const callArgs = fetchMock.mock.calls[0]
    expect(callArgs[0]).toBe("/api/v1/admin/users.csv")
    const headers = (callArgs[1] as RequestInit | undefined)?.headers as
      | Record<string, string>
      | undefined
    expect(headers).toBeDefined()
    expect(headers!.Authorization).toBe("Bearer abc.def.ghi")
  })

  it("Test 2 — quoted-token guard: JSON-stringified token is unwrapped before Bearer prefix (B-1 fix mirror of api-client.ts:18)", async () => {
    // Some auth flows store the token via JSON.stringify, which produces
    // `'"abc.def.ghi"'` (a 13-char string with literal double-quotes inside).
    // Without the guard, the helper would send `Bearer "abc.def.ghi"`
    // (15 chars) — which the backend rejects.
    window.localStorage.setItem(AUTH_TOKEN_KEY, '"abc.def.ghi"')
    const fetchMock = mockFetchOk(
      new Blob(["payload"], { type: "application/json" }),
    )

    await downloadAuthenticated("/api/v1/admin/audit.json")

    const headers = (fetchMock.mock.calls[0][1] as RequestInit | undefined)
      ?.headers as Record<string, string> | undefined
    // Critical contract: NO literal quotes inside the Bearer value.
    expect(headers!.Authorization).toBe("Bearer abc.def.ghi")
    expect(headers!.Authorization).not.toContain('"')
  })

  it("Test 3 — blob lifecycle: createObjectURL → appendChild → click → removeChild → revokeObjectURL", async () => {
    vi.useFakeTimers()
    window.localStorage.setItem(AUTH_TOKEN_KEY, "tok")
    const blob = new Blob(["pdf-bytes"], { type: "application/pdf" })
    mockFetchOk(blob)

    const promise = downloadAuthenticated("/api/v1/admin/summary.pdf")
    await promise

    // Order: blob was passed to createObjectURL first.
    expect(createObjectURLCalls).toHaveLength(1)
    expect(createObjectURLCalls[0]).toBe(blob)

    // Anchor was appended, clicked, then removed (in that order).
    expect(appendedAnchors).toHaveLength(1)
    expect(clickedAnchors).toHaveLength(1)
    expect(removedAnchors).toHaveLength(1)
    expect(appendedAnchors[0]).toBe(clickedAnchors[0])
    expect(clickedAnchors[0]).toBe(removedAnchors[0])

    // revokeObjectURL is deferred to next tick (Firefox/Safari quirk).
    expect(revokeObjectURLCalls).toHaveLength(0)
    vi.runAllTimers()
    expect(revokeObjectURLCalls).toHaveLength(1)
    expect(revokeObjectURLCalls[0]).toBe("blob:mock/1")
  })

  it("Test 4 — non-2xx response throws and does NOT mutate the DOM or create an object URL", async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, "tok")
    mockFetchError(401, "Unauthorized")

    await expect(
      downloadAuthenticated("/api/v1/admin/users.csv"),
    ).rejects.toThrow(/401/)

    expect(createObjectURLCalls).toHaveLength(0)
    expect(appendedAnchors).toHaveLength(0)
    expect(clickedAnchors).toHaveLength(0)
    expect(removedAnchors).toHaveLength(0)
    expect(revokeObjectURLCalls).toHaveLength(0)
  })

  it("Test 5 — filename argument sets <a>.download attribute", async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, "tok")
    mockFetchOk(new Blob(["x"], { type: "text/csv" }))

    await downloadAuthenticated(
      "/api/v1/admin/users.csv",
      "users-2026-04-28.csv",
    )

    expect(appendedAnchors).toHaveLength(1)
    expect(appendedAnchors[0].download).toBe("users-2026-04-28.csv")
  })

  it("Test 5b — without filename, anchor.download is empty (server Content-Disposition wins)", async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, "tok")
    mockFetchOk(new Blob(["x"], { type: "text/csv" }))

    await downloadAuthenticated("/api/v1/admin/users.csv")

    expect(appendedAnchors).toHaveLength(1)
    // jsdom default: empty string when not assigned.
    expect(appendedAnchors[0].download).toBe("")
  })

  it("Test 6 — SSR safety: when document is undefined, helper resolves to undefined without throwing", async () => {
    // We can't actually delete `document` in jsdom, so simulate the SSR
    // condition by stubbing the helper's runtime check via a global override.
    // The implementation MUST early-return when typeof document === "undefined".
    const originalDocument = globalThis.document
    // @ts-expect-error — intentionally test SSR path by removing document.
    delete globalThis.document

    try {
      const result = await downloadAuthenticated(
        "/api/v1/admin/users.csv",
      )
      expect(result).toBeUndefined()
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        writable: true,
        value: originalDocument,
      })
    }
  })

  it("Test 7 — when no token is present, helper still fires fetch but WITHOUT Authorization header (caller decides whether to gate the click client-side)", async () => {
    // No token in localStorage — fetch should be called with no Authorization
    // header at all (NOT `Bearer null`, NOT `Bearer undefined`). The endpoint
    // will return 401 and the error path is exercised by Test 4. This guard
    // covers the case where the helper might otherwise send a literally
    // useless header that confuses backend logging.
    const fetchMock = mockFetchOk(new Blob(["x"]))

    await downloadAuthenticated("/api/v1/admin/users.csv")

    const headers = (fetchMock.mock.calls[0][1] as RequestInit | undefined)
      ?.headers as Record<string, string> | undefined
    if (headers) {
      expect(headers.Authorization).toBeUndefined()
    }
  })
})

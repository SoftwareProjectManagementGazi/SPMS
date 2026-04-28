// Phase 14 Plan 14-13 (Cluster A — UAT 401 fix) — authenticated blob-download
// helper.
//
// Replaces the anchor-trigger downloadCsv() pattern for ANY admin-only binary
// endpoint. The anchor-trigger pattern fires a plain GET that bypasses the
// axios JWT interceptor (api-client.ts:11-22), so backend require_admin
// returns 401. This helper does the right thing: fetch with explicit
// Authorization header → blob → object URL → programmatic click → revoke.
//
// Single producer per Cluster A — consumed by:
//   - app/(shell)/admin/layout.tsx              → /admin/summary.pdf  (Rapor al)
//   - components/admin/users/users-toolbar.tsx  → /admin/users.csv    (CSV)
//   - components/admin/audit/admin-audit-toolbar.tsx → /admin/audit.json (JSON)
//
// Token source: imports AUTH_TOKEN_KEY from @/lib/constants (mirrors the
// axios interceptor at Frontend2/lib/api-client.ts:11-22). Applies the
// SAME quoted-token guard from api-client.ts:18 — if localStorage holds a
// JSON-stringified value, JSON.parse() unwraps it BEFORE the `Bearer `
// prefix. Without this guard the backend receives `Bearer "<token>"`
// (literal quotes) and returns 401.

import { AUTH_TOKEN_KEY } from "@/lib/constants"

/**
 * Download an authenticated blob from `url` (any same-origin admin-only
 * endpoint that returns a binary body with `Content-Disposition: attachment`).
 *
 * Sends `Authorization: Bearer <token>` from `localStorage[AUTH_TOKEN_KEY]`,
 * applying the api-client.ts:18 quoted-token guard. On 2xx, materialises the
 * response as a blob, creates an object URL, programmatically clicks a
 * temporary anchor to trigger the browser download, and revokes the URL on
 * the next tick.
 *
 * Throws on non-2xx so the caller can surface a toast/error UI. Resolves to
 * `undefined` in SSR (no `document`).
 *
 * @param url       Absolute or root-relative URL of the admin binary endpoint.
 * @param filename  Optional override for the download filename. When omitted
 *                  the browser uses the server's `Content-Disposition`.
 */
export async function downloadAuthenticated(
  url: string,
  filename?: string,
): Promise<void> {
  // SSR safety — Next.js may evaluate the module on the server when the
  // consumer is a Server Component. The Cluster A consumers are all client
  // components, but defending here keeps the helper safe for any future
  // server caller.
  if (typeof document === "undefined") return

  // Build Authorization header — mirrors Frontend2/lib/api-client.ts:14-19
  // exactly so the JWT contract is identical between axios calls and this
  // bypass. If no token is stored, we omit the header entirely (the backend
  // will return 401, which the caller surfaces as an error toast).
  const headers: Record<string, string> = {}
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      // D-02 quoted-token guard (verbatim mirror of api-client.ts:18).
      const cleanToken = token.startsWith('"') ? JSON.parse(token) : token
      headers.Authorization = `Bearer ${cleanToken}`
    }
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(
      `downloadAuthenticated failed: ${res.status} ${res.statusText} for ${url}`,
    )
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = objectUrl
  if (filename) a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Defer revoke by one tick so Firefox/Safari finish reading the URL.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

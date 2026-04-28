// Phase 14 Plan 14-01 — CSV download trigger (D-W3 server-side export).
//
// !!! DEPRECATED for any /api/v1/admin/* endpoint !!!
// Plan 14-13 (Cluster A — UAT 401 fix) discovered that the anchor-trigger
// pattern below fires a plain GET that bypasses the axios JWT interceptor
// (api-client.ts:11-22). For admin-only endpoints gated by
// Depends(require_admin), this returns 401 — observed for users.csv,
// summary.pdf, and audit.json during Phase 14 UAT (gap-truths #2, #5, #12).
//
// USE INSTEAD: lib/admin/download-authenticated.ts. The new helper
// performs fetch(url, { headers: { Authorization: `Bearer <token>` }})
// then materialises the response as a blob and triggers an anchor click on
// an object URL — same UX, but the request now carries the bearer token.
//
// This file is kept (NOT deleted) ONLY for hypothetical future PUBLIC
// endpoints (no auth required) where the simpler anchor-trigger pattern is
// adequate. As of Plan 14-13 there are zero live callers — every admin
// download has been migrated to downloadAuthenticated. If you find yourself
// reaching for downloadCsv() against a /admin/* path, STOP — the request
// will 401.
//
// CSV export is server-rendered (Backend GET /admin/users.csv ships
// StreamingResponse with Content-Disposition: attachment and UTF-8 BOM).
// This client utility only fires the browser download by clicking a hidden
// anchor — NO in-browser CSV assembly, NO blob handling, NO fetch().
//
// This avoids (when used against PUBLIC endpoints):
// - Browser memory cap on large datasets (>50k rows)
// - Encoding drift between client/server (UTF-8 BOM for Excel compatibility
//   is enforced on the backend)
// - Duplicating CSV assembly logic in two places

/**
 * @deprecated For admin-only endpoints (anything under /api/v1/admin/*),
 *   use `downloadAuthenticated` from `@/lib/admin/download-authenticated`
 *   instead. The anchor-trigger pattern below does NOT send the
 *   Authorization header, so backend require_admin returns 401.
 *
 * Trigger a browser download for `url`. Optional `filename` overrides the
 * server-suggested Content-Disposition filename (browsers respect the value
 * on the anchor's `download` attribute when same-origin).
 *
 * Implementation note: we attach the anchor to the document body before
 * .click() because some browsers (Firefox, Safari) refuse to fire the
 * download when the element is detached. Removing immediately after click
 * keeps the DOM clean.
 */
export function downloadCsv(url: string, filename?: string): void {
  if (typeof document === "undefined") return
  const a = document.createElement("a")
  a.href = url
  if (filename) a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

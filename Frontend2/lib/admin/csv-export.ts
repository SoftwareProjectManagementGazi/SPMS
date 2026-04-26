// Phase 14 Plan 14-01 — CSV download trigger (D-W3 server-side export).
//
// CSV export is server-rendered (Backend GET /admin/users.csv ships
// StreamingResponse with Content-Disposition: attachment and UTF-8 BOM).
// This client utility only fires the browser download by clicking a hidden
// anchor — NO in-browser CSV assembly, NO blob handling, NO fetch().
//
// This avoids:
// - Browser memory cap on large datasets (>50k rows)
// - Encoding drift between client/server (UTF-8 BOM for Excel compatibility
//   is enforced on the backend)
// - Duplicating CSV assembly logic in two places

/**
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

// Phase 14 Plan 14-01 — Bulk-invite CSV parser (D-B4 + Pitfall 5).
//
// papaparse@^5.5.3 wrapper that yields rows + per-row errors. Validation
// rules MUST mirror the backend Pydantic BulkInviteRowDTO exactly so the
// preview modal does not show "50 valid" while the server later rejects 3.
//
// Format: 3 columns — email, name, role. Header row optional (auto-detected
// by papaparse; if first row contains "email" we use header mode). Hard cap
// 500 rows (D-B4 DoS guard) — parser stops accepting valid rows after the
// 500th and pushes a single "max rows exceeded" error to the errors list.

import Papa, { type ParseResult, type ParseError as PapaParseError } from "papaparse"

export const BULK_INVITE_MAX_ROWS = 500

export type BulkInviteRole = "Admin" | "Project Manager" | "Member"

export interface BulkInviteRow {
  email: string
  name: string
  role: BulkInviteRole
}

export interface BulkInviteParseError {
  row_number: number  // 1-based, matches what the server returns in BulkInviteResponse.failed
  message: string
}

export interface BulkInviteParseResult {
  rows: BulkInviteRow[]
  errors: BulkInviteParseError[]
}

// Mirrors Pydantic EmailStr lax validation — RFC 5322 lax (one local @ one
// domain, at least one dot in the domain). Same regex used on the backend
// integration tests for parity.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

// Case-insensitive role normalization — backend Pydantic Literal accepts
// only the canonical casing, but CSV authors often type "admin" or "PM" —
// we normalize before validation so the user-experience matches expectation.
function normalizeRole(raw: string): BulkInviteRole | null {
  const lower = (raw ?? "").trim().toLowerCase()
  if (lower === "admin") return "Admin"
  if (lower === "project manager" || lower === "pm" || lower === "project_manager")
    return "Project Manager"
  if (lower === "member") return "Member"
  return null
}

function normalizeName(raw: string | undefined, email: string): string {
  const trimmed = (raw ?? "").trim()
  if (trimmed.length === 0) {
    // Default to email local part — matches backend convention so previews
    // and final values agree.
    return email.split("@")[0] ?? ""
  }
  if (trimmed.length > 100) return trimmed.slice(0, 100)
  return trimmed
}

/**
 * Parse a bulk-invite CSV File and return both the valid rows and per-row
 * errors. Row numbers are 1-based to match what the server returns in
 * BulkInviteResponse.failed[].row_number.
 *
 * Hard cap 500 (Pitfall 5 / D-B4): we stop accepting valid rows after row
 * 500 and push ONE summary error so the user sees a clear "skipped remaining"
 * banner in the preview modal. The server-side BulkInviteRowDTO Field(max_items=500)
 * is the single source of truth — this client cap exists for UX symmetry,
 * not security.
 */
export async function parseBulkInviteCsv(file: File): Promise<BulkInviteParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      // Trim header keys so "Email", "EMAIL ", "email" all map identically.
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results: ParseResult<Record<string, string>>) => {
        const rows: BulkInviteRow[] = []
        const errors: BulkInviteParseError[] = []
        let acceptedCount = 0

        // papaparse parse errors are surfaced first (file-level malformation).
        for (const pe of results.errors ?? []) {
          // Cast — papaparse reports `row` as 0-based row index in the file
          // (excluding header). We add 2 so users see 1-based "data row #" with
          // the header counted as row 1.
          const rowNum = typeof (pe as PapaParseError).row === "number"
            ? ((pe as PapaParseError).row as number) + 2
            : 0
          errors.push({
            row_number: rowNum,
            message: pe.message ?? "Geçersiz CSV satırı",
          })
        }

        const dataRows = results.data ?? []
        for (let i = 0; i < dataRows.length; i++) {
          const rowNum = i + 2  // 1-based + header offset

          if (acceptedCount >= BULK_INVITE_MAX_ROWS) {
            // 500-row cap reached — record one summary and stop accepting.
            errors.push({
              row_number: rowNum,
              message: `En fazla ${BULK_INVITE_MAX_ROWS} satır kabul edilir; kalan satırlar atlandı.`,
            })
            break
          }

          const raw = dataRows[i]
          const email = (raw?.email ?? "").trim()
          const roleRaw = (raw?.role ?? "").trim()
          const nameRaw = raw?.name

          if (!email) {
            errors.push({ row_number: rowNum, message: "Email zorunlu" })
            continue
          }
          if (!EMAIL_RE.test(email)) {
            errors.push({ row_number: rowNum, message: `Geçersiz email: ${email}` })
            continue
          }
          const role = normalizeRole(roleRaw)
          if (role === null) {
            errors.push({
              row_number: rowNum,
              message: `Geçersiz rol: '${roleRaw}'. Beklenen: Admin / Project Manager / Member`,
            })
            continue
          }
          const name = normalizeName(nameRaw, email)
          rows.push({ email, name, role })
          acceptedCount++
        }

        resolve({ rows, errors })
      },
      error: (err) => {
        // File-level error (e.g., FileReader failure). Resolve with a single
        // synthetic error so callers don't need a separate failure path.
        resolve({
          rows: [],
          errors: [{ row_number: 0, message: err?.message ?? "CSV okunamadı" }],
        })
      },
    })
  })
}

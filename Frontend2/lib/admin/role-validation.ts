// Phase 15 Plan 15-11 — D-2.6 role-name client-side validator.
//
// Mirror of the backend Pydantic regex at
// Backend/app/application/dtos/role_dtos.py — single source of truth on the
// wire is the backend; the client copy is a snappy-UX accelerator that
// surfaces "Geçersiz karakter" / "Reserved name" errors before the user
// hits Save and waits for the 422 round-trip.
//
// Grammar (mirrors Pydantic regex; if backend tightens, update both at the
// same time per CONTEXT.md cross-file rule "validateRoleName mirrors backend
// regex"):
//
//   - Length: 1-50 characters AFTER trim()
//   - Allowed chars: A-Z, a-z, 0-9, space, underscore, hyphen, plus the
//     Turkish letters Ç Ğ İ Ö Ş Ü ç ğ ı ö ş ü.
//   - Reserved (case-insensitive): Admin, Project Manager, Member, Guest.
//
// Returns a discriminated union so the consumer can render a localized
// error message per reason WITHOUT re-running the regex.

export const ROLE_NAME_RE = /^[A-Za-zÇĞİÖŞÜçğıöşü0-9 _-]+$/
export const ROLE_NAME_MIN = 1
export const ROLE_NAME_MAX = 50
export const RESERVED_ROLE_NAMES = [
  "admin",
  "project manager",
  "member",
  "guest",
] as const

export type RoleNameValidation =
  | { ok: true }
  | { ok: false; reason: "empty" | "too_long" | "invalid_chars" | "reserved" }

export function validateRoleName(name: string): RoleNameValidation {
  const trimmed = name.trim()
  if (trimmed.length < ROLE_NAME_MIN) return { ok: false, reason: "empty" }
  if (trimmed.length > ROLE_NAME_MAX) return { ok: false, reason: "too_long" }
  if (!ROLE_NAME_RE.test(trimmed)) return { ok: false, reason: "invalid_chars" }
  if ((RESERVED_ROLE_NAMES as readonly string[]).includes(trimmed.toLowerCase())) {
    return { ok: false, reason: "reserved" }
  }
  return { ok: true }
}

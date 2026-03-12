# Phase 2: Authentication & Team Management - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage their own profiles (name, email, avatar), create and join global teams, reset forgotten passwords via email token, and the system locks accounts after 5 consecutive failed logins. Rate limiting applies to auth endpoints. Critical destructive actions require user confirmation.

Requirements in scope: AUTH-01, AUTH-02, AUTH-03, AUTH-04, SEC-01, SEC-04, SAFE-01.

</domain>

<decisions>
## Implementation Decisions

### Profile Editing (AUTH-01)
- Editable fields: full name, email, avatar — all three, no others in this phase
- Avatar: file upload to backend `static/` folder (not URL input); served via a static file route that requires authentication — no unauthenticated access to the upload directory
- Email change: requires current password confirmation before applying
- UI behavior: save only after server confirms success — show loading state on submit, update UI on success response, show error on failure (no optimistic updates)
- Backend: new `PUT /auth/me` endpoint; follows existing `GET /auth/me` pattern in `auth.py`

### Team Model & Structure (AUTH-02)
- Teams are **global entities** (not scoped inside a single project) — a team exists independently and can be assigned to multiple projects
- A user can belong to multiple teams (many-to-many: `team_members` join table)
- Teams can be assigned to multiple projects (many-to-many: `team_projects` join table)
- Any authenticated user can create a team; the creator becomes the team owner
- Invite mechanism: search by email or username from registered users → instant add (no email invite needed for team membership)
- New DB entities required: `teams` table + `team_members` join table + `team_projects` join table
- **SDD impact**: schema additions must be documented in `sdd_revizyon.md`

### Password Reset (AUTH-03)
- Token storage: new DB table `password_reset_tokens` with columns: `token_hash`, `user_id`, `expires_at`, `used_at` — single-use, 30-minute validity
- Dev environment: log the full reset link to console/structured log instead of sending email; real SMTP configured via env vars for production
- Expired or already-used link: show clear error page — "This link has expired or has already been used. Request a new password reset." with a link to the request form
- Non-existent email: always return generic message — "If this email is registered, you'll receive a reset link shortly." (no user enumeration)
- **SDD impact**: `password_reset_tokens` table addition must be documented in `sdd_revizyon.md`

### Account Lockout (AUTH-04)
- Trigger: 5 consecutive failed login attempts → account locked
- Storage: in-memory Python dict in the FastAPI process (key: user_id → {attempts, locked_until}). Resets on server restart; acceptable for current single-process deployment.
- Unlock: time-based auto-unlock — account automatically unlocks after 15 minutes
- Locked account response: HTTP 423 (Locked) with a message indicating when it will unlock
- Counter resets on successful login

### Rate Limiting (SEC-01)
- Library: `slowapi` (FastAPI-native, wraps `limits` library) — per-IP rate limiting
- Applied to: `POST /auth/login` and `POST /auth/register`
- Limits: login → 10 requests/minute per IP; register → 5 requests/minute per IP
- Rate-limited response: HTTP 429 Too Many Requests

### Confirmation Dialogs (SAFE-01)
- **Type-name-to-confirm** (highly destructive): Delete project — user must type the project name to confirm
- **Modal with Cancel/Confirm** (shadcn/ui AlertDialog): Delete task, Remove team member, Change email/password
- All modals follow shadcn/ui AlertDialog component — consistent with existing UI library

### GDPR/KVKK Note (SEC-04)
- Document data processing practices in a brief compliance note (which personal data is stored, purpose, retention policy)
- No automated data deletion or export flow required in this phase — documented compliance note is sufficient

### Claude's Discretion
- Exact SMTP library/service choice for production email (e.g., smtplib, sendgrid-python, fastapi-mail)
- File naming convention for avatar uploads (UUID-based or user-id-based)
- Exact rate limit numbers (start with 10/min login, 5/min register — adjust if needed)
- `sdd_revizyon.md` update format/structure

</decisions>

<specifics>
## Specific Ideas

- Avatar files must not be publicly accessible without authentication — serve via authenticated endpoint, not raw static file URL
- In-memory lockout counter is explicitly chosen for simplicity (single-process Docker deployment); if the app moves to multi-process, this needs Redis
- Team invite is search-and-add (no email flow) — keeps the UX fast and avoids dependency on email infrastructure for team management
- `password_reset_tokens` and any other new tables added in Phase 2 must be reflected in `sdd_revizyon.md` schema section

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/api/v1/auth.py` — existing auth router with `GET /auth/me`, `POST /auth/login`, `POST /auth/register`; extend with `PUT /auth/me`, `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`
- `app/application/dtos/auth_dtos.py` — extend with `UserUpdateDTO`, `PasswordResetRequestDTO`, `PasswordResetConfirmDTO`
- `app/domain/entities/user.py` — `User` entity has `email`, `full_name`, `avatar`, `is_active`; extend with lockout fields or handle in-memory separately
- `app/infrastructure/database/models/user.py` — `UserModel` with `TimestampedMixin`; add avatar path column if needed
- `app/api/dependencies.py` — existing `get_current_user` Depends() pattern; new team permission checks follow same pattern
- `Backend/static/` — existing static folder; set up sub-directory for user avatars
- shadcn/ui `AlertDialog` component — use for all confirmation dialogs (already in project)
- `Frontend/services/auth-service.ts` — extend with `updateProfile()`, `requestPasswordReset()`, `confirmPasswordReset()`

### Established Patterns
- FastAPI `Depends()` for all auth/permission checks — team owner check follows same pattern
- Clean Architecture layers: Domain → Application → Infrastructure → API — new Team use cases live in `app/application/use_cases/`
- `TimestampedMixin` applied to new `teams` table (soft delete + versioning)
- Error responses: HTTP 400, 401, 403, 404, 423 (lockout), 429 (rate limit)

### Integration Points
- `Frontend/app/settings/page.tsx` — add form save functionality (currently read-only, loads from `GET /auth/me`)
- New pages/components needed: Team creation page, team invite UI, password reset request page, password reset confirm page
- `Frontend/app/projects/` — team assignment to project needs to be wired in project creation/edit flow
- `Backend/docker-compose.yaml` — add SMTP env vars for production email config; no new containers needed for dev

</code_context>

<deferred>
## Deferred Ideas

- Email invite link for team membership (search-and-add chosen instead) — could be added in a future phase if needed
- Admin dashboard for unlocking accounts manually — Phase 6 or admin panel phase
- Redis-based lockout counter for multi-process deployments — v2 / infrastructure scaling phase
- HttpOnly cookie JWT storage (XSS risk mitigation) — already noted in PROJECT.md as v2 item

</deferred>

---

*Phase: 02-authentication-team-management*
*Context gathered: 2026-03-12*

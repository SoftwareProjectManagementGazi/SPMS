# Phase 2: Authentication & Team Management - Research

**Researched:** 2026-03-12
**Domain:** FastAPI authentication extensions, team management, password reset, account lockout, rate limiting, file upload, shadcn/ui confirmation dialogs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Profile Editing (AUTH-01)**
- Editable fields: full name, email, avatar — all three, no others in this phase
- Avatar: file upload to backend `static/` folder (not URL input); served via a static file route that requires authentication — no unauthenticated access to the upload directory
- Email change: requires current password confirmation before applying
- UI behavior: save only after server confirms success — show loading state on submit, update UI on success response, show error on failure (no optimistic updates)
- Backend: new `PUT /auth/me` endpoint; follows existing `GET /auth/me` pattern in `auth.py`

**Team Model & Structure (AUTH-02)**
- Teams are global entities (not scoped inside a single project) — a team exists independently and can be assigned to multiple projects
- A user can belong to multiple teams (many-to-many: `team_members` join table)
- Teams can be assigned to multiple projects (many-to-many: `team_projects` join table)
- Any authenticated user can create a team; the creator becomes the team owner
- Invite mechanism: search by email or username from registered users → instant add (no email invite needed for team membership)
- New DB entities required: `teams` table + `team_members` join table + `team_projects` join table
- SDD impact: schema additions must be documented in `sdd_revizyon.md`

**Password Reset (AUTH-03)**
- Token storage: new DB table `password_reset_tokens` with columns: `token_hash`, `user_id`, `expires_at`, `used_at` — single-use, 30-minute validity
- Dev environment: log the full reset link to console/structured log instead of sending email; real SMTP configured via env vars for production
- Expired or already-used link: show clear error page — "This link has expired or has already been used. Request a new password reset." with a link to the request form
- Non-existent email: always return generic message — "If this email is registered, you'll receive a reset link shortly." (no user enumeration)
- SDD impact: `password_reset_tokens` table addition must be documented in `sdd_revizyon.md`

**Account Lockout (AUTH-04)**
- Trigger: 5 consecutive failed login attempts → account locked
- Storage: in-memory Python dict in the FastAPI process (key: user_id → {attempts, locked_until}). Resets on server restart; acceptable for current single-process deployment.
- Unlock: time-based auto-unlock — account automatically unlocks after 15 minutes
- Locked account response: HTTP 423 (Locked) with a message indicating when it will unlock
- Counter resets on successful login

**Rate Limiting (SEC-01)**
- Library: `slowapi` (FastAPI-native, wraps `limits` library) — per-IP rate limiting
- Applied to: `POST /auth/login` and `POST /auth/register`
- Limits: login → 10 requests/minute per IP; register → 5 requests/minute per IP
- Rate-limited response: HTTP 429 Too Many Requests

**Confirmation Dialogs (SAFE-01)**
- Type-name-to-confirm (highly destructive): Delete project — user must type the project name to confirm
- Modal with Cancel/Confirm (shadcn/ui AlertDialog): Delete task, Remove team member, Change email/password
- All modals follow shadcn/ui AlertDialog component — consistent with existing UI library

**GDPR/KVKK Note (SEC-04)**
- Document data processing practices in a brief compliance note (which personal data is stored, purpose, retention policy)
- No automated data deletion or export flow required in this phase — documented compliance note is sufficient

### Claude's Discretion
- Exact SMTP library/service choice for production email (e.g., smtplib, sendgrid-python, fastapi-mail)
- File naming convention for avatar uploads (UUID-based or user-id-based)
- Exact rate limit numbers (start with 10/min login, 5/min register — adjust if needed)
- `sdd_revizyon.md` update format/structure

### Deferred Ideas (OUT OF SCOPE)
- Email invite link for team membership (search-and-add chosen instead)
- Admin dashboard for unlocking accounts manually — Phase 6 or admin panel phase
- Redis-based lockout counter for multi-process deployments — v2 / infrastructure scaling phase
- HttpOnly cookie JWT storage (XSS risk mitigation) — already noted in PROJECT.md as v2 item
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can edit profile (name, email, avatar) | `PUT /auth/me` endpoint pattern; `python-multipart` already installed for file upload; `UserModel.avatar` column exists; Settings page already loads data — needs form save wiring |
| AUTH-02 | User can create a team and invite registered users | New domain layer: Team entity + TeamRepository + team use cases; 3 new DB tables (teams, team_members, team_projects); search-and-add flow via existing `/auth/users` list endpoint |
| AUTH-03 | Password reset via single-use 30-min email link | New `password_reset_tokens` DB table; secrets.token_urlsafe for token generation; SHA-256 hash storage; dev: log link to structured logger; prod: SMTP via env vars |
| AUTH-04 | Account locks after 5 consecutive failed logins | Module-level dict in login use case / router; datetime-based lock expiry; HTTP 423 response; counter reset on success |
| SEC-01 | Rate limiting on login and register endpoints | `slowapi` library (not yet in requirements.txt); Limiter instance on FastAPI app; @limiter.limit decorator on POST /auth/login and /auth/register |
| SEC-04 | KVKK/GDPR compliance documentation | Compliance note document listing personal data fields, purpose, retention; no code changes required |
| SAFE-01 | Confirmation dialogs before critical destructive actions | shadcn/ui AlertDialog (already installed as @radix-ui/react-alert-dialog 1.1.4); type-name pattern for delete project; standard modal for lesser actions |
</phase_requirements>

---

## Summary

Phase 2 extends the existing FastAPI/Next.js SPMS stack with user-facing auth features that sit on top of the Phase 1 foundation. The codebase already follows Clean Architecture (Domain → Application → Infrastructure → API), uses SQLAlchemy async with PostgreSQL, and has `python-multipart` installed — all prerequisites for the file upload and endpoint work in this phase.

The six areas of work are largely independent and can be parallelised in planning waves: (1) profile editing (backend endpoint + frontend form), (2) team management (new DB tables + full CRUD), (3) password reset (new DB table + token flow), (4) account lockout (in-memory dict, modifies existing login use case), (5) rate limiting (new library `slowapi`, decorator on two endpoints), and (6) confirmation dialogs (frontend-only UI work using already-installed AlertDialog).

The biggest architectural expansion is team management, which requires the first new domain entity added since Phase 1 and introduces three new database tables. Everything else is additive to existing structures (new methods on existing repos, new columns noted, new endpoints on the existing auth router).

**Primary recommendation:** Structure planning waves so that the DB migration for teams + password_reset_tokens is Wave 0/1, backend use cases are Wave 2-3, and frontend wiring is Wave 4-5. Rate limiting and confirmation dialogs are low-risk and can slot into any wave.

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| fastapi | latest | API framework | Installed |
| sqlalchemy (async) | latest | ORM + async sessions | Installed |
| asyncpg | latest | PostgreSQL async driver | Installed |
| passlib[bcrypt] | latest | Password hashing | Installed |
| python-jose | latest | JWT creation/validation | Installed |
| python-multipart | latest | File upload parsing (Form, UploadFile) | Installed — needed for avatar upload |
| pydantic[email] | latest | DTO validation | Installed |

### New Libraries Required
| Library | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| slowapi | >=0.1.9 | FastAPI-native rate limiting | `pip install slowapi` |

### Claude's Discretion: SMTP Library
For production email sending (password reset), three options are viable. Recommendation: **smtplib** (stdlib, zero extra dependency) for dev-phase logging + a minimal async wrapper. If real SMTP is needed before Phase 5, use **fastapi-mail** which integrates cleanly with FastAPI's dependency system and supports async sending.

| Option | Dependency | Dev fit | Prod fit |
|--------|-----------|---------|---------|
| smtplib (stdlib) | None | Console log mode: no SMTP needed | Works for basic SMTP |
| fastapi-mail | `pip install fastapi-mail` | Overkill for dev | Clean async integration |
| sendgrid-python | `pip install sendgrid` | Not needed for dev | Requires SendGrid account |

**Chosen approach for dev phase:** Log reset link to structured logger (already in `logger = logging.getLogger("spms")`). Add `SMTP_*` env vars to config for production path but make them optional.

### Installation (additions only)
```bash
# In Backend/
pip install slowapi
# Add to requirements.txt:
echo "slowapi" >> requirements.txt
```

---

## Architecture Patterns

### Recommended New File Layout
```
Backend/app/
├── domain/
│   ├── entities/
│   │   ├── team.py                    # NEW: Team entity
│   │   └── password_reset_token.py    # NEW: PasswordResetToken entity
│   └── repositories/
│       ├── team_repository.py         # NEW: ITeamRepository interface
│       └── password_reset_repository.py # NEW: IPasswordResetRepository interface
├── application/
│   ├── dtos/
│   │   ├── auth_dtos.py               # EXTEND: UserUpdateDTO, PasswordResetRequestDTO, PasswordResetConfirmDTO
│   │   └── team_dtos.py               # NEW: TeamCreateDTO, TeamResponseDTO, TeamMemberDTO
│   └── use_cases/
│       ├── update_user_profile.py     # NEW
│       ├── request_password_reset.py  # NEW
│       ├── confirm_password_reset.py  # NEW
│       └── manage_teams.py            # NEW: create, add_member, remove_member, list
├── infrastructure/
│   └── database/
│       ├── models/
│       │   ├── team.py                # NEW: TeamModel, TeamMemberModel, TeamProjectModel
│       │   └── password_reset_token.py # NEW: PasswordResetTokenModel
│       └── repositories/
│           ├── team_repo.py           # NEW: SqlAlchemyTeamRepository
│           └── password_reset_repo.py # NEW: SqlAlchemyPasswordResetRepository
└── api/
    └── v1/
        ├── auth.py                    # EXTEND: PUT /auth/me, reset endpoints, avatar endpoint
        └── teams.py                   # NEW: /teams router
```

### Pattern 1: Extending the Auth Router
Existing pattern in `auth.py` uses `Depends(get_current_user)` for all protected endpoints. New endpoints follow the same pattern:

```python
# Source: existing auth.py pattern
@router.put("/me", response_model=UserResponseDTO)
async def update_profile(
    dto: UserUpdateDTO,
    current_user: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
    security_service: ISecurityService = Depends(get_security_service),
):
    use_case = UpdateUserProfileUseCase(user_repo, security_service)
    return await use_case.execute(current_user, dto)
```

### Pattern 2: File Upload (Avatar)
`python-multipart` is already installed. FastAPI's `UploadFile` + `File` handle multipart:

```python
from fastapi import UploadFile, File, Form
import uuid, os

@router.post("/me/avatar", response_model=UserResponseDTO)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    ext = os.path.splitext(file.filename)[1].lower()  # e.g. ".jpg"
    filename = f"{uuid.uuid4()}{ext}"                 # UUID-based naming (Claude's discretion)
    dest = Path("static/uploads/avatars") / filename
    dest.parent.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    dest.write_bytes(content)
    # Save relative path to DB: "uploads/avatars/<uuid>.ext"
    await user_repo.update_avatar(current_user.id, str(dest.relative_to(Path("static"))))
    return await user_repo.get_by_id(current_user.id)
```

**Authenticated avatar serving:** Do NOT use `StaticFiles` mount for the avatars directory. Serve via a dedicated endpoint that checks `get_current_user` first:

```python
from fastapi.responses import FileResponse

@router.get("/avatar/{filename}")
async def serve_avatar(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    path = Path("static/uploads/avatars") / filename
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(path)
```

### Pattern 3: slowapi Rate Limiting
```python
# In main.py — add limiter to app state
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# In auth.py — decorate the target endpoints
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

@router.post("/login", response_model=TokenDTO)
@limiter.limit("10/minute")
async def login(request: Request, dto: UserLoginDTO, ...):
    ...

@router.post("/register", response_model=UserResponseDTO, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, dto: UserRegisterDTO, ...):
    ...
```

Note: `request: Request` parameter is required by slowapi even if unused in the handler body.

### Pattern 4: In-Memory Account Lockout
```python
# Module-level dict — lives for the process lifetime (acceptable per CONTEXT.md)
from datetime import datetime, timedelta
from dataclasses import dataclass, field

@dataclass
class LockoutEntry:
    attempts: int = 0
    locked_until: datetime | None = None

_lockout_store: dict[int, LockoutEntry] = {}
LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION_MINUTES = 15

def check_lockout(user_id: int) -> datetime | None:
    """Returns locked_until if currently locked, else None."""
    entry = _lockout_store.get(user_id)
    if entry and entry.locked_until and datetime.utcnow() < entry.locked_until:
        return entry.locked_until
    return None

def record_failed_attempt(user_id: int) -> bool:
    """Returns True if this attempt triggers a lock."""
    entry = _lockout_store.setdefault(user_id, LockoutEntry())
    entry.attempts += 1
    if entry.attempts >= LOCKOUT_THRESHOLD:
        entry.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        return True
    return False

def clear_lockout(user_id: int) -> None:
    _lockout_store.pop(user_id, None)
```

Integrate into `LoginUserUseCase.execute()` or at the router level before calling the use case. HTTP 423 response:
```python
raise HTTPException(status_code=423, detail=f"Account locked until {locked_until.isoformat()}")
```

### Pattern 5: Password Reset Token Flow
```python
import secrets, hashlib

def generate_token() -> tuple[str, str]:
    """Returns (raw_token, token_hash). Store hash, send raw."""
    raw = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed

# Request endpoint
@router.post("/password-reset/request", status_code=204)
async def request_password_reset(dto: PasswordResetRequestDTO, ...):
    user = await user_repo.get_by_email(dto.email)
    # ALWAYS return 204 regardless of whether email exists (no enumeration)
    if user:
        raw, hashed = generate_token()
        expires = datetime.utcnow() + timedelta(minutes=30)
        await reset_repo.create(user.id, hashed, expires)
        link = f"{settings.FRONTEND_URL}/reset-password?token={raw}"
        logger.info(json.dumps({"event": "password_reset_requested", "link": link}))
        # In production: send_email(user.email, link)
    return Response(status_code=204)

# Confirm endpoint
@router.post("/password-reset/confirm", status_code=204)
async def confirm_password_reset(dto: PasswordResetConfirmDTO, ...):
    hashed = hashlib.sha256(dto.token.encode()).hexdigest()
    record = await reset_repo.get_by_hash(hashed)
    if not record or record.used_at or datetime.utcnow() > record.expires_at:
        raise HTTPException(400, "This link has expired or has already been used.")
    new_hash = security.get_password_hash(dto.new_password)
    await user_repo.update_password(record.user_id, new_hash)
    await reset_repo.mark_used(record.id)
    return Response(status_code=204)
```

### Pattern 6: Team Management Domain Layer
```python
# Domain entity (app/domain/entities/team.py)
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class Team(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    owner_id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
```

Team endpoints follow the same project-style pattern. Owner check uses a Depends() guard analogous to `get_project_member`:

```python
async def get_team_owner(
    team_id: int,
    current_user: User = Depends(get_current_user),
    team_repo: ITeamRepository = Depends(get_team_repo),
) -> User:
    team = await team_repo.get_by_id(team_id)
    if team is None:
        raise HTTPException(404, "Team not found")
    if team.owner_id != current_user.id and not _is_admin(current_user):
        raise HTTPException(403, "Only team owner can perform this action")
    return current_user
```

### Pattern 7: shadcn/ui AlertDialog (Confirmation Dialogs)
The `@radix-ui/react-alert-dialog` package is already installed (v1.1.4). The project already has `components/ui/alert-dialog.tsx`. Standard usage:

```tsx
// Standard modal (Delete task, Remove team member, Change email/password)
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Type-name pattern (Delete project)
// Controlled AlertDialog where the Confirm button is disabled until
// a controlled <Input> value matches the project name.
const [confirmText, setConfirmText] = React.useState("")
<AlertDialogAction disabled={confirmText !== project.name} onClick={handleDelete}>
  Delete
</AlertDialogAction>
```

### Anti-Patterns to Avoid

- **Don't serve avatar files via raw StaticFiles mount** — that bypasses authentication. Always serve through an authenticated endpoint.
- **Don't store raw password reset tokens** — store the SHA-256 hash, send the raw token in the URL only.
- **Don't reveal whether an email exists during password reset** — always return the same generic response.
- **Don't use optimistic updates for profile save** — locked decision: update UI only after server confirms (prevents stale state if backend rejects).
- **Don't put lockout logic in IUserRepository** — it belongs in the use case or a dedicated service module; keep repos pure data access.
- **Don't add TimestampedMixin to `password_reset_tokens`** — these records are append-only reference data; soft-delete is not appropriate. Simple `created_at`/`expires_at`/`used_at` columns suffice.
- **Don't add teams router to main.py before the router file exists** — circular import risk during development.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom middleware counting requests | `slowapi` | Handles distributed keys, sliding window, 429 response, exception handler — edge cases in custom impl are numerous |
| Password hashing | Custom hash function | `passlib[bcrypt]` (already used) | Already wired into `SecurityAdapter.get_password_hash()` — reuse same method |
| Token generation | Custom random string | `secrets.token_urlsafe(32)` (stdlib) | Cryptographically secure; already available |
| File content-type validation | Manual mime checks | `python-magic` or simple extension allowlist | Extensions + size limit is sufficient for avatar use case; full magic-byte check is overkill |
| JWT creation | Custom JWT | `python-jose` (already used) | Already in `SecurityAdapter.create_access_token()` |
| Confirmation dialogs | Custom modal component | shadcn/ui `AlertDialog` (already installed) | Consistent with existing UI; accessible; keyboard-managed |

**Key insight:** The project already has most infrastructure needed. This phase adds one new pip package (`slowapi`) and one new DB migration. Everything else is extending existing patterns.

---

## Common Pitfalls

### Pitfall 1: slowapi Requires `request: Request` as First Parameter
**What goes wrong:** `AttributeError: 'NoneType' object has no attribute 'state'` or limiter silently not firing.
**Why it happens:** slowapi reads the request object to extract IP; FastAPI only injects it if the parameter is declared.
**How to avoid:** Always add `request: Request` as the first parameter of rate-limited endpoints, even if unused.
**Warning signs:** Rate limiting not triggering in tests; missing `request` in function signature.

### Pitfall 2: slowapi Exception Handler Must Be Registered
**What goes wrong:** 429 responses return a generic 500 or unformatted response.
**Why it happens:** FastAPI doesn't know how to serialize `RateLimitExceeded`.
**How to avoid:**
```python
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### Pitfall 3: Alembic Migration — `password_reset_tokens` Table Naming Collision
**What goes wrong:** Migration fails if table already exists from a previous partial run.
**Why it happens:** Unlike Phase 1, this migration creates entirely new tables (not adding columns to existing ones).
**How to avoid:** Use the same `_table_exists()` guard pattern from `001_phase1_schema.py` — check `information_schema.tables` before `CREATE TABLE`.

### Pitfall 4: Avatar Path Storage — Absolute vs Relative
**What goes wrong:** Avatar URLs break when server moves or port changes.
**Why it happens:** Storing absolute file system paths (`/home/user/...`) or full URLs in the DB.
**How to avoid:** Store only the relative path from `static/` root: `"uploads/avatars/{uuid}.jpg"`. The serving endpoint reconstructs the full path. Frontend constructs the URL as `{API_BASE}/auth/avatar/{filename}`.

### Pitfall 5: In-Memory Lockout Dict and User ID Lookup Order
**What goes wrong:** Lockout check runs after the DB lookup, so a locked user's credentials are still verified.
**Why it happens:** Checking lockout requires knowing `user_id`, which requires finding the user by email first.
**How to avoid:** Lookup sequence in `LoginUserUseCase.execute()`:
1. `user = await user_repo.get_by_email(dto.email)` — if None, raise InvalidCredentialsError (no lockout)
2. `locked_until = check_lockout(user.id)` — if locked, raise HTTP 423 immediately
3. `verify_password(...)` — if wrong, call `record_failed_attempt(user.id)`
4. On success: `clear_lockout(user.id)`

### Pitfall 6: Email Enumeration in Password Reset
**What goes wrong:** Returning different responses for "email found" vs "email not found" leaks user existence.
**Why it happens:** Natural coding instinct is to return an error when the email isn't registered.
**How to avoid:** Always return `204 No Content` (or a uniform 200 message). Execute the token generation logic only if the user exists, but return the same response either way.

### Pitfall 7: `PUT /auth/me` Email Change Requires Password Confirmation
**What goes wrong:** Email updated without re-authentication, enabling account takeover if token is stolen.
**Why it happens:** Forgetting that CONTEXT.md mandates current password confirmation for email changes.
**How to avoid:** `UserUpdateDTO` includes `current_password: Optional[str]`. If `email` is in the update payload, validate `current_password` against `user.password_hash` before applying changes.

### Pitfall 8: Missing `FRONTEND_URL` Config for Reset Link
**What goes wrong:** Dev log contains `None/reset-password?token=...`.
**Why it happens:** `settings.FRONTEND_URL` not added to `config.py`.
**How to avoid:** Add `FRONTEND_URL: str = "http://localhost:3000"` to `Settings` class with env var override.

---

## Code Examples

### New DB Tables (Alembic Migration 002)

```sql
-- teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- team_members (many-to-many users <-> teams)
CREATE TABLE team_members (
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id)
);

-- team_projects (many-to-many teams <-> projects)
CREATE TABLE team_projects (
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, project_id)
);

-- password_reset_tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hex = 64 chars
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens(user_id);
```

### New DTOs in auth_dtos.py
```python
class UserUpdateDTO(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None  # Required when email changes

class PasswordResetRequestDTO(BaseModel):
    email: EmailStr

class PasswordResetConfirmDTO(BaseModel):
    token: str
    new_password: str
```

### New DTOs in team_dtos.py
```python
class TeamCreateDTO(BaseModel):
    name: str
    description: Optional[str] = None

class TeamMemberDTO(BaseModel):
    user_id: int

class TeamResponseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    members: List[UserListDTO] = []
    model_config = ConfigDict(from_attributes=True)
```

### Config Additions (config.py)
```python
class Settings(BaseSettings):
    # ... existing fields ...
    FRONTEND_URL: str = "http://localhost:3000"
    # SMTP — optional, only needed for production email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@spms.local"
```

### Frontend: Extending auth-service.ts
```typescript
export const authService = {
  // ... existing methods ...

  updateProfile: async (data: {
    full_name?: string;
    email?: string;
    current_password?: string;
  }): Promise<User> => {
    const response = await apiClient.put<UserResponseDTO>('/auth/me', data);
    return mapUserResponseToUser(response.data);
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UserResponseDTO>('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapUserResponseToUser(response.data);
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password-reset/request', { email });
  },

  confirmPasswordReset: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    });
  },
};
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Flask-Limiter | slowapi | slowapi is the FastAPI-native equivalent; same `limits` library under the hood |
| Email-based team invites | Search-and-add (instant) | Chosen for UX speed; avoids email infra dependency for team management |
| Redis lockout counter | In-memory dict | Acceptable for single-process Docker deployment (CONTEXT.md decision) |
| Raw StaticFiles for uploads | Authenticated endpoint | Required because avatar directory must not be publicly accessible |

**Deprecated/outdated for this project:**
- `flask-limiter`: Flask-specific, incompatible
- `limits` directly: Lower-level; slowapi wraps it with FastAPI integration
- `aiofiles` for avatar writing: Synchronous `Path.write_bytes()` is acceptable for small avatar files in a FastAPI endpoint; async file I/O is only critical for very large files

---

## Open Questions

1. **Avatar file size limit**
   - What we know: No limit specified in CONTEXT.md
   - What's unclear: Without a limit, large files could fill disk
   - Recommendation: Add a 2MB size check in the upload endpoint (`if len(content) > 2 * 1024 * 1024: raise HTTPException(413)`)

2. **Team search endpoint — can regular users see all teams?**
   - What we know: "Any authenticated user can create a team" and invite is search-and-add from registered users
   - What's unclear: Should `GET /teams` return all teams system-wide or only the user's teams?
   - Recommendation: Return only teams where the user is owner or member for the list endpoint; add a separate search for team discovery if needed

3. **Password strength validation**
   - What we know: Not mentioned in CONTEXT.md for this phase
   - What's unclear: Whether minimum length or complexity applies to new passwords in the reset flow
   - Recommendation: Apply the same validation already used in `/auth/register` (check existing `UserRegisterDTO.password` validation if any; if none, add min-length=8 to `PasswordResetConfirmDTO.new_password`)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + pytest-asyncio (auto mode) |
| Config file | `Backend/pytest.ini` |
| Quick run command | `cd Backend && pytest tests/unit/ -x -q` |
| Full suite command | `cd Backend && pytest tests/ -q` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | PUT /auth/me updates profile fields | unit | `pytest tests/unit/application/test_update_user_profile.py -x` | ❌ Wave 0 |
| AUTH-01 | Avatar upload saves file + updates DB | integration | `pytest tests/integration/api/test_auth_avatar.py -x` | ❌ Wave 0 |
| AUTH-01 | Email change requires correct current_password | unit | `pytest tests/unit/application/test_update_user_profile.py::test_email_change_requires_password -x` | ❌ Wave 0 |
| AUTH-02 | Create team → owner assigned | unit | `pytest tests/unit/application/test_manage_teams.py::test_create_team -x` | ❌ Wave 0 |
| AUTH-02 | Add member → appears in team members list | unit | `pytest tests/unit/application/test_manage_teams.py::test_add_member -x` | ❌ Wave 0 |
| AUTH-03 | Reset request returns 204 for any email | unit | `pytest tests/unit/application/test_password_reset.py::test_request_generic_response -x` | ❌ Wave 0 |
| AUTH-03 | Token validates within 30 min, rejects after | unit | `pytest tests/unit/application/test_password_reset.py::test_token_expiry -x` | ❌ Wave 0 |
| AUTH-03 | Used token is rejected | unit | `pytest tests/unit/application/test_password_reset.py::test_token_single_use -x` | ❌ Wave 0 |
| AUTH-04 | 5 failed attempts → HTTP 423 on 6th | unit | `pytest tests/unit/application/test_account_lockout.py -x` | ❌ Wave 0 |
| AUTH-04 | Successful login resets counter | unit | `pytest tests/unit/application/test_account_lockout.py::test_counter_resets_on_success -x` | ❌ Wave 0 |
| AUTH-04 | Auto-unlock after 15 minutes (time mock) | unit | `pytest tests/unit/application/test_account_lockout.py::test_auto_unlock -x` | ❌ Wave 0 |
| SEC-01 | Login endpoint returns 429 after 10 requests/min | integration | `pytest tests/integration/api/test_rate_limiting.py -x` | ❌ Wave 0 |
| SEC-04 | Compliance note exists | manual | N/A — document review | N/A |
| SAFE-01 | AlertDialog renders on delete action | manual | N/A — browser test | N/A |

### Sampling Rate
- **Per task commit:** `cd Backend && pytest tests/unit/ -x -q`
- **Per wave merge:** `cd Backend && pytest tests/ -q`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/application/test_update_user_profile.py` — covers AUTH-01 (unit)
- [ ] `tests/unit/application/test_manage_teams.py` — covers AUTH-02 (unit)
- [ ] `tests/unit/application/test_password_reset.py` — covers AUTH-03 (unit)
- [ ] `tests/unit/application/test_account_lockout.py` — covers AUTH-04 (unit)
- [ ] `tests/integration/api/test_rate_limiting.py` — covers SEC-01 (integration)
- [ ] `tests/integration/api/test_auth_avatar.py` — covers AUTH-01 avatar upload (integration)

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read: `Backend/app/api/v1/auth.py`, `auth_dtos.py`, `dependencies.py`, `user_repo.py`, `main.py` — existing patterns verified
- Codebase direct read: `Backend/requirements.txt`, `Frontend/package.json` — installed library versions confirmed
- Codebase direct read: `Backend/app/infrastructure/database/models/base.py` — TimestampedMixin pattern confirmed
- Codebase direct read: `Backend/tests/unit/application/test_register_user.py` — existing test pattern (mock-based unit tests)
- Official FastAPI docs: `python-multipart` is the required package for `UploadFile` support (installed, confirmed)
- Python stdlib `secrets` module: `secrets.token_urlsafe` is the standard for cryptographically safe tokens

### Secondary (MEDIUM confidence)
- slowapi GitHub (https://github.com/laurents/slowapi): FastAPI-native limiter; wraps `limits` library; requires `request: Request` in handler signature; `_rate_limit_exceeded_handler` for 429 responses
- `@radix-ui/react-alert-dialog` 1.1.4 confirmed in `Frontend/package.json` — AlertDialog component already in project at `Frontend/components/ui/alert-dialog.tsx`

### Tertiary (LOW confidence)
- File size limit of 2MB: convention-based recommendation, not from official source — validate against project requirements

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in requirements.txt/package.json; slowapi is the only new addition
- Architecture patterns: HIGH — all patterns derived directly from existing codebase code; no assumptions
- DB schema: HIGH — consistent with existing init.sql patterns and alembic migration style confirmed in 001_phase1_schema.py
- Pitfalls: HIGH for items derived from code analysis; MEDIUM for slowapi-specific pitfalls (verified from README)
- Test structure: HIGH — mirrors existing `tests/unit/application/test_register_user.py` pattern exactly

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack; slowapi API surface is stable)

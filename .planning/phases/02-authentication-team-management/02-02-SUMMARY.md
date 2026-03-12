---
phase: 02-authentication-team-management
plan: 02
subsystem: database
tags: [sqlalchemy, alembic, pydantic, postgresql, teams, password-reset]

# Dependency graph
requires:
  - phase: 01-foundation-security-hardening
    provides: Base, TimestampedMixin, existing models, init.sql schema, user domain entity pattern

provides:
  - Team and PasswordResetToken domain entities
  - ITeamRepository and IPasswordResetRepository interfaces
  - TeamCreateDTO, TeamResponseDTO, TeamMemberDTO DTOs
  - UserUpdateDTO, PasswordResetRequestDTO, PasswordResetConfirmDTO DTOs (extended auth_dtos.py)
  - TeamModel, TeamMemberModel, TeamProjectModel, PasswordResetTokenModel SQLAlchemy models
  - Idempotent Alembic migration 002_phase2_schema (teams, team_members, team_projects, password_reset_tokens)
  - Async upgrade() helper in app/infrastructure/database/migrations/002_phase2_schema.py
  - Phase 2 tables added to database/init.sql with IF NOT EXISTS guards
  - sdd_revizyon.md schema documentation for all 4 new Phase 2 tables
  - SMTP and FRONTEND_URL settings added to infrastructure config

affects:
  - 02-03 (team use cases — consumes ITeamRepository)
  - 02-04 (password reset use cases — consumes IPasswordResetRepository)
  - 02-05 (auth endpoints — consumes new DTOs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - append-only model pattern (no TimestampedMixin on PasswordResetTokenModel)
    - idempotent Alembic migration with _table_exists guard
    - async upgrade() helper in app/infrastructure/database/migrations/

key-files:
  created:
    - Backend/app/domain/entities/team.py
    - Backend/app/domain/entities/password_reset_token.py
    - Backend/app/domain/repositories/team_repository.py
    - Backend/app/domain/repositories/password_reset_repository.py
    - Backend/app/application/dtos/team_dtos.py
    - Backend/app/infrastructure/database/models/team.py
    - Backend/app/infrastructure/database/models/password_reset_token.py
    - Backend/app/infrastructure/database/migrations/002_phase2_schema.py
    - Backend/alembic/versions/002_phase2_schema.py
    - Backend/sdd_revizyon.md
  modified:
    - Backend/app/application/dtos/auth_dtos.py
    - Backend/app/infrastructure/config.py
    - Backend/app/infrastructure/database/models/__init__.py
    - Backend/database/init.sql

key-decisions:
  - "No TimestampedMixin on PasswordResetTokenModel — append-only reference data per CONTEXT.md"
  - "Config lives at Backend/app/infrastructure/config.py (not app/core/config.py) — SMTP fields added there"
  - "Migration written as standard Alembic in alembic/versions/002_phase2_schema.py AND as async helper in app/infrastructure/database/migrations/002_phase2_schema.py"
  - "UserListDTO kept as-is (id, email, username, avatar_url) — TeamResponseDTO.members uses existing UserListDTO"

patterns-established:
  - "Append-only model pattern: no TimestampedMixin, no soft-delete, just created_at"
  - "Idempotent Alembic migrations via _table_exists() guard on information_schema.tables"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 20min
completed: 2026-03-12
---

# Phase 2 Plan 02: Schema, Entities, Interfaces, and DTOs Summary

**Pydantic domain entities, ABC repository interfaces, Pydantic DTOs, SQLAlchemy ORM models, and idempotent Alembic migration 002 for teams and password-reset-token tables**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-12T00:00:00Z
- **Completed:** 2026-03-12T00:20:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Created 4 new tables (teams, team_members, team_projects, password_reset_tokens) via idempotent Alembic migration 002 and IF NOT EXISTS guards in init.sql
- Established 2 domain entities, 2 repository interfaces, 6 new DTOs — all importable as verified by import check
- Documented all 4 new Phase 2 tables in sdd_revizyon.md (AUTH-02 and AUTH-03 locked decisions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Domain entities, repository interfaces, and DTOs** - `818420a` (feat)
2. **Task 2: SQLAlchemy models, Alembic migration 002, and schema documentation** - `5015480` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `Backend/app/domain/entities/team.py` - Team Pydantic domain entity with from_attributes=True
- `Backend/app/domain/entities/password_reset_token.py` - PasswordResetToken domain entity
- `Backend/app/domain/repositories/team_repository.py` - ITeamRepository ABC interface
- `Backend/app/domain/repositories/password_reset_repository.py` - IPasswordResetRepository ABC interface
- `Backend/app/application/dtos/team_dtos.py` - TeamCreateDTO, TeamMemberDTO, TeamResponseDTO
- `Backend/app/application/dtos/auth_dtos.py` - Extended with UserUpdateDTO, PasswordResetRequestDTO, PasswordResetConfirmDTO
- `Backend/app/infrastructure/config.py` - Added FRONTEND_URL, SMTP_HOST/PORT/USER/PASSWORD/FROM
- `Backend/app/infrastructure/database/models/team.py` - TeamModel (TimestampedMixin), TeamMemberModel, TeamProjectModel
- `Backend/app/infrastructure/database/models/password_reset_token.py` - PasswordResetTokenModel (append-only, no mixin)
- `Backend/app/infrastructure/database/models/__init__.py` - Registered 4 new model classes
- `Backend/app/infrastructure/database/migrations/002_phase2_schema.py` - Async upgrade() helper
- `Backend/alembic/versions/002_phase2_schema.py` - Standard Alembic migration 002 (idempotent)
- `Backend/database/init.sql` - Added 4 Phase 2 tables with IF NOT EXISTS guards
- `Backend/sdd_revizyon.md` - New file: schema documentation for all 4 Phase 2 tables

## Decisions Made

- **No TimestampedMixin on PasswordResetTokenModel** — append-only reference data per CONTEXT.md anti-patterns; it records immutable events (token creation, optional used_at mark)
- **Config at app/infrastructure/config.py** — the plan referenced `app/core/config.py` which does not exist in this project; SMTP and FRONTEND_URL fields added to the actual settings file
- **Dual migration files** — standard Alembic migration in `alembic/versions/` for CLI-driven upgrades, plus async helper in `app/infrastructure/database/migrations/` for lifespan or management scripts
- **UserListDTO unchanged** — existing DTO already serves TeamResponseDTO.members without redefinition

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Config path correction: app/core/config.py does not exist**
- **Found during:** Task 1 (config.py extension)
- **Issue:** Plan specified `Backend/app/core/config.py` which is not part of this project; settings live at `Backend/app/infrastructure/config.py`
- **Fix:** Added SMTP and FRONTEND_URL fields to `Backend/app/infrastructure/config.py` — the actual settings module
- **Files modified:** `Backend/app/infrastructure/config.py`
- **Verification:** `from app.infrastructure.config import Settings; s = Settings(); print(s.FRONTEND_URL)` prints `http://localhost:3000`
- **Committed in:** `818420a` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - wrong file path in plan)
**Impact on plan:** Necessary correction; config is functionally identical, only the module path differed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 2 domain contracts (entities, interfaces, DTOs, models) are in place
- Plans 02-03, 02-04, and 02-05 can proceed — they depend on these contracts
- Migration 002 must be run against the live database before Plans 02-03/02-04/02-05 tests can pass with DB-dependent operations

---
*Phase: 02-authentication-team-management*
*Completed: 2026-03-12*

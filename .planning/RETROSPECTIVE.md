# Retrospective: SPMS

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-20
**Phases:** 7 | **Plans:** 43

### What Was Built

- Foundation & security hardening (RBAC fix, soft-delete, audit trail, startup validation)
- Authentication with profile editing, team management, password reset, account lockout
- Full task/project module with dependencies, recurrence, comments, attachments, sprints, pagination
- Kanban drag-and-drop, Calendar, Gantt timeline, modular view switching
- In-app + email notifications with per-type preferences and task watching
- Reporting with burndown/velocity/distribution charts, PDF/Excel export, manager dashboard
- Scrum/Kanban/Waterfall/Iterative process templates, admin config panel, Slack/Teams webhooks

### What Worked

- **Phase 1 blocker-first strategy:** Bundling all architecture violations and the critical RBAC bug into Phase 1 meant every subsequent phase shipped on a clean foundation. No rework from inherited bugs.
- **Clean Architecture consistency:** Domain > Application > Infrastructure > API boundary was maintained across all 7 phases. New features slotted in predictably.
- **Wave 0 test scaffolds:** Starting each phase with xfail stubs ensured test files existed before implementation. Made verification checkpoints natural.
- **Dual migration pattern:** Alembic CLI + async lifespan migration files kept both dev workflows happy without conflicts.
- **INotificationService abstraction:** Built for polling but structured so WebSocket can replace it without touching callers.

### What Was Inefficient

- **REQUIREMENTS.md checkbox drift:** 10 requirements implemented in Phase 1 were never checked off in REQUIREMENTS.md. The traceability table also had stale "Pending" entries. Manual checkbox tracking doesn't scale.
- **Phase 1 verification never formally closed:** ROADMAP.md still showed Phase 1 as "In Progress (awaiting verification)" despite 6/6 summaries. STATE.md was also inconsistent.
- **human_needed verification items accumulated:** Phase 04 and 06 VERIFICATION.md items requiring live browser testing were never resolved. Acceptable given UI overhaul plans, but the pattern of deferring manual verification is worth watching.
- **PROJECT.md Active section stale:** Many SPMS-* requirements in the Active section were implemented across phases but never moved to Validated until milestone close.

### Patterns Established

- **Repository-level soft-delete:** Use cases stay clean; deleted_at set via Python datetime.utcnow()
- **Inline membership check for body-param endpoints:** POST routes where project_id is in body (not URL path) use inline checks instead of path-param Depends()
- **React Query v5 patterns:** useEffect for data accumulation (no onSuccess in useQuery), enabled guards for dependent queries
- **ConfirmDialog/TypeToConfirmDialog:** Controlled open state pattern for destructive action confirmation
- **Fire-and-forget integration events:** asyncio.create_task with lazy imports to avoid circular dependencies
- **Module toggle via system_config:** reporting_module_enabled !== 'false' pattern (missing key = enabled)

### Key Lessons

1. **Automate requirement tracking** — manual checkboxes in markdown drift. Next milestone should use verification reports as the source of truth for requirement completion.
2. **Close verification immediately** — don't let human_needed items accumulate across phases. Schedule manual testing sessions after each frontend phase.
3. **STATE.md needs atomic updates** — progress counters in STATE.md fell behind actual work. Consider updating STATE.md as part of each plan's SUMMARY commit.
4. **fpdf2 over WeasyPrint** — pure Python PDF generation avoids system lib dependencies. Validated decision worth carrying forward.
5. **Turkish UI content** — all user-facing strings are Turkish. Next milestone (UI overhaul) should consider whether i18n infrastructure is worth adding.

### Cost Observations

- Model mix: primarily opus for planning/execution, sonnet for research/verification
- Sessions: ~40+ sessions across 133 days
- Notable: Phases 2-5 executed rapidly (4 days for 28 plans), Phase 6-7 had a gap then completed in 2 days

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 7 |
| Plans | 43 |
| Commits | 274 |
| LOC | ~52,600 |
| Timeline | 133 days |
| Requirement coverage | 68/68 |

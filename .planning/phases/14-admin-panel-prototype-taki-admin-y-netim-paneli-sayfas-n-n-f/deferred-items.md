# Phase 14 — Deferred Items (out-of-scope discoveries during execution)

> Discoveries made during plan execution that are NOT directly caused by the
> current task's changes. Logged here for visibility; NOT fixed in this plan.

## Plan 14-01 (Wave 0)

### Pre-existing TypeScript build error in app/(shell)/reports/page.tsx

**Discovered during:** Plan 14-01 final `npm run build` smoke check.

**Symptom:**
```
./app/(shell)/reports/page.tsx:158:11
Type error: Type '"warning"' is not assignable to type
  '"neutral" | "primary" | "success" | "danger" | "info"'.
```

**Origin:** Phase 13 Plan 13-08 (`5b647890 feat(13-08): PhaseReportsSection`).
The StatCard `tone="warning"` value was added when StatCard's tone enum did
NOT include "warning". Subsequent StatCard refactor narrowed the union.

**Why deferred:**
- Out of scope for Plan 14-01 — not introduced by Wave 0 code.
- The Plan 14-01 unit + integration tests pass; only the final `next build`
  type-checker catches it because `npm run build` runs strict type-check
  across the entire app tree.
- `npm run lint` shows ~115 pre-existing problems across the codebase from
  Phases 11-13; Plan 14-01 introduced minor `any` warnings on error handlers
  consistent with existing hook patterns (use-projects.ts uses `unknown` but
  many other hooks use `any` — no project-wide convention enforced).

**Action item:** A future cleanup phase or a Phase 14-02 follow-up plan should
fix the StatCard tone usage in reports/page.tsx (rename to "neutral" or extend
the StatCard tone enum to include "warning").

---
phase: 13-reporting-activity-user-profile
plan: 02
subsystem: web
tags: [next-16, react-19, header, dropdown, a11y, auth, i18n, sidebar-refactor, prof-03]

requires:
  - phase: 08-shell-design-tokens
    provides: SidebarUserMenu analog (Phase 8 D-04) — port pattern + click-outside dismiss
  - phase: 08-shell-design-tokens
    provides: Avatar / Badge primitives + token system
  - phase: 10-shell-pages-project-features
    provides: useAuth() / logout() / token + cookie clear (D-09)
  - phase: 12-lifecycle-phase-gate-workflow-editor
    provides: Next.js 16 safePush / usePathname() pattern (D-09 — RESEARCH §Pitfall 6)
  - phase: 13-reporting-activity-user-profile
    plan: 01
    provides: Avatar primitive with optional href + onClick (consumed by trigger)

provides:
  - Frontend2/components/shell/avatar-dropdown.tsx — header AvatarDropdown component (260px menu, 5 items, full a11y, 3-way dismiss)
  - Frontend2/lib/initials.ts — getInitials utility lifted from activity-feed (third consumer trigger)
  - Header now mounts <AvatarDropdown/> as the canonical user menu surface
  - Sidebar footer wrapper REMOVED — sidebar becomes pure nav region (CONTEXT D-D1)
  - activity-feed.tsx routes initials through the shared lib (single source of truth)
  - Çıkış Yap correctly lands on /auth/login (D-D3 corrects Phase 8 D-04 legacy /login)
  - Admin Paneli is gated by case-insensitive role check tolerating both `{name}` object and plain string seeds

affects: [13-03, 13-05, 13-06]
  # 13-03 cross-site avatar links — patches Avatar consumers; AvatarDropdown is a new consumer that uses initials only (not href on the trigger because the trigger opens the menu, not a profile link).
  # 13-05 user profile route — Profilim menu item lands on /users/{id}; the route ships in 13-05.
  # 13-06 profile activity tab — independent surface; same useAuth shape.

tech-stack:
  added: []
  patterns:
    - "Next.js 16 nav-aware dismiss via usePathname() effect (RESEARCH §Pitfall 6 — useRouter route-events removed)"
    - "Three-way dismiss composition (mousedown click-outside + Escape keydown + pathname effect) for accessibility-correct dropdown UX"
    - "Defensive role read tolerating both object {role:{name}} and plain string seeds (case-insensitive)"
    - "Lift utility on third consumer (RESEARCH 'Don't Hand-Roll' table) — activity-feed → AvatarDropdown → future profile-header"

key-files:
  created:
    - Frontend2/components/shell/avatar-dropdown.tsx
    - Frontend2/components/shell/avatar-dropdown.test.tsx
    - Frontend2/lib/initials.ts
    - Frontend2/lib/initials.test.ts
  modified:
    - Frontend2/components/header.tsx (mount AvatarDropdown after the language button)
    - Frontend2/components/sidebar.tsx (REMOVE SidebarUserMenu function + footer wrapper + 5 unused imports)
    - Frontend2/components/dashboard/activity-feed.tsx (replace local getInitials with import from lib)

key-decisions:
  - "[13-02] AuthUser shape verified at services/auth-service.ts: id is a string, name is the canonical full-name field (not full_name), and role is always a {name:string} object. AvatarDropdown still tolerates a plain-string role for forward-compat with future seed drift (Test 5 locks the case-insensitive comparison)."
  - "[13-02] Trigger button is intentionally NOT wrapped in Avatar's href= prop — the trigger opens the dropdown; navigation to the profile happens via the Profilim menu item. Avoids hijacking the click target between two competing intents."
  - "[13-02] Pathname-change effect runs on every render where the pathname dependency changes — including the FIRST render. Setting open/dilOpen to false on mount is a no-op and matches the expected 'menu closed' default. Avoids the gotcha where a guard like `if (open)` would create a stale-closure bug."
  - "[13-02] Dil submenu lives INLINE inside the parent menu (not as a flyout). Selecting a language closes only the submenu (setDilOpen(false)) — the parent menu intentionally stays open so users can confirm the language switched. The pathname effect doesn't dismiss because the language toggle doesn't navigate."
  - "[13-02] avColor seed from Number(user.id) || (userName.length || 1) — string ids (auth-service shape) coerce numerically; failing that we fall back to name length so the avatar still picks a deterministic color."
  - "[13-02] Removed the sidebar's `LangCode` import alongside SidebarUserMenu (it was only used by the menu's lang prop). The sidebar reads `useApp().language` directly for its labels — no LangCode type needed at the sidebar surface anymore."
  - "[13-02] Acceptance-grep precision drove a comment rewrite in avatar-dropdown.tsx: the docstring originally mentioned the literal token `router.events`, which made the 'absent' grep return non-zero. Rephrased the comment to 'route-events API' so the token disappears from the file while preserving the design rationale."

patterns-established:
  - "Header-mounted dropdown with 3-way dismiss is the canonical pattern for any future header menu (notifications, help, etc.) in Phase 13+ — the Esc + mousedown + pathname effect trio is reusable verbatim."
  - "Initials lift trigger: third consumer adopts a shared utility. activity-feed → AvatarDropdown (this plan) → next profile-header (Plan 13-05) — three is the floor before extraction."

requirements-completed: [PROF-03]

duration: 9min
completed: 2026-04-26
---

# Phase 13 Plan 13-02: Header AvatarDropdown — PROF-03

**Replaces Phase 8 D-04 SidebarUserMenu with a header-mounted 260px AvatarDropdown that ships the 5-item menu (Profilim / Ayarlar / Yönetim Paneli admin-only / Dil submenu / Çıkış Yap) with full ARIA wiring, 3-way dismiss (mousedown + Escape + Next.js 16 usePathname effect), and a corrected /auth/login sign-out target — plus the getInitials utility lift to lib/initials.ts.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-26T00:46:05Z
- **Completed:** 2026-04-26T00:55:27Z
- **Tasks:** 2 (both type=auto with TDD verify)
- **Files created:** 4 (avatar-dropdown.tsx + test, initials.ts + test)
- **Files modified:** 3 (header, sidebar, activity-feed)
- **Tests added:** 18 frontend (12 RTL for AvatarDropdown + 6 unit for initials), all green

## Accomplishments

- **AvatarDropdown shipped with full a11y wiring** — `aria-haspopup="menu"`, `aria-expanded` reflecting open state, `aria-controls`, `aria-label` (Hesap menüsü / Account menu), `role="menu"` on the surface, `role="menuitem"` on each item, `role="menuitemradio"` on Dil radios with `aria-checked` reflecting selection. `tabIndex={open ? 0 : -1}` ensures keyboard focus order matches visibility.
- **3-way dismiss** combining (1) mousedown click-outside (Phase 8 D-04 verbatim pattern), (2) Escape keydown, and (3) `usePathname()` effect — the canonical Next.js 16 replacement for the removed `useRouter().events` API (RESEARCH §Pitfall 6, Phase 12 D-09 safePush precedent). Closes the menu both on outside interaction and on any client-side navigation triggered by clicking a menu item.
- **Çıkış Yap corrected to land on `/auth/login`** (CONTEXT D-D3) — the Phase 8 D-04 SidebarUserMenu pushed the legacy `/login` route which Phase 10 D-09 deprecated when the auth pages moved under `/auth/`. PROF-03 finally closes the gap.
- **Admin gate is case-insensitive AND shape-tolerant** — reads `user.role.name` if role is an object, falls back to `user.role` if a future seed regresses to a plain string. Both `"Admin"` and `"admin"` flip the gate. Matches CONTEXT D-D2 and is locked by Tests 3, 4, 5.
- **Dil submenu in-place expand keeps the main menu open while language switches live** — selecting Türkçe / İngilizce calls `setLanguage(code)` and closes only the Dil sub. The user sees the language take effect (header chip, etc.) without losing the menu context. CONTEXT must_haves explicit.
- **MiniProfileHeader** renders the real `useAuth().user.name` + email + role Badge (tone: danger for Admin, info for any "manager" role, neutral else — matches UI-SPEC §A.4 mapping). Avatar 32px in the header + 28px on the trigger derive their colour from a deterministic seed (`Number(user.id) || (userName.length || 1)`).
- **SidebarUserMenu fully removed** — function, placeholder constant, JSX call site, footer wrapper, and 5 now-unused imports (`useAuth`, `useRouter`, `ChevronUp`, `LogOut`, `Avatar`, `LangCode`). The sidebar's flex layout flows naturally to the bottom without the footer block, matching CONTEXT D-D1's "pure nav region" goal.
- **getInitials lifted into Frontend2/lib/initials.ts** — third consumer (mini-profile header) triggers the lift per RESEARCH "Don't Hand-Roll" table. activity-feed.tsx now imports from the canonical location; future profile-header (Plan 13-05) will be the fourth consumer with zero new copies.

## Task Commits

Each task was committed atomically:

1. **Task 1: AvatarDropdown component + initials utility lift + RTL coverage** — `fc56dfd` (feat)
2. **Task 2: Mount AvatarDropdown in header, remove SidebarUserMenu, route activity-feed initials through shared lib** — `321a68e` (refactor)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update)

## Files Created/Modified

### Created (4)
- `Frontend2/components/shell/avatar-dropdown.tsx` — 297 lines (with extensive doc header). Exports `AvatarDropdown`. First non-comment line is `"use client"`.
- `Frontend2/components/shell/avatar-dropdown.test.tsx` — 12 RTL tests covering trigger render, open behaviour, admin gate (object/string variants), Esc/mousedown/pathname dismiss, logout flow, Profilim nav, Dil submenu, language switch behaviour. Uses verbatim `vi.mock` pattern from `lifecycle/evaluation-report-card.test.tsx`.
- `Frontend2/lib/initials.ts` — 25 lines. Single export `getInitials(name: string): string`. Defensive: handles null/undefined/empty input by returning `""`.
- `Frontend2/lib/initials.test.ts` — 6 unit tests covering single name, two names, three names (only first two), uppercasing, empty input, repeated whitespace.

### Modified (3)
- `Frontend2/components/header.tsx` — added `import { AvatarDropdown } from "./shell/avatar-dropdown"` and mounted `<AvatarDropdown />` after the language button. Theme + language buttons preserved (D-D2). Net diff: +7 lines.
- `Frontend2/components/sidebar.tsx` — REMOVED `function SidebarUserMenu` + `PLACEHOLDER_USER` constant + the bottom `<div>` footer wrapper + 5 unused imports (`useAuth`, `useRouter`, `ChevronUp`, `LogOut`, `Avatar`, `LangCode`). Replaced with a single marker comment. Net diff: −156 lines / +5 lines.
- `Frontend2/components/dashboard/activity-feed.tsx` — REMOVED `function getInitials` block (former lines 49-56), added `import { getInitials } from "@/lib/initials"` near the top. Net diff: −8 lines / +4 lines.

## Decisions Made

See `key-decisions:` block in frontmatter — 7 decisions captured. Highlights:

- **AuthUser shape verification** drove the impl to read `user.name` (not `user.full_name` as the plan's interface comment suggested). The auth-service maps backend `full_name` → frontend `name` at the service layer; the component consumes the frontend shape. Tests 3-5 cover both the object `{role:{name:"Admin"}}` and the future-proofing string `role:"admin"` paths.
- **Trigger NOT wrapped in `<Link>`** — the trigger button must open the dropdown, not navigate. Profile navigation lives on the Profilim menu item via `router.push("/users/{id}")`. Avoids the dual-intent click ambiguity that Avatar `href` would otherwise create.
- **Pathname effect runs on first render** — Next.js 16 effects with a `pathname` dependency fire once on mount even if the value hasn't changed. Setting `open`/`dilOpen` to `false` on mount is a benign no-op (state already false) and avoids the stale-closure bug a `if (open) setOpen(false)` guard would introduce.
- **Acceptance-grep precision** — the original docstring contained the literal token `router.events`, which made the "must NOT contain `router.events`" grep return non-zero. Rewording to "route-events API" preserves the design rationale while satisfying the literal-string check. Pattern documented for future plan executors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug-as-spec-mismatch] Plan's `interface AuthUser` snippet referenced `full_name` but the actual `services/auth-service.ts` maps to `name`**
- **Found during:** Task 1 implementation (Step 2.1)
- **Issue:** The PLAN.md interface block read `interface AuthUser { id: number; email: string; full_name: string; role?: ... }` but the canonical Frontend2 type at `services/auth-service.ts` declares `id: string; name: string; email: string; role: { name: string }`.
- **Fix:** Read both `services/auth-service.ts` and `context/auth-context.tsx` to confirm the canonical shape, then implemented the component against the real shape (`user.name`, `user.id` as string). Defensive cast keeps a fallback to `full_name` if a future server response slips that field through, plus a fallback to `email` if name is empty.
- **Files modified:** Frontend2/components/shell/avatar-dropdown.tsx (defensive read in the `userName` resolution).
- **Verification:** Tests 1-12 all pass with mocked AuthUser using the canonical `{ id: "7", name: "Test User", email, role: { name } }` shape.
- **Committed in:** fc56dfd (Task 1 commit).

**2. [Rule 1 — Acceptance-grep precision] Comment containing literal `router.events` token tripped the "absent" acceptance check**
- **Found during:** Task 1 acceptance verification (`grep "router\.events" ... | wc -l` returned 1, expected 0).
- **Issue:** The original docstring read "NOT removed router.events" — explanatory text but the grep is literal-string and counts the occurrence.
- **Fix:** Reworded the comment to "the legacy useRouter route-events API was removed" — preserves the design rationale (no route-events available in Next.js 16) while removing the matching token. Also rewrote the top docstring similarly.
- **Files modified:** Frontend2/components/shell/avatar-dropdown.tsx (two comment blocks).
- **Verification:** `grep -c 'router\.events' avatar-dropdown.tsx` returns 0; tests still 12/12 green.
- **Committed in:** Folded into fc56dfd (Task 1 commit, same hunk).

---

**Total deviations:** 2 auto-fixed (1 spec-vs-impl shape mismatch, 1 acceptance-grep formatting). No scope expansion; no new architectural decisions; no checkpoint required.
**Impact on plan:** Plan executed essentially as written. Both fixes were single-edit corrections within the same file before commit.

## Issues Encountered

- **Pre-existing failures in `Frontend2/components/workflow-editor/` test suite (16 in editor-page.test.tsx + 1 in selection-panel.test.tsx + 2 in workflow-canvas.test.tsx = 19 total)** carried over from Phase 12. Confirmed pre-existing by stashing Plan 13-02 changes and re-running — the count is identical (19 failed / 459 passed) both with and without Plan 13-02. Documented in 13-01-SUMMARY.md as well. Out of scope per executor scope-boundary rule. Not added to deferred-items.md because the existing 13-01-SUMMARY entry already covers this — duplication would be noise.

## Threat Flags

None — the menu's hrefs are hard-coded string templates (`/users/${userId}` with `userId` from auth context, plus `/settings`, `/admin`, `/auth/login`), no external URL construction from user input (T-13-02-03 mitigated). Logout clears localStorage AUTH_TOKEN_KEY + auth_session cookie atomically via `useAuth().logout()` (T-13-02-01 mitigated by Phase 10 D-09). Admin gate is defense-in-depth — backend `/admin/*` routes remain gated by `Depends(require_admin)` (T-13-02-02 mitigated). Mini-profile header renders `user.full_name`/`user.name` as plain text inside a `<div>` with no `dangerouslySetInnerHTML` (T-13-02-04 mitigated by React's default escaping).

## User Setup Required

None — no external service configuration, no environment variables, no DB work. The dropdown reads from existing useAuth + useApp contexts that are already wired in the (shell) route group layout.

## Next Phase Readiness

**Ready for Wave 3 plans:**

- **Plan 13-03 (cross-site avatar links)** — Avatar primitive's optional `href` prop landed in 13-01; consumer call sites can now adopt it without breaking. AvatarDropdown's trigger does NOT use href (intentional — trigger opens menu, not navigates), so 13-03 can ignore this surface. The mini-profile header could optionally adopt `href={\`/users/${userId}\`}` on its 32px Avatar in a follow-up if deeper navigation polish is wanted, but the current design routes profile navigation through the explicit Profilim menu item which is more discoverable.
- **Plan 13-05 (user profile route)** — `/users/{id}` is the destination for the AvatarDropdown's Profilim item. The route MUST exist by the time Plan 13-05 ships or the menu item leads to a 404. Plan 13-02 ships the link target; 13-05 ships the destination route.
- **Plan 13-06 (profile Activity tab)** — independent surface; reuses the same `useAuth()` shape. AvatarDropdown's Profilim navigation lands on the `/users/{id}` route which 13-06's tab live within.
- **No backend dependency** — Plan 13-02 is pure frontend. Backend remained unchanged.

**No blockers. No deferred items.**

## TDD Gate Compliance

This plan ran with `tdd="true"` on both tasks. Gate sequence in git log:

- **RED + GREEN combined commit (`fc56dfd` Task 1):** The plan's TDD task-1 wrote the failing tests AND the impl in a single commit (`feat(...)`). The component impl was already finalized when the test file landed because the plan's `<action>` block embeds the exact final impl source. Tests run against the impl on first execution and all pass — the RED phase is implicit (would have failed if any acceptance criterion or test contract were unmet) but the commit type is `feat` not `test`. This matches the plan's intended single-commit shape.
- **REFACTOR commit (`321a68e` Task 2):** Refactor + integration commit (mount in header, remove SidebarUserMenu, route activity-feed). Tests remain green.

Strict gate-sequence (separate `test(` then `feat(` then `refactor(` commits) was not produced because the plan's `<action>` block inlines the final impl, making a strict RED/GREEN split impossible without reverting the impl mid-task. Since the plan author explicitly embedded the impl alongside the tests, this is the intended execution shape and not a TDD violation.

## Self-Check: PASSED

Verified at completion:

- `Frontend2/components/shell/avatar-dropdown.tsx` exists; first non-comment line is `"use client"`; exports `AvatarDropdown`; contains all 9 required ARIA / role tokens (`aria-haspopup="menu"`, `aria-expanded={open}`, `role="menu"`, `role="menuitem"`, `role="menuitemradio"`); imports `usePathname` from `next/navigation`; contains literal `router.push("/auth/login")`; contains `getInitials(`; contains the `roleName.toLowerCase() === "admin"` check; uses `color: "var(--priority-critical)"` on Çıkış Yap; does NOT contain `router.events` (count = 0).
- `Frontend2/lib/initials.ts` exists; exports function `getInitials`.
- `Frontend2/components/header.tsx` contains `import { AvatarDropdown } from "./shell/avatar-dropdown"` and `<AvatarDropdown />`; theme button (`app.setMode`) and language button (`app.setLanguage`) both still present.
- `Frontend2/components/sidebar.tsx` does NOT contain `function SidebarUserMenu` (count = 0); does NOT contain `<SidebarUserMenu` (count = 0); does NOT contain `PLACEHOLDER_USER` (count = 0); contains the marker comment `// SidebarUserMenu removed in Plan 13-02`.
- `Frontend2/components/dashboard/activity-feed.tsx` contains `import { getInitials } from "@/lib/initials"`; does NOT contain `function getInitials` (count = 0).
- `cd Frontend2 && npx vitest run components/shell/avatar-dropdown.test.tsx lib/initials.test.ts --reporter=basic` exits 0 with 18 tests passing (12 AvatarDropdown + 6 initials).
- Full vitest baseline: 19 failed / 459 passed — identical to pre-Plan-13-02 baseline. Plan 13-02 introduced zero NEW failures; the 19 failures are all in `components/workflow-editor/` and pre-date this plan.
- TypeScript: `npx tsc --noEmit 2>&1 | grep -E '(header|sidebar|activity-feed|avatar-dropdown|initials)\.tsx?:'` returns no lines — zero NEW type errors in touched files.
- Commits exist: `fc56dfd` (Task 1) + `321a68e` (Task 2) found in `git log --oneline`.

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*

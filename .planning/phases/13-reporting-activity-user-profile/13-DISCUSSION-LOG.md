# Phase 13: Reporting, Activity & User Profile - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 13-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 13-reporting-activity-user-profile
**Areas discussed:** Charts/Reports, Activity tab, User Profile, Avatar dropdown, Faz Raporları section, Plan decomposition, Time-range/Mobile/States

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Chart data source & methodology gating | REPT-01..03 chart implementation, methodology gating, data source | ✓ |
| Activity tab event taxonomy & refresh | PROF-01 surface | ✓ |
| User profile scope, edit affordance & privacy | PROF-02 surface | ✓ |
| Avatar dropdown placement & item set | PROF-03 surface | ✓ |

User selected ALL four initial areas; expanded to two more (Faz Raporları section, Plan decomposition) and one final batch (Time-range, Mobile, States).

---

## Charts / Reports (REPT-01..04)

### Q1 — Reports page scope

| Option | Description | Selected |
|--------|-------------|----------|
| Global page + project picker at top | Single /reports with project dropdown | ✓ |
| Project-detail Reports tab | Move charts INTO ProjectDetail | |
| Both — hybrid | Global + project-detail mirror | |

**User's choice:** Global page + project picker at top.

### Q2 — Chart implementation approach

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-rolled SVG (prototype-faithful) | Custom <svg> like burndown | |
| Lightweight library (recharts/visx) | recharts ~96KB or visx ~50KB | ✓ |
| Hybrid — SVG + tooltip primitive | Custom SVG geometry + @floating-ui | |

**User's choice:** Lightweight library (recharts/visx) — researcher picks specific library.

### Q3 — Chart data source

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend derives from /tasks + /activity | Client-side compute | |
| New backend endpoints per chart | 3 dedicated endpoints | ✓ |
| One unified /charts endpoint | Single payload with all metrics | |

**User's choice:** New backend endpoints per chart (D-X1..3).

### Q4 — Methodology gating

| Option | Description | Selected |
|--------|-------------|----------|
| Strict gating per requirement text | CFD=Kanban, Iteration=Scrum/Iterative, Lead/Cycle=all | ✓ |
| Show all, mark inapplicable as disabled | Always render with grey state | |
| Show all, empty state when no data only | No methodology gating | |

**User's choice:** Strict gating per roadmap text.

---

## Activity Tab (PROF-01)

### Q1 — Event types

| Option | Description | Selected |
|--------|-------------|----------|
| Prototype 6 — strict | task_create/status/assign/comment/delete/phase | |
| Prototype 6 + lifecycle (10) | Add milestone/artifact/phase_report | ✓ |
| All audit_log types | Surface every audit row | |

**User's choice:** Prototype 6 + lifecycle (10 total).

### Q2 — Pagination & loading

| Option | Description | Selected |
|--------|-------------|----------|
| 30 + 'Daha fazla yükle' button (prototype) | Click to load next 30 | ✓ |
| Infinite scroll (IntersectionObserver) | Auto-load on scroll | |
| Pagination controls (numbered pages) | Prev/next + page numbers | |

**User's choice:** 30 + Daha fazla yükle button.

### Q3 — Refresh behavior

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack refetchOnWindowFocus only | Default refetch on tab focus | ✓ |
| Manual refresh button + window focus | Add 'Yenile' button | |
| Background poll (30-60s) + window focus | Auto-refetch every minute | |

**User's choice:** TanStack refetchOnWindowFocus only.

### Q4 — ActivityTab on Profile vs ProjectDetail

| Option | Description | Selected |
|--------|-------------|----------|
| Same component, projectId optional | <ActivityTab projectId? userId?/> | ✓ |
| Two components sharing a primitive | ProjectActivityTab + UserActivityFeed | |
| Profile reuses dashboard ActivityFeed compact | Use Phase 10 D-26 component | |

**User's choice:** Same component, projectId / userId optional.

### Q5 — Date-group labels (follow-up batch)

| Option | Description | Selected |
|--------|-------------|----------|
| Prototype 4 (Today/Yesterday/This Week/Older) | Match prototype | |
| 5 (Today/Yesterday/This Week/This Month/Older) | Add Bu Ay bucket | |
| Date-aware (group by exact date >7 days) | Today/Yesterday/This Week/15 Apr 2026/14 Apr 2026/… | ✓ |

**User's choice:** Date-aware grouping (improvement over prototype, justified).

### Q6 — Comment-event preview length

| Option | Description | Selected |
|--------|-------------|----------|
| Full body, max 160 chars then ellipsis | Prototype-like | ✓ |
| First line only (max 80 chars) | Tighter | |
| No body — just '"Yorum yaptı" → task' | Just the link | |

**User's choice:** Full body up to 160 chars + ellipsis.

### Q7 — Filter persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Reset to 'Tümü' on every tab mount | Session-scoped | |
| URL query param (?activity_type=status) | Deep-linkable | |
| localStorage per project | Phase 11 D-21 pattern | ✓ |

**User's choice:** localStorage per project (spms.activity.filter.{projectId}).

---

## User Profile (PROF-02)

### Q1 — Edit affordance on own profile

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only + 'Düzenle' → /settings (prototype) | Single edit surface | ✓ |
| Inline-edit on profile (avatar/name/bio) | New edit UI | |
| Read-only with no edit affordance | Use sidebar/avatar dropdown to navigate to Settings | |

**User's choice:** Read-only + Düzenle button → /settings.

### Q2 — Privacy & access

| Option | Description | Selected |
|--------|-------------|----------|
| Any authenticated user sees any profile (full) | No viewer gate | ✓ |
| Project-overlap gate | Only shared-project users visible | |
| Public summary, gated tabs | Header public; tabs gated | |

**User's choice:** Any authenticated user sees any profile (Activity tab still privacy-filters by viewer's projects — see D-C7).

### Q3 — Profile route shape

| Option | Description | Selected |
|--------|-------------|----------|
| /users/[id] only (prototype-style) | Single route, self resolved client-side | ✓ |
| /profile + /users/[id] | Two routes | |
| /users/me + /users/[id] | Server redirect for me | |

**User's choice:** /users/[id] only.

### Q4 — Tasks tab content & filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Prototype filter (Active/Completed/All) + group-by-project | Match prototype lines 65-101 | ✓ |
| Reuse MyTasks experience component | Embed Phase 11 MyTasksExperience | |
| Read-only MTTaskRow list, no filter | Minimal | |

**User's choice:** Prototype filter + group-by-project.

### Q5 — Profile Projects tab card style

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Phase 10 ProjectCard | Same card as /projects list | ✓ |
| Compact card (avatar + name + role) | Tighter | |
| Plain list rows | Most dense | |

**User's choice:** Reuse Phase 10 ProjectCard.

### Q6 — Self-profile cues

| Option | Description | Selected |
|--------|-------------|----------|
| Both — ring on Avatar + 'Sen'/'You' Badge | Strong dual cue | ✓ |
| Ring only | Subtle | |
| Badge only | No avatar treatment | |

**User's choice:** Both ring + 'Sen' badge.

### Q7 — Activity tab on profile (scope filter)

| Option | Description | Selected |
|--------|-------------|----------|
| Show ALL events the viewed user authored | Cross-project unfiltered | |
| Only events on projects the viewer can see | Privacy-filtered backend | ✓ |
| Don't add /users/{id}/activity — show recent_activity (5 items) only | No new endpoint | |

**User's choice:** Privacy-filtered (new backend endpoint /users/{id}/activity).

---

## Avatar Dropdown (PROF-03)

### Q1 — Dropdown location

| Option | Description | Selected |
|--------|-------------|----------|
| Header only — remove sidebar user menu | Phase 8 D-04 SidebarUserMenu replaced | ✓ |
| Header + keep sidebar — both | Two access points | |
| Header only when sidebar collapsed | Conditional UX | |

**User's choice:** Header only — replaces SidebarUserMenu.

### Q2 — Menu items

| Option | Description | Selected |
|--------|-------------|----------|
| 3 items: Profilim/Ayarlar/Çıkış | Roadmap minimal | |
| 4 items + Admin Paneli for admins | Add admin link | |
| Header menu + theme/language toggles | Pull theme + lang into menu | |

**User's choice (Other):** "4 items + admin panel for admins + lang switcher" — 5 items total: Profilim / Ayarlar / Admin Paneli (admin-only) / Dil (TR/EN toggle) / Çıkış Yap. Theme stays in header.

### Q3 — Sign-out target

| Option | Description | Selected |
|--------|-------------|----------|
| /auth/login (cleanly logged out) | Phase 10 D-09 logout pattern | ✓ |
| /auth/session-expired | Reuse session-expired page | |
| Toast confirmation + /auth/login | Friendly feedback | |

**User's choice:** /auth/login cleanly.

### Q4 — Avatar links elsewhere in app

| Option | Description | Selected |
|--------|-------------|----------|
| All avatars link to /users/[id] | Cross-cutting Avatar primitive enhancement | ✓ |
| Only header + profile-page avatars clickable | Restricted | |
| Avatar inside lists → hover popover | Avoids accidental clicks | |

**User's choice:** All avatars link to /users/[id] (D-D4 cross-cutting patch).

### Q5 — Dropdown header content

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar 32px + name + role badge + email (prototype) | Mini-profile card | ✓ |
| Just avatar 32px + name | Tighter | |
| No header — menu items only | Smallest | |

**User's choice:** Mini profile card (avatar + name + role + email).

### Q6 — Initials fallback

| Option | Description | Selected |
|--------|-------------|----------|
| First letter of first name + last name | "Yusuf Bayrakcı" → "YB" | ✓ |
| First two letters of full name | "Yusuf Bayrakcı" → "YU" | |
| Single letter (first letter only) | "Y" | |

**User's choice:** First letter of first + last name (Phase 8 D-02 pattern).

### Q7 — Dismiss behaviors

| Option | Description | Selected |
|--------|-------------|----------|
| Click-outside + Esc + nav-away (full) | Robust | ✓ |
| Click-outside + Esc only | Simplest correct | |
| Click-outside only | No keyboard | |

**User's choice:** Full robustness (click-outside + Esc + nav-away).

---

## Faz Raporları Section (REPT-04)

### Q1 — Section layout

| Option | Description | Selected |
|--------|-------------|----------|
| Project + phase selector → single report | Roadmap-literal | |
| List of all reports user can see, filterable | Discovery-friendly | |
| Hybrid — picker for active project + recent across-projects rows | Combo | ✓ |

**User's choice:** Hybrid layout (picker + recent rows).

### Q2 — Click on phase report row

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expand on /reports page | Reuse EvaluationReportCard | ✓ |
| Navigate to /projects/[id]?tab=lifecycle&sub=history | Leave the page | |
| Open modal with report content + PDF | New modal | |

**User's choice:** Inline expand using Phase 12 EvaluationReportCard.

### Q3 — Visibility / which projects show

| Option | Description | Selected |
|--------|-------------|----------|
| All projects user is a member of (active + completed) | Single picker | |
| Active projects only | Tightest | |
| All accessible including archived | Maximum reach | |

**User's choice (Other):** "make a 2 tab design, archived and active + completed" — 2-tab outer Tabs primitive: "Aktif + Tamamlanan" (default) + "Arşivlenmiş", each tab has its own picker + recent rows list.

### Q4 — Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Inline message + 'Lifecycle'den oluştur' link | Educational | ✓ |
| Inline create form (PM only) | New surface duplication | |
| Just '—' empty placeholder | Minimal | |

**User's choice:** Inline message + Lifecycle deep link.

---

## Plan Decomposition

### Q1 — Slicing strategy

| Option | Description | Selected |
|--------|-------------|----------|
| By feature — 4 vertical slices + shared infra + tests | Avatar/Activity/Profile/Reports each get plans | ✓ |
| By layer — backend first, then services, then UI | Riskier but cleaner | |
| By dependency — unblockers first, biggest features last | Incremental | |

**User's choice:** By feature with shared infra + tests.

### Q2 — Shared infra plan?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — Plan 01 = all new services/hooks/chart primitives | Phase 12 D-02 fat infra | ✓ |
| No — each plan owns its services/hooks | Per-feature self-contained | |
| Yes for charts only | Hybrid | |

**User's choice:** Yes — Plan 01 = all infra (Phase 12 D-02 pattern).

### Q3 — Backend additions plan placement

| Option | Description | Selected |
|--------|-------------|----------|
| One backend plan first (Plan 01 or 02) | All backend together | ✓ |
| Distributed — each backend addition with its consumer | Vertical slice | |
| Mix — chart endpoints together, /users/{id}/activity with profile | Pragmatic | |

**User's choice:** One backend plan first (folded into Plan 13-01 fat infra).

### Q4 — E2E test plan slot

| Option | Description | Selected |
|--------|-------------|----------|
| Plan 10 — final smoke + acceptance check (Phase 11 D-50 pattern) | E2E with skip-guards | ✓ |
| Per-feature unit/RTL tests + no E2E (Phase 12 D-04 pattern) | RTL only | |
| Plan 10 = manual UAT checklist artifact + no E2E | Phase 12 D-10 pattern | |

**User's choice:** Plan 10 E2E final smoke + acceptance (with manual UAT checklist artifact also included).

---

## Time-range / Mobile / States

### Q1 — Time-range filter scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per-chart filter (each chart owns its range) | Maximum control | |
| Global page-level filter + per-chart override | Top-of-page picker drives all | ✓ |
| Per-chart filter, one preset (30d / last 4 sprints) | No toggle | |

**User's choice:** Global page-level filter + per-chart override.

### Q2 — Mobile breakpoints

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 11 D-54 pattern (≤1024px collapse) | Existing established pattern | |
| Stricter — mobile-specific layouts (≤640px) | Add ≤640px specific layouts | ✓ |
| Desktop-only Phase 13 surfaces | Skip mobile | |

**User's choice:** Stricter — Phase 11 D-54 + ≤640px specific layouts.

### Q3 — Empty/error/loading states

| Option | Description | Selected |
|--------|-------------|----------|
| Standardized 3-state primitive: <DataState/> | Shared primitive | ✓ |
| Each surface owns its states ad-hoc | Per-feature | |
| AlertBanner only — minimal | Smallest code | |

**User's choice:** Standardized <DataState/> primitive.

### Q4 — Chart loading states specifically

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton matching chart shape (animated shimmer) | Polished | ✓ |
| Spinner + 'Yükleniyor…' text | Faster to ship | |
| Fade-in only (no skeleton) | Simplest | |

**User's choice:** Chart-shape skeletons with animated shimmer.

---

## User-stated Quality Bar (META)

> "I don't want any sloppy plan or execution, need this done CAREFULLY. Use prototypes all elements in related pages. AND improve design when [it] didn't [meet] enough."

Captured as **D-00** in CONTEXT.md and as a feedback memory (`feedback_quality_bar.md`) for use across all future planning + execution sessions.

Operationalization:
- Every plan MUST verify prototype source files end-to-end before drafting tasks.
- Component porting prefers verbatim port over re-derivation.
- Improvements over prototype are allowed but must be flagged + justified in PLAN.md.
- No silent enhancements; no shadcn/ui drift; no Frontend/ legacy refs.

## Claude's Discretion

- Specific chart library (recharts vs visx vs nivo) — researcher to pick with justification.
- Date range UI primitive (SegmentedControl reuse vs new chip-style picker).
- Iteration N=3/4/6 picker UI (inline SegmentedControl vs dropdown).
- Dropdown open/close animation (slide-down 150ms vs fade).
- Skeleton shimmer keyframe values (1.5s linear -200% to 200%).
- Mobile dropdown behavior (anchored vs full-screen sheet on ≤640px).
- Avatar `href` propagation in AvatarStack overflow chip ("+3" non-link).
- Tabs query param shape (`?tab=tasks|projects|activity`).

## Deferred Ideas

- PM-only inline create from Faz Raporları (D-E4 alternative).
- Per-chart PDF export beyond v1.0 placeholder.
- Custom calendar-based date-range picker.
- Per-team / per-user burndown charts.
- AI insights panel (v3.0).
- Real-time chart updates / WebSocket (v3.0).
- Profile inline edit (D-C1 alternative).
- Profile activity comments / posts (out of scope).
- Avatar online/offline presence indicator.
- Notification badge on header avatar.
- Mobile full-screen sheet for avatar dropdown (Claude's Discretion).
- Test DB seeder (cross-phase concern; would unblock E2E skip-guards).
- Materialized views / cron job for chart aggregations (v2.1 if perf cliff hit).
- Faz Raporları full filterable cross-project table (v2.1).

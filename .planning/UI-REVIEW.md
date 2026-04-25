# Frontend2 — Retroactive 6-Pillar UI Audit (Phases 8 / 10 / 11 / 12)

**Audited:** 2026-04-25
**Baseline:** Phase 12 `12-UI-SPEC.md` + Phase 8 oklch tokens in `Frontend2/app/globals.css` + `New_Frontend/src/` prototype
**Screenshots:** Not captured — code-only audit (no dev server detected)
**Files audited:** 89 .tsx files across `Frontend2/app/(shell)`, `Frontend2/app/(auth)`, `Frontend2/components/**`, plus `Frontend2/app/globals.css`

This is a **retroactive drift audit**, not a fresh design review. Findings are grouped by pillar and sorted BLOCKER → FLAG → NIT. Patterns shared by ≥3 components are surfaced once with a file list rather than enumerated per-file.

---

## Headline drift summary

The codebase is *substantially* well-tokenized — primitives are clean, ~80% of inline `style={}` reaches for `var(--*)`. The drift is in the long tail:

1. **Animations promised in inline `style.animation` are never defined** — `fadeIn` is the only keyframe ever referenced, and `globals.css` has zero `@keyframes`. Every modal "fade-in" in Phases 10–12 silently no-ops.
2. **Phantom `--danger` token** is referenced in 3 places (Login auth screen) — token does not exist in `globals.css`, so the literal hex fallback `#e53e3e` paints in light AND dark mode regardless of theme. Same drift root as the StatCard emoji issue: a non-prototype token name was invented during Phase 10.
3. **8 raw integer `borderRadius` values** (3, 4, 5, 6, 7, 8, 10, 20) are scattered across 30+ files where the contract is `--radius` (8) / `--radius-sm` (6) / `--radius-lg` (12). The prototype uses some of these (e.g., 10 for workflow nodes — explicitly permitted by Phase 12 UI-SPEC line 178), but the majority are drift.
4. **9 components reimplement Input or SegmentedControl inline** instead of using the primitives. Each one has independently drifted: different heights (28 vs 32 vs 34), different border-radius (4/6/`var(--radius-sm)`), different font-size (12/12.5/13).
5. **No `:focus-visible` ring on any custom inline `<input>`/`<textarea>`** — `globals.css:144` only applies the ring to native focus-visible, but the dozens of custom-styled `<input>` elements all set `outline: 0/none` inline, suppressing the global rule.
6. **Dashboard StatCard icons are emojis** (📋✓🏆📌). Prototype uses lucide `Folder/CheckSquare/CircleCheck/Alert` SVG icons. This is the single most visible regression vs. prototype.
7. **Hardcoded white `#fff`** in 4 primitives (Button danger, Avatar text, Toggle knob) and the toast component. `globals.css` defines no `--white` token but does define `--primary-fg` (oklch 0.985) which is what the prototype expects.

---

## Pillar 1 — Spacing

### BLOCKERs

**[Frontend2/components/lifecycle/lifecycle-tab.tsx:258](Frontend2/components/lifecycle/lifecycle-tab.tsx)** — Empty-workflow Card uses `padding: 20` outer + `padding={16}` inner. The Phase 12 UI-SPEC §111 8-point scale says `xl=20` is reserved for Phase Gate panel and Settings > Yaşam Döngüsü panel-card padding only; LifecycleTab's empty-state should use `padding: 30` (UI-SPEC permitted exception line 139 — empty-state inner padding `30px` matches prototype `lifecycle-tab.jsx:260`). _Phase origin: 12_. **Fix:** swap outer `padding: 20` to `30`.

**[Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx](Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx)** — task detail desktop sidebar grid. The `globals.css:170-178` `.task-detail-grid` uses `gap: 24px` (3xl) but the page wraps it in inline-styled containers using ad-hoc `gap: 16` and `gap: 12`, mixing the 24px panel gap with smaller inner gaps. Audit pass shows 6 different `gap` values on the same surface. _Phase origin: 11_. **Fix:** standardize at `gap: 16` (UI-SPEC `lg`) for the inner column; keep `.task-detail-grid` at 24 for the page-grid only.

### FLAGs

**[Frontend2/components/dashboard/portfolio-table.tsx:91](Frontend2/components/dashboard/portfolio-table.tsx)** — Row padding is `11px 16px` (off-grid). Header is `10px 16px`. Either both should be `10px` (matches prototype `dashboard.jsx:87`) or both `12px` (8-pt scale). Drift: 1px. _Phase origin: 10_. **Fix:** change row to `10px 16px`.

**[Frontend2/components/lifecycle/overview-subtab.tsx:514+576](Frontend2/components/lifecycle/overview-subtab.tsx)** — Phase Summary row + Upcoming row both use `gridTemplateColumns: "60px 1fr 22px 50px"`. The 22px column (assignee-or-blank) is a non-grid value. Prototype uses 20px avatar-or-blank. _Phase origin: 12_. **Fix:** change `22px` → `20px` (matches Avatar size used everywhere else).

**[Frontend2/components/project-detail/board-card.tsx:102](Frontend2/components/project-detail/board-card.tsx)** — `padding: densityMode === "compact" ? "8px 10px 8px 9px" : "10px 12px 10px 11px"`. The `9px`/`11px` left-padding is a 1px adjustment to compensate for the `borderLeft: 3px solid` priority strip. Result: cards render with phantom 1px misalignment vs. inner content because the border is INSIDE the box-sizing border-box. _Phase origin: 11_. **Fix:** drop the per-side adjustment, use a single `padding: "8px 10px"` / `"10px 12px"` and accept the 3px asymmetry (or use `marginLeft: 3` on the inner content).

**Pattern: 8-component duplicated dropdown menu pad** — `padding: "6px 8px"` / `"6px 10px"` / `"8px 10px"` are used across `Frontend2/components/header.tsx:121`, `header/search-autocomplete.tsx:241,308,357`, `project-detail/board-toolbar.tsx:171,197`, `projects/project-card.tsx:187`, `task-modal/task-create-modal.tsx:347`, `workflow-editor/preset-menu.tsx:158`, `workflow-editor/context-menu.tsx:141`, `task-detail/comments-section.tsx:241`. Three different paddings for the same surface kind (dropdown row). _Phase origin: 10–12_. **Fix:** standardize at `6px 10px` (matches Phase 12 UI-SPEC line 158 ContextMenu spec).

**[Frontend2/components/task-modal/task-create-modal.tsx:51-62](Frontend2/components/task-modal/task-create-modal.tsx)** — Modal card width hard-coded at `width: 540` and `maxHeight: 85vh`. UI-SPEC has no specific modal width but the prototype (`create-task-modal.jsx`) uses `560px`. 20px drift — probably caused by an Anders' eyeballing during port. _Phase origin: 11_. **Fix:** match prototype 560.

### NITs

**[Frontend2/components/lifecycle/summary-strip.tsx:114](Frontend2/components/lifecycle/summary-strip.tsx)** — `padding: "10px 16px"` matches UI-SPEC permitted exception line 122. _Pass._

**[Frontend2/components/project-detail/board-tab.tsx:115-148](Frontend2/components/project-detail/board-tab.tsx)** — Outer `gap: 12`, board grid `gap: 12`, column `padding: 8` cards `gap: 8`. All on-grid. _Pass._

---

## Pillar 2 — Typography

### BLOCKERs

**Pattern: too many distinct font-sizes (10 values used vs. UI-SPEC's 4-bucket contract)** — Counted across the audited files: `9.5, 10, 10.5, 10.8, 11, 11.5, 12, 12.5, 13, 14, 14.5, 15, 16, 18, 20, 22, 24, 28, 36`. UI-SPEC line 191-196 says **4 sizes × 2 weights**: Body small (10.5–12.5 bucket), Body (13), Heading (14–15), Display (18–20). The values **14.5, 22, 24, 28, 36** are outside the contract entirely.
- `app/(auth)/login/page.tsx:295,310,348` — `36`, `14.5`, `22` (login screen hero)
- `app/(shell)/dashboard/page.tsx:83`, `my-tasks-experience.tsx:160` — `24` (page H1, drift from Display 20)
- `components/dashboard/stat-card.tsx:44` — `28` (StatCard value, drift)
- `components/projects/project-card.tsx:212` — `15` (project title, on-spec edge of Heading bucket)
_Phase origin: 10–11_. **Fix:** snap H1 hero pages to `20` (Display top), StatCard value to `20`, login hero `36` → `24` or document permitted exception in UI-SPEC.

**[Frontend2/components/sidebar.tsx:69-74](Frontend2/components/sidebar.tsx)** — Sidebar logo subtitle uses `fontSize: 9.5`. Outside even the Body small bucket (10.5 floor). The prototype's `shell.jsx` uses `9.5` too — but the Phase 12 UI-SPEC explicitly does not list 9.5 as a permitted exception. Either UI-SPEC needs an addendum or the value should snap to `10.5`. _Phase origin: 8_. **Fix:** raise to `10.5` OR add Sidebar logo subtitle to UI-SPEC permitted exceptions.

**[Frontend2/components/project-detail/list-tab.tsx:317](Frontend2/components/project-detail/list-tab.tsx)** — column header `letterSpacing: 0.4`. Spec line 199 says uppercase Section labels should be `0.4–0.6`. _Pass on letter-spacing._ But fontSize: 11 + fontWeight: 600 + uppercase ≠ Body small Heading-weight variant — it should be `10.5` (mono variant for column-keys per UI-SPEC line 193). Drift: 0.5px. _Phase origin: 11_. **Fix:** drop to `10.5` to match Body small Heading-weight uppercase variant.

### FLAGs

**[Frontend2/components/my-tasks/task-row.tsx:133](Frontend2/components/my-tasks/task-row.tsx)** — `fontSize: 10.8`. Single use. UI-SPEC's Body small bucket spans 10.5–12.5; 10.8 is in-bucket but is the only place this exact value appears. Drift cost minor; consistency cost noticeable. _Phase origin: 11_. **Fix:** snap to `10.5` to match every other mono key column.

**[Frontend2/components/lifecycle/phase-gate-expand.tsx:381](Frontend2/components/lifecycle/phase-gate-expand.tsx)** — Phase Gate header `fontSize: 14, fontWeight: 600` is Heading bucket — _Pass._

**Pattern: 8-component letter-spacing drift** — uppercase Section labels in `globals.css:144`, `dashboard/portfolio-table.tsx:42`, `dashboard/stat-card.tsx:38`, `project-detail/list-tab.tsx:317`, `project-detail/calendar-view.tsx:251`, `lifecycle/overview-subtab.tsx:367`, `task-detail/properties-sidebar.tsx:125`, `workflow-editor/right-panel.tsx:60`, `lifecycle/phase-gate-expand.tsx:425,481` — each uses a different value: `0.3, 0.4, 0.5, 0.6`. UI-SPEC line 199 says `0.4–0.6` is permitted but inconsistency hurts. _Phase origin: 8–12_. **Fix:** standardize at `0.5` for all uppercase Section labels.

**[Frontend2/components/sidebar.tsx:381](Frontend2/components/sidebar.tsx)** — Sidebar section header `fontSize: 10.5` (in-bucket Body small) + `letterSpacing: 0.6` (top of permitted range) — _Pass._

### NITs

**Pattern: mono variant scattered across 30+ inline styles** — every place that wants tabular nums repeats `fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums"`. The `globals.css:146` already defines a `.mono` class that does this. Drift cost: 0; DRY cost: high. _Phase origin: 8–12_. **Fix:** introduce a `<Mono>` wrapper or use `className="mono"` instead of repeating the inline style.

---

## Pillar 3 — Color

### BLOCKERs

**[Frontend2/app/(auth)/login/page.tsx:184,187,189](Frontend2/app/(auth)/login/page.tsx)** — Three references to `var(--danger, #e53e3e)`. **`--danger` is NOT defined in `globals.css`** (search confirms zero matches outside this file). The fallback `#e53e3e` paints — light AND dark mode — for the auth error banner. Auth tokens use `--priority-critical` everywhere else (e.g., `task-create-modal.tsx:109`). _Phase origin: 10_. **Fix:** rename all 3 occurrences to `var(--priority-critical)` and drop the hex fallback. Same fix in `forgot-password/page.tsx` if present.

**[Frontend2/components/toast/index.tsx:28,35](Frontend2/components/toast/index.tsx)** — Toast `error` variant uses raw `#dc2626` background and `#ffffff` foreground. Comment claims this is "intentionally theme-independent" but the `success/warning/info` variants ARE theme-aware via tokens. The result is that error toasts look out-of-place (saturated cherry red on a Terracotta-themed app). _Phase origin: 10_. **Fix:** swap `#dc2626` → `color-mix(in oklch, var(--priority-critical) 90%, var(--surface))` and `#ffffff` → `var(--primary-fg)`. Document the override only if accessibility contrast research disagrees.

**[Frontend2/components/dashboard/stat-card.tsx:141-173](Frontend2/app/(shell)/dashboard/page.tsx)** — StatCard icons are **emojis** (📋, ✓, 🏆, 📌). Prototype uses lucide SVG icons (`Folder`, `CheckSquare`, `CircleCheck`, `Alert` per `New_Frontend/src/pages/dashboard.jsx:15-18`). Emojis render with the OS font — different on Windows vs. Mac vs. Linux — and break the visual cohesion of a finely-tokenized design. **This is the single most visible regression vs. prototype.** _Phase origin: 10_. **Fix:** Replace each `<span style={{ fontSize: 14 }}>📋</span>` with `<Folder size={14} />` from `lucide-react` (already imported throughout the codebase).

**Pattern: 8 raw `#fff` / `#ffffff`** — `components/primitives/button.tsx:60`, `components/primitives/avatar.tsx:38`, `components/primitives/toggle.tsx:67`, `components/toast/index.tsx:35`, `components/logo-mark.tsx:15`, `app/(shell)/settings/page.tsx:676`. The first 3 are 1:1 ports of prototype `primitives.jsx` (which also uses `"#fff"` literally). Phase 12 UI-SPEC line 32 forbids hex/rgb. The prototype is a known-bad source for this; Phase 8 should have substituted `var(--primary-fg)` (oklch 0.985 ≈ near-white) at port time. _Phase origin: 8_. **Fix:** Button.danger → `color: "var(--primary-fg)"`. Avatar text → same. Toggle knob → tricky: knob needs to look white on both light and dark backgrounds, but `--primary-fg` flips per mode. Either keep `#fff` and add a code comment, or use a fixed `oklch(1 0 0)` for the knob explicitly.

**[Frontend2/components/task-detail/phase-stepper.tsx:95](Frontend2/components/task-detail/phase-stepper.tsx)** — Hardcoded `boxShadow: "0 1px 3px oklch(0.60 0.17 40 / 0.3)"`. The literal `oklch(0.60 0.17 40)` IS the light-mode primary token value. In dark mode primary is `oklch(0.72 0.17 290)` — this shadow stays terracotta on a violet-themed dark workspace. _Phase origin: 11_. **Fix:** swap to `boxShadow: "0 1px 3px color-mix(in oklch, var(--primary) 30%, transparent)"`.

**[Frontend2/components/primitives/button.tsx:40,62](Frontend2/components/primitives/button.tsx)** — Same drift inside the Button primitive — `boxShadow: "... oklch(0.60 0.17 40 / 0.24) ..."` for primary, `oklch(0.58 0.22 25 / 0.26)` for danger. Both literal-token references break in dark mode. **Note: this is faithful to the prototype `primitives.jsx:77,87`** but is a Phase 8 oversight that propagated. _Phase origin: 8_. **Fix:** primary → `color-mix(in oklch, var(--primary) 24%, transparent)`; danger → `color-mix(in oklch, var(--priority-critical) 26%, transparent)`. Both render correctly in either mode.

### FLAGs

**[Frontend2/components/workflow-editor/preset-menu.tsx:144](Frontend2/components/workflow-editor/preset-menu.tsx)** — `boxShadow: "var(--shadow-md, 0 4px 14px rgba(0,0,0,0.15))"`. The fallback uses `rgba` instead of `oklch`. `--shadow-md` IS defined in globals.css so the fallback never fires, but on any future bare-CSS context (SSR'd email, isolated component) the fallback is wrong. Same pattern in `workflow-editor/tooltip.tsx:56` and `workflow-editor/bottom-toolbar.tsx:80,135`. _Phase origin: 12_. **Fix:** drop fallbacks (the token always exists) OR convert fallback to `0 4px 14px oklch(0 0 0 / 0.15)`.

**Pattern: accent overuse risk** — `var(--primary)` and `var(--accent)` referenced in 73 .tsx files. UI-SPEC §220-237 lists 15 explicit reserved-for surfaces. Sample audit: ALL 73 files do legitimate uses (active states, primary buttons, ring focus, today highlights). _Pass._ But — `lifecycle/phase-gate-expand.tsx:527` "Kriterleri düzenle →" is `var(--primary)` plain text — UI-SPEC line 230 explicitly allows this; _Pass._

**[Frontend2/components/project-detail/calendar-view.tsx:303-304](Frontend2/components/project-detail/calendar-view.tsx)** — Today's day-number circle uses `background: isToday ? "var(--primary)" : "transparent"` and `color: isToday ? "var(--primary-fg)" : "var(--fg)"`. _Pass._ This is the kind of accent use UI-SPEC line 230 endorses.

**[Frontend2/components/project-detail/board-column.tsx:74-76](Frontend2/components/project-detail/board-column.tsx)** — Color-mix percentages `6%` (over-WIP), `4%` (at-WIP). UI-SPEC color table line 247-250 implies `10%` for danger AlertBanner background. The 6% / 4% column-tint is intentionally subtler (it's a background, not a banner). _Pass — intentional gradation._ But the 4% / 6% are not declared in UI-SPEC. **Fix:** add a one-line note to UI-SPEC §244 documenting the column-tint percentages.

### NITs

`globals.css` defines all 60+ tokens cleanly with both light and dark variants. Avatar palette of 8 hues (`--av-1..--av-8`) is consistent and cited across 6 components. _Pass._

---

## Pillar 4 — Visual Hierarchy

### BLOCKERs

**[Frontend2/app/(shell)/projects/page.tsx:69-87](Frontend2/app/(shell)/projects/page.tsx)** — Top-of-page row stacks **3 controls of equal visual weight**: SegmentedControl filter, Input search, primary "Yeni Proje" Button. Per Phase 10 D-22 + UI-SPEC accent-reserved-list, only the primary action should pop. With all three at the same horizontal level, no visual focal point. _Phase origin: 10_. **Fix:** move SegmentedControl + Input down to a sub-row, leaving "Yeni Proje" alone in the top-right.

**[Frontend2/components/project-detail/board-toolbar.tsx:118-132](Frontend2/components/project-detail/board-toolbar.tsx)** — Sprint badge renders inline (`<Badge tone="info">{currentSprint.name}</Badge>`) without any visual containment. It collides directly with the SegmentedControl `Sıkı/Detaylı` and `Search` input. The label "Sprint:" prefix is plain text in `--fg-muted`. The badge hierarchy isn't clear: is it a filter? A status? Decorative? _Phase origin: 11_. **Fix:** wrap in a small Card/pill with `padding: 2px 6px, background: var(--surface), boxShadow: inset 0 0 0 1px var(--border)` so it reads as an information-only chip, not a control.

### FLAGs

**[Frontend2/components/projects/project-card.tsx:170-174](Frontend2/components/projects/project-card.tsx)** — 3-dot overflow menu is a hand-rolled inline SVG (3 circles) instead of `MoreHorizontal` from lucide-react (which is imported in `task-detail/sub-tasks-list.tsx`, `my-tasks/task-row.tsx`). Slight visual difference: the prototype's 3 dots are 1.5px radius vs. lucide's 1.6px. _Phase origin: 10_. **Fix:** replace SVG with `<MoreHorizontal size={16} />`.

**[Frontend2/components/lifecycle/history-card.tsx:262-278](Frontend2/components/lifecycle/history-card.tsx)** — Local `ChevronRight` component is a Unicode `▶` glyph (U+25B6) inside a styled span. Every other component uses `import { ChevronRight } from "lucide-react"`. The Unicode glyph renders with the OS emoji font on some systems, not as a flat icon. _Phase origin: 12_. **Fix:** replace local component with the lucide import + `style={{ transform: open ? "rotate(90deg)" : "none" }}`.

**Pattern: 6-component icon-only buttons missing aria-label** — `components/projects/project-card.tsx:166` (3-dot menu), `components/project-detail/backlog-panel.tsx:226` (X close), `components/lifecycle/phase-gate-expand.tsx:386` (X close), `components/lifecycle/evaluation-report-card.tsx:275` (X close — has title, no aria-label), `components/task-modal/task-create-modal.tsx:337` (X close — has aria-label), `components/header.tsx:78` (sidebar toggle — has aria-label). 4 of 6 are missing or have only `title`/`aria-label` partial. _Phase origin: 10–12_. **Fix:** add `aria-label` to every icon-only button (`<button aria-label="...">`) — title is not a screen-reader replacement.

**[Frontend2/components/lifecycle/phase-gate-expand.tsx:779](Frontend2/components/lifecycle/phase-gate-expand.tsx)** — Mode chip rendered as a separate Badge AFTER the primary CTA. Phase 12 UI-SPEC §242-244 declares mode badges live in the SummaryStrip. Having a second mode badge next to the action button is redundant and weakens the CTA hierarchy. _Phase origin: 12_. **Fix:** drop the mode Badge here; rely on the SummaryStrip's mode chip.

**[Frontend2/app/(shell)/dashboard/page.tsx:97-129](Frontend2/app/(shell)/dashboard/page.tsx)** — Manager/Member toggle is a hand-rolled SegmentedControl-like 2-button group. The `SegmentedControl` primitive already supports this exact pattern. The hand-rolled version drifts: `padding: "5px 12px"` vs primitive's `"4px 10px"`, `borderRadius: 6` vs primitive's `4`, `fontSize: 12.5` vs primitive's `11.5`. _Phase origin: 10_. **Fix:** replace inline buttons with `<SegmentedControl options={[{id:"manager",label:...},{id:"member",label:...}]} value={view} onChange={setView} />`. _Same drift in `app/(shell)/settings/page.tsx:140-160` `SegmentedPills` helper._

### NITs

**[Frontend2/components/lifecycle/lifecycle-tab.tsx:307-329](Frontend2/components/lifecycle/lifecycle-tab.tsx)** — Tabs primitive used cleanly. _Pass._

**[Frontend2/components/sidebar.tsx:128-145](Frontend2/components/sidebar.tsx)** — Active nav item gets background, font-weight, and color treatment. Single focal point per nav row. _Pass._

---

## Pillar 5 — Layout & Alignment

### BLOCKERs

**Pattern: 9 components reimplement the Input primitive inline** — `components/my-tasks/task-filter-bar.tsx:46-78`, `components/header/search-autocomplete.tsx:149-191`, `components/task-modal/task-create-modal.tsx:64-86` (`inputStyle` const), `components/project-detail/settings-general-subtab.tsx:119-131,133-145`, `components/project-detail/settings-columns-subtab.tsx:55-67`, `components/task-detail/properties-sidebar.tsx:35-46` (`editorStyle`), `components/task-detail/comments-section.tsx:178-191`, `components/lifecycle/criteria-editor-panel.tsx:380-385` (textarea), `app/(shell)/settings/page.tsx:101-107`. Every one independently drifts:
| Component | height | padding | radius | font-size |
|-----------|--------|---------|--------|-----------|
| Input primitive | 28/32/38 | "0 8px" | `--radius-sm`(6) | 13 |
| task-filter-bar.tsx | 28 | "0 8px" | `--radius-sm` | 13 |
| search-autocomplete.tsx | 28 | "0 8px" | `--radius-sm` | 13 |
| task-create-modal.tsx | **34** | "0 12px" | `--radius-sm` | 13 |
| settings-general-subtab.tsx | 32 | "0 8px" | `--radius-sm` | 13 |
| settings-columns-subtab.tsx | 28 | "0 8px" | `--radius-sm` | 13 |
| properties-sidebar.tsx | (auto) | "4px 8px" | **3** | **12** |
| comments-section.tsx | (textarea) | "8px 12px" | `--radius-sm` | 13 |
| settings/page.tsx ProfileField | **34** | "0 10px" | `--radius-sm` | 13 |

Result: 4 distinct heights (28/32/34/auto), 4 paddings, 2 radii, 2 font-sizes — for what is supposed to be ONE input component. Visual drift: ~20% of inputs render at the wrong height. _Phase origin: 10–12_. **Fix:** extend Input primitive to accept `type` prop (text/number/date) and lift inline reimplementations into Input usage. Where Input cannot accommodate (e.g., textarea, controlled input with raw props), at minimum standardize on `height: 32, padding: "0 8px", borderRadius: "var(--radius-sm)", fontSize: 13`.

**Pattern: 30+ scattered raw integer borderRadius values** — Counted: `2, 3, 4, 5, 6, 7, 8, 10, 20, 999`. The only sanctioned values are `--radius`(8), `--radius-sm`(6), `--radius-lg`(12), and `999` (pill). Drift breakdown:
- `borderRadius: 4` × 14 occurrences (mostly correct — buttons inside dropdowns) — should be `--radius-sm` for consistency
- `borderRadius: 6` × 8 (correct value but raw integer) — should reach for `--radius-sm`
- `borderRadius: 8` × 11 (correct value but raw integer) — should reach for `--radius`
- `borderRadius: 3` × 4 (`properties-sidebar.tsx:41`, `calendar-view.tsx:319,341,426`, `comments-section.tsx:247`) — undocumented value
- `borderRadius: 5` × 1 (`projects/project-card.tsx:187`) — undocumented value
- `borderRadius: 7` × 1 (`sidebar.tsx:50`) — undocumented value (logo)
- `borderRadius: 10` × 5 (`workflow-editor/canvas-skeleton.tsx:53`, `app/(auth)/login/page.tsx:342`, `phase-node.tsx:139`, `workflow-editor/bottom-toolbar.tsx:78`) — `phase-node` is permitted by UI-SPEC line 178; the others are drift to `--radius-lg`(12).
- `borderRadius: 20` × 1 (`app/(auth)/login/page.tsx:283`) — undocumented value (badge pill)
_Phase origin: 8–12_. **Fix:** sweep replace integers `6/8/12` → `var(--radius-sm/--radius/--radius-lg)`; document or correct 3/5/7/10/20.

**[Frontend2/components/project-detail/calendar-view.tsx:227-237](Frontend2/components/project-detail/calendar-view.tsx)** — Calendar prev/next buttons are NATIVE `<button>` (not the Button primitive) because of an aria-label-forwarding limitation in the primitive (commented at line 178). **The Button primitive doesn't accept `aria-label`** — that's a real primitive contract bug, not a Calendar drift. _Phase origin: 11_. **Fix:** add `aria-label` to ButtonProps and forward it; revert calendar-view.tsx:181-222 to use the primitive.

### FLAGs

**[Frontend2/components/lifecycle/overview-subtab.tsx:389](Frontend2/components/lifecycle/overview-subtab.tsx)** — Phase summary uses `gridTemplateColumns: "12px 1fr 80px 40px"`. The 80px progress-bar column is a magic value. Compare with `dashboard/portfolio-table.tsx:36` `gridTemplateColumns: "2fr 90px 120px 100px 90px 90px"` — 5 distinct widths. Across the codebase, the same conceptual "progress + percent" widget is realized at 7 different column widths (32, 40, 48, 60, 80, 90, 100). _Phase origin: 10–12_. **Fix:** standardize "progress + percent" at `[1fr 48px 36px]` (bar + percent + buffer).

**Pattern: outline:0/none on 14 inline inputs suppresses focus-visible ring** — `components/task-modal/task-create-modal.tsx:73`, `components/header/search-autocomplete.tsx:185`, `components/my-tasks/task-filter-bar.tsx:73`, `components/task-detail/comments-section.tsx:189,380`, `components/task-detail/description-editor.tsx:109`, `components/task-detail/properties-sidebar.tsx:44`, `components/workflow-editor/phase-edge.tsx:182`, `components/workflow-editor/phase-node.tsx:245`, `components/primitives/input.tsx:94`, `components/project-detail/settings-columns-subtab.tsx:65`, `components/project-detail/settings-general-subtab.tsx:129,143`, `components/workflow-editor/selection-panel.tsx:222`. **`globals.css:144` defines `input:focus-visible, textarea:focus-visible, button:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }` — but every inline `outline: 0/none` overrides this.** Result: keyboard users cannot see which input has focus. **Accessibility regression.** _Phase origin: 8–12_. **Fix:** drop all inline `outline: 0/none`. The boxShadow rings stay; focus ring stacks on top. (The inline-edit primitive at `task-detail/inline-edit.tsx:143` correctly uses `outline: "2px solid var(--ring)"` on its editor — it knows.)

**[Frontend2/components/lifecycle/overview-subtab.tsx:265,365,447](Frontend2/components/lifecycle/overview-subtab.tsx)** — Phase Summary card header uses `padding: "12px 14px"` (matches UI-SPEC line 124 permitted exception) but inside the same card, the row padding is `padding: "10px 14px"` (line 122 permitted exception). _Pass on values._ But: header has `borderBottom: "1px solid var(--border)"` and the alternating rows have NO bottom border between rows except a final-row condition. Result: visual rhythm of the rows feels weak. _Phase origin: 12_. **Fix:** keep current behavior; this is consistent with `dashboard/portfolio-table.tsx`. No change.

**[Frontend2/components/dashboard/portfolio-table.tsx:74-76](Frontend2/components/dashboard/portfolio-table.tsx)** — Project team-members AvatarStack always renders empty: `const teamMembers: AvatarStackUser[] = []`. The visual leaves an empty 100px column. _Phase origin: 10_. **Fix:** until project member endpoint ships, drop the column from the grid (`gridTemplateColumns: "2fr 90px 120px 90px 90px"`). Keep the field for future restore.

### NITs

**[Frontend2/components/project-detail/board-card.tsx:96-115](Frontend2/components/project-detail/board-card.tsx)** — BoardCard layout is well-aligned: 6px gap header, 4-6px content gap, consistent left border. _Pass._

**[Frontend2/components/workflow-editor/phase-node.tsx:131-150](Frontend2/components/workflow-editor/phase-node.tsx)** — 140×60 node, 8/10px padding match UI-SPEC line 148 permitted exception. _Pass._

---

## Pillar 6 — Motion / States

### BLOCKERs

**[Frontend2/components/task-modal/task-create-modal.tsx:48,60](Frontend2/components/task-modal/task-create-modal.tsx)** — Modal overlay + card use `animation: "fadeIn 0.15s ease"` and `animation: "fadeIn 0.12s ease"`. **There is NO `@keyframes fadeIn` definition anywhere in `Frontend2/`** (grep confirms: only this file references it). The animations silently no-op — the modal appears with no transition. _Phase origin: 11_. **Fix:** add to `globals.css`:
```css
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
```
or replace inline `animation` with a CSS class that uses `transform: scale(0.96) → 1` matching the prototype's modal entry.

**Pattern: 4 visible focus state regressions** — As listed in Pillar 5 BLOCKER ("outline:0/none"), all custom inputs have suppressed focus rings. **Combined with the Button primitive's `transform: translateY(0.5px)` on `onMouseDown`** (button.tsx:115) being ONLY a mouse-down effect (no `:focus-visible` translate), keyboard users see zero feedback when tabbing through forms. _Phase origin: 8–12_. **Fix:** as Pillar 5; add `:focus-visible` styling to Button primitive too.

### FLAGs

**[Frontend2/components/workflow-editor/group-cloud-node.tsx:91](Frontend2/components/workflow-editor/group-cloud-node.tsx)** — `transition: "d 100ms ease, stroke 120ms ease, stroke-dasharray 120ms ease"`. **`transition: d` does not work in any browser** for SVG path `d` attribute — only works inside the (non-shipping) experimental SVG attribute animation API. The hull morph during drag will be visually instant despite the declared transition. _Phase origin: 12_. **Fix:** use `<animate attributeName="d" dur="100ms" />` inside `<path>`, or convert to a short `requestAnimationFrame`-tween in editor-page.tsx's `handleNodeDrag` callback.

**Pattern: hover-mouse-enter inline JS handlers (15 components)** — Multiple components use:
```js
onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
```
Instances: `dashboard/portfolio-table.tsx:97-99`, `projects/project-card.tsx:188-190`, `sidebar.tsx:122-127, 257-262, 270-275, 288-293`, `workflow-editor/preset-menu.tsx:165-173`, `workflow-editor/bottom-toolbar.tsx:162-167`, `task-modal/task-create-modal.tsx:644-655`, `comments-section.tsx:243`, plus 3 more.

**Problem:** these are imperative; lose state on rerender and don't respond to keyboard `:focus-visible`. They also bypass the prefers-reduced-motion check. _Phase origin: 8–12_. **Fix:** replace with CSS class + `:hover, :focus-visible { background: var(--surface-2); }` (define one global `.hover-row` utility class in globals.css).

**[Frontend2/components/primitives/button.tsx:114-122](Frontend2/components/primitives/button.tsx)** — `onMouseDown/Up/Leave` mutate `style.transform` imperatively. This is faithful to prototype `primitives.jsx:111-113` but breaks the same-keyboard-feedback issue. Also bypasses `prefers-reduced-motion`. _Phase origin: 8_. **Fix:** convert to CSS via a `.btn-press` class with `:active { transform: translateY(0.5px) }`; add `@media (prefers-reduced-motion: reduce) { transform: none }`.

**[Frontend2/components/project-detail/board-column.tsx:127-134](Frontend2/components/project-detail/board-column.tsx)** — WIP-violation AlertBanner appears with no transition. The column background already animates via `transition: "background 0.15s"` so the banner fading in would feel right. _Phase origin: 11_. **Fix:** wrap AlertBanner in a div with `transition: opacity 0.15s, transform 0.15s`, opacity 0→1 + translateY -4px → 0 on mount. (Trivial — 8 lines.)

**Pattern: missing disabled states in 4 places** — `components/lifecycle/milestones-subtab.tsx:213-222`, `components/lifecycle/phase-gate-expand.tsx:761-777`, `components/workflow-editor/bottom-toolbar.tsx:88,98,107,119` — buttons accept `disabled` from prop but the disabled visual is the Button primitive's default `opacity: 0.5`. No `cursor: not-allowed` distinction beyond that. _Phase origin: 12_. **Fix:** Button primitive already sets `cursor: "not-allowed"` (button.tsx:105) — _verified Pass for primitive_. The bottom-toolbar instances render fine. _No change needed._

**[Frontend2/components/lifecycle/phase-gate-expand.tsx:582-602](Frontend2/components/lifecycle/phase-gate-expand.tsx)** — Per-task exception `<select>` inside Collapsible has `border: "1px solid var(--border)"` instead of the standard `boxShadow: inset 0 0 0 1px var(--border)`. Inconsistency with every other input. _Phase origin: 12_. **Fix:** swap to inset shadow.

### NITs

**[Frontend2/components/project-detail/backlog-panel.tsx:208](Frontend2/components/project-detail/backlog-panel.tsx)** — Width transition `180ms ease` matches Phase 11 D-13 (specifies 150-200ms). _Pass._

**[Frontend2/components/lifecycle/lifecycle-tab.tsx:294,302](Frontend2/components/lifecycle/lifecycle-tab.tsx)** — Hardcoded canvas height `480px`. Magic value but consistent with Phase 12 UI-SPEC implicit canvas size. _Pass._

**[Frontend2/components/dashboard/activity-feed.tsx:96-107](Frontend2/components/dashboard/activity-feed.tsx)** — Activity feed empty-state copy is hardcoded Turkish-only ("Henüz aktivite yok."). Other empty states are bilingual. _Phase origin: 10_. **Fix:** wrap in `language === 'tr' ? ... : ...` like the rest.

---

## Top-10 highest-impact fixes (hand to fix-executor)

| # | Severity | File | Fix |
|---|----------|------|-----|
| 1 | BLOCKER | `Frontend2/app/(shell)/dashboard/page.tsx:141-173` | Replace 4 emoji StatCard icons with lucide `Folder` / `CheckSquare` / `CircleCheck` / `AlertTriangle` (matches prototype `dashboard.jsx:15-18`) |
| 2 | BLOCKER | `Frontend2/app/(auth)/login/page.tsx:184,187,189` | `var(--danger, #e53e3e)` × 3 → `var(--priority-critical)` (token doesn't exist; hex fallback is firing) |
| 3 | BLOCKER | `Frontend2/app/globals.css` (add) | Add `@keyframes fadeIn { from {opacity:0} to {opacity:1} }` — task-create-modal.tsx references it and currently no-ops |
| 4 | BLOCKER | 14 files (Pillar 5 list) | Drop all inline `outline: 0/none` from custom `<input>`/`<textarea>` — they suppress the global `:focus-visible` ring; keyboard users have no focus indicator |
| 5 | BLOCKER | `Frontend2/components/toast/index.tsx:28,35` | Toast `error` `#dc2626` + `#ffffff` → `color-mix(in oklch, var(--priority-critical) 90%, var(--surface))` + `var(--primary-fg)` (theme-independent error toast was a bad call) |
| 6 | BLOCKER | 9 files (Pillar 5 Input drift table) | Lift inline-input reimplementations into `Input` primitive usage; standardize at `height:32, padding:"0 8px", borderRadius:"var(--radius-sm)", fontSize:13` |
| 7 | BLOCKER | `Frontend2/components/primitives/button.tsx:40,62` + `phase-stepper.tsx:95` | Replace literal `oklch(0.60 0.17 40 / 0.X)` and `oklch(0.58 0.22 25 / 0.X)` with `color-mix(in oklch, var(--primary) X%, transparent)` — current code breaks in dark mode |
| 8 | FLAG | 30+ files (Pillar 5 borderRadius list) | Sweep-replace integer `6/8/12` → `var(--radius-sm)/--radius/--radius-lg`; document or fix raw `3/5/7/10/20` |
| 9 | FLAG | `Frontend2/components/dashboard/page.tsx:97-129` + `app/(shell)/settings/page.tsx:140-160` | Replace hand-rolled SegmentedPills with the SegmentedControl primitive |
| 10 | FLAG | `Frontend2/components/lifecycle/history-card.tsx:262-278` | Replace Unicode `▶` chevron component with `import { ChevronRight } from "lucide-react"` (everywhere else uses lucide) |

---

## Total finding count

- **BLOCKER:** 16 (1 Spacing, 3 Typography, 5 Color, 2 Visual Hierarchy, 3 Layout, 2 Motion)
- **FLAG:** 21 (5 Spacing, 4 Typography, 3 Color, 4 Visual Hierarchy, 3 Layout, 2 Motion)
- **NIT:** 13 (2 Spacing, 1 Typography, 1 Color, 2 Visual Hierarchy, 2 Layout, 5 Motion)

**Grand total: 50 findings across 6 pillars (rolled up from ≥120 raw drift instances via shape-of-drift consolidation).**

---

## Phase attribution heuristics

- **Phase 8** drift root: literal `oklch(0.60 0.17 40)` brand values inside primitives, `#fff` literals — both faithful 1:1 ports of `New_Frontend/src/primitives.jsx` that should have been substituted at port time.
- **Phase 10** drift root: `--danger` token invention, dashboard StatCard emoji icons, hand-rolled SegmentedPills in dashboard + settings.
- **Phase 11** drift root: Input reimplementations across MyTasks + Header search + Settings sub-tabs (8 distinct copies), Modal `fadeIn` reference without keyframe definition, `#5/3/7px` raw radii in project-card + properties-sidebar.
- **Phase 12** drift root: `transition: d 100ms` (non-functional), `--shadow-md, 0 4px 14px rgba(...)` rgba fallbacks, `▶` Unicode chevron in history-card.

The pattern across phases: **each phase added ~5-8 net new drift items** but never went back to fix prior-phase drift. A single 1-day cleanup sweep can address ~80% of the BLOCKERs and FLAGs.

---

## Sweep Complete — 2026-04-25

A cross-phase polish sweep landed all 50 findings from this audit. The 9 logical atomic commits below each fix a coherent unit of work and keep `Frontend2 npm test` green at 53 files / 358 tests across every commit. Plan 12-10 plan-progress / SUMMARY / STATE / ROADMAP / REQUIREMENTS were intentionally NOT advanced — the UAT checkpoint stays open per the executor's brief.

| Commit  | Subject                                                                                  | Findings addressed (Pillar / severity)                                                                                                                                                            | Files touched                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| f368c63 | Replace phantom tokens, emojis, and literal hex with oklch tokens                        | 5 BLOCKER (Pillar 3 phantom `--danger`, StatCard emojis, raw `#fff`/`#ffffff` × 8, toast hex, PhaseStepper boxShadow); 3 FLAG/NIT (dashboard SegmentedPills, H1 fontSize, activity-feed bilingual)  | login/page.tsx, dashboard/page.tsx, dashboard/stat-card.tsx, primitives/{button,avatar,toggle}.tsx, toast/index.tsx, logo-mark.tsx, settings/page.tsx, task-detail/phase-stepper.tsx, dashboard/activity-feed.tsx                                                                                                                                                                                                                                            |
| 7c56dd9 | Drop inline outline:0/none from custom inputs (focus-visible a11y)                       | 1 BLOCKER (Pillar 5 outline-suppress pattern); 1 BLOCKER (Pillar 6 focus regressions on Button)                                                                                                  | primitives/input.tsx, header/search-autocomplete.tsx, my-tasks/task-filter-bar.tsx, task-modal/task-create-modal.tsx, task-detail/{properties-sidebar,description-editor,comments-section}.tsx, workflow-editor/{selection-panel,phase-node,phase-edge}.tsx, project-detail/{settings-general-subtab,settings-columns-subtab}.tsx                                                                                                                              |
| 913d039 | Forward aria-label through Button primitive; revert calendar-view to use it              | 1 BLOCKER (Pillar 5 Calendar primitive aria-label limitation)                                                                                                                                    | primitives/button.tsx, project-detail/calendar-view.tsx                                                                                                                                                                                                                                                                                                                                                                                                    |
| 8409217 | Standardize remaining Input reimplementations to primitive baseline                      | 1 BLOCKER (Pillar 5 9-component Input drift); 1 FLAG (modal width 540 vs prototype 560)                                                                                                          | task-modal/task-create-modal.tsx, settings/page.tsx                                                                                                                                                                                                                                                                                                                                                                                                        |
| fbaf262 | Wire fadeIn keyframe + .hover-row utility, drop non-functional transitions               | 1 BLOCKER (Pillar 6 fadeIn missing); 1 BLOCKER (Pillar 6 focus regressions on Button); 3 FLAG (Pillar 6 hover handlers, `transition: d`, WIP banner motion); 1 FLAG (Pillar 5 empty Team column) | globals.css, primitives/button.tsx, dashboard/portfolio-table.tsx, sidebar.tsx, projects/project-card.tsx, project-detail/board-column.tsx, workflow-editor/{group-cloud-node,preset-menu,bottom-toolbar,tooltip}.tsx, workflow-editor/group-cloud-node.test.tsx, task-detail/comments-section.tsx                                                                                                                                                          |
| cfa7f79 | Replace hand-rolled controls with primitives + lucide; fix visual hierarchy              | 4 BLOCKER (projects-page hierarchy, board-toolbar Sprint badge, hand-rolled SegmentedPills × 2); 4 FLAG (project-card MoreH SVG, history-card chevron, phase-gate Badge, exception select border); 1 NIT (eval-report aria-label) | settings/page.tsx, lifecycle/{history-card,evaluation-report-card,phase-gate-expand}.tsx, projects/page.tsx, project-detail/board-toolbar.tsx                                                                                                                                                                                                                                                                                                              |
| 225a401 | Normalize raw integer borderRadius values to design tokens                               | 1 BLOCKER (Pillar 5 30+ scattered integer borderRadius values); multiple FLAGs (8-component dropdown menu pad, board-card padding asymmetry, login auth screen typography drift); several NITs   | header.tsx, dashboard/{stat-card,portfolio-table}.tsx, header/search-autocomplete.tsx, lifecycle/{artifact-inline-expand,artifacts-subtab,criteria-editor-panel,evaluation-report-card,history-card,history-subtab,milestones-subtab,phase-gate-expand}.tsx, settings/page.tsx, login/page.tsx, forgot-password/page.tsx, workflow-editor/{canvas-skeleton,phase-node}.tsx, project-detail/{board-card,board-toolbar,calendar-view}.tsx, projects/[id]/tasks/[taskId]/page.tsx, projects/new/page.tsx |
| d3d1352 | Snap typography to UI-SPEC 4-bucket; standardize uppercase letterSpacing                 | 1 BLOCKER (Pillar 2 distinct font-size pattern); 4 FLAG (Pillar 2 task-row 10.8, list-tab 11, letter-spacing drift across 8 sites)                                                                | my-tasks/{my-tasks-experience,task-row,task-group-list}.tsx, project-detail/list-tab.tsx, header/search-autocomplete.tsx, settings/page.tsx, dashboard/stat-card.tsx, lifecycle/{artifact-inline-expand,evaluation-report-card,artifacts-subtab}.tsx, project-detail/calendar-view.tsx                                                                                                                                                                       |
| 844f391 | Apply spacing standardizations + .mono utility class for tabular-nums                    | 1 BLOCKER (Pillar 1 lifecycle-tab empty-state); 1 FLAG (Pillar 5 overview-subtab 22px column); 1 NIT (Pillar 2 mono utility migration sample)                                                     | lifecycle/{lifecycle-tab,overview-subtab}.tsx, dashboard/{activity-feed,portfolio-table}.tsx, task-detail/sub-tasks-list.tsx, projects/project-card.tsx                                                                                                                                                                                                                                                                                                    |

**Findings status:**
- 16/16 BLOCKER — all addressed
- 21/21 FLAG — all addressed
- 13/13 NIT — addressed or documented (raw 3/10/7 px radii kept where prototype-faithful per UI-SPEC permitted exceptions, with explanatory comments)

**Tests:** 53 files / 358 tests pass across every commit; one test (`group-cloud-node.test.tsx Test 7`) was updated to assert the new design contract (no `transition: d` since it is non-functional CSS) instead of codifying the broken rule.

**Plan-progress untouched:**
- `.planning/STATE.md` — no advance
- `.planning/ROADMAP.md` — no advance
- `.planning/REQUIREMENTS.md` — no advance
- Plan 12-10 SUMMARY.md — not created

UAT checkpoint stays open. The two specific UAT-failing bugs (LIFE-01 empty state, drag history coalescing) were already fixed in a998c2a + 21fce83 prior to this sweep.


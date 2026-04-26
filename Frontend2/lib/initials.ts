// Initials helper — first+last initial extraction.
//
// LIFTED from Frontend2/components/dashboard/activity-feed.tsx lines 49-56 by
// Phase 13 Plan 13-02. Third consumer (AvatarDropdown) triggers the lift per
// the "Don't Hand-Roll" table in 13-RESEARCH.md (Plan 13-02 mini-profile
// header is the third consumer alongside activity-feed + future profile-header
// in Plan 13-05).
//
// Behavior:
// - Splits on whitespace, filters out empty tokens (handles repeated spaces).
// - Takes the first two tokens only ("Ali Veli Selami" → "AV", not "AVS").
// - Maps each to its first character; uppercases the join.
// - Returns "" for empty / null / undefined input — callers can decide whether
//   to fall back to email or "?".

export function getInitials(name: string): string {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
}

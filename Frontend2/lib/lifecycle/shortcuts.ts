// Pure keyboard-shortcut map (Phase 12 Plan 12-01).
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumer is the editor's keydown handler in
// Frontend2/components/workflow-editor/editor-page.tsx (added in Plan 12-08)
// and the right-panel "Kısayollar" section.
//
// Reference: CONTEXT D-35 + 12-UI-SPEC §Keyboard Shortcuts.

export interface ShortcutDef {
  key: string
  ctrlOrCmd?: boolean
  shift?: boolean
  alt?: boolean
  description: string
}

export type ShortcutId =
  | "save"
  | "undo"
  | "redo"
  | "addNode"
  | "delete"
  | "selectAll"
  | "fit"
  | "esc"
  | "group"
  | "duplicate"

export const KEYBOARD_SHORTCUTS: Record<ShortcutId, ShortcutDef> = {
  save: { key: "s", ctrlOrCmd: true, description: "Kaydet" },
  undo: { key: "z", ctrlOrCmd: true, description: "Geri al" },
  redo: { key: "z", ctrlOrCmd: true, shift: true, description: "Yinele" },
  addNode: { key: "n", description: "İmleç konumuna düğüm ekle" },
  delete: { key: "Delete", description: "Seçimi sil" },
  selectAll: { key: "a", ctrlOrCmd: true, description: "Tümünü seç" },
  fit: { key: "f", description: "Ekrana sığdır" },
  esc: { key: "Escape", description: "Seçimi kaldır" },
  group: { key: "g", ctrlOrCmd: true, description: "Grupla / Grubu çöz" },
  duplicate: { key: "d", ctrlOrCmd: true, description: "Çoğalt" },
}

/**
 * Detect whether the current runtime is macOS — used to pick Cmd vs Ctrl in
 * the shortcut matcher. Falls back to false in non-browser environments
 * (SSR, vitest without jsdom). Uses navigator.platform deliberately because
 * it remains the most-reliable signal in 2026 browsers; navigator.userAgent
 * is increasingly anonymized.
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false
  // navigator.platform may be deprecated but still populated in all browsers
  // we target. Tests rely on this exact string match.
  const platform = (navigator.platform || "").toString()
  return /Mac|iP/.test(platform)
}

/**
 * matchesShortcut — returns true if the keyboard event triggers the given
 * shortcut. Honors Cmd on Mac vs Ctrl elsewhere automatically.
 */
export function matchesShortcut(event: KeyboardEvent, def: ShortcutDef): boolean {
  if (def.key.toLowerCase() !== event.key.toLowerCase()) return false
  // Strict modifier match — `undefined` means "must not be pressed".
  const wantsShift = Boolean(def.shift)
  if (Boolean(event.shiftKey) !== wantsShift) return false
  const wantsAlt = Boolean(def.alt)
  if (Boolean(event.altKey) !== wantsAlt) return false
  if (def.ctrlOrCmd) {
    const wantsModifier = isMac() ? event.metaKey : event.ctrlKey
    if (!wantsModifier) return false
  } else if (event.ctrlKey || event.metaKey) {
    // No modifier expected but one is held — reject for non-text shortcuts so
    // browser shortcuts (Ctrl+R, Cmd+L) don't accidentally trigger 'r'/'l'.
    return false
  }
  return true
}

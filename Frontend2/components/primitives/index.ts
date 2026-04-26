// Barrel export for all 16 primitive components.
// Consumers import named exports only: `import { Badge, Button } from "@/components/primitives"`.
// Type exports use `export type` for ts 3.8+ explicit type re-export.

export { Avatar } from "./avatar"
export type { AvatarUser, AvatarProps } from "./avatar"

export { AvatarStack } from "./avatar-stack"
export type { AvatarStackUser, AvatarStackProps } from "./avatar-stack"

export { Badge } from "./badge"
export type { BadgeTone, BadgeSize, BadgeProps } from "./badge"

export { Button } from "./button"
export type { ButtonVariant, ButtonSize, ButtonProps } from "./button"

export { Card } from "./card"
export type { CardProps } from "./card"

export { Kbd } from "./kbd"
export type { KbdProps } from "./kbd"

export { Tabs } from "./tabs"
export type { TabItem, TabsSize, TabsProps } from "./tabs"

export { Section } from "./section"
export type { SectionProps } from "./section"

export { PriorityChip } from "./priority-chip"
export type { PriorityLevel, PriorityChipProps } from "./priority-chip"

export { StatusDot } from "./status-dot"
export type { StatusValue, StatusDotProps } from "./status-dot"

export { Input } from "./input"
export type { InputSize, InputProps } from "./input"

export { ProgressBar } from "./progress-bar"
export type { ProgressBarProps } from "./progress-bar"

export { SegmentedControl } from "./segmented-control"
export type {
  SegmentedOption,
  SegmentedSize,
  SegmentedControlProps,
} from "./segmented-control"

export { Collapsible } from "./collapsible"
export type { CollapsibleProps } from "./collapsible"

export { AlertBanner } from "./alert-banner"
export type { AlertTone, AlertBannerProps } from "./alert-banner"

export { Toggle } from "./toggle"
export type { ToggleSize, ToggleProps } from "./toggle"

// Phase 13 Plan 13-01 Task 2 — DataState 3-state primitive (D-F2).
export { DataState } from "./data-state"
export type { DataStateProps } from "./data-state"

// Phase 14 Plan 14-01 — NavTabs Link-based tab strip primitive (D-C4).
export { NavTabs } from "./nav-tabs"
export type { NavTabItem, NavTabsProps } from "./nav-tabs"

// Phase 14 Plan 14-01 — Modal primitive (overlay + panel + slots).
export { Modal, ModalHeader, ModalBody, ModalFooter } from "./modal"
export type { ModalProps } from "./modal"

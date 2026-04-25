// Shared MyTasks types — extracted so consumers don't have to import from
// the (now-removed) saved-views-tabs.tsx component file.

export type ViewId =
  | "today"
  | "overdue"
  | "upcoming"
  | "starred"
  | "all"
  | "done"

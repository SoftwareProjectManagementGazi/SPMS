"use client"

// WorkflowCanvas — outer wrapper that dynamic-imports the actual React Flow
// canvas with `ssr: false` (CONTEXT D-07, RESEARCH §Pattern 3).
//
// React Flow depends on `window`, `ResizeObserver`, and `getBoundingClientRect`
// — none of which exist during Node.js SSR. `"use client"` alone is
// insufficient because it still SSR-renders. The dynamic({ ssr: false })
// gate is the pattern Phase 11 D-36 established for TipTap and is
// belt-and-suspenders here.
//
// Loading fallback: <CanvasSkeleton/> shows the prototype's dot-grid + 5
// placeholder rectangles while the chunk loads.

import * as React from "react"
import dynamic from "next/dynamic"
import { CanvasSkeleton } from "./canvas-skeleton"
import type { WorkflowCanvasInnerProps } from "./workflow-canvas-inner"

const WorkflowCanvasInner = dynamic(
  () => import("./workflow-canvas-inner").then((m) => m.WorkflowCanvasInner),
  {
    ssr: false,
    loading: () => <CanvasSkeleton />,
  },
)

export type WorkflowCanvasProps = WorkflowCanvasInnerProps

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return <WorkflowCanvasInner {...props} />
}

"use client"

// ValidationPanel (Phase 12 Plan 12-07) — right-panel section that runs the
// pure 5-rule `validateWorkflow` from Plan 12-01 and renders pass/fail rows.
//
// Per CONTEXT Claude's Discretion + UI-SPEC §1387 — validator re-runs on
// every workflow mutation with **300 ms debounce**. We use a setTimeout-ref
// pattern to avoid React.useDeferredValue's behaviour-change interactions
// with the editor's optimistic state mutations.
//
// Rule labels per UI-SPEC §634-647 (TR + EN).

import * as React from "react"
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react"

import { AlertBanner } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import {
  validateWorkflow,
  type ValidationResult,
} from "@/lib/lifecycle/workflow-validators"
import type { WorkflowConfig } from "@/services/lifecycle-service"

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-subtle)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 10,
}

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 12,
  color: "var(--fg)",
  marginBottom: 6,
  lineHeight: 1.4,
}

export interface ValidationPanelProps {
  workflow: WorkflowConfig
}

const DEBOUNCE_MS = 300

export function ValidationPanel({ workflow }: ValidationPanelProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const [result, setResult] = React.useState<ValidationResult>({
    errors: [],
    warnings: [],
  })

  // 300 ms debounce — reset the timer on every workflow change.
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setResult(validateWorkflow(workflow))
    }, DEBOUNCE_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [workflow])

  // Per-rule pass/fail derived from the result.
  const ruleStatus = React.useMemo(() => {
    const ruleHasError = (n: number) =>
      result.errors.some((e) => e.rule === n) ||
      result.warnings.some((w) => w.rule === n)
    return {
      rule1: !ruleHasError(4) || hasInitial(workflow),
      rule2: !ruleHasError(4) || hasFinal(workflow),
      rule3: !result.errors.some((e) => e.rule === 3),
      rule4: !result.errors.some((e) => e.rule === 2),
      rule5: !result.errors.some((e) => e.rule === 5),
    }
  }, [result, workflow])

  const rule5HasWarning = result.warnings.some((w) => w.rule === 5)

  // Rule 6 (prototype parity) — every non-archived node must be reachable
  // from at least one initial node (BFS along forward + bidirectional flow
  // edges). Surfaces unreachable orphans the user might have left behind.
  const reachabilityOK = React.useMemo(
    () => isReachable(workflow),
    [workflow],
  )

  // Soft warning row — counts nodes that look like they have task-shaped
  // metadata (wipLimit / wipUsage). The prototype showed "X düğümün atanmış
  // görevi var" as a non-blocking notice; we use the same heuristic until a
  // dedicated task-counts query lands.
  const nodesWithTasks = React.useMemo(
    () =>
      (workflow.nodes ?? []).filter(
        (n) =>
          (n.wipLimit != null && n.wipLimit > 0) ||
          ((n as { wipUsage?: number }).wipUsage ?? 0) > 0,
      ).length,
    [workflow],
  )

  return (
    <div aria-live="polite">
      <div style={TITLE_STYLE}>{T("Doğrulama", "Validation")}</div>

      <ValidationRow
        ok={ruleStatus.rule1}
        okLabel={T("Başlangıç düğümü mevcut", "Initial node exists")}
        failLabel={T("Başlangıç düğümü tanımlanmamış", "Initial node not defined")}
      />
      <ValidationRow
        ok={ruleStatus.rule2}
        okLabel={T("Bitiş düğümü mevcut", "Final node exists")}
        failLabel={T("Bitiş düğümü tanımlanmamış", "Final node not defined")}
      />
      <ValidationRow
        ok={ruleStatus.rule3}
        okLabel={T("Tüm bağlantılar geçerli", "All edges reference valid nodes")}
        failLabel={T(
          `Geçersiz bağlantılar var: ${result.errors.filter((e) => e.rule === 3).length}`,
          `Invalid edges: ${result.errors.filter((e) => e.rule === 3).length}`,
        )}
      />
      <ValidationRow
        ok={ruleStatus.rule4}
        okLabel={T("Düğüm kimlikleri benzersiz", "Node IDs unique")}
        failLabel={T("Yinelenen düğüm kimliği var", "Duplicate node IDs")}
      />
      <ValidationRow
        ok={ruleStatus.rule5}
        warning={rule5HasWarning}
        okLabel={T("Akış döngüsü yok", "No flow cycles")}
        failLabel={
          rule5HasWarning
            ? T(
                "Akış kenarları döngü oluşturuyor (uyarı)",
                "Flow edges form a cycle (warning)",
              )
            : T(
                "Akış kenarları döngü oluşturuyor",
                "Flow edges form a cycle",
              )
        }
      />
      <ValidationRow
        ok={reachabilityOK}
        okLabel={T("Ulaşılabilirlik kontrolü geçti", "Reachability OK")}
        failLabel={T(
          "Bazı düğümler başlangıçtan ulaşılamıyor",
          "Some nodes are unreachable from initial",
        )}
      />
      {nodesWithTasks > 0 ? (
        <ValidationRow
          ok={false}
          warning
          okLabel=""
          failLabel={T(
            `${nodesWithTasks} düğümün atanmış görevi var`,
            `${nodesWithTasks} nodes have tasks`,
          )}
        />
      ) : null}

      {result.errors.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <AlertBanner tone="danger">
            <span style={{ fontSize: 11.5 }}>
              {T(
                `${result.errors.length} hata bulundu.`,
                `${result.errors.length} error(s) found.`,
              )}
            </span>
          </AlertBanner>
        </div>
      )}
      {result.errors.length === 0 && result.warnings.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <AlertBanner tone="warning">
            <span style={{ fontSize: 11.5 }}>
              {T(
                `${result.warnings.length} uyarı bulundu.`,
                `${result.warnings.length} warning(s) found.`,
              )}
            </span>
          </AlertBanner>
        </div>
      )}
    </div>
  )
}

function hasInitial(wf: WorkflowConfig): boolean {
  return wf.nodes.some((n) => Boolean(n.isInitial))
}

function hasFinal(wf: WorkflowConfig): boolean {
  return wf.nodes.some((n) => Boolean(n.isFinal))
}

/**
 * Forward BFS from any initial node along edges (bidirectional included).
 * Every non-archived node must be reached for the rule to pass.
 */
function isReachable(wf: WorkflowConfig): boolean {
  const live = wf.nodes.filter((n) => !n.isArchived)
  if (live.length === 0) return true
  const initials = live.filter((n) => n.isInitial).map((n) => n.id)
  if (initials.length === 0) return false
  const adj = new Map<string, string[]>()
  for (const e of wf.edges) {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source)!.push(e.target)
    if (e.bidirectional) {
      if (!adj.has(e.target)) adj.set(e.target, [])
      adj.get(e.target)!.push(e.source)
    }
  }
  const visited = new Set<string>(initials)
  const queue = [...initials]
  while (queue.length) {
    const id = queue.shift()!
    for (const next of adj.get(id) ?? []) {
      if (!visited.has(next)) {
        visited.add(next)
        queue.push(next)
      }
    }
  }
  return live.every((n) => visited.has(n.id))
}

function ValidationRow({
  ok,
  warning,
  okLabel,
  failLabel,
}: {
  ok: boolean
  warning?: boolean
  okLabel: string
  failLabel: string
}) {
  if (ok) {
    return (
      <div style={ROW_STYLE}>
        <CheckCircle2
          size={14}
          style={{ color: "var(--status-done)", flexShrink: 0, marginTop: 1 }}
        />
        <span>{okLabel}</span>
      </div>
    )
  }
  if (warning) {
    return (
      <div style={ROW_STYLE}>
        <AlertTriangle
          size={14}
          style={{ color: "var(--status-review)", flexShrink: 0, marginTop: 1 }}
        />
        <span style={{ color: "var(--status-review)" }}>{failLabel}</span>
      </div>
    )
  }
  return (
    <div style={ROW_STYLE}>
      <AlertCircle
        size={14}
        style={{
          color: "var(--priority-critical)",
          flexShrink: 0,
          marginTop: 1,
        }}
      />
      <span style={{ color: "var(--priority-critical)" }}>{failLabel}</span>
    </div>
  )
}

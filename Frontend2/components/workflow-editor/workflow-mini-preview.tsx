"use client"

// WorkflowMiniPreview — bir şablonun default_workflow grafının statik,
// salt-okunur SVG küçük görünümü. React Flow mount etmez: node'lar ölçekli
// dikdörtgenler, kenarlar çizgiler (feedback kesikli, verification noktalı),
// gruplar yumuşak arka-plan blokları olarak çizilir. Gerçek kanvasla aynı
// koordinatlar ve renk token'ları kullanıldığı için önizleme, editördeki
// yerleşimin birebir minyatürüdür.

import * as React from "react"

interface PreviewNode {
  id: string
  name?: string
  x: number
  y: number
  color?: string
}

interface PreviewEdge {
  source: string
  target: string
  type?: string
}

interface PreviewGroup {
  id: string
  color?: string
  children?: string[]
}

export interface WorkflowMiniPreviewProps {
  workflow: {
    nodes?: PreviewNode[]
    edges?: PreviewEdge[]
    groups?: PreviewGroup[]
  }
  /** Kapsayıcı yüksekliği (px). Genişlik %100. */
  height?: number
}

// Gerçek kanvas node'larının yaklaşık ayak izi — oranlar minyatürde korunur.
const NODE_W = 150
const NODE_H = 44
const PAD = 50

const TOKEN_VARS = new Set([
  "status-todo",
  "status-progress",
  "status-review",
  "status-done",
  "status-blocked",
])

function nodeFill(color?: string): string {
  if (!color) return "var(--status-todo)"
  if (color.startsWith("#")) return color
  if (TOKEN_VARS.has(color)) return `var(--${color})`
  return "var(--status-todo)"
}

export function WorkflowMiniPreview({
  workflow,
  height = 104,
}: WorkflowMiniPreviewProps) {
  const nodes = workflow.nodes ?? []
  const edges = workflow.edges ?? []
  const groups = workflow.groups ?? []
  if (nodes.length === 0) return null

  const minX = Math.min(...nodes.map((n) => n.x)) - PAD
  const minY = Math.min(...nodes.map((n) => n.y)) - PAD
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_W)) + PAD
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_H)) + PAD

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const center = (n: PreviewNode) => ({
    cx: n.x + NODE_W / 2,
    cy: n.y + NODE_H / 2,
  })

  return (
    <div
      data-testid="workflow-mini-preview"
      style={{
        marginTop: 12,
        height,
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-2)",
        boxShadow: "inset 0 0 0 1px var(--border)",
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Workflow önizlemesi"
      >
        {/* Grup blokları — üye node'ların kapsayıcı kutusu */}
        {groups.map((g) => {
          const members = (g.children ?? [])
            .map((id) => byId.get(id))
            .filter((n): n is PreviewNode => n != null)
          if (members.length === 0) return null
          const gx = Math.min(...members.map((n) => n.x)) - 22
          const gy = Math.min(...members.map((n) => n.y)) - 22
          const gw = Math.max(...members.map((n) => n.x + NODE_W)) + 22 - gx
          const gh = Math.max(...members.map((n) => n.y + NODE_H)) + 22 - gy
          const c = g.color && g.color.startsWith("#") ? g.color : "#6366F1"
          return (
            <rect
              key={g.id}
              x={gx} y={gy} width={gw} height={gh} rx={26}
              fill={c} fillOpacity={0.08}
              stroke={c} strokeOpacity={0.3} strokeWidth={3}
              strokeDasharray="10 8"
            />
          )
        })}

        {/* Kenarlar — node merkezleri arası; tip görsel dili editörle uyumlu */}
        {edges.map((e, i) => {
          const s = byId.get(e.source)
          const t = byId.get(e.target)
          if (!s || !t) return null
          const a = center(s)
          const b = center(t)
          // Hafif kavis: orta noktayı normale doğru it (geri beslemelerde
          // daha belirgin, döngü hissi için).
          const mx = (a.cx + b.cx) / 2
          const my = (a.cy + b.cy) / 2
          const dx = b.cx - a.cx
          const dy = b.cy - a.cy
          const len = Math.max(Math.hypot(dx, dy), 1)
          const bend = e.type === "feedback" ? 56 : 14
          const qx = mx - (dy / len) * bend
          const qy = my + (dx / len) * bend
          const dash =
            e.type === "feedback"
              ? "12 10"
              : e.type === "verification"
                ? "3 9"
                : undefined
          return (
            <path
              key={`${e.source}-${e.target}-${i}`}
              d={`M ${a.cx} ${a.cy} Q ${qx} ${qy} ${b.cx} ${b.cy}`}
              fill="none"
              stroke="var(--fg-subtle)"
              strokeOpacity={0.55}
              strokeWidth={4}
              strokeDasharray={dash}
              strokeLinecap="round"
            />
          )
        })}

        {/* Node'lar */}
        {nodes.map((n) => (
          <rect
            key={n.id}
            data-testid="mini-node"
            x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={10}
            fill={nodeFill(n.color)}
            fillOpacity={0.9}
          >
            {n.name ? <title>{n.name}</title> : null}
          </rect>
        ))}
      </svg>
    </div>
  )
}

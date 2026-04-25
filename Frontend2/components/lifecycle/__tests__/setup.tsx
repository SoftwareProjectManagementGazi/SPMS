// Shared RTL test fixtures for Phase 12 component tests (Plans 12-02..12-08).
//
// Exports:
//   - mockProject — minimal Project shape consumed by Lifecycle / Editor pages
//   - mockUser — AuthUser stub for useAuth() mocks
//   - mockWorkflow — V-Model + Scrum + Kanban shapes
//   - withQueryClient(component) — wraps a component in a fresh
//     QueryClientProvider with retries off
//   - withAuthContext(component, user?) — wraps a component in AuthProvider
//     by exposing the children with a custom value (avoids importing the real
//     auth flow into unit tests)

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { AuthUser } from "@/services/auth-service"
import type {
  WorkflowConfig,
  WorkflowMode,
} from "@/services/lifecycle-service"

export interface MockProject {
  id: number
  key: string
  name: string
  managerId: number | null
  methodology: string
  processConfig: { workflow?: WorkflowConfig } | null
}

export const mockUser: AuthUser = {
  id: "1",
  name: "Ayşe Demir",
  email: "ayse.demir@acme.co",
  role: { name: "Admin" },
}

export const mockProject: MockProject = {
  id: 1,
  key: "MOBIL",
  name: "Mobil Bankacılık 3.0",
  managerId: 2,
  methodology: "SCRUM",
  processConfig: null,
}

export function makeWorkflow(
  mode: WorkflowMode,
  overrides: Partial<WorkflowConfig> = {},
): WorkflowConfig {
  return {
    mode,
    nodes: [
      { id: "n1", name: "Başlatma", x: 60, y: 120, isInitial: true },
      { id: "n2", name: "Yürütme", x: 280, y: 120 },
      { id: "n3", name: "Kapanış", x: 500, y: 120, isFinal: true },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2", type: "flow" },
      { id: "e2", source: "n2", target: "n3", type: "flow" },
    ],
    groups: [],
    ...overrides,
  }
}

// V-Model fixture (mirrors EXTRA_LIFECYCLES.v-model in New_Frontend prototype)
export const mockVModelWorkflow: WorkflowConfig = {
  mode: "sequential-flexible",
  nodes: [
    { id: "n1", name: "Gereksinimler", x: 60, y: 60, isInitial: true },
    { id: "n2", name: "Sistem Tasarımı", x: 260, y: 60 },
    { id: "n3", name: "Modül Tasarımı", x: 460, y: 60 },
    { id: "n4", name: "Kodlama", x: 460, y: 220 },
    { id: "n5", name: "Birim Testi", x: 460, y: 380 },
    { id: "n6", name: "Entegrasyon Testi", x: 260, y: 380 },
    { id: "n7", name: "Sistem Testi", x: 60, y: 380, isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n5", type: "flow" },
    { id: "e5", source: "n5", target: "n6", type: "flow" },
    { id: "e6", source: "n6", target: "n7", type: "flow" },
    { id: "ev1", source: "n3", target: "n5", type: "verification", label: "Doğrula" },
    { id: "ev2", source: "n2", target: "n6", type: "verification", label: "Doğrula" },
    { id: "ev3", source: "n1", target: "n7", type: "verification", label: "Doğrula" },
  ],
  groups: [],
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function withQueryClient(node: React.ReactElement, qc?: QueryClient) {
  const client = qc ?? makeQueryClient()
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>
}

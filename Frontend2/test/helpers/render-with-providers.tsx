import * as React from "react"
import { render, type RenderOptions, type RenderResult } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppProvider } from "@/context/app-context"
import { AuthProvider } from "@/context/auth-context"
import { ToastProvider } from "@/components/toast"
import { TaskModalProvider } from "@/context/task-modal-context"

export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })
}

interface Options extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: React.ReactElement,
  opts: Options = {}
): RenderResult & { queryClient: QueryClient } {
  const queryClient = opts.queryClient ?? makeTestQueryClient()
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <ToastProvider>
            <TaskModalProvider>{children}</TaskModalProvider>
          </ToastProvider>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  )
  return { ...render(ui, { wrapper: Wrapper, ...opts }), queryClient }
}

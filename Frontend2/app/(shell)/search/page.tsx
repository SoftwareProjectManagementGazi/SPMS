"use client"

// /search — full search results page (Wave C / M-A2).
//
// The header SearchAutocomplete routes here on Enter-without-a-selection and via
// its "Tümünü gör / See all" footer (search-autocomplete.tsx:136,363). Before
// this route existed those pushes 404'd.
//
// Data sources mirror the autocomplete exactly, so results are identical — just
// un-truncated and on a dedicated surface:
//   - projects: useProjects() + filterProjects() (client-side substring match,
//     reused from the Reports ProjectPicker so the semantics stay in one place)
//   - tasks:    useTaskSearch() (backend search, enabled at >= 2 chars)
//
// ?q= is the source of truth: the input initializes from it and writes back
// (router.replace) so reload / share / back preserve the query. useSearchParams
// is wrapped in <Suspense> because this is a fresh route (Next 16 requires the
// boundary for static-render eligibility).

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Badge, Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProjects } from "@/hooks/use-projects"
import { useTaskSearch } from "@/hooks/use-tasks"
import { filterProjects } from "@/components/reports/project-picker"

// A single result row — a real <Link> (so middle-click / open-in-new-tab work,
// and it picks up the global a:focus-visible ring added in Y25) with a hover
// highlight driven by local state (the app styles inline, so CSS :hover isn't
// available without a class).
function ResultRow({ href, children }: { href: string; children: React.ReactNode }) {
  const [hover, setHover] = React.useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: "var(--radius-sm)",
        textDecoration: "none",
        color: "var(--fg)",
        background: hover ? "var(--surface-2)" : "transparent",
        boxShadow: hover ? "inset 0 0 0 1px var(--border)" : "none",
        transition: "background 0.1s ease",
      }}
    >
      {children}
    </Link>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        fontWeight: 600,
        letterSpacing: 0.5,
        color: "var(--fg-subtle)",
        marginBottom: 6,
        padding: "0 2px",
      }}
    >
      {children}
    </div>
  )
}

function SearchExperience() {
  const { language: lang } = useApp()
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQ = searchParams.get("q") ?? ""
  const [query, setQuery] = React.useState(initialQ)
  const [debounced, setDebounced] = React.useState(initialQ)

  // 250ms debounce — same cadence as the header autocomplete.
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(t)
  }, [query])

  // Keep ?q= synced to the debounced query so reload / share / back preserve it.
  // replace (not push) so the back button leaves /search instead of stepping
  // through each keystroke. The guard makes the self-induced URL change a no-op
  // on the re-run it triggers (terminates — no loop).
  React.useEffect(() => {
    const current = searchParams.get("q") ?? ""
    if (debounced !== current) {
      router.replace(
        debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search",
      )
    }
  }, [debounced, router, searchParams])

  // Backend task search fires at >= 2 chars (useTaskSearch's `enabled` guard);
  // gate the client-side project filter on the same threshold so the two groups
  // appear together rather than projects flashing in at a single character.
  const active = debounced.trim().length >= 2

  const { data: allProjects = [], isLoading: projectsLoading } = useProjects()
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isFetching: tasksFetching,
  } = useTaskSearch(query, debounced)

  const projectResults = React.useMemo(
    () => (active ? filterProjects(allProjects, debounced) : []),
    [active, allProjects, debounced],
  )
  const taskResults = active ? tasks : []

  // useTaskSearch stays in the pending state while disabled, so only treat the
  // fetch as loading when the query is actually active.
  const loading = active && (projectsLoading || tasksLoading || tasksFetching)
  const total = projectResults.length + taskResults.length
  const hasResults = total > 0

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Heading + result summary */}
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.4,
            color: "var(--fg)",
            margin: 0,
          }}
        >
          {T("Arama", "Search")}
        </h1>
        {active && !loading && (
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
            {hasResults
              ? T(
                  `"${debounced}" için ${total} sonuç`,
                  `${total} result${total === 1 ? "" : "s"} for "${debounced}"`,
                )
              : T(
                  `"${debounced}" için sonuç bulunamadı`,
                  `No results for "${debounced}"`,
                )}
          </div>
        )}
      </div>

      {/* Search input — chrome mirrors the header SearchAutocomplete input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--surface)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          height: 40,
          padding: "0 12px",
        }}
      >
        <Search size={16} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} aria-hidden />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={T("Proje veya görev ara…", "Search projects or tasks…")}
          aria-label={T("Ara", "Search")}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            background: "transparent",
            border: 0,
            fontSize: 14,
            color: "var(--fg)",
          }}
        />
      </div>

      {/* Below-threshold hint */}
      {!active && (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            color: "var(--fg-subtle)",
            fontSize: 13,
          }}
        >
          {T(
            "Aramak için en az 2 karakter yazın.",
            "Type at least 2 characters to search.",
          )}
        </div>
      )}

      {/* Loading skeleton (reuses the global .skeleton shimmer class) */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 44, borderRadius: "var(--radius)" }}
            />
          ))}
        </div>
      )}

      {/* Results */}
      {active && !loading && hasResults && (
        <>
          {projectResults.length > 0 && (
            <section>
              <SectionHeader>
                {T("Projeler", "Projects")} · {projectResults.length}
              </SectionHeader>
              <Card padding={6} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {projectResults.map((p) => (
                  <ResultRow key={`proj-${p.id}`} href={`/projects/${p.id}`}>
                    <Badge
                      size="xs"
                      tone="neutral"
                      style={{ fontFamily: "var(--font-mono)", flexShrink: 0 }}
                    >
                      {p.key}
                    </Badge>
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    {p.managerName && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--fg-subtle)",
                          flexShrink: 0,
                        }}
                      >
                        {p.managerName}
                      </span>
                    )}
                  </ResultRow>
                ))}
              </Card>
            </section>
          )}

          {taskResults.length > 0 && (
            <section>
              <SectionHeader>
                {T("Görevler", "Tasks")} · {taskResults.length}
              </SectionHeader>
              <Card padding={6} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {taskResults.map((t) => (
                  <ResultRow
                    key={`task-${t.id}`}
                    href={`/projects/${t.projectId}/tasks/${t.id}`}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--fg-muted)",
                        minWidth: 64,
                        flexShrink: 0,
                      }}
                    >
                      {t.key}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.title}
                    </span>
                  </ResultRow>
                ))}
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchExperience />
    </Suspense>
  )
}

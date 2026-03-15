"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ParentTask, TaskPriority } from "@/lib/types"

const priorityStyles: Record<TaskPriority, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-300',
  HIGH:     'bg-orange-100 text-orange-700 border-orange-300',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border-yellow-300',
  LOW:      'bg-gray-100 text-gray-600 border-gray-300',
}

type SortField = "key" | "title" | "status" | "priority" | "due_date"
type SortDir = "asc" | "desc"

interface Filters {
  status: string[]
  priority: string[]
  assignee: string[]
}

interface ListTabProps {
  tasks: ParentTask[]
  total: number
  page: number
  onLoadMore: () => void
  isLoading: boolean
}

interface SortHeaderProps {
  field: SortField
  label: string
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
}

function SortHeader({ field, label, sortField, sortDir, onSort }: SortHeaderProps) {
  const isActive = field === sortField
  return (
    <th
      className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:bg-muted/70"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </th>
  )
}

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

export function ListTab({ tasks, total, page, onLoadMore, isLoading }: ListTabProps) {
  const router = useRouter()

  const [sortField, setSortField] = useState<SortField>("key")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [filters, setFilters] = useState<Filters>({ status: [], priority: [], assignee: [] })

  // Build unique filter options from task list
  const statusOptions = useMemo(
    () => Array.from(new Set(tasks.map(t => t.status))).sort(),
    [tasks]
  )
  const priorityOptions = useMemo(
    () => Array.from(new Set(tasks.map(t => t.priority))).sort(),
    [tasks]
  )
  const assigneeOptions = useMemo(
    () => Array.from(new Set(tasks.map(t => t.assignee?.name ?? "").filter(Boolean))).sort(),
    [tasks]
  )

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  function toggleFilter(key: keyof Filters, value: string) {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }))
  }

  const displayed = useMemo(() => {
    let result = [...tasks]

    if (filters.status.length) result = result.filter(t => filters.status.includes(t.status))
    if (filters.priority.length) result = result.filter(t => filters.priority.includes(t.priority))
    if (filters.assignee.length)
      result = result.filter(t => filters.assignee.includes(t.assignee?.name ?? ""))

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "key":
          cmp = a.key.localeCompare(b.key)
          break
        case "title":
          cmp = a.title.localeCompare(b.title)
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
        case "priority":
          cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
          break
        case "due_date":
          cmp = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [tasks, filters, sortField, sortDir])

  const activeFilterCount =
    filters.status.length + filters.priority.length + filters.assignee.length

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Status{filters.status.length > 0 ? ` (${filters.status.length})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {statusOptions.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.status.includes(status)}
                onCheckedChange={() => toggleFilter("status", status)}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Priority{filters.priority.length > 0 ? ` (${filters.priority.length})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {priorityOptions.map(priority => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={filters.priority.includes(priority)}
                onCheckedChange={() => toggleFilter("priority", priority)}
              >
                {priority}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assignee filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Assignee{filters.assignee.length > 0 ? ` (${filters.assignee.length})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {assigneeOptions.map(name => (
              <DropdownMenuCheckboxItem
                key={name}
                checked={filters.assignee.includes(name)}
                onCheckedChange={() => toggleFilter("assignee", name)}
              >
                {name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ status: [], priority: [], assignee: [] })}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <SortHeader
                field="key"
                label="Key"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                field="title"
                label="Title"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                field="status"
                label="Status"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left font-medium">Assignee</th>
              <SortHeader
                field="priority"
                label="Priority"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                field="due_date"
                label="Due Date"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No tasks match your filters.
                </td>
              </tr>
            ) : (
              displayed.map(task => (
                <tr
                  key={task.id}
                  className="border-b cursor-pointer hover:bg-muted/50 last:border-b-0"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{task.key}</td>
                  <td className="px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{task.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-[10px]">
                            {task.assignee.name?.[0] ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] uppercase border ${priorityStyles[task.priority as TaskPriority] ?? ''}`}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load More */}
      {tasks.length < total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : `Load more (${total - tasks.length} remaining)`}
          </Button>
        </div>
      )}
    </div>
  )
}

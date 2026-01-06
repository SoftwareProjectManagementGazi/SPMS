"use client"
import Link from "next/link"
import { ChevronRight, Edit, MessageSquare, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ParentTask, SubTask } from "@/lib/types"

interface TaskHeaderProps {
  task: ParentTask | SubTask
}

export function TaskHeader({ task }: TaskHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground">
          {task.project.name}
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-muted-foreground">{task.key}</span>
      </nav>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <MessageSquare className="h-4 w-4" />
            Comment
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Clock className="h-4 w-4" />
            Log Work
          </Button>
        </div>
      </div>
    </div>
  )
}

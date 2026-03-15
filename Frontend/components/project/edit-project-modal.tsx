"use client"

import { useState, useEffect } from "react"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { projectService } from "@/services/project-service"
import { Project } from "@/lib/types"

interface EditProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? "")
  const [startDate, setStartDate] = useState(project.startDate?.split("T")[0] ?? "")
  const [endDate, setEndDate] = useState(project.endDate?.split("T")[0] ?? "")

  // Sync form state when project prop changes (e.g. modal re-opened for same project)
  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description ?? "")
      setStartDate(project.startDate?.split("T")[0] ?? "")
      setEndDate(project.endDate?.split("T")[0] ?? "")
    }
  }, [open, project])

  const mutation = useMutation({
    mutationFn: () =>
      projectService.updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project.id] })
      toast.success("Project updated")
      onOpenChange(false)
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Failed to update project"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Name</Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proj-start">Start Date</Label>
              <Input
                id="proj-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-end">End Date</Label>
              <Input
                id="proj-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

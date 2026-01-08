"use client"

import * as React from "react"
import { CalendarIcon, Layers, Workflow, GitBranch } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Methodology, Project } from "@/lib/types"

import { getTemplateById, buildDefaultEnabledFieldsMap } from "@/lib/process-templates"
import { useLocalStorageState } from "@/hooks/useLocalStorageState"
import CustomizeColumns from "@/components/project/customize-columns"
import FieldToggles from "@/components/project/field-toggles"
import AiRecommendationModal from "@/components/project/ai-recommendation-modal"
import { users } from "@/lib/mock-data"
import { projectService } from "@/services/project-service"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const methodologies: { value: Methodology; label: string; description: string; icon: React.ElementType }[] = [
  { value: "scrum", label: "Scrum", description: "Sprint-based planning with iterative development", icon: Layers },
  { value: "kanban", label: "Kanban", description: "Continuous flow with WIP limits", icon: Workflow },
  { value: "waterfall", label: "Waterfall", description: "Sequential phases from start to finish", icon: GitBranch },
]

export function ProjectCreation() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form states
  const [projectName, setProjectName] = React.useState("")
  const [projectKey, setProjectKey] = React.useState("")
  const [projectDesc, setProjectDesc] = React.useState("")

  // Persisted states
  const [selectedMethodology, setSelectedMethodology] = useLocalStorageState<Methodology | null>(
    "pms:newProject:methodology",
    null,
  )

  const [startDate, setStartDate] = React.useState<Date>()
  const [endDate, setEndDate] = React.useState<Date>()

  const template = React.useMemo(
    () => (selectedMethodology ? getTemplateById(selectedMethodology) : null),
    [selectedMethodology],
  )

  const [columns, setColumns] = useLocalStorageState<string[]>("pms:newProject:columns", template?.columns ?? [])

  const [enabledFields, setEnabledFields] = useLocalStorageState<Record<string, boolean>>(
    "pms:newProject:fields",
    template ? buildDefaultEnabledFieldsMap(template) : {},
  )

  // Mutation for creating project
  const createProjectMutation = useMutation({
      mutationFn: projectService.create,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          toast({
              title: "Project created",
              description: "Your new project has been successfully created.",
          })
          router.push("/projects")
      },
      onError: (error: any) => {
          console.error("Failed to create project:", error);
          toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create project. Please try again.",
          })
      }
  })

  // Reset columns/fields when methodology changes
  React.useEffect(() => {
    if (!template) return
    setColumns(template.columns)
    setEnabledFields(buildDefaultEnabledFieldsMap(template))
  }, [template, setColumns, setEnabledFields])

  const canCreate =
    Boolean(selectedMethodology) && projectName.trim().length > 0 && projectKey.trim().length > 0 && !createProjectMutation.isPending

  function handleCreate() {
    if (!selectedMethodology) return
    if (!projectName.trim() || !projectKey.trim()) return

    const start = startDate ? format(startDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
    const end = endDate ? format(endDate, "yyyy-MM-dd") : undefined

    createProjectMutation.mutate({
        key: projectKey.trim(),
        name: projectName.trim(),
        description: projectDesc.trim(),
        methodology: selectedMethodology.toUpperCase() as Methodology,
        start_date: start,
        end_date: end,
        columns: columns,
        custom_fields: enabledFields,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">Set up a new project with your preferred methodology</p>
      </div>

      {/* Project Details */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Basic information about your project</CardDescription>
          </div>

          <AiRecommendationModal onApply={(m) => setSelectedMethodology(m)} />
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Project Key</Label>
              <Input
                placeholder="e.g., PROJ"
                className="uppercase"
                maxLength={6}
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the project..."
              className="min-h-[100px]"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start", !startDate && "text-muted-foreground")}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start", !endDate && "text-muted-foreground")}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Select Methodology</CardTitle>
          <CardDescription>Choose how you want to manage this project</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {methodologies.map((method) => (
              <button
                key={method.value}
                onClick={() => setSelectedMethodology(method.value)}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all text-center",
                  selectedMethodology === method.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50",
                )}
                type="button"
              >
                <div
                  className={cn(
                    "p-3 rounded-full",
                    selectedMethodology === method.value ? "bg-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  <method.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{method.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{method.description}</p>
                </div>
              </button>
            ))}
          </div>

          {template ? (
            <div className="mt-6 space-y-4">
              {/* Preview */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Template Preview</CardTitle>
                  <CardDescription>{template.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((c, i) => (
                      <span key={`${c}-${i}`} className="text-xs rounded-full border px-3 py-1 bg-secondary">
                        {c}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customize Columns */}
              <CustomizeColumns columns={columns} onChange={setColumns} />

              {/* Task Fields */}
              <FieldToggles
                fields={template.taskFields.map((f) => ({
                  id: f.id,
                  label: f.label,
                  description: f.description,
                }))}
                enabled={enabledFields}
                onChange={setEnabledFields}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => router.push("/projects")}>
          Cancel
        </Button>

        <Button disabled={!canCreate} onClick={handleCreate} type="button">
          {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Project
        </Button>
      </div>
    </div>
  )
}

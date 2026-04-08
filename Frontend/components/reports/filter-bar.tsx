"use client"

import { useQuery } from "@tanstack/react-query"
import { ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { projectService, ProjectMember } from "@/services/project-service"
import { ReportFilters } from "@/services/report-service"
import { Badge } from "@/components/ui/badge"
import { Project } from "@/lib/types"

interface FilterBarProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", filters.projectId],
    queryFn: () => projectService.getMembers(filters.projectId!),
    enabled: !!filters.projectId,
  });

  const handleProjectChange = (value: string) => {
    onFiltersChange({
      ...filters,
      projectId: Number(value),
      assigneeIds: [], // reset assignees when project changes
    });
  };

  const handleAssigneeToggle = (userId: number, checked: boolean) => {
    const newIds = checked
      ? [...filters.assigneeIds, userId]
      : filters.assigneeIds.filter((id) => id !== userId);
    onFiltersChange({ ...filters, assigneeIds: newIds });
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({ ...filters, dateFrom: value || null });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({ ...filters, dateTo: value || null });
  };

  const dateRangeLabel =
    filters.dateFrom && filters.dateTo
      ? `${filters.dateFrom} – ${filters.dateTo}`
      : "Son 30 Gün";

  const assigneeLabel =
    filters.assigneeIds.length > 0
      ? `Atanan (${filters.assigneeIds.length})`
      : "Tümü";

  return (
    <Card className="p-4 w-full">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Proje select */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Proje</span>
          <Select
            value={filters.projectId ? String(filters.projectId) : ""}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Proje seçin" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project: Project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} ({project.key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Atanan multi-select */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Atanan</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-44 justify-between">
                <span className="truncate">{assigneeLabel}</span>
                {filters.assigneeIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {filters.assigneeIds.length}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-1 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              {members.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {filters.projectId ? "Üye bulunamadı." : "Önce proje seçin."}
                </div>
              )}
              {members.map((member: ProjectMember) => (
                <DropdownMenuCheckboxItem
                  key={member.id}
                  checked={filters.assigneeIds.includes(member.id)}
                  onCheckedChange={(checked) =>
                    handleAssigneeToggle(member.id, !!checked)
                  }
                >
                  {member.full_name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tarih Aralığı date range picker */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Tarih Aralığı</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-48 justify-between">
                <span className="truncate text-sm">{dateRangeLabel}</span>
                <ChevronDown className="h-4 w-4 ml-1 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Başlangıç</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Bitiş</label>
                  <input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
}

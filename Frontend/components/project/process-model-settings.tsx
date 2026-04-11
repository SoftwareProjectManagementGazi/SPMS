"use client"
import React, { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projectService } from "@/services/project-service"
import { processTemplateService } from "@/services/process-template-service"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Loader2, Info } from "lucide-react"
import type { Project, Methodology } from "@/lib/types"

interface ProcessModelSettingsProps {
  project: Project
  onUpdate: () => void
}

const METHODOLOGY_OPTIONS: { value: Methodology; label: string }[] = [
  { value: "scrum", label: "Scrum" },
  { value: "kanban", label: "Kanban" },
  { value: "waterfall", label: "Waterfall" },
  { value: "iterative", label: "Iteratif" },
]

export function ProcessModelSettings({ project, onUpdate }: ProcessModelSettingsProps) {
  const queryClient = useQueryClient()
  const processConfig = project.process_config || {}
  const currentMethodology = project.methodology

  // Local state for form values
  const [selectedMethodology, setSelectedMethodology] = useState<Methodology>(currentMethodology)
  const [pendingMethodology, setPendingMethodology] = useState<Methodology | null>(null)
  const [sprintDuration, setSprintDuration] = useState<number>(
    processConfig.sprint_duration_days ?? 14
  )
  const [enforceSequentialDeps, setEnforceSequentialDeps] = useState<boolean>(
    processConfig.enforce_sequential_dependencies ?? false
  )
  const [enforceWipLimits, setEnforceWipLimits] = useState<boolean>(
    processConfig.enforce_wip_limits ?? false
  )
  const [restrictExpiredSprints, setRestrictExpiredSprints] = useState<boolean>(
    processConfig.restrict_expired_sprints ?? false
  )
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Fetch all process templates (for methodology select options including custom)
  const { data: templates } = useQuery({
    queryKey: ["process-templates"],
    queryFn: processTemplateService.getAll,
  })

  // Detect changes
  const hasChanges =
    selectedMethodology !== currentMethodology ||
    sprintDuration !== (processConfig.sprint_duration_days ?? 14) ||
    enforceSequentialDeps !== (processConfig.enforce_sequential_dependencies ?? false) ||
    enforceWipLimits !== (processConfig.enforce_wip_limits ?? false) ||
    restrictExpiredSprints !== (processConfig.restrict_expired_sprints ?? false)

  const mutation = useMutation({
    mutationFn: ({
      methodology,
      updatedConfig,
    }: {
      methodology: Methodology
      updatedConfig: Record<string, any>
    }) =>
      projectService.update(project.id, {
        methodology: methodology.toUpperCase() as Methodology,
        process_config: updatedConfig,
      }),
    onSuccess: () => {
      toast.success("Surec modeli guncellendi.")
      queryClient.invalidateQueries({ queryKey: ["project", project.id] })
      onUpdate()
    },
    onError: () => {
      toast.error("Surec modeli guncellenemedi. Lutfen tekrar deneyin.")
      // Revert to original
      setSelectedMethodology(currentMethodology)
    },
  })

  function handleSave() {
    const updatedConfig = {
      ...processConfig,
      sprint_duration_days: sprintDuration,
      enforce_sequential_dependencies: enforceSequentialDeps,
      enforce_wip_limits: enforceWipLimits,
      restrict_expired_sprints: restrictExpiredSprints,
    }
    mutation.mutate({ methodology: selectedMethodology, updatedConfig })
  }

  function handleMethodologySelectChange(value: string) {
    const newMethodology = value as Methodology
    if (newMethodology !== currentMethodology) {
      setPendingMethodology(newMethodology)
      setConfirmOpen(true)
    } else {
      setSelectedMethodology(newMethodology)
    }
  }

  function handleConfirmMethodologyChange() {
    if (pendingMethodology) {
      setSelectedMethodology(pendingMethodology)
      setPendingMethodology(null)
    }
    setConfirmOpen(false)
  }

  function handleCancelMethodologyChange() {
    setPendingMethodology(null)
    setConfirmOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Current methodology */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-48 shrink-0">Mevcut Surec Modeli</Label>
        <Badge variant="secondary" className="uppercase">
          {currentMethodology}
        </Badge>
      </div>

      {/* Change methodology */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-48 shrink-0">Surec Modelini Degistir</Label>
        <Select value={selectedMethodology} onValueChange={handleMethodologySelectChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Metodoloji secin" />
          </SelectTrigger>
          <SelectContent>
            {METHODOLOGY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            {/* Custom templates from backend */}
            {templates
              ?.filter((t) => !t.is_builtin)
              .map((t) => (
                <SelectItem key={`custom-${t.id}`} value={`custom-${t.id}`}>
                  {t.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Behavioral flags */}
      <div className="mt-4 space-y-3">
        {/* enforce_sequential_dependencies */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-48 shrink-0">
            <Label className="text-sm font-medium">Sirali Bagimlilik Zorunlulugu</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">
                  Etkinlestirildiginde gorevler yalnizca onceki bagimli gorev tamamlandiktan sonra baslatilabilir.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            checked={enforceSequentialDeps}
            onCheckedChange={setEnforceSequentialDeps}
          />
        </div>

        {/* enforce_wip_limits */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-48 shrink-0">
            <Label className="text-sm font-medium">WIP Siniri Zorunlulugu</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">
                  Etkinlestirildiginde WIP (Ayni Anda Yapilan Is) siniri asildigi zaman uyari gosterilir.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            checked={enforceWipLimits}
            onCheckedChange={setEnforceWipLimits}
          />
        </div>

        {/* restrict_expired_sprints */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-48 shrink-0">
            <Label className="text-sm font-medium">Suresi Dolan Sprint Kisitlamasi</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">
                  Etkinlestirildiginde suresi dolan sprintlere yeni gorev eklenmesi kisitlanir.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            checked={restrictExpiredSprints}
            onCheckedChange={setRestrictExpiredSprints}
          />
        </div>
      </div>

      {/* Sprint duration */}
      <div className="flex items-center gap-3 mt-4">
        <Label className="text-sm font-medium w-48 shrink-0">Sprint Suresi</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={90}
            className="w-20 h-8 text-sm"
            value={sprintDuration}
            onChange={(e) => setSprintDuration(Number(e.target.value))}
          />
          <span className="text-sm text-muted-foreground">gun</span>
        </div>
      </div>

      {/* Save button */}
      <Button
        className="mt-4"
        disabled={!hasChanges || mutation.isPending}
        onClick={handleSave}
      >
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Surec Modelini Kaydet
      </Button>

      {/* Methodology change confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelMethodologyChange()
        }}
        title="Surec Modelini Degistir"
        description="Mevcut gorevler ve board kolonlari korunacak. SCRUM'dan gecis yapiyorsaniz aktif sprint'ler kapatilacak. Devam etmek istiyor musunuz?"
        confirmLabel="Degistir"
        onConfirm={handleConfirmMethodologyChange}
      />
    </div>
  )
}

"use client"
import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  processTemplateService,
  ProcessTemplate,
  CreateProcessTemplateDTO,
  UpdateProcessTemplateDTO,
} from "@/services/process-template-service"
import { toast } from "sonner"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, Eye, Pencil, Trash2, Loader2 } from "lucide-react"

interface ColumnEntry {
  name: string
  order: number
  wip_limit?: number
}

interface FormState {
  name: string
  description: string
  columns: ColumnEntry[]
}

const defaultFormState: FormState = {
  name: "",
  description: "",
  columns: [],
}

export function ProcessTemplatesTab() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ProcessTemplate | null>(null)
  const [form, setForm] = useState<FormState>(defaultFormState)

  const { data: templates, isLoading } = useQuery({
    queryKey: ["process-templates"],
    queryFn: processTemplateService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (dto: CreateProcessTemplateDTO) => processTemplateService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] })
      setDialogOpen(false)
      setForm(defaultFormState)
      toast.success("Sablon olusturuldu.")
    },
    onError: () => {
      toast.error("Sablon olusturulamadi. Lutfen tekrar deneyin.")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateProcessTemplateDTO }) =>
      processTemplateService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] })
      setDialogOpen(false)
      setEditingTemplate(null)
      setForm(defaultFormState)
      toast.success("Sablon guncellendi.")
    },
    onError: () => {
      toast.error("Sablon guncellenemedi. Lutfen tekrar deneyin.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => processTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] })
      toast.success("Sablon silindi.")
    },
    onError: () => {
      toast.error("Sablon silinemedi. Lutfen tekrar deneyin.")
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  function openCreateDialog() {
    setEditingTemplate(null)
    setForm(defaultFormState)
    setDialogOpen(true)
  }

  function openEditDialog(template: ProcessTemplate) {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      description: template.description ?? "",
      columns: template.columns.map((c) => ({ ...c })),
    })
    setDialogOpen(true)
  }

  function handleSave() {
    const dto = {
      name: form.name,
      description: form.description || undefined,
      columns: form.columns,
    }
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, dto })
    } else {
      createMutation.mutate(dto)
    }
  }

  function addColumn() {
    setForm((prev) => ({
      ...prev,
      columns: [...prev.columns, { name: "", order: prev.columns.length + 1 }],
    }))
  }

  function removeColumn(index: number) {
    setForm((prev) => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index),
    }))
  }

  function updateColumnName(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      columns: prev.columns.map((c, i) => (i === index ? { ...c, name: value } : c)),
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Surec Sablonlari</h2>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sablon
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sablon Adi</TableHead>
            <TableHead>Tur</TableHead>
            <TableHead>Kolon Sayisi</TableHead>
            <TableHead className="text-right">Eylemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : templates && templates.length > 0 ? (
            templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  {template.is_builtin ? (
                    <Badge variant="secondary">Yerlesik</Badge>
                  ) : (
                    <Badge variant="outline">Ozel</Badge>
                  )}
                </TableCell>
                <TableCell>{template.columns.length}</TableCell>
                <TableCell className="text-right">
                  {template.is_builtin ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" disabled>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Yerlesik sablonlar duzenlenemez.</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sablonu Duzenle</TooltipContent>
                      </Tooltip>

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Sablonu Sil</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sablonu Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu sablonu silmek istediginize emin misiniz? Bu islem geri alinamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Silme</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteMutation.mutate(template.id)}
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Henuz surec sablonu bulunmuyor.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Sablonu Duzenle" : "Yeni Sablon"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Sablon Adi</Label>
              <Input
                id="template-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ornek: Ozel Scrum"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Aciklama (opsiyonel)</Label>
              <Textarea
                id="template-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Bu sablon hakkinda kisaca aciklama..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Kolonlar</Label>
                <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                  <Plus className="h-3 w-3 mr-1" />
                  Kolon Ekle
                </Button>
              </div>
              {form.columns.map((col, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={col.name}
                    onChange={(e) => updateColumnName(index, e.target.value)}
                    placeholder={`Kolon ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeColumn(index)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.columns.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Henuz kolon eklenmedi.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Vazgec
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? "Degisiklikleri Uygula" : "Sablonu Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

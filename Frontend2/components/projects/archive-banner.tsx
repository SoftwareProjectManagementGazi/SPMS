"use client"
import * as React from "react"
import { AlertBanner, Button } from "@/components/primitives"
import { ConfirmDialog } from "./confirm-dialog"
import { useUpdateProjectStatus } from "@/hooks/use-projects"
import { useToast } from "@/components/toast"
import { useApp } from "@/context/app-context"

interface ArchiveBannerProps {
  projectId: number
  projectName: string
}

export function ArchiveBanner({ projectId, projectName }: ArchiveBannerProps) {
  const { language } = useApp()
  const { showToast } = useToast()
  const { mutate: updateStatus, isPending } = useUpdateProjectStatus()
  const [showConfirm, setShowConfirm] = React.useState(false)

  const handleReactivate = () => {
    updateStatus(
      { id: projectId, status: 'ACTIVE' },
      {
        onSuccess: () => {
          showToast({
            message: language === 'tr'
              ? `${projectName} yeniden aktif.`
              : `${projectName} reactivated.`,
            variant: 'success',
          })
        },
        onError: () => {
          showToast({
            message: language === 'tr'
              ? 'Bir şeyler ters gitti. Lütfen tekrar deneyin.'
              : 'Something went wrong. Please try again.',
            variant: 'error',
          })
        },
      }
    )
    setShowConfirm(false)
  }

  return (
    <>
      <AlertBanner
        tone="warning"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
          >
            {language === 'tr' ? 'Aktif Et' : 'Reactivate'}
          </Button>
        }
      >
        {language === 'tr'
          ? 'Bu proje arşivlenmiştir. İçerik düzenleme devre dışı.'
          : 'This project is archived. Content editing is disabled.'}
      </AlertBanner>

      <ConfirmDialog
        open={showConfirm}
        title={
          language === 'tr'
            ? 'Bu projeyi yeniden aktifleştirmek istediğinize emin misiniz?'
            : 'Reactivate this project?'
        }
        body={
          language === 'tr'
            ? 'Bu işlem daha sonra proje durumu değiştirilerek geri alınabilir.'
            : 'This action can be reversed by changing the project status later.'
        }
        confirmLabel={language === 'tr' ? 'Onayla' : 'Confirm'}
        cancelLabel={language === 'tr' ? 'İptal' : 'Cancel'}
        onConfirm={handleReactivate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}

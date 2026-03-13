"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AvatarCropDialogProps {
  file: File
  onConfirm: (croppedBlob: Blob) => void
  onCancel: () => void
}

// The circular crop window size shown in the dialog (px)
const PREVIEW_SIZE = 280
// Output image size written to the server (px)
const OUTPUT_SIZE = 256

export function AvatarCropDialog({ file, onConfirm, onCancel }: AvatarCropDialogProps) {
  const [imageUrl, setImageUrl] = React.useState("")
  const [naturalSize, setNaturalSize] = React.useState({ w: 0, h: 0 })
  // displayScale: factor to make the image fill (cover) the PREVIEW_SIZE square
  const [displayScale, setDisplayScale] = React.useState(1)
  // offset: how many display-px the image is shifted from the top-left of the crop window
  // Always ≤ 0 on both axes so image never shows a gap
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const [isConfirming, setIsConfirming] = React.useState(false)

  const isDragging = React.useRef(false)
  const dragOrigin = React.useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  // Create an object URL for the selected file
  React.useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nW = img.naturalWidth
    const nH = img.naturalHeight
    setNaturalSize({ w: nW, h: nH })

    // Cover: scale so the smaller side fills PREVIEW_SIZE
    const scale = Math.max(PREVIEW_SIZE / nW, PREVIEW_SIZE / nH)
    setDisplayScale(scale)

    // Center the image inside the crop window
    const dW = nW * scale
    const dH = nH * scale
    setOffset({
      x: -(dW - PREVIEW_SIZE) / 2,
      y: -(dH - PREVIEW_SIZE) / 2,
    })
  }

  /** Clamp offset so the image always covers the full PREVIEW_SIZE window */
  const clamp = (ox: number, oy: number) => {
    const dW = naturalSize.w * displayScale
    const dH = naturalSize.h * displayScale
    return {
      x: Math.min(0, Math.max(PREVIEW_SIZE - dW, ox)),
      y: Math.min(0, Math.max(PREVIEW_SIZE - dH, oy)),
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my
    setOffset(clamp(dragOrigin.current.ox + dx, dragOrigin.current.oy + dy))
  }

  const handlePointerUp = () => { isDragging.current = false }

  const handleConfirm = () => {
    if (!imageUrl || !naturalSize.w || isConfirming) return
    setIsConfirming(true)

    // Map display offset back to source image coordinates
    const scaleX = naturalSize.w / (naturalSize.w * displayScale)
    const srcX = -offset.x * scaleX
    const srcY = -offset.y * scaleX
    const srcSize = PREVIEW_SIZE * scaleX

    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext("2d")!

    // Clip to circle so transparent areas around the circle are blank in the PNG
    // (JPEG doesn't support transparency — use image/jpeg for opaque square)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      canvas.toBlob(
        (blob) => {
          setIsConfirming(false)
          if (blob) onConfirm(blob)
        },
        "image/jpeg",
        0.92,
      )
    }
    img.src = imageUrl
  }

  const dW = naturalSize.w * displayScale
  const dH = naturalSize.h * displayScale

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Profil Fotoğrafını Kırp</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center">
          Fotoğrafı sürükleyerek yüzünüzü daire içine alın.
        </p>

        {/* Circular crop window */}
        <div className="mx-auto select-none" style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}>
          <div
            className="relative overflow-hidden rounded-full border-2 border-primary"
            style={{
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              cursor: isDragging.current ? "grabbing" : "grab",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="crop preview"
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  width: dW || PREVIEW_SIZE,
                  height: dH || PREVIEW_SIZE,
                  maxWidth: "none",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Daire içindeki alan profil fotoğrafı olarak kaydedilecek.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={!imageUrl || isConfirming}>
            {isConfirming ? "Kaydediliyor..." : "Onayla ve Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

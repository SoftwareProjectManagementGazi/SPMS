/**
 * Yön-bilinçli React Flow handle seçimi — baskın eksene göre kenarın çıkış/
 * varış noktasını belirler. AI canvas ve apply (kalıcı workflow) aynı mantığı
 * paylaşır ki çizim her iki yüzeyde aynı görünsün.
 */

export interface EdgeHandles {
  sourceHandle: string
  targetHandle: string
}

export function pickEdgeHandles(
  source: { x: number; y: number } | undefined,
  target: { x: number; y: number } | undefined,
): EdgeHandles {
  const dx = (target?.x ?? 0) - (source?.x ?? 0)
  const dy = (target?.y ?? 0) - (source?.y ?? 0)

  if (Math.abs(dy) > Math.abs(dx)) {
    return dy > 0
      ? { sourceHandle: "bottom-source", targetHandle: "top-target" }
      : { sourceHandle: "top-source", targetHandle: "bottom-target" }
  }
  return dx >= 0
    ? { sourceHandle: "right-source", targetHandle: "left-target" }
    : { sourceHandle: "left-source", targetHandle: "right-target" }
}

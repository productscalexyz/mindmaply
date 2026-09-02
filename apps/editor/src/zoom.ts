// Low enough that fit-to-view can shrink large/deep diagrams fully into the
// canvas, including on a phone, where the canvas is a few hundred px wide.
export const ZOOM_MIN = 0.05
export const ZOOM_MAX = 4

export function clampZoom(z: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))
}

export function stepZoom(current: number, delta: number): number {
  return clampZoom(Math.round((current + delta) * 1000) / 1000)
}

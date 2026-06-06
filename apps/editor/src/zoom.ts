export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 4

export function clampZoom(z: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))
}

export function stepZoom(current: number, delta: number): number {
  return clampZoom(Math.round((current + delta) * 1000) / 1000)
}

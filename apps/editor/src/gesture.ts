// Geometry for the canvas gestures (drag-pan, pinch, anchored zoom). No DOM in
// here so it can be unit tested; Canvas.tsx feeds it pointer positions.

export interface Point {
  x: number
  y: number
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * The pan that keeps the diagram point under `anchor` (screen px) where it is
 * while zoom goes from `zoom` to `nextZoom`.
 *
 * The diagram is drawn as translate(pan) scale(zoom) about its own centre, and
 * that centre sits at `center` (screen px) when pan is zero. So a diagram point
 * `d` units from the centre lands at center + pan + d * zoom; hold the anchor
 * fixed and solve for the new pan.
 */
export function panForZoom(
  anchor: Point,
  center: Point,
  pan: Point,
  zoom: number,
  nextZoom: number,
): Point {
  const dx = (anchor.x - center.x - pan.x) / zoom
  const dy = (anchor.y - center.y - pan.y) / zoom
  return {
    x: anchor.x - center.x - dx * nextZoom,
    y: anchor.y - center.y - dy * nextZoom,
  }
}

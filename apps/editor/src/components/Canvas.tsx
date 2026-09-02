import { useRef, useEffect, useCallback, useState } from 'react'
import ZoomCluster from './ZoomCluster'
import { clampZoom } from '../zoom'
import { distance, midpoint, panForZoom, type Point } from '../gesture'
import { CHROME_EXTENSION_URL } from '../extension'

export interface BranchChip {
  id: string
  label: string
  color: string
  /** Node center in SVG viewBox coordinates. */
  x: number
  y: number
}

interface Props {
  svg: string
  zoom: number
  onZoomChange: (z: number) => void
  /** Info badge content (diagram kind + stats). Hidden when absent or in embed mode. */
  info?: { color: string; text: string }
  onShare: () => void
  onExport: () => void
  /** Embed mode: hide editor actions + info badge, show a small attribution link. */
  embed?: boolean
  /** Link back to the full editor for the "Made with mindmaply" credit (embed mode). */
  shareUrl?: string
  /** Level-1 branch chips: click pans/zooms the canvas to that branch. */
  chips?: BranchChip[]
  /** Stack the chips vertically on the left (used for LR maps). */
  chipsVertical?: boolean
  /** Touch-first layout: the source lives in a sheet behind an Edit button. */
  mobile?: boolean
  /** Opens that sheet (mobile only). */
  onEdit?: () => void
  /** Root node centre in SVG viewBox coordinates: where a phone opens a big map. */
  focus?: Point
}

// Below this, a fitted map is a thumbnail on a phone. Open on the root at this
// zoom instead; the chip strip and pinch take the reader from there.
const MOBILE_MIN_OPEN_ZOOM = 0.6

// The floating controls: a gesture that starts on one of these is theirs.
const CONTROLS = '.zoom-cluster, .canvas-actions, .canvas-info, .canvas-chips'

function parseViewBox(svgStr: string): [number, number, number, number] | null {
  const match = svgStr.match(/viewBox="([^"]+)"/)
  if (!match) return null
  const parts = match[1].trim().split(/\s+/).map(Number)
  return parts.length >= 4 ? (parts.slice(0, 4) as [number, number, number, number]) : null
}

function computeFitZoom(svgStr: string, el: HTMLDivElement): number {
  const match = svgStr.match(/viewBox="([^"]+)"/)
  if (!match) return 1
  const parts = match[1].trim().split(/\s+/).map(Number)
  if (parts.length < 4) return 1
  const [, , diagramW, diagramH] = parts
  // diagram-viewport has padding: 48px 32px 56px
  const canvasW = el.clientWidth - 64   // 32px each side
  const canvasH = el.clientHeight - 104 // 48px top + 56px bottom
  if (canvasW <= 0 || canvasH <= 0 || diagramW <= 0 || diagramH <= 0) return 1
  return clampZoom(Math.min(canvasW / diagramW, canvasH / diagramH))
}

// One in-flight gesture. `pan` follows a single pointer; `pinch` scales about
// the two pointers' midpoint and also pans with it, so a two-finger drag works.
interface Gesture {
  kind: 'pan' | 'pinch'
  startPan: Point
  startZoom: number
  /** Pointer position (pan) or pointer midpoint (pinch) at the start. */
  startPoint: Point
  startDist: number
  /** Screen position of the diagram centre at pan {0,0}, see viewportCenter. */
  center: Point
}

export default function Canvas({
  svg,
  zoom,
  onZoomChange,
  info,
  onShare,
  onExport,
  embed = false,
  shareUrl,
  chips,
  chipsVertical = false,
  mobile = false,
  onEdit,
  focus,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  // Pan offset (screen px) applied before the zoom scale; lets the user
  // drag the diagram around the canvas.
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [activeChip, setActiveChip] = useState<string | null>(null)

  // Live copies for the pointer handlers, which must not re-bind per render
  // (a re-bind mid-gesture would drop the pointer capture they rely on).
  const panRef = useRef(pan)
  const zoomRef = useRef(zoom)
  panRef.current = pan
  zoomRef.current = zoom

  // Auto-fit whenever SVG changes (edits, direction/sample/format switches).
  // On a phone a big map fits at a thumbnail scale nobody can read, so it
  // opens on the root at a legible zoom instead (same maths as centerOnChip).
  useEffect(() => {
    if (!svg || !canvasRef.current) return
    setActiveChip(null)
    const fit = computeFitZoom(svg, canvasRef.current)
    const vb = parseViewBox(svg)
    if (mobile && focus && vb && fit < MOBILE_MIN_OPEN_ZOOM) {
      const [minX, minY, w, h] = vb
      const z = MOBILE_MIN_OPEN_ZOOM
      // An LR map grows to the right of its root, so park the root in the
      // left third rather than the middle; TD maps hang below theirs.
      const shiftX = chipsVertical ? canvasRef.current.clientWidth * 0.22 : 0
      setPan({ x: (minX + w / 2 - focus.x) * z - shiftX, y: (minY + h / 2 - focus.y) * z + 4 })
      onZoomChange(z)
      return
    }
    setPan({ x: 0, y: 0 })
    onZoomChange(fit)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg])

  // Where the diagram centre sits on screen at pan {0,0}. Scaling is about the
  // centre, so the live element's centre is exactly that plus the current pan.
  const viewportCenter = useCallback((): Point => {
    const r = innerRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return { x: r.left + r.width / 2 - panRef.current.x, y: r.top + r.height / 2 - panRef.current.y }
  }, [])

  // Zoom to `next`, keeping the diagram point under `anchor` where it is.
  const zoomAt = useCallback(
    (next: number, anchor: Point) => {
      const z = clampZoom(next)
      setPan(panForZoom(anchor, viewportCenter(), panRef.current, zoomRef.current, z))
      onZoomChange(z)
    },
    [onZoomChange, viewportCenter],
  )

  // Center the viewport on a branch node. The diagram is flex-centered at
  // pan {0,0} and scales about its own center, so a point offset `d` from the
  // diagram center lands `d * zoom` screen px from the viewport center.
  const centerOnChip = useCallback(
    (chip: BranchChip, button: HTMLElement) => {
      const vb = parseViewBox(svg)
      if (!vb) return
      const [minX, minY, w, h] = vb
      const cx = minX + w / 2
      const cy = minY + h / 2
      // Zoom in to a readable level if the map is currently fitted-out tiny.
      const z = clampZoom(Math.max(zoom, 0.75))
      if (z !== zoom) onZoomChange(z)
      // +4 compensates the viewport's asymmetric vertical padding (48/56).
      setPan({ x: (cx - chip.x) * z, y: (cy - chip.y) * z + 4 })
      setActiveChip(chip.id)
      // The mobile strip scrolls; bring the chosen chip into view.
      button.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    },
    [svg, zoom, onZoomChange],
  )

  // Re-fit when the canvas itself resizes (window or panel-divider drag).
  // Not on mobile: there a resize is the keyboard or the sheet coming up, and
  // snapping the map back to fit under the reader's fingers is a jolt.
  useEffect(() => {
    const el = canvasRef.current
    if (!el || mobile) return
    const ro = new ResizeObserver(() => {
      if (svg) onZoomChange(computeFitZoom(svg, el))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [svg, onZoomChange, mobile])

  const handleFit = useCallback(() => {
    if (!canvasRef.current || !svg) return
    setPan({ x: 0, y: 0 })
    setActiveChip(null)
    onZoomChange(computeFitZoom(svg, canvasRef.current))
  }, [svg, onZoomChange])

  // Pointer gestures: one pointer pans, two pinch-zoom (and pan). Pointer
  // Events cover mouse, touch and pen alike; the CSS `touch-action: none` on
  // .canvas keeps the browser from claiming the touches for page zoom/scroll.
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)

  // (Re)start the gesture from whatever pointers are down. Called on every
  // pointer add/remove so lifting one finger of a pinch continues as a pan.
  const rebaseGesture = useCallback(() => {
    const pts = [...pointers.current.values()]
    if (pts.length >= 2) {
      gesture.current = {
        kind: 'pinch',
        startPan: panRef.current,
        startZoom: zoomRef.current,
        startPoint: midpoint(pts[0], pts[1]),
        startDist: distance(pts[0], pts[1]),
        center: viewportCenter(),
      }
    } else if (pts.length === 1) {
      gesture.current = {
        kind: 'pan',
        startPan: panRef.current,
        startZoom: zoomRef.current,
        startPoint: pts[0],
        startDist: 0,
        center: viewportCenter(),
      }
    } else {
      gesture.current = null
    }
    setDragging(pts.length > 0)
  }, [viewportCenter])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      if ((e.target as Element).closest(CONTROLS)) return
      e.preventDefault()
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      // Capture so moves keep arriving when the pointer leaves the canvas.
      e.currentTarget.setPointerCapture(e.pointerId)
      rebaseGesture()
    },
    [rebaseGesture],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const g = gesture.current
      if (!g) return
      if (g.kind === 'pan') {
        setPan({
          x: g.startPan.x + (e.clientX - g.startPoint.x),
          y: g.startPan.y + (e.clientY - g.startPoint.y),
        })
        return
      }
      const [a, b] = [...pointers.current.values()]
      if (!a || !b || g.startDist === 0) return
      const next = clampZoom((g.startZoom * distance(a, b)) / g.startDist)
      // Hold the diagram point that was under the initial midpoint under the
      // current midpoint: zoom anchored there, plus the midpoint's own drift.
      const anchored = panForZoom(g.startPoint, g.center, g.startPan, g.startZoom, next)
      const mid = midpoint(a, b)
      setPan({
        x: anchored.x + (mid.x - g.startPoint.x),
        y: anchored.y + (mid.y - g.startPoint.y),
      })
      onZoomChange(next)
    },
    [onZoomChange],
  )

  const onPointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.delete(e.pointerId)) return
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      rebaseGesture()
    },
    [rebaseGesture],
  )

  // Double-click / double-tap: zoom in about that point.
  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as Element).closest(CONTROLS)) return
      zoomAt(zoomRef.current * 1.6, { x: e.clientX, y: e.clientY })
    },
    [zoomAt],
  )

  // Wheel zoom, anchored under the cursor. A trackpad pinch arrives as a wheel
  // with ctrlKey and fine-grained deltas, so it gets a proportional step.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      if ((e.target as Element).closest(CONTROLS)) return
      e.preventDefault()
      const z = zoomRef.current
      const next = e.ctrlKey ? z * Math.exp(-e.deltaY * 0.01) : z + (e.deltaY > 0 ? -0.08 : 0.08)
      zoomAt(next, { x: e.clientX, y: e.clientY })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  return (
    <div
      className={`canvas${dragging ? ' is-panning' : ''}`}
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onDoubleClick={onDoubleClick}
    >
      {/* zoomable + pannable diagram */}
      <div className="diagram-viewport">
        <div
          ref={innerRef}
          className="diagram-inner"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: dragging ? 'none' : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* branch chapter chips (editor only). One per level-1 branch; clicking
          pans/zooms to it — the way into a big map. Top-left on desktop, a
          thumb-reach strip along the bottom on mobile (.is-mobile CSS). */}
      {!embed && chips && chips.length > 1 && (
        <div className={`canvas-chips${chipsVertical ? ' vertical' : ''}`}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              className={`chip${activeChip === chip.id ? ' on' : ''}`}
              onClick={(e) => centerOnChip(chip, e.currentTarget)}
              title={chip.label}
            >
              <span className="chip-dot" style={{ background: chip.color }} />
              <span className="chip-lbl">{chip.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* top-right: actions (editor only). On mobile the YouTube link gives
          way to Edit: the extension is desktop Chrome, the sheet is how the
          source is reached. */}
      {!embed && (
        <div className="canvas-actions">
          {mobile ? (
            <button className="ca-btn ca-edit" onClick={onEdit}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5l2 2L5 13H3v-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="ca-lbl">Edit</span>
            </button>
          ) : (
            <a
              className="ca-btn ca-ext"
              href={CHROME_EXTENSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Turn YouTube videos into mind maps: get the Chrome extension"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6.8 6.2v3.6L9.9 8z" fill="currentColor" />
              </svg>
              <span className="ca-lbl">YouTube</span>
            </a>
          )}
          <button className="ca-btn ca-export" onClick={onExport} aria-label="Export">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v9M5 8l3 3 3-3M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ca-lbl">Export</span>
          </button>
          <button className="ca-btn ca-share" onClick={onShare}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 2l4 4-4 4M14 6H6a4 4 0 000 8h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ca-lbl">Share</span>
          </button>
        </div>
      )}

      {/* bottom-right: zoom */}
      <ZoomCluster zoom={zoom} onChange={onZoomChange} onFit={handleFit} />

      {/* bottom-left: info badge (editor only — diagram kind + live stats) */}
      {!embed && info && (
        <div className="canvas-info">
          <div className="ci-dot" style={{ background: info.color }} />
          <span className="ci-text">{info.text}</span>
        </div>
      )}

      {/* embed: unobtrusive attribution / funnel back to the editor */}
      {embed && (
        <a
          className="embed-credit"
          href={shareUrl ?? 'https://mindmaply.app'}
          target="_blank"
          rel="noopener noreferrer"
        >
          Made with mindmaply
        </a>
      )}
    </div>
  )
}

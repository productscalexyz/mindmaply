import { useRef, useEffect, useCallback, useState } from 'react'
import ZoomCluster from './ZoomCluster'
import { clampZoom } from '../zoom'

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

export default function Canvas({
  svg,
  zoom,
  onZoomChange,
  info,
  onShare,
  onExport,
  embed = false,
  shareUrl,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Pan offset (screen px) applied before the zoom scale; lets the user
  // click-drag the diagram around the canvas.
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  // Auto-fit whenever SVG changes (edits, direction/sample/format switches)
  useEffect(() => {
    if (!svg || !canvasRef.current) return
    setPan({ x: 0, y: 0 })
    onZoomChange(computeFitZoom(svg, canvasRef.current))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg])

  // Re-fit when the canvas itself resizes (window or panel-divider drag)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (svg) onZoomChange(computeFitZoom(svg, el))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [svg, onZoomChange])

  const handleFit = useCallback(() => {
    if (!canvasRef.current || !svg) return
    setPan({ x: 0, y: 0 })
    onZoomChange(computeFitZoom(svg, canvasRef.current))
  }, [svg, onZoomChange])

  // Click-drag panning. Ignore drags that start on the floating controls so
  // their buttons keep working.
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as Element
    if (target.closest('.zoom-cluster, .canvas-actions, .canvas-info')) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const origin = { ...pan }
    setDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    const move = (ev: PointerEvent) => {
      setPan({ x: origin.x + (ev.clientX - startX), y: origin.y + (ev.clientY - startY) })
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [pan])

  // Scroll-wheel zoom
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      const target = e.target as Element
      if (target.closest('.zoom-cluster, .canvas-actions, .canvas-info')) return
      e.preventDefault()
      onZoomChange(zoom + (e.deltaY > 0 ? -0.08 : 0.08))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoom, onZoomChange])

  return (
    <div
      className={`canvas${dragging ? ' is-panning' : ''}`}
      ref={canvasRef}
      onPointerDown={onPointerDown}
    >
      {/* zoomable + pannable diagram */}
      <div className="diagram-viewport">
        <div
          className="diagram-inner"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: dragging ? 'none' : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* top-right: actions (editor only) */}
      {!embed && (
        <div className="canvas-actions">
          <button className="ca-btn ca-export" onClick={onExport}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v9M5 8l3 3 3-3M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export
          </button>
          <button className="ca-btn ca-share" onClick={onShare}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 2l4 4-4 4M14 6H6a4 4 0 000 8h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share
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

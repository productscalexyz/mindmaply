import { useRef, useEffect, useCallback } from 'react'
import { SAMPLES, type SampleId, type Direction } from '../samples'
import SampleBar from './SampleBar'
import ZoomCluster from './ZoomCluster'
import { clampZoom } from '../zoom'

interface Props {
  svg: string
  zoom: number
  onZoomChange: (z: number) => void
  sample: SampleId
  direction: Direction
  onSampleChange: (id: SampleId) => void
  onShare: () => void
  onExport: () => void
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
  sample,
  direction,
  onSampleChange,
  onShare,
  onExport,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const config = SAMPLES[sample]

  // Auto-fit whenever SVG changes
  useEffect(() => {
    if (!svg || !canvasRef.current) return
    onZoomChange(computeFitZoom(svg, canvasRef.current))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg])

  const handleFit = useCallback(() => {
    if (!canvasRef.current || !svg) return
    onZoomChange(computeFitZoom(svg, canvasRef.current))
  }, [svg, onZoomChange])

  // Scroll-wheel zoom
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      const target = e.target as Element
      if (target.closest('.zoom-cluster, .sample-bar, .canvas-actions, .canvas-info')) return
      e.preventDefault()
      onZoomChange(zoom + (e.deltaY > 0 ? -0.08 : 0.08))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoom, onZoomChange])

  return (
    <div className="canvas" ref={canvasRef}>
      {/* zoomable diagram */}
      <div className="diagram-viewport">
        <div
          className="diagram-inner"
          style={{ transform: `scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* top-left: sample tabs */}
      <SampleBar active={sample} onChange={onSampleChange} />

      {/* top-right: actions */}
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

      {/* bottom-right: zoom */}
      <ZoomCluster zoom={zoom} onChange={onZoomChange} />

      {/* bottom-left: info badge */}
      <div className="canvas-info">
        <div className="ci-dot" style={{ background: config.color }} />
        <span className="ci-text">{config.info(direction)}</span>
      </div>
    </div>
  )
}

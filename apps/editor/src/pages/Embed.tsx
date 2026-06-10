import { useRef, useState, useEffect } from 'react'
import Canvas from '../components/Canvas'
import { readSharedFromUrl, buildShareUrl } from '../share'
import { renderFromPayload } from '../render'
import { clampZoom } from '../zoom'
import type { SampleId, Direction } from '../samples'

// Chrome-less, canvas-only view meant to be dropped into an <iframe> on a
// third-party page (#/embed?d=...). Reuses the editor's Canvas (zoom/pan) but
// hides the toolbar, panel, and info badge.
export default function Embed() {
  // Read the shared payload once at mount — same param shape as the editor.
  const payload = useRef(readSharedFromUrl()).current
  const [zoom, setZoom] = useState(1)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    if (!payload) return
    try {
      setSvg(renderFromPayload(payload))
    } catch {
      // Leave the canvas empty on malformed input rather than crashing the frame.
    }
  }, [payload])

  if (!payload) {
    return <div className="embed-empty">No diagram to display.</div>
  }

  return (
    <div className="embed-root">
      <Canvas
        svg={svg}
        zoom={zoom}
        onZoomChange={(z) => setZoom(clampZoom(z))}
        sample={(payload.sample as SampleId) ?? 'org'}
        direction={payload.direction as Direction}
        onShare={() => {}}
        onExport={() => {}}
        embed
        shareUrl={buildShareUrl(payload)}
      />
    </div>
  )
}

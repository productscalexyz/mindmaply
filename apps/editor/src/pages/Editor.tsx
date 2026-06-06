import { useState, useCallback, useEffect, useRef } from 'react'
import {
  render,
  renderMarkdown,
  parse,
  parseMarkdown,
  toMarkdown,
  toMermaid,
} from 'mindmaply-core'
import { SAMPLES, getSampleSource, type SampleId, type Direction } from '../samples'
import { clampZoom } from '../zoom'
import EditorPanel from '../components/EditorPanel'
import Canvas from '../components/Canvas'
import ShareModal from '../components/ShareModal'
import ExportModal from '../components/ExportModal'

type Format = 'mermaid' | 'markdown'

export default function Editor() {
  const [sample, setSample] = useState<SampleId>('org')
  const [direction, setDirection] = useState<Direction>('TD')
  const [zoom, setZoomRaw] = useState(1)
  const [shareOpen, setShareOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [svg, setSvg] = useState('')
  const [source, setSource] = useState(() => getSampleSource('org', 'TD'))
  const [format, setFormat] = useState<Format>('mermaid')
  const [panelWidth, setPanelWidth] = useState(() => Math.round(window.innerWidth * 0.27))
  const dragging = useRef(false)

  const setZoom = useCallback((z: number) => setZoomRaw(clampZoom(z)), [])

  // Reset source and format when sample or direction changes
  useEffect(() => {
    setSource(getSampleSource(sample, direction))
    setFormat('mermaid')
  }, [sample, direction])

  // Re-render diagram whenever source or format changes
  useEffect(() => {
    const config = SAMPLES[sample]
    try {
      const result =
        format === 'markdown'
          ? renderMarkdown(source)
          : render(source, { layout: config.layout })
      setSvg(result)
    } catch (err) {
      console.error('mindmaply-core render error:', err)
    }
  }, [source, sample, format])

  // Keyboard zoom shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === '=') { e.preventDefault(); setZoom(zoom + 0.15) }
      if (e.key === '-') { e.preventDefault(); setZoom(zoom - 0.15) }
      if (e.key === '0') { e.preventDefault(); setZoom(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom, setZoom])

  // Convert source to the new format when switching tabs
  const handleFormatChange = useCallback((newFormat: Format) => {
    if (newFormat === format) return
    try {
      const ast = format === 'mermaid' ? parse(source) : parseMarkdown(source)
      const converted = newFormat === 'markdown' ? toMarkdown(ast) : toMermaid(ast)
      setFormat(newFormat)
      setSource(converted)
    } catch {
      // If conversion fails, just switch the format label without changing source
      setFormat(newFormat)
    }
  }, [format, source])

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startW = panelWidth

    function onMove(ev: MouseEvent) {
      const newW = Math.max(180, Math.min(window.innerWidth * 0.6, startW + (ev.clientX - startX)))
      setPanelWidth(Math.round(newW))
    }
    function onUp() {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth])

  return (
    <>
      <div className="app">
        <div className="body">
          <EditorPanel
            sample={sample}
            direction={direction}
            onDirectionChange={setDirection}
            source={source}
            onSourceChange={setSource}
            format={format}
            onFormatChange={handleFormatChange}
            width={panelWidth}
          />
          <div className="resize-handle" onMouseDown={onResizeStart} />
          <Canvas
            svg={svg}
            zoom={zoom}
            onZoomChange={setZoom}
            sample={sample}
            direction={direction}
            onSampleChange={setSample}
            onShare={() => setShareOpen(true)}
            onExport={() => setExportOpen(true)}
          />
        </div>
      </div>
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      {exportOpen && (
        <ExportModal
          svg={svg}
          source={source}
          sourceFormat={format}
          baseName={SAMPLES[sample].file.replace(/\.mmd$/, '')}
          onClose={() => setExportOpen(false)}
        />
      )}
    </>
  )
}

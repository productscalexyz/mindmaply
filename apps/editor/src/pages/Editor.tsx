import { useState, useCallback, useEffect, useRef } from 'react'
import {
  render,
  renderMarkdown,
  parse,
  parseMarkdown,
  toMarkdown,
  toMermaid,
  validate,
  type ValidationError,
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
  // Markdown is the primary editing format — samples are stored as Mermaid, so convert on load
  const [source, setSource] = useState(() => toMarkdown(parse(getSampleSource('org', 'TD'))))
  const [format, setFormat] = useState<Format>('markdown')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [panelWidth, setPanelWidth] = useState(() => Math.round(window.innerWidth * 0.27))
  const dragging = useRef(false)

  const setZoom = useCallback((z: number) => setZoomRaw(clampZoom(z)), [])

  // Load a sample's source, keeping the current format
  const handleSampleChange = useCallback((id: SampleId) => {
    setSample(id)
    const src = getSampleSource(id, direction)
    setSource(format === 'markdown' ? toMarkdown(parse(src)) : src)
  }, [direction, format])

  // Change direction without discarding user edits: in Mermaid mode the
  // `flowchart TD|LR` header is the source of truth, so rewrite just that
  // line; in Markdown mode direction is a render option (no source change).
  const handleDirectionChange = useCallback((d: Direction) => {
    setDirection(d)
    if (format === 'mermaid') {
      setSource((prev: string) =>
        /^(\s*)flowchart\s+\w+/m.test(prev)
          ? prev.replace(/^(\s*)flowchart\s+\w+/m, `$1flowchart ${d}`)
          : `flowchart ${d}\n${prev}`
      )
    }
  }, [format])

  // Re-render diagram and re-validate whenever source, format, or direction changes
  useEffect(() => {
    const config = SAMPLES[sample]
    const result = validate(source, format)
    try {
      const svgStr =
        format === 'markdown'
          ? renderMarkdown(source, { layout: config.layout, direction })
          : render(source, { layout: config.layout })
      setSvg(svgStr)
      setErrors(result.errors)
    } catch (err) {
      // Keep the last good diagram; surface the render error in the status bar
      const message = err instanceof Error ? err.message : String(err)
      setErrors(result.valid ? [{ line: 1, message }] : result.errors)
    }
  }, [source, sample, format, direction])

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
      const converted =
        newFormat === 'markdown' ? toMarkdown(ast) : toMermaid(ast, direction)
      setFormat(newFormat)
      setSource(converted)
    } catch {
      // If conversion fails, just switch the format label without changing source
      setFormat(newFormat)
    }
  }, [format, source, direction])

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
            onSampleChange={handleSampleChange}
            direction={direction}
            onDirectionChange={handleDirectionChange}
            source={source}
            onSourceChange={setSource}
            format={format}
            onFormatChange={handleFormatChange}
            errors={errors}
            width={panelWidth}
          />
          <div className="resize-handle" onMouseDown={onResizeStart} />
          <Canvas
            svg={svg}
            zoom={zoom}
            onZoomChange={setZoom}
            sample={sample}
            direction={direction}
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

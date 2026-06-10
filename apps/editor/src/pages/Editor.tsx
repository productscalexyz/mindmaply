import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  parse,
  parseMarkdown,
  toMarkdown,
  toMermaid,
  validate,
  type ValidationError,
} from 'mindmaply-core'
import { SAMPLES, getSampleSource, type SampleId, type Direction } from '../samples'
import { clampZoom } from '../zoom'
import { renderFromPayload } from '../render'
import EditorPanel from '../components/EditorPanel'
import Canvas from '../components/Canvas'
import ShareModal from '../components/ShareModal'
import ExportModal from '../components/ExportModal'
import { readSharedFromUrl, buildShareUrl, buildEmbedUrl, buildImgEmbedCode } from '../share'

type Format = 'mermaid' | 'markdown'

export default function Editor() {
  // If the page was opened from a shared link (#/editor?d=...), seed the
  // initial state from it. Read once at mount; bad/garbled params -> null.
  const shared = useRef(readSharedFromUrl()).current

  // `sample` is opaque in the payload (may be absent on API-made links); fall
  // back to a known built-in so SAMPLES[sample] lookups stay safe.
  const initialSample: SampleId =
    shared?.sample && shared.sample in SAMPLES ? (shared.sample as SampleId) : 'org'
  const [sample, setSample] = useState<SampleId>(initialSample)
  const [direction, setDirection] = useState<Direction>(shared?.direction ?? 'TD')
  const [zoom, setZoomRaw] = useState(1)
  const [shareOpen, setShareOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [svg, setSvg] = useState('')
  // Markdown is the primary editing format — samples are stored as Mermaid, so convert on load
  const [source, setSource] = useState(
    () => shared?.source ?? toMarkdown(parse(getSampleSource('org', 'TD')))
  )
  const [format, setFormat] = useState<Format>(shared?.format ?? 'markdown')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [panelWidth, setPanelWidth] = useState(() => Math.round(window.innerWidth * 0.27))
  const dragging = useRef(false)

  // Live shareable link + embed snippets encoding the current editor state.
  const shareUrl = useMemo(
    () => buildShareUrl({ v: 1, source, format, direction, sample }),
    [source, format, direction, sample]
  )
  const embedCode = useMemo(() => {
    const url = buildEmbedUrl({ v: 1, source, format, direction, sample })
    return `<iframe src="${url}" width="800" height="500" style="border:0;border-radius:12px" loading="lazy"></iframe>`
  }, [source, format, direction, sample])
  const imgCode = useMemo(
    () => buildImgEmbedCode({ v: 1, source, format, direction, sample }),
    [source, format, direction, sample]
  )

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
    const result = validate(source, format)
    try {
      const svgStr = renderFromPayload({ v: 1, source, format, direction, sample })
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
            width={collapsed ? 0 : panelWidth}
          />
          {!collapsed && (
            <div className="resize-handle" onMouseDown={onResizeStart}>
              <button
                className="collapse-btn"
                onClick={() => setCollapsed(true)}
                aria-label="Hide editor"
              >
                «
              </button>
            </div>
          )}
          {collapsed && (
            <button
              className="expand-tab"
              onClick={() => setCollapsed(false)}
              aria-label="Show editor"
            >
              »
            </button>
          )}
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
      {shareOpen && (
        <ShareModal
          url={shareUrl}
          embedCode={embedCode}
          imgCode={imgCode}
          onClose={() => setShareOpen(false)}
        />
      )}
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

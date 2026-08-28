import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  parse,
  parseMarkdown,
  toMarkdown,
  toMermaid,
  validate,
  type ValidationError,
} from 'mindmaply-core'
import { SAMPLES, getSampleSource, type SampleId, type Direction, type EdgeStyle } from '../samples'
import { diagramType, DIAGRAM_TYPE_COLORS } from '../diagram-type'
import { clampZoom } from '../zoom'
import { renderFromPayload, layoutFromPayload } from '../render'
import EditorPanel from '../components/EditorPanel'
import Canvas from '../components/Canvas'
import ShareModal from '../components/ShareModal'
import ExportModal from '../components/ExportModal'
import {
  readSharedFromUrl,
  buildShareUrl,
  buildShareApiUrl,
  buildEmbedUrl,
  buildImgEmbedCode,
  shortenShareUrl,
  buildImgEmbedCodeForId,
} from '../share'

type Format = 'mermaid' | 'markdown'

// Was the editor opened in map-first mode (`view=map` on the hash query, the
// YouTube extension flow)? Read once at mount, like the shared payload.
function openedWithMapView(): boolean {
  const q = window.location.hash.split('?')[1]
  return q ? new URLSearchParams(q).get('view') === 'map' : false
}

// Append view=map to a share link: `?` for /s landing URLs, `&` for hash-route
// editor links (whose payload query already starts with ?d=).
function withMapView(url: string): string {
  return `${url}${url.includes('#/') ? '&' : '?'}view=map`
}

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
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>(
    shared?.edgeStyle ?? SAMPLES[initialSample].edgeStyle
  )
  const [zoom, setZoomRaw] = useState(1)
  const [shareOpen, setShareOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  // `view=map` on the hash query opens with the source panel collapsed: links
  // handed to viewers (e.g. the YouTube extension flow) show the map first.
  // The toggle still works; the param only sets the initial state. Shares
  // made from such a session inherit it (mapFirst), so a re-shared link keeps
  // hiding the markdown for the next viewer too.
  const mapFirst = useRef(openedWithMapView()).current
  const [collapsed, setCollapsed] = useState(mapFirst)
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
  // Prefer the API's /s link when configured: it unfurls with a preview image
  // of the diagram when pasted (Slack, X, …), then redirects into the editor.
  const shareUrl = useMemo(() => {
    const payload = { v: 1, source, format, direction, edgeStyle, sample } as const
    const url = buildShareApiUrl(payload) ?? buildShareUrl(payload)
    return mapFirst ? withMapView(url) : url
  }, [source, format, direction, edgeStyle, sample, mapFirst])
  const embedCode = useMemo(() => {
    const url = buildEmbedUrl({ v: 1, source, format, direction, edgeStyle, sample })
    return `<iframe src="${url}" width="800" height="500" style="border:0;border-radius:12px" loading="lazy"></iframe>`
  }, [source, format, direction, edgeStyle, sample])
  const imgCode = useMemo(
    () => buildImgEmbedCode({ v: 1, source, format, direction, edgeStyle, sample }),
    [source, format, direction, edgeStyle, sample]
  )

  // Opening the Share modal asks the API to store the map and hand back a
  // short link (long URLs choke social platforms). The long link shows
  // instantly and simply stays if the request fails or the API is unset.
  const [shortLink, setShortLink] = useState<{ id: string; url: string } | null>(null)
  useEffect(() => {
    if (!shareOpen) return
    setShortLink(null)
    let cancelled = false
    shortenShareUrl({ v: 1, source, format, direction, edgeStyle, sample }).then((r) => {
      if (!cancelled && r) setShortLink(r)
    })
    return () => {
      cancelled = true
    }
  }, [shareOpen, source, format, direction, edgeStyle, sample])

  const setZoom = useCallback((z: number) => setZoomRaw(clampZoom(z)), [])

  // Canvas info badge: diagram type (colored — what's drawn) · language
  // (the syntax it's written in) · live node count. Tracks edits, never
  // shows the sample/file name.
  const canvasInfo = useMemo(() => {
    const type = diagramType(source, format)
    let text = `${type} · ${format}`
    try {
      const ast = format === 'markdown' ? parseMarkdown(source) : parse(source)
      text += ` · ${ast.nodes.size} nodes`
    } catch {
      // unparseable mid-edit — show type · language alone
    }
    return { color: DIAGRAM_TYPE_COLORS[type], text }
  }, [source, format])

  // Branch chapter chips: one per level-1 branch, positions from the same
  // layout the renderer uses, so a chip click can center its branch exactly.
  const chips = useMemo(() => {
    try {
      const { root, direction: dir } = layoutFromPayload({
        v: 1, source, format, direction, edgeStyle, sample,
      })
      return {
        // LR maps grow rightward from a left root, so a vertical rail on the
        // left mirrors the map; TD maps keep the horizontal top row.
        vertical: dir === 'LR',
        items: root.children.map((c) => ({
          id: c.id,
          label: c.label,
          color: c.branchColor,
          x: c.x,
          y: c.y,
        })),
      }
    } catch {
      return { vertical: false, items: [] }
    }
  }, [source, format, direction, edgeStyle, sample])

  // Load a sample's source, keeping the current format. The sample's
  // preferred edge style is just a starting point — both toggles stay live.
  const handleSampleChange = useCallback((id: SampleId) => {
    setSample(id)
    setEdgeStyle(SAMPLES[id].edgeStyle)
    const src = getSampleSource(id, direction)
    setSource(format === 'markdown' ? toMarkdown(parse(src)) : src)
  }, [direction, format])

  // Change direction without discarding user edits: when a Mermaid source has
  // a `flowchart TD|LR` header, that header is the source of truth, so rewrite
  // just that line. Otherwise (markdown, mermaid mindmap blocks) direction is
  // a render option — no source change needed.
  const handleDirectionChange = useCallback((d: Direction) => {
    setDirection(d)
    if (format === 'mermaid') {
      setSource((prev: string) =>
        /^(\s*)flowchart\s+\w+/m.test(prev)
          ? prev.replace(/^(\s*)flowchart\s+\w+/m, `$1flowchart ${d}`)
          : prev
      )
    }
  }, [format])

  // Re-render diagram and re-validate whenever source, format, direction, or edge style changes
  useEffect(() => {
    const result = validate(source, format)
    try {
      const svgStr = renderFromPayload({ v: 1, source, format, direction, edgeStyle, sample })
      setSvg(svgStr)
      setErrors(result.errors)
    } catch (err) {
      // Keep the last good diagram; surface the render error in the status bar
      const message = err instanceof Error ? err.message : String(err)
      setErrors(result.valid ? [{ line: 1, message }] : result.errors)
    }
  }, [source, sample, format, direction, edgeStyle])

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
            edgeStyle={edgeStyle}
            onEdgeStyleChange={setEdgeStyle}
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
            info={canvasInfo}
            onShare={() => setShareOpen(true)}
            onExport={() => setExportOpen(true)}
            chips={chips.items}
            chipsVertical={chips.vertical}
          />
        </div>
      </div>
      {shareOpen && (
        <ShareModal
          url={shortLink ? (mapFirst ? withMapView(shortLink.url) : shortLink.url) : shareUrl}
          embedCode={embedCode}
          imgCode={(shortLink && buildImgEmbedCodeForId(shortLink.id)) ?? imgCode}
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

import { useCallback, useMemo, useRef } from 'react'
import { SAMPLES, type SampleId, type Direction } from '../samples'
import { highlight } from '../highlight'

interface Props {
  sample: SampleId
  direction: Direction
  onDirectionChange: (d: Direction) => void
  source: string
  onSourceChange: (s: string) => void
  format: 'mermaid' | 'markdown'
  onFormatChange: (f: 'mermaid' | 'markdown') => void
  width?: number
}

export default function EditorPanel({
  sample,
  direction,
  onDirectionChange,
  source,
  onSourceChange,
  format,
  onFormatChange,
  width,
}: Props) {
  const config = SAMPLES[sample]
  const highlighted = useMemo(() => highlight(source, format), [source, format])
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLPreElement>(null)

  const lineNumbers = useMemo(
    () => source.split('\n').map((_, i) => i + 1).join('\n'),
    [source]
  )

  const syncScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop
      preRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
    if (gutterRef.current) {
      // Sync vertical scroll only; gutter clips horizontally via overflow:hidden
      gutterRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }, [])

  const filename = format === 'markdown' ? 'diagram.md' : 'diagram.mmd'

  return (
    <div className="editor" style={width != null ? { width } : undefined}>
      <div className="ep-header">
        <div className="fmt-tabs">
          <button
            className={`fmt-tab${format === 'mermaid' ? ' on' : ''}`}
            aria-pressed={format === 'mermaid'}
            onClick={() => onFormatChange('mermaid')}
          >
            Mermaid
          </button>
          <button
            className={`fmt-tab${format === 'markdown' ? ' on' : ''}`}
            aria-pressed={format === 'markdown'}
            onClick={() => onFormatChange('markdown')}
          >
            Markdown
          </button>
        </div>
        <div
          className="dir-toggle"
          style={{
            opacity: config.supportsDirection && format === 'mermaid' ? 1 : 0.35,
            pointerEvents: config.supportsDirection && format === 'mermaid' ? 'auto' : 'none',
          }}
        >
          <button
            className={`dir-btn${direction === 'TD' ? ' on' : ''}`}
            onClick={() => onDirectionChange('TD')}
            title="Top-Down"
          >
            Top → Down
          </button>
          <button
            className={`dir-btn${direction === 'LR' ? ' on' : ''}`}
            onClick={() => onDirectionChange('LR')}
            title="Left-Right"
          >
            Left → Right
          </button>
        </div>
      </div>

      <div className="code-area">
        <pre ref={gutterRef} className="ln-gutter" aria-hidden="true">
          {lineNumbers}
        </pre>
        <pre
          ref={preRef}
          className="code-pre"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
        />
        <textarea
          className="code-textarea"
          value={source}
          onChange={e => onSourceChange(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      <div className="ep-footer">
        <span className="ep-stat-dot" />
        <span className="ep-stat ep-stat-ok">valid syntax</span>
        <span className="ep-stat" style={{ marginLeft: 'auto' }}>
          {filename} · {config.statusInfo}
        </span>
      </div>
    </div>
  )
}

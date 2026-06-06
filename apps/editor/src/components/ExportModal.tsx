import { useState } from 'react'
import {
  exportSvg,
  exportPng,
  exportSource,
  type PngScale,
  type PngBackground,
} from '../export'

type Format = 'svg' | 'png' | 'source'
type SourceFormat = 'mermaid' | 'markdown'

interface Props {
  svg: string
  source: string
  sourceFormat: SourceFormat
  baseName: string
  onClose: () => void
}

const SCALES: PngScale[] = [1, 2, 3]

export default function ExportModal({ svg, source, sourceFormat, baseName, onClose }: Props) {
  const [format, setFormat] = useState<Format>('png')
  const [scale, setScale] = useState<PngScale>(2)
  const [background, setBackground] = useState<PngBackground>('white')

  const sourceExt = sourceFormat === 'markdown' ? 'md' : 'mmd'
  const sourceLabel = sourceFormat === 'markdown' ? 'Markdown' : 'Mermaid'

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleExport() {
    if (!svg && format !== 'source') return
    if (format === 'svg') exportSvg(svg, `${baseName}.svg`)
    else if (format === 'source') exportSource(source, `${baseName}.${sourceExt}`)
    else await exportPng(svg, `${baseName}.png`, scale, background)
    onClose()
  }

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-hd">Export diagram</div>
        <div className="modal-sub">Choose a format to download.</div>

        <div className="share-type">
          <div
            className={`st-opt${format === 'svg' ? ' on' : ''}`}
            onClick={() => setFormat('svg')}
          >
            <div className="st-title">SVG</div>
            <div className="st-desc">Vector, scales perfectly</div>
          </div>
          <div
            className={`st-opt${format === 'png' ? ' on' : ''}`}
            onClick={() => setFormat('png')}
          >
            <div className="st-title">PNG</div>
            <div className="st-desc">Image for docs &amp; chat</div>
          </div>
          <div
            className={`st-opt${format === 'source' ? ' on' : ''}`}
            onClick={() => setFormat('source')}
          >
            <div className="st-title">Source</div>
            <div className="st-desc">{sourceLabel} text</div>
          </div>
        </div>

        {format === 'png' && (
          <>
            <div className="exp-row">
              <span className="exp-label">Resolution</span>
              <div className="exp-seg">
                {SCALES.map((s) => (
                  <button
                    key={s}
                    className={`exp-seg-btn${scale === s ? ' on' : ''}`}
                    onClick={() => setScale(s)}
                  >
                    {s}&times;
                  </button>
                ))}
              </div>
            </div>
            <div className="exp-row">
              <span className="exp-label">Background</span>
              <div className="exp-seg">
                <button
                  className={`exp-seg-btn${background === 'transparent' ? ' on' : ''}`}
                  onClick={() => setBackground('transparent')}
                >
                  Transparent
                </button>
                <button
                  className={`exp-seg-btn${background === 'white' ? ' on' : ''}`}
                  onClick={() => setBackground('white')}
                >
                  White
                </button>
              </div>
            </div>
          </>
        )}

        <div className="modal-ft">
          <button className="m-cancel" onClick={onClose}>Cancel</button>
          <button className="m-done" onClick={handleExport}>Export</button>
        </div>
      </div>
    </div>
  )
}

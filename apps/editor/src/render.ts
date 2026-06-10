import { render, renderMarkdown, type SharePayload } from 'mindmaply-core'
import { SAMPLES, type SampleId } from './samples'

// Render a SharePayload to an SVG string. Used by both the live editor and the
// chrome-less /embed view so they stay pixel-identical.
//
// Direction and edge style flow through render options (options > document
// config > format default). A `flowchart TD|LR` header stays the source of
// truth for direction — users hand-edit it and the toggle rewrites it — so
// the payload direction is only passed when the source has no header (markdown
// and mermaid mindmap blocks). Old payloads carry no edgeStyle; for those we
// fall back to the named sample's preferred style, or let core infer it from
// the source (straight for flowchart, curved for markdown/mindmap).
export function renderFromPayload(p: SharePayload): string {
  const edgeStyle =
    p.edgeStyle ??
    (p.sample && p.sample in SAMPLES ? SAMPLES[p.sample as SampleId].edgeStyle : undefined)
  const hasFlowchartHeader =
    p.format === 'mermaid' && /^\s*flowchart\s+\w+/m.test(p.source)
  const options = {
    edgeStyle,
    direction: hasFlowchartHeader ? undefined : p.direction,
  }
  return p.format === 'markdown'
    ? renderMarkdown(p.source, options)
    : render(p.source, options)
}

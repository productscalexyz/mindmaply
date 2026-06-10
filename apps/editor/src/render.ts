import { render, renderMarkdown, type SharePayload } from 'mindmaply-core'
import { SAMPLES, type SampleId } from './samples'

// Render a SharePayload to an SVG string. Used by both the live editor and the
// chrome-less /embed view so they stay pixel-identical.
//
// When the payload names a built-in sample we honour that sample's curated
// layout; otherwise (e.g. diagrams created via the API) we let core infer the
// layout from the format defaults — orthogonal for Mermaid, curved for Markdown.
export function renderFromPayload(p: SharePayload): string {
  const layout =
    p.sample && p.sample in SAMPLES ? SAMPLES[p.sample as SampleId].layout : undefined
  return p.format === 'markdown'
    ? renderMarkdown(p.source, { layout, direction: p.direction })
    : render(p.source, { layout })
}

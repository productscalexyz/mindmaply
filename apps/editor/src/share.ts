import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string'
import type { SampleId, Direction } from './samples'

// The full editor state needed to faithfully reproduce a shared diagram.
// `sample` is encoded (not just the source text) so the layout
// (SAMPLES[sample].layout) and the canvas info badge are reproduced too.
export interface SharePayload {
  v: 1
  source: string
  format: 'markdown' | 'mermaid'
  direction: Direction
  sample: SampleId
}

export function encodeShare(p: SharePayload): string {
  return compressToEncodedURIComponent(JSON.stringify(p))
}

export function decodeShare(param: string): SharePayload | null {
  try {
    const json = decompressFromEncodedURIComponent(param)
    if (!json) return null
    const o = JSON.parse(json)
    // Whitelist-validate every field; anything unexpected -> null (safe fallback)
    if (typeof o.source !== 'string') return null
    if (o.format !== 'markdown' && o.format !== 'mermaid') return null
    if (o.direction !== 'TD' && o.direction !== 'LR') return null
    if (o.sample !== 'org' && o.sample !== 'mm' && o.sample !== 'proc') return null
    return {
      v: 1,
      source: o.source,
      format: o.format,
      direction: o.direction,
      sample: o.sample,
    }
  } catch {
    return null
  }
}

// Read the `d` param from the hash route (e.g. "#/editor?d=...") at first render.
export function readSharedFromUrl(): SharePayload | null {
  const q = window.location.hash.split('?')[1]
  if (!q) return null
  const d = new URLSearchParams(q).get('d')
  return d ? decodeShare(d) : null
}

export function buildShareUrl(p: SharePayload): string {
  return `${window.location.origin}${window.location.pathname}#/editor?d=${encodeShare(p)}`
}

// Import the default export rather than named bindings: lz-string ships as
// CommonJS, and named ESM imports of it fail under raw Node (they work in
// bundlers but not for Node consumers of the published package — e.g. the API).
import LZString from 'lz-string'

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString

// The full editor state needed to faithfully reproduce a shared diagram.
// `sample` is an opaque hint the editor uses to reproduce the layout and the
// canvas info badge for built-in samples. It is OPTIONAL: diagrams created
// programmatically (e.g. via the render API) carry no sample, and decode must
// still accept them — layout/direction are derived from `format` + `direction`.
export interface SharePayload {
  v: 1
  source: string
  format: 'markdown' | 'mermaid'
  direction: 'LR' | 'TD'
  /** Edge rendering override. Optional: old links omit it and decode unchanged. */
  edgeStyle?: 'curved' | 'straight'
  sample?: string
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
    // `sample` is optional and opaque: keep it only if it's a string.
    const sample = typeof o.sample === 'string' ? o.sample : undefined
    // `edgeStyle` is optional: keep it only if it's a known value.
    const edgeStyle =
      o.edgeStyle === 'curved' || o.edgeStyle === 'straight' ? o.edgeStyle : undefined
    return {
      v: 1,
      source: o.source,
      format: o.format,
      direction: o.direction,
      ...(edgeStyle ? { edgeStyle } : {}),
      ...(sample ? { sample } : {}),
    }
  } catch {
    return null
  }
}

// Build a link to the full editor. `base` is everything before the hash,
// e.g. "https://mindmaply.app/" (trailing slash included).
export function buildShareUrl(p: SharePayload, base: string): string {
  return `${base}#/editor?d=${encodeShare(p)}`
}

// Build a link to the chrome-less embed view (used inside <iframe>).
export function buildEmbedUrl(p: SharePayload, base: string): string {
  return `${base}#/embed?d=${encodeShare(p)}`
}

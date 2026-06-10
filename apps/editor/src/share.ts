import {
  encodeShare,
  decodeShare,
  buildShareUrl as coreBuildShareUrl,
  buildEmbedUrl as coreBuildEmbedUrl,
  type SharePayload,
} from 'mindmaply-core'

// Encoding/validation now lives in mindmaply-core so the editor and the render
// API produce byte-identical links. This module keeps only the browser-only
// glue (reading the current URL, supplying window.location as the base).
export { encodeShare, decodeShare }
export type { SharePayload }

// `${origin}${pathname}` is the part before the hash — e.g. on GitHub Pages
// custom domains this is "https://mindmaply.app/".
function currentBase(): string {
  return `${window.location.origin}${window.location.pathname}`
}

export function buildShareUrl(p: SharePayload): string {
  return coreBuildShareUrl(p, currentBase())
}

export function buildEmbedUrl(p: SharePayload): string {
  return coreBuildEmbedUrl(p, currentBase())
}

// Read the `d` param from the hash route (e.g. "#/editor?d=..." or
// "#/embed?d=...") at first render.
export function readSharedFromUrl(): SharePayload | null {
  const q = window.location.hash.split('?')[1]
  if (!q) return null
  const d = new URLSearchParams(q).get('d')
  return d ? decodeShare(d) : null
}

// Base URL for the render API. Empty until the Cloudflare Worker is live; when
// set (e.g. "https://api.mindmaply.app"), the Share modal also offers a static
// <img> embed snippet.
export const API_BASE = ''

export function buildImgEmbedCode(p: SharePayload): string | null {
  if (!API_BASE) return null
  const url = `${API_BASE}/svg?d=${encodeShare(p)}`
  return `<img src="${url}" alt="mindmap" />`
}

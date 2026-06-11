import {
  encodeShare,
  decodeShare,
  buildShareUrl as coreBuildShareUrl,
  buildEmbedUrl as coreBuildEmbedUrl,
  buildShareLandingUrl,
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

// Base URL of the render API (apps/api, the Cloudflare Worker). Comes from the
// build (e.g. VITE_API_BASE=https://api.mindmaply.app); while unset the Share
// modal hands out plain #/editor links and skips the <img> embed snippet.
export const API_BASE: string = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '')

// Base for share landing links (`<base>s/<d>`). VITE_SHARE_BASE points at the
// zone route on the main domain (e.g. https://mindmaply.app — prettier links,
// same Worker); when unset, fall back to the api host, which serves the
// identical page at /s/. Empty only while the API itself is unconfigured.
const RAW_SHARE_BASE: string = import.meta.env.VITE_SHARE_BASE ?? ''
export const SHARE_BASE: string = RAW_SHARE_BASE
  ? RAW_SHARE_BASE.replace(/\/*$/, '/')
  : API_BASE
    ? `${API_BASE}/`
    : ''

// Share link that unfurls with a live preview of the diagram: /s/<d> serves
// per-diagram OG tags to crawlers (which never see the URL fragment) and
// redirects humans into the editor. Null while the API is not configured.
export function buildShareApiUrl(p: SharePayload): string | null {
  if (!SHARE_BASE) return null
  return buildShareLandingUrl(p, SHARE_BASE)
}

export function buildImgEmbedCode(p: SharePayload): string | null {
  if (!API_BASE) return null
  const url = `${API_BASE}/svg?d=${encodeShare(p)}`
  return `<img src="${url}" alt="mindmap" />`
}

import { describe, it, expect, vi, afterEach } from 'vitest'
import { encodeShare, decodeShare, type SharePayload } from '../share'

const payload: SharePayload = {
  v: 1,
  source: '# Root\n- Child "quotes" & emoji 🌳\n- Ünïcode',
  format: 'markdown',
  direction: 'LR',
  sample: 'mm',
}

describe('encodeShare / decodeShare', () => {
  it('round-trips a payload through the URL-safe encoding', () => {
    expect(decodeShare(encodeShare(payload))).toEqual(payload)
  })

  it('produces a URL-safe string (no chars that need escaping)', () => {
    const s = encodeShare(payload)
    expect(s).toBe(encodeURIComponent(s))
  })

  it('returns null for garbage input', () => {
    expect(decodeShare('not-valid-lzstring!!!')).toBeNull()
    expect(decodeShare('')).toBeNull()
  })

  it('rejects payloads with an unknown format/direction/sample', () => {
    const bad = encodeShare({ ...payload, format: 'xml' as never })
    expect(decodeShare(bad)).toBeNull()
  })

  it('round-trips a payload with an edgeStyle', () => {
    const p: SharePayload = { ...payload, edgeStyle: 'straight' }
    expect(decodeShare(encodeShare(p))).toEqual(p)
  })

  it('legacy payloads without edgeStyle still decode', () => {
    const decoded = decodeShare(encodeShare(payload))
    expect(decoded).toEqual(payload)
    expect(decoded!.edgeStyle).toBeUndefined()
  })
})

// shortenShareUrl reads API_BASE/SHARE_BASE at module scope, so each case
// stubs the env and re-imports a fresh module instance.
describe('shortenShareUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function loadConfigured() {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE', 'https://api.example.com')
    vi.stubEnv('VITE_SHARE_BASE', 'https://example.app')
    return import('../share')
  }

  it('returns the id and a url built from SHARE_BASE on success', async () => {
    const mod = await loadConfigured()
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ id: 'abc123XYZ_-', url: 'https://attacker.example/x' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const r = await mod.shortenShareUrl(payload)
    expect(r).toEqual({ id: 'abc123XYZ_-', url: 'https://example.app/s/abc123XYZ_-' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/shorten',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('returns null on non-2xx, network failure, and malformed responses', async () => {
    const mod = await loadConfigured()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
    expect(await mod.shortenShareUrl(payload)).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))))
    expect(await mod.shortenShareUrl(payload)).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    expect(await mod.shortenShareUrl(payload)).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 42 }), { status: 200 })))
    expect(await mod.shortenShareUrl(payload)).toBeNull()
  })

  it('returns null without touching the network when the API is unconfigured', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE', '')
    vi.stubEnv('VITE_SHARE_BASE', '')
    const mod = await import('../share')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await mod.shortenShareUrl(payload)).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('buildImgEmbedCodeForId points the img at /svg with the short id', async () => {
    const mod = await loadConfigured()
    expect(mod.buildImgEmbedCodeForId('abc123XYZ_-')).toBe(
      '<img src="https://api.example.com/svg?d=abc123XYZ_-" alt="mindmap" />',
    )
  })
})

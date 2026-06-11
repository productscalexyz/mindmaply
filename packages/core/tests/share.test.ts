import { describe, it, expect } from 'vitest'
import {
  encodeShare,
  decodeShare,
  buildShareUrl,
  buildEmbedUrl,
  buildShareLandingUrl,
  type SharePayload,
} from '../src/share'

const SAMPLE: SharePayload = {
  v: 1,
  source: '# Root\n- A\n- B',
  format: 'markdown',
  direction: 'LR',
  sample: 'org',
}

describe('share encoding', () => {
  it('round-trips a full payload', () => {
    expect(decodeShare(encodeShare(SAMPLE))).toEqual(SAMPLE)
  })

  it('round-trips a payload without a sample (API-created)', () => {
    const p: SharePayload = { v: 1, source: 'flowchart LR\n a-->b', format: 'mermaid', direction: 'LR' }
    expect(decodeShare(encodeShare(p))).toEqual(p)
  })

  it('produces a param within lz-string’s URI-safe alphabet', () => {
    // compressToEncodedURIComponent emits only [A-Za-z0-9+-$].
    expect(encodeShare(SAMPLE)).toMatch(/^[A-Za-z0-9+\-$]*$/)
  })

  it('returns null on garbage input', () => {
    expect(decodeShare('not-a-real-param')).toBeNull()
    expect(decodeShare('')).toBeNull()
  })

  it('rejects payloads with an invalid format/direction', () => {
    const bad = encodeShare({ ...SAMPLE, format: 'xml' as never })
    expect(decodeShare(bad)).toBeNull()
  })

  it('drops a non-string sample rather than failing', () => {
    const enc = encodeShare({ ...SAMPLE, sample: 42 as never })
    expect(decodeShare(enc)).toEqual({ v: 1, source: SAMPLE.source, format: 'markdown', direction: 'LR' })
  })

  it('round-trips a payload with an edgeStyle', () => {
    const p: SharePayload = { ...SAMPLE, edgeStyle: 'curved' }
    expect(decodeShare(encodeShare(p))).toEqual(p)
  })

  it('legacy payloads without edgeStyle decode unchanged', () => {
    expect(decodeShare(encodeShare(SAMPLE))).toEqual(SAMPLE)
    expect(decodeShare(encodeShare(SAMPLE))!.edgeStyle).toBeUndefined()
  })

  it('drops an invalid edgeStyle rather than failing', () => {
    const enc = encodeShare({ ...SAMPLE, edgeStyle: 'zigzag' as never })
    const decoded = decodeShare(enc)
    expect(decoded).not.toBeNull()
    expect(decoded!.edgeStyle).toBeUndefined()
  })

  it('builds editor and embed URLs from the same base', () => {
    const base = 'https://mindmaply.app/'
    expect(buildShareUrl(SAMPLE, base)).toBe(`${base}#/editor?d=${encodeShare(SAMPLE)}`)
    expect(buildEmbedUrl(SAMPLE, base)).toBe(`${base}#/embed?d=${encodeShare(SAMPLE)}`)
  })

  it('builds a share landing URL on the /s/ route (no hash)', () => {
    const base = 'https://mindmaply.app/'
    expect(buildShareLandingUrl(SAMPLE, base)).toBe(`${base}s/${encodeShare(SAMPLE)}`)
  })
})

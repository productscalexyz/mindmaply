import { describe, it, expect } from 'vitest'
import {
  encodeShare,
  decodeShare,
  buildShareUrl,
  buildEmbedUrl,
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

  it('builds editor and embed URLs from the same base', () => {
    const base = 'https://mindmaply.app/'
    expect(buildShareUrl(SAMPLE, base)).toBe(`${base}#/editor?d=${encodeShare(SAMPLE)}`)
    expect(buildEmbedUrl(SAMPLE, base)).toBe(`${base}#/embed?d=${encodeShare(SAMPLE)}`)
  })
})

import { describe, it, expect } from 'vitest'
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

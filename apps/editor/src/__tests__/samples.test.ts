import { describe, it, expect } from 'vitest'
import { getSampleSource, SAMPLES } from '../samples'

describe('getSampleSource', () => {
  it('returns TD source for org when direction is TD', () => {
    const src = getSampleSource('org', 'TD')
    expect(src).toContain('flowchart TD')
  })
  it('returns LR source for org when direction is LR', () => {
    const src = getSampleSource('org', 'LR')
    expect(src).toContain('flowchart LR')
  })
  it('always returns same source for mm regardless of direction', () => {
    const td = getSampleSource('mm', 'TD')
    const lr = getSampleSource('mm', 'LR')
    expect(td).toBe(lr)
  })
  it('always returns same source for proc regardless of direction', () => {
    const td = getSampleSource('proc', 'TD')
    const lr = getSampleSource('proc', 'LR')
    expect(td).toBe(lr)
  })
})

describe('SAMPLES metadata', () => {
  it('org supports direction', () => {
    expect(SAMPLES.org.supportsDirection).toBe(true)
  })
  it('mm does not support direction', () => {
    expect(SAMPLES.mm.supportsDirection).toBe(false)
  })
  it('proc does not support direction', () => {
    expect(SAMPLES.proc.supportsDirection).toBe(false)
  })
  it('mm uses curved layout', () => {
    expect(SAMPLES.mm.layout).toBe('curved')
  })
  it('org and proc use orthogonal layout', () => {
    expect(SAMPLES.org.layout).toBe('orthogonal')
    expect(SAMPLES.proc.layout).toBe('orthogonal')
  })
})

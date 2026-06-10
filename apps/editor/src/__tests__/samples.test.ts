import { describe, it, expect } from 'vitest'
import { validate } from 'mindmaply-core'
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
  it('org ships TD/LR source variants', () => {
    expect(SAMPLES.org.supportsDirection).toBe(true)
  })
  it('mm prefers curved edges', () => {
    expect(SAMPLES.mm.edgeStyle).toBe('curved')
  })
  it('org and proc prefer straight edges', () => {
    expect(SAMPLES.org.edgeStyle).toBe('straight')
    expect(SAMPLES.proc.edgeStyle).toBe('straight')
  })
})

describe('batman sample (mermaid mindmap syntax)', () => {
  it('uses the mermaid mindmap block grammar', () => {
    const src = getSampleSource('batman', 'LR')
    expect(src).toContain('mindmap')
    expect(src).toContain('root((Batman))')
  })
  it('validates cleanly as mermaid', () => {
    const src = getSampleSource('batman', 'LR')
    expect(validate(src, 'mermaid')).toEqual({ valid: true, errors: [] })
  })
  it('prefers curved edges', () => {
    expect(SAMPLES.batman.edgeStyle).toBe('curved')
  })
})

describe('default theme in samples', () => {
  it('every sample carries the editable theme directive', () => {
    for (const id of Object.keys(SAMPLES) as Array<keyof typeof SAMPLES>) {
      const src = getSampleSource(id, 'TD')
      expect(src, `${id} must carry the theme directive`).toContain('%%{init:')
      expect(src).toContain('"palette"')
    }
  })
  it('all samples still validate with the theme directive', () => {
    for (const id of Object.keys(SAMPLES) as Array<keyof typeof SAMPLES>) {
      for (const dir of ['TD', 'LR'] as const) {
        expect(validate(getSampleSource(id, dir), 'mermaid').valid, `${id} ${dir}`).toBe(true)
      }
    }
  })
})

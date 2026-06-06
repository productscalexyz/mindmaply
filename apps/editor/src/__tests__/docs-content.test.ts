import { describe, it, expect } from 'vitest'
import { COLOR_SWATCHES, NAV_SECTIONS, SNIPPETS } from '../docs-content'

describe('COLOR_SWATCHES', () => {
  it('has 6 entries — root plus b1–b5', () => {
    expect(COLOR_SWATCHES).toHaveLength(6)
  })

  it('each entry has id, hex, label, classDef', () => {
    for (const s of COLOR_SWATCHES) {
      expect(typeof s.id).toBe('string')
      expect(s.id.length).toBeGreaterThan(0)
      expect(s.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(typeof s.label).toBe('string')
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.classDef).toContain('classDef')
    }
  })

  it('first entry is root with #FFFFFF', () => {
    expect(COLOR_SWATCHES[0].id).toBe('root')
    expect(COLOR_SWATCHES[0].hex).toBe('#FFFFFF')
  })

  it('branch entries b1–b5 have 33-suffix fill in classDef', () => {
    for (const s of COLOR_SWATCHES.slice(1)) {
      expect(s.classDef).toContain(`${s.hex}33`)
    }
  })

  it('branch entries are in order b1–b5', () => {
    const ids = COLOR_SWATCHES.slice(1).map(s => s.id)
    expect(ids).toEqual(['b1', 'b2', 'b3', 'b4', 'b5'])
  })
})

describe('NAV_SECTIONS', () => {
  it('has 6 sections', () => {
    expect(NAV_SECTIONS).toHaveLength(6)
  })

  it('each section has id and label', () => {
    for (const s of NAV_SECTIONS) {
      expect(typeof s.id).toBe('string')
      expect(s.id.length).toBeGreaterThan(0)
      expect(typeof s.label).toBe('string')
      expect(s.label.length).toBeGreaterThan(0)
    }
  })

  it('contains overview, layouts, colors, shapes, direction, reference', () => {
    const ids = NAV_SECTIONS.map(s => s.id)
    expect(ids).toContain('overview')
    expect(ids).toContain('layouts')
    expect(ids).toContain('colors')
    expect(ids).toContain('shapes')
    expect(ids).toContain('direction')
    expect(ids).toContain('reference')
  })

  it('sections are in reading order', () => {
    const ids = NAV_SECTIONS.map(s => s.id)
    expect(ids).toEqual(['overview', 'layouts', 'colors', 'shapes', 'direction', 'reference'])
  })
})

describe('SNIPPETS', () => {
  it('all snippet values are non-empty strings', () => {
    for (const [key, val] of Object.entries(SNIPPETS)) {
      expect(val.length, `${key} must be non-empty`).toBeGreaterThan(0)
    }
  })

  it('all snippets start with flowchart', () => {
    for (const [key, val] of Object.entries(SNIPPETS)) {
      expect(val.trimStart(), `${key} must start with flowchart`).toMatch(/^flowchart/)
    }
  })

  it('orthogonal snippet uses TD direction', () => {
    expect(SNIPPETS.orthogonal).toContain('flowchart TD')
  })

  it('curved snippet uses LR direction', () => {
    expect(SNIPPETS.curved).toContain('flowchart LR')
  })

  it('directionTD and directionLR use correct directions', () => {
    expect(SNIPPETS.directionTD).toContain('flowchart TD')
    expect(SNIPPETS.directionLR).toContain('flowchart LR')
  })
})

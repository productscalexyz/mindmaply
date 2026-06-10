import { describe, it, expect } from 'vitest'
import { render, renderMarkdown, validate } from 'mindmaply-core'
import { COLOR_SWATCHES, NAV_SECTIONS, SNIPPETS } from '../docs-content'

describe('COLOR_SWATCHES', () => {
  it('has 6 entries — root plus b1–b5', () => {
    expect(COLOR_SWATCHES).toHaveLength(6)
  })

  it('each entry has id, hex, label', () => {
    for (const s of COLOR_SWATCHES) {
      expect(typeof s.id).toBe('string')
      expect(s.id.length).toBeGreaterThan(0)
      expect(s.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(typeof s.label).toBe('string')
      expect(s.label.length).toBeGreaterThan(0)
    }
  })

  it('first entry is root with #FFFFFF', () => {
    expect(COLOR_SWATCHES[0].id).toBe('root')
    expect(COLOR_SWATCHES[0].hex).toBe('#FFFFFF')
  })

  it('branch entries are in order b1–b5', () => {
    const ids = COLOR_SWATCHES.slice(1).map(s => s.id)
    expect(ids).toEqual(['b1', 'b2', 'b3', 'b4', 'b5'])
  })
})

describe('NAV_SECTIONS', () => {
  it('each section has id and label', () => {
    for (const s of NAV_SECTIONS) {
      expect(typeof s.id).toBe('string')
      expect(s.id.length).toBeGreaterThan(0)
      expect(typeof s.label).toBe('string')
      expect(s.label.length).toBeGreaterThan(0)
    }
  })

  it('sections are in reading order', () => {
    const ids = NAV_SECTIONS.map(s => s.id)
    expect(ids).toEqual(['overview', 'layouts', 'colors', 'shapes', 'direction', 'mindmap', 'config', 'reference'])
  })
})

// The docs page embeds a live render of every snippet — so every snippet
// must be valid, supported syntax that actually draws.
const SNIPPET_FORMAT: Record<keyof typeof SNIPPETS, 'mermaid' | 'markdown'> = {
  straight: 'mermaid',
  curved: 'mermaid',
  styleOverride: 'mermaid',
  shapes: 'mermaid',
  directionTD: 'mermaid',
  directionLR: 'mermaid',
  mindmap: 'mermaid',
  initConfig: 'mermaid',
  frontmatterConfig: 'markdown',
}

describe('SNIPPETS', () => {
  it('every snippet validates cleanly in its language', () => {
    for (const [key, src] of Object.entries(SNIPPETS)) {
      const format = SNIPPET_FORMAT[key as keyof typeof SNIPPETS]
      const result = validate(src, format)
      expect(result.errors, `${key} must validate`).toEqual([])
    }
  })

  it('every snippet renders to SVG without NaN/undefined', () => {
    for (const [key, src] of Object.entries(SNIPPETS)) {
      const format = SNIPPET_FORMAT[key as keyof typeof SNIPPETS]
      const svg = format === 'markdown' ? renderMarkdown(src) : render(src)
      expect(svg, `${key} must render`).toMatch(/^<svg/)
      expect(svg).not.toContain('NaN')
      expect(svg).not.toContain('undefined')
    }
  })

  it('edge-style snippets demonstrate what they claim', () => {
    expect(render(SNIPPETS.straight)).not.toContain(' C ')
    expect(render(SNIPPETS.curved)).toContain(' C ')
  })

  it('direction snippets use the directions they claim', () => {
    expect(SNIPPETS.directionTD).toContain('flowchart TD')
    expect(SNIPPETS.directionLR).toContain('flowchart LR')
  })

  it('style override snippet produces dashed and outlined nodes', () => {
    const svg = render(SNIPPETS.styleOverride)
    expect(svg).toContain('stroke-dasharray')
    expect(svg).toContain('#E5884B')
  })

  it('config snippets demonstrate the theme (custom palette in output)', () => {
    expect(render(SNIPPETS.initConfig)).toContain('#E45858')
    expect(renderMarkdown(SNIPPETS.frontmatterConfig)).toContain('#E45858')
  })

  it('mindmap snippet uses the mermaid mindmap grammar', () => {
    expect(SNIPPETS.mindmap.trimStart()).toMatch(/^mindmap/)
    expect(SNIPPETS.mindmap).toContain('::icon(')
  })
})

import { describe, it, expect } from 'vitest'
import { parse, parseMarkdown, toMarkdown, toMermaid } from 'mindmaply-core'
import { diagramType, DIAGRAM_TYPE_COLORS } from '../diagram-type'
import { SAMPLES, getSampleSource } from '../samples'

describe('diagramType()', () => {
  it('mermaid flowchart grammar draws a flowchart', () => {
    expect(diagramType('flowchart LR\n  a --> b', 'mermaid')).toBe('flowchart')
  })

  it('mermaid mindmap grammar draws a mind map (theme directive above it too)', () => {
    expect(diagramType('mindmap\n  root((Idea))', 'mermaid')).toBe('mindmap')
    expect(diagramType(getSampleSource('batman', 'TD'), 'mermaid')).toBe('mindmap')
  })

  it('markdown defaults to mindmap; diagram: frontmatter overrides', () => {
    expect(diagramType('# Root\n- a', 'markdown')).toBe('mindmap')
    expect(diagramType('---\ndiagram: flowchart\n---\n# Root\n- a', 'markdown')).toBe('flowchart')
  })

  it('the type survives the language tab switch (no syntax ↔ type link)', () => {
    for (const id of ['org', 'mm', 'proc', 'batman'] as const) {
      const mermaidSrc = getSampleSource(id, 'TD')
      const type = diagramType(mermaidSrc, 'mermaid')
      const md = toMarkdown(parse(mermaidSrc))
      expect(diagramType(md, 'markdown'), `${id} mermaid→markdown`).toBe(type)
      const back = toMermaid(parseMarkdown(md))
      expect(diagramType(back, 'mermaid'), `${id} markdown→mermaid`).toBe(type)
    }
  })

  it('classifies all samples by what they draw', () => {
    expect(diagramType(SAMPLES.org.sources.TD, 'mermaid')).toBe('flowchart')
    expect(diagramType(SAMPLES.proc.sources.TD, 'mermaid')).toBe('flowchart')
    expect(diagramType(SAMPLES.mm.sources.TD, 'mermaid')).toBe('mindmap')
    expect(diagramType(SAMPLES.batman.sources.TD, 'mermaid')).toBe('mindmap')
  })

  it('each diagram type has a distinct color', () => {
    const colors = Object.values(DIAGRAM_TYPE_COLORS)
    expect(new Set(colors).size).toBe(colors.length)
  })
})

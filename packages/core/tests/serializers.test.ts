import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../src/markdown-parser'
import { parse } from '../src/parser'
import { toMarkdown, toMermaid } from '../src/serializers'

describe('toMarkdown()', () => {
  it('emits h1 for root node', () => {
    const ast = parseMarkdown('# Root')
    expect(toMarkdown(ast)).toContain('# Root')
  })

  it('emits h2 for L1 children', () => {
    const ast = parseMarkdown('# Root\n## Branch A')
    const md = toMarkdown(ast)
    expect(md).toContain('# Root')
    expect(md).toContain('## Branch A')
  })

  it('emits h3 for L2 children', () => {
    const ast = parseMarkdown('# Root\n## Section\n### Sub')
    expect(toMarkdown(ast)).toContain('### Sub')
  })

  it('emits bullet for L3+ children', () => {
    const ast = parseMarkdown('# Root\n## S\n### SS\n- Item')
    expect(toMarkdown(ast)).toContain('- Item')
  })

  it('returns empty string for empty ast', () => {
    expect(toMarkdown(parseMarkdown(''))).toBe('')
  })

  it('round-trips markdown labels through AST', () => {
    const source = '# Root\n## Branch A\n## Branch B'
    const ast = parseMarkdown(source)
    const rt = parseMarkdown(toMarkdown(ast))
    const labels1 = [...ast.nodes.values()].map(n => n.label).sort()
    const labels2 = [...rt.nodes.values()].map(n => n.label).sort()
    expect(labels1).toEqual(labels2)
  })
})

describe('toMermaid()', () => {
  it('starts with "flowchart LR"', () => {
    const ast = parseMarkdown('# Root')
    expect(toMermaid(ast)).toMatch(/^flowchart LR/)
  })

  it('includes node labels in quoted bracket syntax', () => {
    const ast = parseMarkdown('# Root\n## Branch A')
    const mmd = toMermaid(ast)
    expect(mmd).toContain('["Root"]')
    expect(mmd).toContain('["Branch A"]')
  })

  it('emits edge arrows', () => {
    const ast = parseMarkdown('# Root\n## Branch A')
    expect(toMermaid(ast)).toContain('-->')
  })

  it('produces output parseable by parse() with correct structure', () => {
    const ast = parseMarkdown('# Root\n## Section A\n## Section B')
    const mmd = toMermaid(ast)
    expect(() => parse(mmd)).not.toThrow()
    const reparsed = parse(mmd)
    expect(reparsed.nodes.size).toBe(3)
    expect(reparsed.edges).toHaveLength(2)
  })

  it('returns empty string for empty ast', () => {
    expect(toMermaid(parseMarkdown(''))).toBe('')
  })

  it('emits the requested direction in the header', () => {
    const ast = parseMarkdown('# Root\n## Branch A')
    expect(toMermaid(ast, 'TD')).toMatch(/^flowchart TD/)
    expect(toMermaid(ast, 'LR')).toMatch(/^flowchart LR/)
  })

  it("falls back to the AST's own direction", () => {
    const ast = parse('flowchart TD\n  A["Root"]\n  A --> B["Child"]')
    expect(toMermaid(ast)).toMatch(/^flowchart TD/)
  })

  it('drops style directives through mermaid→markdown→mermaid round-trip', () => {
    const src = 'flowchart LR\n  root["Root"]\n  root --> a["Branch"]\n  style root fill:#ff0000'
    const mmd = toMermaid(parseMarkdown(toMarkdown(parse(src))))
    expect(mmd).not.toContain('style')
    expect(mmd).not.toContain('fill:')
  })
})

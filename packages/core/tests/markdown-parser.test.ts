import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../src/markdown-parser'

describe('parseMarkdown()', () => {
  it('defaults layout to curved and direction to LR', () => {
    const ast = parseMarkdown('# Root')
    expect(ast.layout).toBe('curved')
    expect(ast.direction).toBe('LR')
  })

  it('treats h1 as root with no incoming edges', () => {
    const ast = parseMarkdown('# Root')
    expect(ast.nodes.size).toBe(1)
    expect(ast.edges).toHaveLength(0)
    expect([...ast.nodes.values()][0].label).toBe('Root')
  })

  it('creates child edges from h2 under h1', () => {
    const ast = parseMarkdown('# Root\n## Branch A\n## Branch B')
    expect(ast.nodes.size).toBe(3)
    expect(ast.edges).toHaveLength(2)
    const rootId = [...ast.nodes.values()].find(n => n.label === 'Root')!.id
    const aId = [...ast.nodes.values()].find(n => n.label === 'Branch A')!.id
    const bId = [...ast.nodes.values()].find(n => n.label === 'Branch B')!.id
    expect(ast.edges).toContainEqual({ from: rootId, to: aId })
    expect(ast.edges).toContainEqual({ from: rootId, to: bId })
  })

  it('nests h3 under nearest h2', () => {
    const ast = parseMarkdown('# Root\n## Section\n### Sub')
    const sectionId = [...ast.nodes.values()].find(n => n.label === 'Section')!.id
    const subId = [...ast.nodes.values()].find(n => n.label === 'Sub')!.id
    expect(ast.edges).toContainEqual({ from: sectionId, to: subId })
  })

  it('attaches unindented bullet to nearest heading', () => {
    const ast = parseMarkdown('# Root\n## Section\n- Item')
    const sectionId = [...ast.nodes.values()].find(n => n.label === 'Section')!.id
    const itemId = [...ast.nodes.values()].find(n => n.label === 'Item')!.id
    expect(ast.edges).toContainEqual({ from: sectionId, to: itemId })
  })

  it('nests indented bullet under parent bullet', () => {
    const ast = parseMarkdown('# Root\n## Section\n- Parent\n  - Child')
    const parentId = [...ast.nodes.values()].find(n => n.label === 'Parent')!.id
    const childId = [...ast.nodes.values()].find(n => n.label === 'Child')!.id
    expect(ast.edges).toContainEqual({ from: parentId, to: childId })
  })

  it('returns empty ast for empty input with correct defaults', () => {
    const ast = parseMarkdown('')
    expect(ast.nodes.size).toBe(0)
    expect(ast.edges).toHaveLength(0)
    expect(ast.layout).toBe('curved')
    expect(ast.direction).toBe('LR')
  })

  it('all nodes have shape rect', () => {
    const ast = parseMarkdown('# Root\n## Branch')
    for (const node of ast.nodes.values()) {
      expect(node.shape).toBe('rect')
    }
  })

  it('generates unique node IDs for duplicate labels', () => {
    const ast = parseMarkdown('# Root\n## Same\n## Same')
    const ids = [...ast.nodes.keys()]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('bullet-only input with no headings — first bullet becomes root', () => {
    const ast = parseMarkdown('- Root Item\n- Sibling')
    expect(ast.nodes.size).toBe(2)
    // Both bullets have no parent — they are disconnected roots
    const rootItem = [...ast.nodes.values()].find(n => n.label === 'Root Item')!
    const sibling = [...ast.nodes.values()].find(n => n.label === 'Sibling')!
    expect(rootItem).toBeDefined()
    expect(sibling).toBeDefined()
    // Both unindented bullets have depth 7 — neither can be parent of the other
    expect(ast.edges).toHaveLength(0)
  })

  it('tab-indented bullet nests correctly under parent bullet', () => {
    const ast = parseMarkdown('- Root\n\t- Child')
    const rootId = [...ast.nodes.values()].find(n => n.label === 'Root')!.id
    const childId = [...ast.nodes.values()].find(n => n.label === 'Child')!.id
    expect(ast.edges).toContainEqual({ from: rootId, to: childId })
  })

  it('indented bullet-only input — nested bullets form a chain', () => {
    const ast = parseMarkdown('- Root\n  - Child\n    - Grandchild')
    const rootId = [...ast.nodes.values()].find(n => n.label === 'Root')!.id
    const childId = [...ast.nodes.values()].find(n => n.label === 'Child')!.id
    const grandchildId = [...ast.nodes.values()].find(n => n.label === 'Grandchild')!.id
    expect(ast.edges).toContainEqual({ from: rootId, to: childId })
    expect(ast.edges).toContainEqual({ from: childId, to: grandchildId })
  })
})

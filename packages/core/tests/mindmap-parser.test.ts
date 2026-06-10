import { describe, it, expect } from 'vitest'
import { parseMindmap, validateMindmap, isMindmapSource } from '../src/mindmap-parser'
import { parse, validateMermaid } from '../src/parser'
import { buildTree } from '../src/tree'
import type { TreeNode } from '../src/tree'

// The canonical mermaid mindmap example (Tony Buzan) — inconsistent indent
// widths on purpose: mermaid nesting is relative, not fixed-width.
const BUZAN = `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`

function findByLabel(root: TreeNode, label: string): TreeNode | null {
  if (root.label === label) return root
  for (const child of root.children) {
    const hit = findByLabel(child, label)
    if (hit) return hit
  }
  return null
}

describe('isMindmapSource()', () => {
  it('detects a mindmap header as the first meaningful line', () => {
    expect(isMindmapSource(BUZAN)).toBe(true)
    expect(isMindmapSource('\n%% comment\nmindmap\n  a')).toBe(true)
  })

  it('does not detect flowchart sources', () => {
    expect(isMindmapSource('flowchart LR\n  a --> b')).toBe(false)
  })

  it('skips a leading init directive', () => {
    const src = '%%{init: {"mindmaply": {"edgeStyle": "straight"}}}%%\nmindmap\n  a'
    expect(isMindmapSource(src)).toBe(true)
  })
})

describe('parseMindmap() — Tony Buzan example', () => {
  const ast = parseMindmap(BUZAN)
  const tree = buildTree(ast)

  it('parses all 15 nodes (icon line is not a node)', () => {
    expect(ast.nodes.size).toBe(15)
  })

  it('root is the circle node "mindmap"', () => {
    expect(tree.label).toBe('mindmap')
    expect(tree.shape).toBe('circle')
    expect(tree.depth).toBe(0)
  })

  it('root has three branches: Origins, Research, Tools', () => {
    expect(tree.children.map(c => c.label)).toEqual(['Origins', 'Research', 'Tools'])
  })

  it('::icon attaches to the previous node instead of becoming a node', () => {
    const longHistory = [...ast.nodes.values()].find(n => n.label === 'Long history')
    expect(longHistory?.icon).toBe('fa fa-book')
    expect([...ast.nodes.values()].some(n => n.label.includes('icon'))).toBe(false)
  })

  it('<br/> becomes a line break in the label', () => {
    const node = findByLabel(tree, 'On effectiveness\nand features')
    expect(node).not.toBeNull()
    expect(node!.depth).toBe(2)
  })

  it('handles inconsistent indent widths relatively (Creative techniques under Uses)', () => {
    const uses = findByLabel(tree, 'Uses')!
    expect(uses.depth).toBe(3)
    expect(uses.children.map(c => c.label)).toEqual([
      'Creative techniques',
      'Strategic planning',
      'Argument mapping',
    ])
  })

  it('nests Tony Buzan four levels deep under Origins → Popularisation', () => {
    const buzan = findByLabel(tree, 'British popular psychology author Tony Buzan')!
    expect(buzan.depth).toBe(3)
  })

  it('defaults to curved layout, LR direction', () => {
    expect(ast.layout).toBe('curved')
    expect(ast.direction).toBe('LR')
  })
})

describe('parseMindmap() — shapes', () => {
  it('maps shape brackets: ((circle)), (pill), [rect], bare → rect', () => {
    const src = `mindmap
  root((Round))
    a(Soft)
    b[Square]
    c{{Hexagon}}
    Plain text`
    const ast = parseMindmap(src)
    const shapes = new Map([...ast.nodes.values()].map(n => [n.label, n.shape]))
    expect(shapes.get('Round')).toBe('circle')
    expect(shapes.get('Soft')).toBe('pill')
    expect(shapes.get('Square')).toBe('rect')
    expect(shapes.get('Hexagon')).toBe('rect') // graceful fallback
    expect(shapes.get('Plain text')).toBe('rect')
  })

  it('uses an explicit id prefix as the slug seed', () => {
    const ast = parseMindmap('mindmap\n  root((The Big Idea))')
    expect([...ast.nodes.keys()][0]).toMatch(/^root_/)
  })
})

describe('parse() integration — mindmap detection', () => {
  it('parse() routes mindmap sources to the mindmap parser', () => {
    const ast = parse(BUZAN)
    expect(ast.nodes.size).toBe(15)
    expect(ast.layout).toBe('curved')
  })

  it('init directive config applies to mindmap sources', () => {
    const src = `%%{init: {"mindmaply": {"edgeStyle": "straight", "direction": "TD"}}}%%\n${BUZAN}`
    const ast = parse(src)
    expect(ast.layout).toBe('orthogonal')
    expect(ast.direction).toBe('TD')
    expect(ast.config?.edgeStyle).toBe('straight')
  })
})

describe('validateMindmap()', () => {
  it('accepts the Tony Buzan example with zero errors', () => {
    expect(validateMindmap(BUZAN)).toEqual({ valid: true, errors: [] })
  })

  it('validateMermaid() delegates for mindmap sources', () => {
    expect(validateMermaid(BUZAN).valid).toBe(true)
  })

  it('flags a second root', () => {
    const result = validateMindmap('mindmap\n  a\n  b')
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('multiple root')
  })

  it('flags an icon before any node', () => {
    const result = validateMindmap('mindmap\n  ::icon(fa fa-book)\n  a')
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('icon')
  })

  it('flags an empty mindmap', () => {
    const result = validateMindmap('mindmap\n')
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('no nodes')
  })
})

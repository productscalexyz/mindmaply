import { describe, it, expect } from 'vitest'
import { computeOrthogonalLayout } from '../src/layout/orthogonal'
import { buildTree } from '../src/tree'
import { parse } from '../src/parser'
import type { LayoutNode } from '../src/layout/types'
import { NODE_HEIGHT, ORTHO_V_GAP, NODE_PADDING_H } from '../src/design'
import { DEFAULT_THEME } from '../src/config'

const DIAGRAM = `flowchart LR
  root["Site"]
  root --> a["Section A"]
  root --> b["Section B"]
  a --> a1["Sub 1"]
  a --> a2["Sub 2"]`

function allNodes(root: LayoutNode): LayoutNode[] {
  return [root, ...root.children.flatMap(allNodes)]
}

describe('computeOrthogonalLayout()', () => {
  it('returns a LayoutNode tree with the same structure', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    expect(layout.id).toBe('root')
    expect(layout.children).toHaveLength(2)
    expect(layout.children[0].children).toHaveLength(2)
  })

  it('root is at x=0', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    expect(layout.x).toBe(0)
  })

  it('children have greater x than root', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    for (const child of layout.children) {
      expect(child.x).toBeGreaterThan(layout.x)
    }
  })

  it('grandchildren have greater x than children', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    const a = layout.children[0]
    for (const gc of a.children) {
      expect(gc.x).toBeGreaterThan(a.x)
    }
  })

  it('siblings have different y values', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    const yValues = layout.children.map(c => c.y)
    expect(new Set(yValues).size).toBe(yValues.length)
  })

  it('each LayoutNode has a parent reference (root parent is null)', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    expect(layout.parent).toBeNull()
    expect(layout.children[0].parent?.id).toBe('root')
  })

  it('root has non-zero width and height', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
  })

  it('root is at y=0', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    expect(layout.y).toBe(0)
  })

  it('sibling y-distance equals NODE_HEIGHT + ORTHO_V_GAP', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)))
    // Use consecutive leaf siblings (a1, a2) — d3-cluster guarantees exactly
    // one nodeSize step between adjacent leaves, not between internal nodes.
    const [a1, a2] = layout.children[0].children
    expect(Math.abs(a2.y - a1.y)).toBeCloseTo(NODE_HEIGHT + ORTHO_V_GAP, 0)
  })
})

describe('computeOrthogonalLayout() — TD direction', () => {
  it('children have greater y than root, same-depth nodes share y', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)), 'TD')
    for (const child of layout.children) {
      expect(child.y).toBeGreaterThan(layout.y)
    }
    const ys = new Set(layout.children.map(c => c.y))
    expect(ys.size).toBe(1)
  })

  it('depth axis grows monotonically with depth', () => {
    const layout = computeOrthogonalLayout(buildTree(parse(DIAGRAM)), 'TD')
    const a = layout.children[0]
    for (const gc of a.children) {
      expect(gc.y).toBeGreaterThan(a.y)
    }
  })
})

describe('deep and unbalanced diagrams', () => {
  const DEEP = `flowchart LR
  l0["Level 0"]
  l0 --> l1["Level 1"]
  l1 --> l2["Level 2"]
  l2 --> l3["Level 3"]
  l3 --> l4["Level 4"]
  l4 --> l5["Level 5"]
  l5 --> l6["Level 6"]
  l6 --> l7["Level 7"]`

  it('7-level chain: depth axis strictly increases, no NaN (LR and TD)', () => {
    for (const dir of ['LR', 'TD'] as const) {
      const layout = computeOrthogonalLayout(buildTree(parse(DEEP)), dir)
      let node: LayoutNode | undefined = layout
      let prev = -Infinity
      while (node) {
        const depthAxis = dir === 'LR' ? node.x : node.y
        expect(Number.isFinite(depthAxis)).toBe(true)
        expect(depthAxis).toBeGreaterThan(prev)
        prev = depthAxis
        node = node.children[0]
      }
    }
  })

  it('unbalanced tree (one deep branch, one wide branch) has no overlapping siblings', () => {
    const UNBALANCED = `flowchart LR
  root["Root"]
  root --> deep["Deep"]
  root --> wide["Wide"]
  deep --> d1["D1"]
  d1 --> d2["D2"]
  d2 --> d3["D3"]
  wide --> w1["W1"]
  wide --> w2["W2"]
  wide --> w3["W3"]
  wide --> w4["W4"]
  wide --> w5["W5"]
  wide --> w6["W6"]`
    const layout = computeOrthogonalLayout(buildTree(parse(UNBALANCED)))
    // group nodes by depth and assert vertical separation within each column
    const byDepth = new Map<number, LayoutNode[]>()
    for (const n of allNodes(layout)) {
      byDepth.set(n.depth, [...(byDepth.get(n.depth) ?? []), n])
    }
    for (const nodes of byDepth.values()) {
      const sorted = [...nodes].sort((a, b) => a.y - b.y)
      for (let i = 1; i < sorted.length; i++) {
        const gap = (sorted[i].y - sorted[i].height / 2) - (sorted[i - 1].y + sorted[i - 1].height / 2)
        expect(gap).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('multi-line labels', () => {
  it('a label with \\n is taller than a single-line label', () => {
    const src = `flowchart LR
  root["Root"]
  root --> a["one line"]`
    const tree = buildTree(parse(src))
    tree.children[0].label = 'first line\nsecond line'
    const layout = computeOrthogonalLayout(tree)
    expect(layout.children[0].height).toBeGreaterThan(NODE_HEIGHT)
  })

  it('multi-line width uses the widest line, not the total length', () => {
    const src = `flowchart LR
  root["Root"]
  root --> a["aaaa"]
  root --> b["bbbb"]`
    const tree = buildTree(parse(src))
    tree.children[0].label = 'aaaa\naaaa'
    const layout = computeOrthogonalLayout(tree)
    const [a, b] = layout.children
    expect(a.width).toBeCloseTo(b.width, 1)
  })
})

describe('auto-wrapped labels', () => {
  const LONG = 'Clarify what was at risk, emotionally or otherwise, to make the story compelling'
  const src = `flowchart LR
  root["Root"]
  root --> a["placeholder"]
  root --> b["short"]`

  function longLabelTree() {
    const tree = buildTree(parse(src))
    tree.children[0].label = LONG
    return tree
  }

  it('a long label wraps: multiple lines, width capped, height grows', () => {
    const layout = computeOrthogonalLayout(longLabelTree())
    const a = layout.children[0]
    expect(a.lines.length).toBeGreaterThan(1)
    // width budget = wrapped text + card padding
    expect(a.width).toBeLessThanOrEqual(DEFAULT_THEME.wrapWidth + NODE_PADDING_H * 2)
    expect(a.height).toBeGreaterThan(NODE_HEIGHT)
  })

  it('theme.wrapWidth: 0 disables wrapping', () => {
    const theme = { ...DEFAULT_THEME, wrapWidth: 0 }
    const layout = computeOrthogonalLayout(longLabelTree(), 'LR', theme)
    const a = layout.children[0]
    expect(a.lines).toEqual([LONG])
    expect(a.width).toBeGreaterThan(DEFAULT_THEME.wrapWidth)
  })

  it('the same label measures narrower at deeper levels (scaled typography)', () => {
    const deepSrc = `flowchart LR
  root["Root"]
  root --> a["placeholder"]
  a --> b["x"]
  b --> c["placeholder"]`
    const tree = buildTree(parse(deepSrc))
    const theme = { ...DEFAULT_THEME, wrapWidth: 0 }
    tree.children[0].label = LONG
    tree.children[0].children[0].children[0].label = LONG
    const layout = computeOrthogonalLayout(tree, 'LR', theme)
    const depth1 = layout.children[0]
    const depth3 = depth1.children[0].children[0]
    expect(depth3.width).toBeLessThan(depth1.width)
  })

  it('wrapped TD siblings do not overlap horizontally', () => {
    const tree = buildTree(parse(src))
    tree.children[0].label = LONG
    tree.children[1].label = LONG
    const layout = computeOrthogonalLayout(tree, 'TD')
    const sorted = [...layout.children].sort((a, b) => a.x - b.x)
    const gap =
      (sorted[1].x - sorted[1].width / 2) - (sorted[0].x + sorted[0].width / 2)
    expect(gap).toBeGreaterThanOrEqual(0)
  })
})

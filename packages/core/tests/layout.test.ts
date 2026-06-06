import { describe, it, expect } from 'vitest'
import { computeOrthogonalLayout } from '../src/layout/orthogonal'
import { computeCurvedLayout } from '../src/layout/curved'
import { buildTree } from '../src/tree'
import { parse } from '../src/parser'
import { NODE_HEIGHT, ORTHO_V_GAP } from '../src/design'

const DIAGRAM = `flowchart LR
  root["Site"]
  root --> a["Section A"]
  root --> b["Section B"]
  a --> a1["Sub 1"]
  a --> a2["Sub 2"]`

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

describe('computeCurvedLayout()', () => {
  it('returns a LayoutNode tree with root at center (x≈0, y≈0)', () => {
    const layout = computeCurvedLayout(buildTree(parse(DIAGRAM)))
    expect(layout.x).toBeCloseTo(0, 0)
    expect(layout.y).toBeCloseTo(0, 0)
  })

  it('children are positioned at a radius > 0', () => {
    const layout = computeCurvedLayout(buildTree(parse(DIAGRAM)))
    for (const child of layout.children) {
      const radius = Math.sqrt(child.x ** 2 + child.y ** 2)
      expect(radius).toBeGreaterThan(0)
    }
  })

  it('grandchildren are at a greater radius than children', () => {
    const layout = computeCurvedLayout(buildTree(parse(DIAGRAM)))
    const a = layout.children[0]
    const radiusA = Math.sqrt(a.x ** 2 + a.y ** 2)
    for (const gc of a.children) {
      const radiusGC = Math.sqrt(gc.x ** 2 + gc.y ** 2)
      expect(radiusGC).toBeGreaterThan(radiusA)
    }
  })

  it('has the same structure as the tree', () => {
    const layout = computeCurvedLayout(buildTree(parse(DIAGRAM)))
    expect(layout.children).toHaveLength(2)
    expect(layout.children[0].children).toHaveLength(2)
  })
})

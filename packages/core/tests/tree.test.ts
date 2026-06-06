import { describe, it, expect } from 'vitest'
import { buildTree, type TreeNode } from '../src/tree'
import { parse } from '../src/parser'
import { PALETTE } from '../src/design'

const SIMPLE = `flowchart LR
  root["Site"]
  root --> a["A"]
  root --> b["B"]
  a --> a1["A1"]`

const FIVE_BRANCHES = `flowchart LR
  root["Root"]
  root --> n1["N1"]
  root --> n2["N2"]
  root --> n3["N3"]
  root --> n4["N4"]
  root --> n5["N5"]
  root --> n6["N6"]`

describe('buildTree()', () => {
  it('finds the root node (no incoming edges)', () => {
    const tree = buildTree(parse(SIMPLE))
    expect(tree.id).toBe('root')
    expect(tree.label).toBe('Site')
    expect(tree.depth).toBe(0)
  })

  it('builds correct child relationships', () => {
    const tree = buildTree(parse(SIMPLE))
    expect(tree.children).toHaveLength(2)
    expect(tree.children.map(c => c.id)).toEqual(['a', 'b'])
  })

  it('builds grandchildren', () => {
    const tree = buildTree(parse(SIMPLE))
    const a = tree.children.find(c => c.id === 'a')!
    expect(a.children).toHaveLength(1)
    expect(a.children[0].id).toBe('a1')
  })

  it('assigns palette colors to top-level branches in order', () => {
    const tree = buildTree(parse(SIMPLE))
    expect(tree.children[0].branchColor).toBe(PALETTE[0])
    expect(tree.children[1].branchColor).toBe(PALETTE[1])
  })

  it('cycles palette when more than 5 branches', () => {
    const tree = buildTree(parse(FIVE_BRANCHES))
    expect(tree.children[5].branchColor).toBe(PALETTE[0]) // wraps to index 0
  })

  it('grandchildren inherit parent branch color', () => {
    const tree = buildTree(parse(SIMPLE))
    const a = tree.children[0]
    expect(a.children[0].branchColor).toBe(a.branchColor)
  })

  it('root node has empty branchColor', () => {
    const tree = buildTree(parse(SIMPLE))
    expect(tree.branchColor).toBe('')
  })

  it('resolves style overrides: fill:none → outlined variant', () => {
    const src = `flowchart LR
  root["Site"] --> a["A"]
style a fill:none,stroke:#4B96E6`
    const tree = buildTree(parse(src))
    const a = tree.children[0]
    expect(a.resolvedStyle.variant).toBe('outlined')
    expect(a.resolvedStyle.strokeColor).toBe('#4B96E6')
  })

  it('resolves style overrides: stroke-dasharray → dashed variant', () => {
    const src = `flowchart LR
  root["Site"] --> a["A"]
style a stroke:#4B96E6,stroke-dasharray:5 5`
    const tree = buildTree(parse(src))
    expect(tree.children[0].resolvedStyle.variant).toBe('dashed')
  })

  it('resolves default variant as filled when no style directive', () => {
    const tree = buildTree(parse(SIMPLE))
    expect(tree.children[0].resolvedStyle.variant).toBe('filled')
  })
})

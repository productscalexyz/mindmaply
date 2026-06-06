import { describe, it, expect } from 'vitest'
import { renderSVG } from '../src/renderer/index'
import { computeOrthogonalLayout } from '../src/layout/orthogonal'
import { computeCurvedLayout } from '../src/layout/curved'
import { buildTree } from '../src/tree'
import { parse } from '../src/parser'

const SIMPLE = `flowchart LR
  root["Site"]
  root --> a["Section A"]
  root --> b["Section B"]
  a --> a1["Sub 1"]`

function getLayout(src: string, mode: 'orthogonal' | 'curved' = 'orthogonal') {
  const tree = buildTree(parse(src))
  return mode === 'orthogonal'
    ? computeOrthogonalLayout(tree)
    : computeCurvedLayout(tree)
}

describe('renderSVG()', () => {
  it('returns a string starting with <svg', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg.trimStart()).toMatch(/^<svg/)
  })

  it('closes with </svg>', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg.trimEnd()).toMatch(/<\/svg>$/)
  })

  it('contains the canvas background rect with design color', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg).toContain('#F4F5F7')
  })

  it('contains root node label text', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg).toContain('Site')
  })

  it('contains child node label texts', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg).toContain('Section A')
    expect(svg).toContain('Section B')
    expect(svg).toContain('Sub 1')
  })

  it('contains a white rect for the root node', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg).toContain('#FFFFFF')
  })

  it('contains edge paths', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    // 3 edges in the simple diagram
    const pathCount = (svg.match(/<path/g) ?? []).length
    expect(pathCount).toBeGreaterThanOrEqual(3)
  })

  it('edge paths use the branch color', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    // First branch gets PALETTE[0] = #4B96E6
    expect(svg).toContain('#4B96E6')
  })

  it('does not contain undefined or NaN in output', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg).not.toContain('undefined')
    expect(svg).not.toContain('NaN')
  })

  it('works with curved layout', () => {
    const src = `%%{init: {"mindmaply": {"layout": "curved"}}}%%\n${SIMPLE}`
    const svg = renderSVG(getLayout(src, 'curved'), { layout: 'curved' })
    expect(svg).toContain('Site')
    expect(svg).not.toContain('NaN')
  })

  it('orthogonal edges use H-V-H elbow paths, no bezier', () => {
    const svg = renderSVG(getLayout(SIMPLE), { layout: 'orthogonal' })
    // Fan renderer emits one full H-V-H path per edge, all straight lines, no C command.
    expect(svg).not.toContain(' C ')
    const pathDs = [...svg.matchAll(/d="([^"]+)"/g)].map(m => m[1])
    // Every edge path starts with M and contains both H and V moves.
    const edgePaths = pathDs.filter(d => d.startsWith('M') && / H /.test(d) && / V /.test(d))
    // SIMPLE: root→a, root→b, a→a1  →  3 edge paths
    expect(edgePaths.length).toBeGreaterThanOrEqual(3)
  })

  it('orthogonal fan uses unique exit-y ports per sibling (no shared origin point)', () => {
    const svg = renderSVG(getLayout(SIMPLE), { layout: 'orthogonal' })
    // root has 2 children (a, b). Their paths should start at different y values.
    const pathDs = [...svg.matchAll(/d="M ([\d.-]+) ([\d.-]+) H/g)]
    const startYs = pathDs.map(m => parseFloat(m[2]))
    // At least 2 distinct y origins exist among all edge paths.
    const unique = new Set(startYs.map(y => Math.round(y)))
    expect(unique.size).toBeGreaterThanOrEqual(2)
  })

  it('curved edges use cubic bezier paths (C command)', () => {
    const svg = renderSVG(getLayout(SIMPLE, 'curved'), { layout: 'curved' })
    const pathDs = [...svg.matchAll(/d="([^"]+)"/g)].map(m => m[1])
    const edgePaths = pathDs.filter(d => d.startsWith('M') && d.includes(' C '))
    expect(edgePaths.length).toBeGreaterThanOrEqual(3)
    edgePaths.forEach(d => expect(d).toContain(' C '))
  })

  it('orthogonal and curved produce different edge SVG output', () => {
    const ortho = renderSVG(getLayout(SIMPLE), { layout: 'orthogonal' })
    const curved = renderSVG(getLayout(SIMPLE, 'curved'), { layout: 'curved' })
    expect(ortho).not.toEqual(curved)
  })
})

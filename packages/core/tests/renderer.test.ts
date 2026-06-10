import { describe, it, expect } from 'vitest'
import { renderSVG } from '../src/renderer/index'
import { computeOrthogonalLayout } from '../src/layout/orthogonal'
import { buildTree } from '../src/tree'
import { parse } from '../src/parser'
import { DEFAULT_THEME } from '../src/config'

const SIMPLE = `flowchart LR
  root["Site"]
  root --> a["Section A"]
  root --> b["Section B"]
  a --> a1["Sub 1"]`

function getLayout(src: string, direction: 'LR' | 'TD' = 'LR') {
  return computeOrthogonalLayout(buildTree(parse(src)), direction)
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

  it('works with curved edges', () => {
    const svg = renderSVG(getLayout(SIMPLE), { edgeStyle: 'curved' })
    expect(svg).toContain('Site')
    expect(svg).not.toContain('NaN')
  })

  it('straight edges use H-V-H elbow paths, no bezier', () => {
    const svg = renderSVG(getLayout(SIMPLE), { edgeStyle: 'straight' })
    // Fan renderer emits one full H-V-H path per edge, all straight lines, no C command.
    expect(svg).not.toContain(' C ')
    const pathDs = [...svg.matchAll(/d="([^"]+)"/g)].map(m => m[1])
    // Every edge path starts with M and contains both H and V moves.
    const edgePaths = pathDs.filter(d => d.startsWith('M') && / H /.test(d) && / V /.test(d))
    // SIMPLE: root→a, root→b, a→a1  →  3 edge paths
    expect(edgePaths.length).toBeGreaterThanOrEqual(3)
  })

  it('straight fan uses unique exit-y ports per sibling (no shared origin point)', () => {
    const svg = renderSVG(getLayout(SIMPLE), { edgeStyle: 'straight' })
    // root has 2 children (a, b). Their paths should start at different y values.
    const pathDs = [...svg.matchAll(/d="M ([\d.-]+) ([\d.-]+) H/g)]
    const startYs = pathDs.map(m => parseFloat(m[2]))
    // At least 2 distinct y origins exist among all edge paths.
    const unique = new Set(startYs.map(y => Math.round(y)))
    expect(unique.size).toBeGreaterThanOrEqual(2)
  })

  it('curved edges use cubic bezier paths (C command)', () => {
    const svg = renderSVG(getLayout(SIMPLE), { edgeStyle: 'curved' })
    const pathDs = [...svg.matchAll(/d="([^"]+)"/g)].map(m => m[1])
    const edgePaths = pathDs.filter(d => d.startsWith('M') && d.includes(' C '))
    expect(edgePaths.length).toBeGreaterThanOrEqual(3)
    edgePaths.forEach(d => expect(d).toContain(' C '))
  })

  it('straight and curved produce different edge SVG output', () => {
    const straight = renderSVG(getLayout(SIMPLE), { edgeStyle: 'straight' })
    const curved = renderSVG(getLayout(SIMPLE), { edgeStyle: 'curved' })
    expect(straight).not.toEqual(curved)
  })
})

describe('renderSVG() — curved + TD', () => {
  it('curved TD edges leave the parent bottom with a vertical tangent', () => {
    const layout = getLayout(SIMPLE, 'TD')
    const svg = renderSVG(layout, { edgeStyle: 'curved', direction: 'TD' })
    const beziers = [...svg.matchAll(/d="M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+),/g)]
    expect(beziers.length).toBeGreaterThanOrEqual(3)
    for (const m of beziers) {
      // vertical tangent: the first control point shares the start x
      expect(parseFloat(m[3])).toBeCloseTo(parseFloat(m[1]), 5)
    }
  })

  it('root→child curved TD edges start at the root bottom edge', () => {
    const layout = getLayout(SIMPLE, 'TD')
    const svg = renderSVG(layout, { edgeStyle: 'curved', direction: 'TD' })
    const rootBottom = layout.y + layout.height / 2
    const starts = [...svg.matchAll(/d="M ([\d.-]+) ([\d.-]+) C/g)].map(m => parseFloat(m[2]))
    expect(starts.some(y => Math.abs(y - rootBottom) < 0.001)).toBe(true)
  })
})

describe('renderSVG() — themes', () => {
  it('theme colors and fonts appear in the output', () => {
    const theme = {
      ...DEFAULT_THEME,
      canvasBg: '#101214',
      rootBg: '#1B1E22',
      textColor: '#E2E8F0',
      fontFamily: 'Georgia, serif',
      fontSize: 14,
    }
    const svg = renderSVG(getLayout(SIMPLE), { theme })
    expect(svg).toContain('#101214')
    expect(svg).toContain('#1B1E22')
    expect(svg).toContain('#E2E8F0')
    expect(svg).toContain('Georgia, serif')
    expect(svg).toContain('font-size="14"')
    expect(svg).not.toContain('#F4F5F7')
  })

  it('default theme output matches the no-theme output exactly', () => {
    const withDefault = renderSVG(getLayout(SIMPLE), { theme: DEFAULT_THEME })
    const without = renderSVG(getLayout(SIMPLE))
    expect(withDefault).toEqual(without)
  })
})

describe('renderSVG() — multi-line labels', () => {
  it('labels with \\n render as one tspan per line', () => {
    const tree = buildTree(parse(SIMPLE))
    tree.children[0].label = 'On effectiveness\nand features'
    const layout = computeOrthogonalLayout(tree)
    const svg = renderSVG(layout)
    expect(svg).toContain('<tspan')
    expect(svg).toContain('On effectiveness')
    expect(svg).toContain('and features')
  })

  it('single-line labels render without tspans', () => {
    const svg = renderSVG(getLayout(SIMPLE))
    expect(svg).not.toContain('<tspan')
  })
})

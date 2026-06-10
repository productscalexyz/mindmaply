import type { LayoutNode } from '../layout/types'
import { renderDefs, renderBackground, renderRootNode, renderChildNode } from './nodes'
import { renderOrthogonalFan, renderCurvedEdge } from './edges'
import { SVG_CANVAS_PADDING } from '../design'
import { DEFAULT_THEME, type EdgeStyle, type Theme } from '../config'

export interface RenderSVGOptions {
  edgeStyle?: EdgeStyle
  direction?: 'LR' | 'TD'
  theme?: Theme
  padding?: number
}

function collectNodes(root: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [root]
  for (const child of root.children) {
    result.push(...collectNodes(child))
  }
  return result
}

// Collect all parent→children groups (one per non-leaf node)
function collectFans(root: LayoutNode): Array<{ parent: LayoutNode; children: LayoutNode[] }> {
  const fans: Array<{ parent: LayoutNode; children: LayoutNode[] }> = []
  if (root.children.length > 0) {
    fans.push({ parent: root, children: root.children })
    for (const child of root.children) {
      fans.push(...collectFans(child))
    }
  }
  return fans
}

// Collect flat parent→child pairs for per-edge renderers (curved mode)
function collectEdges(root: LayoutNode): Array<{ parent: LayoutNode; child: LayoutNode }> {
  const edges: Array<{ parent: LayoutNode; child: LayoutNode }> = []
  for (const child of root.children) {
    edges.push({ parent: root, child })
    edges.push(...collectEdges(child))
  }
  return edges
}

export function renderSVG(root: LayoutNode, options: RenderSVGOptions = {}): string {
  const {
    edgeStyle = 'straight',
    direction = 'LR',
    theme = DEFAULT_THEME,
    padding = SVG_CANVAS_PADDING,
  } = options

  const nodes = collectNodes(root)

  // Bounding box over all node extents (loop, not spread — spread blows the
  // argument limit on very large diagrams)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.width / 2)
    maxX = Math.max(maxX, n.x + n.width / 2)
    minY = Math.min(minY, n.y - n.height / 2)
    maxY = Math.max(maxY, n.y + n.height / 2)
  }
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding
  const width = maxX - minX
  const height = maxY - minY

  // Straight: render each parent's children as one non-overlapping fan (trunk + stubs).
  // Curved: render each edge as an independent bezier arc.
  const edgeSVG = edgeStyle === 'straight'
    ? collectFans(root).map(({ parent, children }) => renderOrthogonalFan(parent, children, direction, theme)).join('\n')
    : collectEdges(root).map(({ parent, child }) => renderCurvedEdge(parent, child, direction, theme)).join('\n')

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">`,
    renderDefs(),
    renderBackground(width, height, minX, minY, theme),
    // Edges drawn first (below nodes)
    edgeSVG,
    // Root node
    renderRootNode(root, theme),
    // All child nodes
    ...nodes.filter(n => n.depth > 0).map(n => renderChildNode(n, theme)),
    '</svg>',
  ]

  return parts.join('\n')
}

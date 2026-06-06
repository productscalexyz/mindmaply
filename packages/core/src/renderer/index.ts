import type { LayoutNode } from '../layout/types'
import { renderDefs, renderBackground, renderRootNode, renderChildNode } from './nodes'
import { renderOrthogonalFan, renderCurvedEdge } from './edges'
import { SVG_CANVAS_PADDING } from '../design'

export interface RenderOptions {
  layout?: 'orthogonal' | 'curved'
  direction?: 'LR' | 'TD'
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

export function renderSVG(root: LayoutNode, options: RenderOptions = {}): string {
  const { layout = 'orthogonal', direction = 'LR', padding = SVG_CANVAS_PADDING } = options

  const nodes = collectNodes(root)

  // Compute bounding box from all node positions
  const xs = nodes.flatMap(n => [n.x - n.width / 2, n.x + n.width / 2])
  const ys = nodes.flatMap(n => [n.y - n.height / 2, n.y + n.height / 2])
  const minX = Math.min(...xs) - padding
  const minY = Math.min(...ys) - padding
  const maxX = Math.max(...xs) + padding
  const maxY = Math.max(...ys) + padding
  const width = maxX - minX
  const height = maxY - minY

  // Orthogonal: render each parent's children as one non-overlapping fan (trunk + stubs).
  // Curved: render each edge as an independent bezier arc.
  const edgeSVG = layout === 'orthogonal'
    ? collectFans(root).map(({ parent, children }) => renderOrthogonalFan(parent, children, direction)).join('\n')
    : collectEdges(root).map(({ parent, child }) => renderCurvedEdge(parent, child)).join('\n')

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">`,
    renderDefs(),
    renderBackground(width, height, minX, minY),
    // Edges drawn first (below nodes)
    edgeSVG,
    // Root node
    renderRootNode(root),
    // All child nodes
    ...nodes.filter(n => n.depth > 0).map(renderChildNode),
    '</svg>',
  ]

  return parts.join('\n')
}

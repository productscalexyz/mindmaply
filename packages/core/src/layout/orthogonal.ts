import { hierarchy, tree, type HierarchyPointNode } from 'd3-hierarchy'
import type { TreeNode } from '../tree'
import type { LayoutNode } from './types'
import {
  ORTHO_H_GAP,
  ORTHO_V_GAP,
  NODE_HEIGHT,
  ROOT_MIN_WIDTH,
  ROOT_MIN_HEIGHT,
  ROOT_PADDING_H,
  FONT_SIZE,
} from '../design'

// Estimate text width for a label (rough approximation for SVG layout)
function estimateTextWidth(label: string): number {
  return label.length * (FONT_SIZE * 0.6)
}

function toLayoutNode(
  d3Node: HierarchyPointNode<TreeNode>,
  parent: LayoutNode | null,
  direction: 'LR' | 'TD',
): LayoutNode {
  const treeNode = d3Node.data
  const isRoot = treeNode.depth === 0

  const width = isRoot
    ? Math.max(ROOT_MIN_WIDTH, estimateTextWidth(treeNode.label) + ROOT_PADDING_H * 2)
    : estimateTextWidth(treeNode.label)
  const height = isRoot ? ROOT_MIN_HEIGHT : NODE_HEIGHT

  // LR: d3.y is depth (→ our x), d3.x is cross (→ our y)
  // TD: d3.x is cross (→ our x), d3.y is depth (→ our y)
  const layoutNode: LayoutNode = {
    id: treeNode.id,
    label: treeNode.label,
    shape: treeNode.shape,
    depth: treeNode.depth,
    branchColor: treeNode.branchColor,
    resolvedStyle: treeNode.resolvedStyle,
    x: direction === 'LR' ? d3Node.y : d3Node.x,
    y: direction === 'LR' ? d3Node.x : d3Node.y,
    width,
    height,
    children: [],
    parent,
  }

  layoutNode.children = (d3Node.children ?? []).map(c =>
    toLayoutNode(c, layoutNode, direction),
  )

  return layoutNode
}

// Width-aware columns (LR only): left-align each depth just past the widest
// node of the previous depth, so every parent→child edge keeps at least
// ORTHO_H_GAP of horizontal run. The d3 depth-axis step is a fixed
// ROOT_MIN_WIDTH + ORTHO_H_GAP, so wide labels otherwise swallow the gap and
// produce near-vertical kinked edges (e.g. a 7px run for a 30px rise). In TD
// mode the depth axis is vertical with a uniform NODE_HEIGHT step, so the kink
// can't occur and this pass doesn't apply.
function applyColumnWidths(root: LayoutNode): void {
  const maxWidthAtDepth: number[] = []
  ;(function scan(n: LayoutNode) {
    maxWidthAtDepth[n.depth] = Math.max(maxWidthAtDepth[n.depth] ?? 0, n.width)
    n.children.forEach(scan)
  })(root)

  const colLeft: number[] = [-root.width / 2] // root stays centered at x=0
  for (let d = 1; d < maxWidthAtDepth.length; d++) {
    colLeft[d] = colLeft[d - 1] + maxWidthAtDepth[d - 1] + ORTHO_H_GAP
  }

  ;(function place(n: LayoutNode) {
    if (n.depth > 0) n.x = colLeft[n.depth] + n.width / 2
    n.children.forEach(place)
  })(root)
}

export function computeOrthogonalLayout(root: TreeNode, direction: 'LR' | 'TD' = 'LR'): LayoutNode {
  const hier = hierarchy<TreeNode>(root, d => d.children)

  // tree() (Reingold-Tilford) places each node at its actual depth
  // nodeSize: [cross-axis spacing, depth-axis step]
  const treeLayout = direction === 'LR'
    ? tree<TreeNode>().nodeSize([NODE_HEIGHT + ORTHO_V_GAP, ROOT_MIN_WIDTH + ORTHO_H_GAP])
    : tree<TreeNode>().nodeSize([ROOT_MIN_WIDTH + ORTHO_H_GAP, NODE_HEIGHT + ORTHO_V_GAP])

  treeLayout(hier)

  const rootNode = hier as HierarchyPointNode<TreeNode>

  // Normalize so root sits at (0, 0)
  const rootDepthAxis = direction === 'LR' ? rootNode.y : rootNode.y
  const rootCrossAxis = direction === 'LR' ? rootNode.x : rootNode.x

  function offset(n: HierarchyPointNode<TreeNode>) {
    n.y -= rootDepthAxis
    n.x -= rootCrossAxis
    n.children?.forEach(offset)
  }
  offset(rootNode)

  const layout = toLayoutNode(rootNode, null, direction)
  if (direction === 'LR') applyColumnWidths(layout)
  return layout
}

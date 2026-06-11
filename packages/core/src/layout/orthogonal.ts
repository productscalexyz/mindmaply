import { hierarchy, tree, type HierarchyPointNode } from 'd3-hierarchy'
import type { TreeNode } from '../tree'
import type { LayoutNode } from './types'
import { DEFAULT_THEME, type Theme } from '../config'
import {
  ORTHO_H_GAP,
  ORTHO_V_GAP,
  NODE_HEIGHT,
  ROOT_MIN_WIDTH,
  ROOT_MIN_HEIGHT,
  ROOT_PADDING_H,
  NODE_PADDING_H,
  EXTRA_LINE_FACTOR,
} from '../design'
import { estimateLineWidth, wrapLabel, fontSizeForDepth } from './text'

interface LayoutContext {
  direction: 'LR' | 'TD'
  theme: Theme
  /** Memoized display lines per node — wrap decisions must be identical in
   * the separation callback and node sizing. */
  linesOf: (n: TreeNode) => string[]
}

function nodeWidth(lines: string[], depth: number, theme: Theme): number {
  const fs = fontSizeForDepth(depth, theme)
  const textWidth = Math.max(...lines.map(l => estimateLineWidth(l, fs)))
  // Card mode draws a padded rect behind non-root text — edges and columns
  // must clear the card, not just the glyphs (root pads via ROOT_PADDING_H).
  const pad = depth > 0 && theme.nodeStyle === 'card' ? NODE_PADDING_H * 2 : 0
  return textWidth + pad
}

function nodeHeight(lines: string[], depth: number, theme: Theme): number {
  const base = depth === 0 ? ROOT_MIN_HEIGHT : NODE_HEIGHT
  return base + (lines.length - 1) * fontSizeForDepth(depth, theme) * EXTRA_LINE_FACTOR
}

function toLayoutNode(
  d3Node: HierarchyPointNode<TreeNode>,
  parent: LayoutNode | null,
  ctx: LayoutContext,
): LayoutNode {
  const treeNode = d3Node.data
  const isRoot = treeNode.depth === 0

  const lines = ctx.linesOf(treeNode)
  const textWidth = nodeWidth(lines, treeNode.depth, ctx.theme)
  const width = isRoot
    ? Math.max(ROOT_MIN_WIDTH, textWidth + ROOT_PADDING_H * 2)
    : textWidth

  // LR: d3.y is depth (→ our x), d3.x is cross (→ our y)
  // TD: d3.x is cross (→ our x), d3.y is depth (→ our y)
  const layoutNode: LayoutNode = {
    id: treeNode.id,
    label: treeNode.label,
    lines,
    shape: treeNode.shape,
    depth: treeNode.depth,
    branchColor: treeNode.branchColor,
    resolvedStyle: treeNode.resolvedStyle,
    x: ctx.direction === 'LR' ? d3Node.y : d3Node.x,
    y: ctx.direction === 'LR' ? d3Node.x : d3Node.y,
    width,
    height: nodeHeight(lines, treeNode.depth, ctx.theme),
    children: [],
    parent,
  }

  layoutNode.children = (d3Node.children ?? []).map(c =>
    toLayoutNode(c, layoutNode, ctx),
  )

  return layoutNode
}

// Width-aware columns (LR only): left-align each depth just past the widest
// node of the previous depth, so every parent→child edge keeps at least
// ORTHO_H_GAP of horizontal run. The d3 depth-axis step is a fixed
// ROOT_MIN_WIDTH + ORTHO_H_GAP, so wide labels otherwise swallow the gap and
// produce near-vertical kinked edges (e.g. a 7px run for a 30px rise).
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

// Height-aware rows (TD only) — the vertical mirror of applyColumnWidths.
// With uniform single-line nodes this reproduces the fixed d3 depth step
// exactly; once multi-line labels make nodes taller, each depth row drops
// just below the tallest node of the previous row.
function applyRowHeights(root: LayoutNode): void {
  const maxHeightAtDepth: number[] = []
  ;(function scan(n: LayoutNode) {
    maxHeightAtDepth[n.depth] = Math.max(maxHeightAtDepth[n.depth] ?? 0, n.height)
    n.children.forEach(scan)
  })(root)

  const rowTop: number[] = [-root.height / 2] // root stays centered at y=0
  for (let d = 1; d < maxHeightAtDepth.length; d++) {
    rowTop[d] = rowTop[d - 1] + maxHeightAtDepth[d - 1] + ORTHO_V_GAP
  }

  ;(function place(n: LayoutNode) {
    if (n.depth > 0) n.y = rowTop[n.depth] + n.height / 2
    n.children.forEach(place)
  })(root)
}

export function computeOrthogonalLayout(
  root: TreeNode,
  direction: 'LR' | 'TD' = 'LR',
  theme: Theme = DEFAULT_THEME,
): LayoutNode {
  const hier = hierarchy<TreeNode>(root, d => d.children)

  // Wrap each label exactly once — the separation callback and node sizing
  // must agree on line breaks or boxes and spacing drift apart.
  const linesCache = new Map<TreeNode, string[]>()
  const linesOf = (n: TreeNode): string[] => {
    let lines = linesCache.get(n)
    if (!lines) {
      lines = wrapLabel(n.label, theme.wrapWidth, fontSizeForDepth(n.depth, theme))
      linesCache.set(n, lines)
    }
    return lines
  }

  // Cross-axis spacing must grow with multi-line labels (LR cross axis is
  // vertical = node height). The base matches d3's default separation
  // (1 between siblings, 2 otherwise) so single-line diagrams are unchanged.
  const crossStep = direction === 'LR'
    ? NODE_HEIGHT + ORTHO_V_GAP
    : ROOT_MIN_WIDTH + ORTHO_H_GAP
  const extraLines = (n: { data: TreeNode }) => linesOf(n.data).length - 1

  // tree() (Reingold-Tilford) places each node at its actual depth
  // nodeSize: [cross-axis spacing, depth-axis step]
  const treeLayout = (direction === 'LR'
    ? tree<TreeNode>().nodeSize([NODE_HEIGHT + ORTHO_V_GAP, ROOT_MIN_WIDTH + ORTHO_H_GAP])
    : tree<TreeNode>().nodeSize([ROOT_MIN_WIDTH + ORTHO_H_GAP, NODE_HEIGHT + ORTHO_V_GAP])
  ).separation((a, b) => {
    const base = a.parent === b.parent ? 1 : 2
    if (direction === 'TD') {
      // TD cross axis is horizontal = node width; the fixed crossStep can't
      // absorb wide labels, so widen separation until boxes clear ORTHO_V_GAP.
      const widthOf = (n: { data: TreeNode }) =>
        nodeWidth(linesOf(n.data), n.data.depth, theme)
      const needed = (widthOf(a) + widthOf(b)) / 2 + ORTHO_V_GAP
      return Math.max(base, needed / crossStep)
    }
    const extra =
      ((extraLines(a) + extraLines(b)) / 2) *
      ((fontSizeForDepth(a.depth, theme) * EXTRA_LINE_FACTOR) / crossStep)
    return base + extra
  })

  treeLayout(hier)

  const rootNode = hier as HierarchyPointNode<TreeNode>

  // Normalize so root sits at (0, 0)
  const rootDepthAxis = rootNode.y
  const rootCrossAxis = rootNode.x

  function offset(n: HierarchyPointNode<TreeNode>) {
    n.y -= rootDepthAxis
    n.x -= rootCrossAxis
    n.children?.forEach(offset)
  }
  offset(rootNode)

  const layout = toLayoutNode(rootNode, null, { direction, theme, linesOf })
  if (direction === 'LR') applyColumnWidths(layout)
  else applyRowHeights(layout)
  return layout
}

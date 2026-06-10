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
} from '../design'

// Per-line-height for the 2nd+ lines of a multi-line label (from <br/>)
const EXTRA_LINE_FACTOR = 1.25

// Width factors by character class — a rough but stable SVG estimate that
// beats a flat 0.6em for labels heavy in narrow (il.,') or wide (mwMW) glyphs.
const NARROW_RE = /[iltfj.,;:'"!|()[\] ]/
const WIDE_RE = /[mwMW@%&]/

function charWidthFactor(ch: string): number {
  if (NARROW_RE.test(ch)) return 0.35
  if (WIDE_RE.test(ch)) return 0.9
  return 0.6
}

// Estimate text width for a single line of a label
function estimateLineWidth(line: string, fontSize: number): number {
  let factor = 0
  for (const ch of line) factor += charWidthFactor(ch)
  return factor * fontSize
}

function labelLines(label: string): string[] {
  return label.split('\n')
}

function estimateTextWidth(label: string, fontSize: number): number {
  return Math.max(...labelLines(label).map(l => estimateLineWidth(l, fontSize)))
}

function nodeHeight(treeNode: TreeNode, fontSize: number): number {
  const lines = labelLines(treeNode.label).length
  const base = treeNode.depth === 0 ? ROOT_MIN_HEIGHT : NODE_HEIGHT
  return base + (lines - 1) * fontSize * EXTRA_LINE_FACTOR
}

function toLayoutNode(
  d3Node: HierarchyPointNode<TreeNode>,
  parent: LayoutNode | null,
  direction: 'LR' | 'TD',
  theme: Theme,
): LayoutNode {
  const treeNode = d3Node.data
  const isRoot = treeNode.depth === 0

  const textWidth = estimateTextWidth(treeNode.label, theme.fontSize)
  const width = isRoot
    ? Math.max(ROOT_MIN_WIDTH, textWidth + ROOT_PADDING_H * 2)
    : textWidth

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
    height: nodeHeight(treeNode, theme.fontSize),
    children: [],
    parent,
  }

  layoutNode.children = (d3Node.children ?? []).map(c =>
    toLayoutNode(c, layoutNode, direction, theme),
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

  // Cross-axis spacing must grow with multi-line labels (LR cross axis is
  // vertical = node height). The base matches d3's default separation
  // (1 between siblings, 2 otherwise) so single-line diagrams are unchanged.
  const crossStep = direction === 'LR'
    ? NODE_HEIGHT + ORTHO_V_GAP
    : ROOT_MIN_WIDTH + ORTHO_H_GAP
  const extraLines = (n: { data: TreeNode }) =>
    labelLines(n.data.label).length - 1

  // tree() (Reingold-Tilford) places each node at its actual depth
  // nodeSize: [cross-axis spacing, depth-axis step]
  const treeLayout = (direction === 'LR'
    ? tree<TreeNode>().nodeSize([NODE_HEIGHT + ORTHO_V_GAP, ROOT_MIN_WIDTH + ORTHO_H_GAP])
    : tree<TreeNode>().nodeSize([ROOT_MIN_WIDTH + ORTHO_H_GAP, NODE_HEIGHT + ORTHO_V_GAP])
  ).separation((a, b) => {
    const base = a.parent === b.parent ? 1 : 2
    if (direction === 'TD') return base
    const extra =
      ((extraLines(a) + extraLines(b)) / 2) *
      ((theme.fontSize * EXTRA_LINE_FACTOR) / crossStep)
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

  const layout = toLayoutNode(rootNode, null, direction, theme)
  if (direction === 'LR') applyColumnWidths(layout)
  else applyRowHeights(layout)
  return layout
}

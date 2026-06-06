// Curved mode uses the same left-to-right layout as orthogonal.
// The visual distinction is in the edge rendering (smooth arcs vs. elbow connectors).
// A full-circle radial layout was tried but caused branch lines to cross each other
// because branches radiating in opposite directions (left vs. right from root) intersected.
import { computeOrthogonalLayout } from './orthogonal'
import type { TreeNode } from '../tree'
import type { LayoutNode } from './types'

export function computeCurvedLayout(root: TreeNode): LayoutNode {
  return computeOrthogonalLayout(root)
}

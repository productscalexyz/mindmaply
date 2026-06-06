export interface LayoutNode {
  id: string
  label: string
  shape: 'rect' | 'circle' | 'pill'
  depth: number
  branchColor: string
  resolvedStyle: import('../tree').ResolvedStyle
  // SVG coordinates — center of the node text / rect
  x: number  // horizontal (left = root, right = leaves)
  y: number  // vertical
  // Bounding box (for root rect; children use text metrics estimate)
  width: number
  height: number
  children: LayoutNode[]
  parent: LayoutNode | null
}

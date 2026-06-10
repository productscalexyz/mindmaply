import { DEFAULT_THEME, type Theme } from '../config'
import type { LayoutNode } from '../layout/types'

function edgeAttrs(child: LayoutNode, theme: Theme): string {
  const dash = child.resolvedStyle.strokeDasharray
    ? ` stroke-dasharray="${child.resolvedStyle.strokeDasharray}"`
    : ''
  const color = child.resolvedStyle.strokeColor || child.branchColor
  return `stroke="${color}" stroke-width="${theme.edgeStrokeWidth}" fill="none"${dash}`
}

// Orthogonal fan: each child gets its own complete elbow path in its branch color.
// LR mode: H-V-H paths fanning from the parent's right edge.
// TD mode: V-H-V paths fanning from the parent's bottom edge.
export function renderOrthogonalFan(
  parent: LayoutNode,
  children: LayoutNode[],
  direction: 'LR' | 'TD' = 'LR',
  theme: Theme = DEFAULT_THEME,
): string {
  if (children.length === 0) return ''
  const n = children.length

  if (direction === 'TD') {
    const py = parent.y + parent.height / 2  // parent bottom edge
    // Sort children left-to-right for port assignment in visual order
    const sorted = [...children].sort((a, b) => a.x - b.x)
    return sorted.map((child, i) => {
      const exitX = parent.x - parent.width / 2 + (i + 0.5) * parent.width / n
      const cx = child.x
      const cy = child.y - child.height / 2  // child top edge
      const midY = (py + cy) / 2
      const d = `M ${exitX} ${py} V ${midY} H ${cx} V ${cy}`
      return `<path d="${d}" ${edgeAttrs(child, theme)}/>`
    }).join('\n')
  }

  // LR: fan from parent's right edge
  const px = parent.x + parent.width / 2  // parent right edge
  // Sort children top-to-bottom so exit ports are assigned in visual order
  const sorted = [...children].sort((a, b) => a.y - b.y)
  return sorted.map((child, i) => {
    const exitY = parent.y - parent.height / 2 + (i + 0.5) * parent.height / n
    const cx = child.x - child.width / 2
    const cy = child.y
    const midX = (px + cx) / 2
    const d = `M ${px} ${exitY} H ${midX} V ${cy} H ${cx}`
    return `<path d="${d}" ${edgeAttrs(child, theme)}/>`
  }).join('\n')
}

// Curved S-arc: cubic bezier with the control-point column shifted 70 % toward
// the child. Tangents at both ends run along the flow axis (horizontal in LR,
// vertical in TD), which guarantees branches from the same parent never cross.
export function renderCurvedEdge(
  parent: LayoutNode,
  child: LayoutNode,
  direction: 'LR' | 'TD' = 'LR',
  theme: Theme = DEFAULT_THEME,
): string {
  if (direction === 'TD') {
    const px = parent.x
    const py = parent.y + parent.height / 2
    const cx = child.x
    const cy = child.y - child.height / 2
    const cpY = py + (cy - py) * 0.7
    const d = `M ${px} ${py} C ${px} ${cpY}, ${cx} ${cpY}, ${cx} ${cy}`
    return `<path d="${d}" ${edgeAttrs(child, theme)}/>`
  }

  const px = parent.x + parent.width / 2
  const py = parent.y
  const cx = child.x - child.width / 2
  const cy = child.y
  const cpX = px + (cx - px) * 0.7
  const d = `M ${px} ${py} C ${cpX} ${py}, ${cpX} ${cy}, ${cx} ${cy}`
  return `<path d="${d}" ${edgeAttrs(child, theme)}/>`
}

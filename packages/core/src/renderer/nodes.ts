import {
  CANVAS_BG,
  TEXT_COLOR,
  ROOT_BG,
  ROOT_BORDER_RADIUS,
  FONT_FAMILY,
  FONT_WEIGHT_ROOT,
  FONT_WEIGHT_PRIMARY,
  FONT_WEIGHT_SECONDARY,
  FONT_SIZE,
} from '../design'
import type { LayoutNode } from '../layout/types'

// Drop shadow matches ROOT_SHADOW design token: 0 1px 3px rgba(0,0,0,0.1)
export function renderDefs(): string {
  return `<defs>
  <filter id="mm-shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.1)"/>
  </filter>
</defs>`
}

export function renderBackground(width: number, height: number, offsetX: number, offsetY: number): string {
  return `<rect x="${offsetX}" y="${offsetY}" width="${width}" height="${height}" fill="${CANVAS_BG}"/>`
}

export function renderRootNode(node: LayoutNode): string {
  const rx = node.x - node.width / 2
  const ry = node.y - node.height / 2
  return [
    `<rect x="${rx}" y="${ry}" width="${node.width}" height="${node.height}"`,
    ` rx="${ROOT_BORDER_RADIUS}" fill="${ROOT_BG}" filter="url(#mm-shadow)"/>`,
    `<text x="${node.x}" y="${node.y}" text-anchor="middle" dominant-baseline="middle"`,
    ` font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}" font-weight="${FONT_WEIGHT_ROOT}"`,
    ` fill="${TEXT_COLOR}">${escapeXml(node.label)}</text>`,
  ].join('')
}

export function renderChildNode(node: LayoutNode): string {
  const weight = node.depth === 1 ? FONT_WEIGHT_PRIMARY : FONT_WEIGHT_SECONDARY
  return [
    `<text x="${node.x}" y="${node.y}" text-anchor="middle" dominant-baseline="middle"`,
    ` font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}" font-weight="${weight}"`,
    ` fill="${node.branchColor}">${escapeXml(node.label)}</text>`,
  ].join('')
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

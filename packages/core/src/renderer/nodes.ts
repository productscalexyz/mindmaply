import {
  ROOT_BORDER_RADIUS,
  NODE_PADDING_V,
  FONT_WEIGHT_ROOT,
  FONT_WEIGHT_PRIMARY,
  FONT_WEIGHT_SECONDARY,
  EXTRA_LINE_FACTOR,
} from '../design'
import { DEFAULT_THEME, type Theme } from '../config'
import { fontSizeForDepth } from '../layout/text'
import type { LayoutNode } from '../layout/types'

// Drop shadow matches ROOT_SHADOW design token: 0 1px 3px rgba(0,0,0,0.1)
export function renderDefs(): string {
  return `<defs>
  <filter id="mm-shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.1)"/>
  </filter>
</defs>`
}

export function renderBackground(
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  theme: Theme = DEFAULT_THEME,
): string {
  return `<rect x="${offsetX}" y="${offsetY}" width="${width}" height="${height}" fill="${theme.canvasBg}"/>`
}

// Single-line labels render as plain text content (unchanged output);
// multi-line labels (from <br/> or auto-wrap) get one centered tspan per line.
function renderTextContent(node: LayoutNode, theme: Theme): string {
  const lines = node.lines
  if (lines.length === 1) return escapeXml(lines[0])
  const lineHeight = fontSizeForDepth(node.depth, theme) * EXTRA_LINE_FACTOR
  const firstDy = -((lines.length - 1) / 2) * lineHeight
  return lines
    .map((line, i) =>
      `<tspan x="${node.x}" dy="${i === 0 ? firstDy : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('')
}

export function renderRootNode(node: LayoutNode, theme: Theme = DEFAULT_THEME): string {
  const rx = node.x - node.width / 2
  const ry = node.y - node.height / 2
  return [
    `<rect x="${rx}" y="${ry}" width="${node.width}" height="${node.height}"`,
    ` rx="${ROOT_BORDER_RADIUS}" fill="${theme.rootBg}" filter="url(#mm-shadow)"/>`,
    `<text x="${node.x}" y="${node.y}" text-anchor="middle" dominant-baseline="middle"`,
    ` font-family="${theme.fontFamily}" font-size="${fontSizeForDepth(node.depth, theme)}" font-weight="${FONT_WEIGHT_ROOT}"`,
    ` fill="${theme.textColor}">${renderTextContent(node, theme)}</text>`,
  ].join('')
}

// The card hugs the text block vertically — the layout box (node.height) is
// taller to keep sibling spacing, so the card is centered inside it. Same
// surface as the root card (radius + shadow, no border) so every node looks
// alike regardless of line count or declared shape; only the fill differs.
function renderNodeCard(node: LayoutNode, theme: Theme): string {
  const fs = fontSizeForDepth(node.depth, theme)
  const textBlockHeight = fs + (node.lines.length - 1) * fs * EXTRA_LINE_FACTOR
  const cardHeight = textBlockHeight + NODE_PADDING_V * 2
  return (
    `<rect x="${node.x - node.width / 2}" y="${node.y - cardHeight / 2}"` +
    ` width="${node.width}" height="${cardHeight}" rx="${ROOT_BORDER_RADIUS}"` +
    ` fill="${theme.nodeBg}" filter="url(#mm-shadow)"/>`
  )
}

export function renderChildNode(node: LayoutNode, theme: Theme = DEFAULT_THEME): string {
  const weight = node.depth === 1 ? FONT_WEIGHT_PRIMARY : FONT_WEIGHT_SECONDARY
  const card = theme.nodeStyle === 'card' ? renderNodeCard(node, theme) : ''
  return [
    card,
    `<text x="${node.x}" y="${node.y}" text-anchor="middle" dominant-baseline="middle"`,
    ` font-family="${theme.fontFamily}" font-size="${fontSizeForDepth(node.depth, theme)}" font-weight="${weight}"`,
    ` fill="${node.branchColor}">${renderTextContent(node, theme)}</text>`,
  ].join('')
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

import { parse } from './parser'
import { parseMarkdown } from './markdown-parser'
import { toMarkdown, toMermaid } from './serializers'
import { buildTree } from './tree'
import { computeOrthogonalLayout } from './layout/orthogonal'
import { computeCurvedLayout } from './layout/curved'
import { renderSVG } from './renderer/index'

export interface RenderOptions {
  /** Override layout mode. If omitted, inferred from source format defaults (orthogonal for Mermaid, curved for Markdown). */
  layout?: 'orthogonal' | 'curved'
  /** Override direction. If omitted, read from 'flowchart TD/LR' declaration or default to 'LR'. */
  direction?: 'LR' | 'TD'
  /** Padding around the diagram in SVG units. Default: SVG_CANVAS_PADDING from design. */
  padding?: number
}

/**
 * Parse a Mermaid flowchart string and render a Whimsical-quality SVG mind map.
 *
 * @param source  Mermaid flowchart string
 * @param options Optional render overrides
 * @returns       SVG string
 */
export function render(source: string, options: RenderOptions = {}): string {
  const ast = parse(source)
  const tree = buildTree(ast)
  const layoutMode = options.layout ?? ast.layout
  const direction = options.direction ?? ast.direction
  const layoutRoot =
    layoutMode === 'curved'
      ? computeCurvedLayout(tree)
      : computeOrthogonalLayout(tree, direction)
  return renderSVG(layoutRoot, { layout: layoutMode, direction, padding: options.padding })
}

/**
 * Parse a Markdown heading/bullet string and render a Whimsical-quality SVG mind map.
 * Defaults to curved layout (can be overridden via options).
 *
 * @param source  Markdown string with `# headings` and `- bullets`
 * @param options Optional render overrides
 * @returns       SVG string
 */
export function renderMarkdown(source: string, options: RenderOptions = {}): string {
  const ast = parseMarkdown(source)
  const tree = buildTree(ast)
  const layoutMode = options.layout ?? ast.layout
  const direction = options.direction ?? ast.direction
  const layoutRoot =
    layoutMode === 'curved'
      ? computeCurvedLayout(tree)
      : computeOrthogonalLayout(tree, direction)
  return renderSVG(layoutRoot, { layout: layoutMode, direction, padding: options.padding })
}

// Named exports for editor format switching
export { parse, parseMarkdown, toMarkdown, toMermaid }

// Re-export types for consumers
export type { ParsedAST } from './parser'
export type { TreeNode, ResolvedStyle } from './tree'
export type { LayoutNode } from './layout/types'

import { parse, validateMermaid } from './parser'
import { parseMarkdown, validateMarkdownSource } from './markdown-parser'
import type { ValidationResult } from './parser'
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

/**
 * Lint a source string in the given format without rendering it.
 * Reports every line the parser would silently skip, with line numbers —
 * rendering itself stays best-effort so the last good diagram persists.
 */
export function validate(source: string, format: 'mermaid' | 'markdown'): ValidationResult {
  return format === 'markdown' ? validateMarkdownSource(source) : validateMermaid(source)
}

// Named exports for editor format switching
export { parse, parseMarkdown, toMarkdown, toMermaid }

// Share-link encoding — kept in core so the editor and the render API produce
// byte-identical URLs from the same payload (no drift between repos).
export {
  encodeShare,
  decodeShare,
  buildShareUrl,
  buildEmbedUrl,
  type SharePayload,
} from './share'

// Re-export types for consumers
export type { ParsedAST, ValidationError, ValidationResult } from './parser'
export type { TreeNode, ResolvedStyle } from './tree'
export type { LayoutNode } from './layout/types'

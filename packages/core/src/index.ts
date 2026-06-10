import { parse, validateMermaid, type ParsedAST } from './parser'
import { parseMarkdown, validateMarkdownSource } from './markdown-parser'
import type { ValidationResult } from './parser'
import { toMarkdown, toMermaid } from './serializers'
import { buildTree } from './tree'
import { computeOrthogonalLayout } from './layout/orthogonal'
import { renderSVG } from './renderer/index'
import {
  resolveConfig,
  parseFrontmatter,
  type DiagramType,
  type Direction,
  type EdgeStyle,
  type ThemeInput,
} from './config'
import { isMindmapSource } from './mindmap-parser'

export interface RenderOptions {
  /** @deprecated Use `edgeStyle` — 'orthogonal' maps to 'straight', 'curved' to 'curved'. */
  layout?: 'orthogonal' | 'curved'
  /** Override edge rendering: smooth bezier arcs or straight elbow connectors. */
  edgeStyle?: EdgeStyle
  /** Override direction. If omitted, read from document config or default to 'LR'. */
  direction?: Direction
  /** Theme overrides (palette, fonts, colors) merged over the document theme and defaults. */
  theme?: ThemeInput
  /** Padding around the diagram in SVG units. Default: SVG_CANVAS_PADDING from design. */
  padding?: number
}

function legacyLayoutToEdgeStyle(layout?: 'orthogonal' | 'curved'): EdgeStyle | undefined {
  if (layout === 'curved') return 'curved'
  if (layout === 'orthogonal') return 'straight'
  return undefined
}

// Shared pipeline: the AST's layout/direction fields already fold the
// document config over the format defaults, so they act as the doc layer here.
function renderAST(ast: ParsedAST, options: RenderOptions): string {
  const config = resolveConfig(
    {
      direction: ast.direction,
      edgeStyle: ast.layout === 'curved' ? 'curved' : 'straight',
      theme: ast.config?.theme,
    },
    {
      direction: options.direction,
      edgeStyle: options.edgeStyle ?? legacyLayoutToEdgeStyle(options.layout),
      theme: options.theme,
    },
  )
  const tree = buildTree(ast, config.theme)
  const layoutRoot = computeOrthogonalLayout(tree, config.direction, config.theme)
  return renderSVG(layoutRoot, { ...config, padding: options.padding })
}

/**
 * Parse a Mermaid source (flowchart or mindmap block) and render a
 * Whimsical-quality SVG mind map.
 *
 * @param source  Mermaid flowchart or mindmap string
 * @param options Optional render overrides
 * @returns       SVG string
 */
export function render(source: string, options: RenderOptions = {}): string {
  return renderAST(parse(source), options)
}

/**
 * Parse a Markdown heading/bullet string and render a Whimsical-quality SVG
 * mind map. Defaults to curved edges; an optional `--- ... ---` frontmatter
 * block can set direction, edgeStyle, and theme.* keys.
 *
 * @param source  Markdown string with `# headings` and `- bullets`
 * @param options Optional render overrides
 * @returns       SVG string
 */
export function renderMarkdown(source: string, options: RenderOptions = {}): string {
  return renderAST(parseMarkdown(source), options)
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

// Source-grammar detection (e.g. for kind-aware UI labels/colors)
export { isMindmapSource }

/**
 * The diagram type (what gets drawn — mermaid.js nomenclature) of a source.
 * There is no link between language and type: mermaid declares it via its
 * grammar, markdown via the `diagram:` frontmatter key (default 'mindmap').
 */
export function diagramTypeOf(
  source: string,
  format: 'mermaid' | 'markdown',
): DiagramType {
  if (format === 'markdown') {
    return parseFrontmatter(source).config.diagram ?? 'mindmap'
  }
  return isMindmapSource(source) ? 'mindmap' : 'flowchart'
}

// Share-link encoding — kept in core so the editor and the render API produce
// byte-identical URLs from the same payload (no drift between repos).
export {
  encodeShare,
  decodeShare,
  buildShareUrl,
  buildEmbedUrl,
  type SharePayload,
} from './share'

// Configuration — document config, themes, and the precedence resolver
export {
  DEFAULT_THEME,
  resolveConfig,
  parseFrontmatter,
  configToFrontmatter,
  configToInitDirective,
  type DiagramType,
  type Direction,
  type EdgeStyle,
  type Theme,
  type ThemeInput,
  type DocumentConfig,
  type DiagramConfig,
} from './config'

// Re-export types for consumers
export type { ParsedAST, ParsedNode, ValidationError, ValidationResult } from './parser'
export type { TreeNode, ResolvedStyle } from './tree'
export type { LayoutNode } from './layout/types'

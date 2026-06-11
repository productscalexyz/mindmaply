// Unified document/render configuration.
//
// Rendering style (direction, edge style, theme) is never decided by which
// diagram a source happens to be — it always resolves through one chain:
//   RenderOptions  >  document config  >  format default  >  global default
//
// Document config is expressed inline so it travels with the source:
//   Mermaid:  %%{init: {"mindmaply": {"direction": "TD", "edgeStyle": "curved", "theme": {...}}}}%%
//   Markdown: a leading frontmatter block:
//     ---
//     direction: TD
//     edgeStyle: straight
//     theme.palette: #4B96E6, #B355D0
//     theme.fontFamily: Georgia, serif
//     theme.fontSize: 14
//     ---
import {
  PALETTE,
  FONT_FAMILY,
  FONT_SIZE,
  TEXT_COLOR,
  CANVAS_BG,
  ROOT_BG,
  EDGE_STROKE_WIDTH,
  WRAP_WIDTH,
  NODE_BG,
} from './design'

export type Direction = 'LR' | 'TD'
export type EdgeStyle = 'curved' | 'straight'
// What gets drawn (mermaid.js nomenclature). Independent of the language the
// source is written in — a markdown outline can be either, declared via the
// `diagram:` frontmatter key; in mermaid the grammar itself declares it.
export type DiagramType = 'flowchart' | 'mindmap'

/** Per-depth font sizing: 'scaled' shrinks deeper levels, 'uniform' does not */
export type Typography = 'scaled' | 'uniform'

/** Non-root node rendering: 'card' draws a background card, 'plain' is bare text */
export type NodeStyle = 'card' | 'plain'

export interface ThemeInput {
  /** Branch color palette — cycles in order across top-level branches */
  palette?: string[]
  fontFamily?: string
  fontSize?: number
  /** Root node text color */
  textColor?: string
  /** Canvas background color */
  canvasBg?: string
  /** Root node background color */
  rootBg?: string
  edgeStrokeWidth?: number
  /** Soft-wrap labels at this pixel width; 0 disables auto-wrapping */
  wrapWidth?: number
  typography?: Typography
  nodeStyle?: NodeStyle
  /** Non-root node card background color */
  nodeBg?: string
}

export type Theme = Required<ThemeInput>

/** Style settings a document may declare inline — all optional */
export interface DocumentConfig {
  direction?: Direction
  edgeStyle?: EdgeStyle
  theme?: ThemeInput
  /**
   * Diagram type, markdown frontmatter only (`diagram: flowchart`). In
   * mermaid the grammar declares the type, so the init directive never
   * carries (or overrides) it.
   */
  diagram?: DiagramType
}

/** Fully resolved settings threaded through layout and rendering */
export interface DiagramConfig {
  direction: Direction
  edgeStyle: EdgeStyle
  theme: Theme
}

export const DEFAULT_THEME: Theme = {
  palette: [...PALETTE],
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE,
  textColor: TEXT_COLOR,
  canvasBg: CANVAS_BG,
  rootBg: ROOT_BG,
  edgeStrokeWidth: EDGE_STROKE_WIDTH,
  wrapWidth: WRAP_WIDTH,
  typography: 'scaled',
  nodeStyle: 'card',
  nodeBg: NODE_BG,
}

export interface ConfigOverrides {
  direction?: Direction
  edgeStyle?: EdgeStyle
  theme?: ThemeInput
}

export function resolveConfig(
  doc: DocumentConfig | undefined,
  options: ConfigOverrides,
  formatDefaults: { direction?: Direction; edgeStyle?: EdgeStyle } = {},
): DiagramConfig {
  return {
    direction:
      options.direction ?? doc?.direction ?? formatDefaults.direction ?? 'LR',
    edgeStyle:
      options.edgeStyle ?? doc?.edgeStyle ?? formatDefaults.edgeStyle ?? 'straight',
    theme: { ...DEFAULT_THEME, ...doc?.theme, ...options.theme },
  }
}

function isDirection(v: unknown): v is Direction {
  return v === 'LR' || v === 'TD'
}

function isEdgeStyle(v: unknown): v is EdgeStyle {
  return v === 'curved' || v === 'straight'
}

function isDiagramType(v: unknown): v is DiagramType {
  return v === 'flowchart' || v === 'mindmap'
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/

function sanitizeTheme(raw: Record<string, unknown>): ThemeInput | undefined {
  const theme: ThemeInput = {}
  if (
    Array.isArray(raw['palette']) &&
    raw['palette'].length > 0 &&
    raw['palette'].every(c => typeof c === 'string' && HEX_COLOR_RE.test(c))
  ) {
    theme.palette = raw['palette'] as string[]
  }
  if (typeof raw['fontFamily'] === 'string' && raw['fontFamily'].trim()) {
    theme.fontFamily = raw['fontFamily'].trim()
  }
  const size = raw['fontSize']
  if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
    theme.fontSize = size
  }
  for (const key of ['textColor', 'canvasBg', 'rootBg', 'nodeBg'] as const) {
    const v = raw[key]
    if (typeof v === 'string' && HEX_COLOR_RE.test(v)) theme[key] = v
  }
  const sw = raw['edgeStrokeWidth']
  if (typeof sw === 'number' && Number.isFinite(sw) && sw > 0) {
    theme.edgeStrokeWidth = sw
  }
  // Unlike fontSize, 0 is meaningful here: it disables auto-wrapping
  const ww = raw['wrapWidth']
  if (typeof ww === 'number' && Number.isFinite(ww) && ww >= 0) {
    theme.wrapWidth = ww
  }
  const ty = raw['typography']
  if (ty === 'scaled' || ty === 'uniform') {
    theme.typography = ty
  }
  const ns = raw['nodeStyle']
  if (ns === 'card' || ns === 'plain') {
    theme.nodeStyle = ns
  }
  return Object.keys(theme).length > 0 ? theme : undefined
}

/**
 * Extract a DocumentConfig from a parsed `%%{init: {"mindmaply": {...}}}%%`
 * payload. Unknown keys and invalid values are dropped — config never breaks
 * a document. The legacy `"layout": "curved" | "orthogonal"` key is accepted
 * as an alias for edgeStyle.
 */
export function documentConfigFromInit(mp: Record<string, unknown>): DocumentConfig {
  const config: DocumentConfig = {}
  if (isDirection(mp['direction'])) config.direction = mp['direction']
  if (isEdgeStyle(mp['edgeStyle'])) {
    config.edgeStyle = mp['edgeStyle']
  } else if (mp['layout'] === 'curved') {
    config.edgeStyle = 'curved'
  } else if (mp['layout'] === 'orthogonal') {
    config.edgeStyle = 'straight'
  }
  if (mp['theme'] && typeof mp['theme'] === 'object') {
    const theme = sanitizeTheme(mp['theme'] as Record<string, unknown>)
    if (theme) config.theme = theme
  }
  return config
}

// ── Init directive helpers ───────────────────────────────────

// Matches: %%{init: {...}}%% — possibly spanning multiple lines
export const INIT_DIRECTIVE_RE = /%%\{init:\s*(\{[\s\S]*?\})\s*\}%%/

/**
 * Blank an init directive out of a source — preserving line count for
 * validation messages — so line-by-line processing never sees directive
 * innards as content.
 */
export function blankInitDirective(source: string): string {
  return source.replace(INIT_DIRECTIVE_RE, m => m.split('\n').map(() => '').join('\n'))
}

// ── Config serialization (format switching keeps the config) ─

/**
 * Serialize a DocumentConfig to a markdown frontmatter block, or '' when the
 * config is empty. Inverse of parseFrontmatter for the supported key set.
 */
export function configToFrontmatter(config: DocumentConfig): string {
  const lines: string[] = []
  if (config.diagram) lines.push(`diagram: ${config.diagram}`)
  if (config.direction) lines.push(`direction: ${config.direction}`)
  if (config.edgeStyle) lines.push(`edgeStyle: ${config.edgeStyle}`)
  const t = config.theme
  if (t) {
    if (t.palette) lines.push(`theme.palette: ${t.palette.join(', ')}`)
    if (t.fontFamily) lines.push(`theme.fontFamily: ${t.fontFamily}`)
    if (t.fontSize !== undefined) lines.push(`theme.fontSize: ${t.fontSize}`)
    if (t.textColor) lines.push(`theme.textColor: ${t.textColor}`)
    if (t.canvasBg) lines.push(`theme.canvasBg: ${t.canvasBg}`)
    if (t.rootBg) lines.push(`theme.rootBg: ${t.rootBg}`)
    if (t.edgeStrokeWidth !== undefined) lines.push(`theme.edgeStrokeWidth: ${t.edgeStrokeWidth}`)
    if (t.wrapWidth !== undefined) lines.push(`theme.wrapWidth: ${t.wrapWidth}`)
    if (t.typography) lines.push(`theme.typography: ${t.typography}`)
    if (t.nodeStyle) lines.push(`theme.nodeStyle: ${t.nodeStyle}`)
    if (t.nodeBg) lines.push(`theme.nodeBg: ${t.nodeBg}`)
  }
  if (lines.length === 0) return ''
  return ['---', ...lines, '---'].join('\n')
}

/**
 * Serialize a DocumentConfig to a mermaid init directive, or '' when there is
 * nothing to carry. The diagram type is never emitted — the grammar declares
 * it. Direction is omitted by default (the `flowchart TD|LR` header is
 * mermaid's native way to express it); pass `includeDirection` when emitting
 * `mindmap` grammar, which has no direction header.
 */
export function configToInitDirective(
  config: DocumentConfig,
  opts: { includeDirection?: boolean } = {},
): string {
  const mp: Record<string, unknown> = {}
  if (opts.includeDirection && config.direction) mp['direction'] = config.direction
  if (config.edgeStyle) mp['edgeStyle'] = config.edgeStyle
  if (config.theme && Object.keys(config.theme).length > 0) mp['theme'] = config.theme
  if (Object.keys(mp).length === 0) return ''
  return `%%{init: {"mindmaply": ${JSON.stringify(mp, null, 2)}}}%%`
}

// ── Markdown frontmatter ─────────────────────────────────────

export interface FrontmatterResult {
  config: DocumentConfig
  /** Source with the frontmatter block removed (line count preserved) */
  body: string
  /** Number of leading lines occupied by the frontmatter block (0 if none) */
  lineCount: number
}

/**
 * Parse an optional leading `--- ... ---` frontmatter block. Only a flat
 * `key: value` subset is supported (no YAML dependency): `diagram`,
 * `direction`, `edgeStyle`, and dotted `theme.*` keys. `theme.palette` takes
 * a comma-separated color list. Unknown keys are ignored.
 *
 * The returned body replaces frontmatter lines with empty lines so that
 * validation line numbers still match the original source.
 */
export function parseFrontmatter(source: string): FrontmatterResult {
  const lines = source.split('\n')

  // The block must start on the first non-empty line
  let start = 0
  while (start < lines.length && !lines[start].trim()) start++
  if (start >= lines.length || lines[start].trim() !== '---') {
    return { config: {}, body: source, lineCount: 0 }
  }

  let end = -1
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i
      break
    }
  }
  if (end === -1) return { config: {}, body: source, lineCount: 0 }

  const config: DocumentConfig = {}
  const rawTheme: Record<string, unknown> = {}
  for (let i = start + 1; i < end; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (!value) continue

    if (key === 'diagram' && isDiagramType(value)) {
      config.diagram = value
    } else if (key === 'direction' && isDirection(value)) {
      config.direction = value
    } else if (key === 'edgeStyle' && isEdgeStyle(value)) {
      config.edgeStyle = value
    } else if (key === 'theme.palette') {
      rawTheme['palette'] = value.split(',').map(c => c.trim())
    } else if (
      key === 'theme.fontSize' ||
      key === 'theme.edgeStrokeWidth' ||
      key === 'theme.wrapWidth'
    ) {
      rawTheme[key.slice('theme.'.length)] = Number(value)
    } else if (key.startsWith('theme.')) {
      rawTheme[key.slice('theme.'.length)] = value
    }
  }
  const theme = sanitizeTheme(rawTheme)
  if (theme) config.theme = theme

  const body = lines
    .map((line, i) => (i >= start && i <= end ? '' : line))
    .join('\n')
  return { config, body, lineCount: end + 1 }
}

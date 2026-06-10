// Mermaid `mindmap` block syntax — https://mermaid.js.org/syntax/mindmap.html
//
//   mindmap
//     root((mindmap))
//       Origins
//         Long history
//         ::icon(fa fa-book)
//
// Nesting is RELATIVE: a line is a child of the nearest line above it with
// strictly smaller indentation (mermaid does not require consistent indent
// widths). `::icon(...)` attaches to the previous node. `<br/>` in a label
// becomes a line break. Exotic shapes (hexagon, cloud, bang) fall back to
// rect so every valid mermaid mindmap still renders.
import type { ParsedAST, ParsedNode, ValidationError, ValidationResult } from './parser'
import { blankInitDirective } from './config'
import { slugify } from './slug'

// Shape tokens, tried in order (circle before rounded, bang before cloud).
// The optional \w+ prefix is mermaid's node id — kept as the slug seed.
const CIRCLE_RE = /^(\w*)\(\((.+)\)\)$/
const BANG_RE = /^(\w*)\)\)(.+)\(\($/
const CLOUD_RE = /^(\w*)\)(.+)\($/
const HEXAGON_RE = /^(\w*)\{\{(.+)\}\}$/
const SQUARE_RE = /^(\w*)\[(.+)\]$/
const ROUNDED_RE = /^(\w*)\((.+)\)$/
const ICON_RE = /^::icon\((.+)\)$/
const HEADER_RE = /^mindmap\s*$/

/** True when the first meaningful line of a mermaid source is `mindmap` */
export function isMindmapSource(source: string): boolean {
  // A (possibly multi-line) init directive is config, not content
  for (const raw of blankInitDirective(source).split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('%%')) continue
    return HEADER_RE.test(line)
  }
  return false
}

function cleanLabel(raw: string): string {
  let label = raw.trim().replace(/<br\s*\/?>/gi, '\n')
  if (label.length >= 2 && label.startsWith('"') && label.endsWith('"')) {
    label = label.slice(1, -1)
  }
  return label
}

interface MindmapToken {
  label: string
  shape: ParsedNode['shape']
  idSeed: string
}

function parseToken(text: string): MindmapToken {
  const matchers: Array<[RegExp, ParsedNode['shape']]> = [
    [CIRCLE_RE, 'circle'],
    [BANG_RE, 'rect'],
    [CLOUD_RE, 'rect'],
    [HEXAGON_RE, 'rect'],
    [SQUARE_RE, 'rect'],
    [ROUNDED_RE, 'pill'],
  ]
  for (const [re, shape] of matchers) {
    const m = text.match(re)
    if (m) {
      const label = cleanLabel(m[2])
      return { label, shape, idSeed: m[1] || label }
    }
  }
  const label = cleanLabel(text)
  return { label, shape: 'rect', idSeed: label }
}

export function parseMindmap(source: string): ParsedAST {
  const ast: ParsedAST = {
    layout: 'curved',
    direction: 'LR',
    diagramType: 'mindmap',
    nodes: new Map(),
    edges: [],
    styles: new Map(), // mindmap syntax has no style directives
  }

  let counter = 0
  let lastId: string | null = null
  // Each entry: [indentWidth, nodeId] — relative-indent ancestry
  const stack: Array<[number, string]> = []

  for (const raw of source.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('%%')) continue
    if (HEADER_RE.test(line)) continue

    const iconMatch = line.match(ICON_RE)
    if (iconMatch) {
      if (lastId) ast.nodes.get(lastId)!.icon = iconMatch[1].trim()
      continue
    }

    const indent = raw.match(/^\s*/)![0].replace(/\t/g, '  ').length
    const token = parseToken(line)
    const id = slugify(token.idSeed, counter++)
    ast.nodes.set(id, { id, label: token.label, shape: token.shape })

    while (stack.length > 0 && stack[stack.length - 1][0] >= indent) {
      stack.pop()
    }
    const parent = stack.length > 0 ? stack[stack.length - 1][1] : null
    if (parent !== null) ast.edges.push({ from: parent, to: id })
    stack.push([indent, id])
    lastId = id
  }

  return ast
}

/**
 * Lint a mermaid mindmap source. The parser itself is permissive (any text
 * line is a node), so the structural checks matter most: a `mindmap` header,
 * at least one node, a single root, and no icon before the first node.
 */
export function validateMindmap(source: string): ValidationResult {
  const errors: ValidationError[] = []
  let sawHeader = false
  let nodeCount = 0
  let rootIndent = -1

  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    const lineNo = i + 1
    if (!line || line.startsWith('%%')) continue

    if (!sawHeader) {
      if (HEADER_RE.test(line)) {
        sawHeader = true
      } else {
        errors.push({ line: lineNo, message: `expected "mindmap" header, got: "${line}"` })
        sawHeader = true // report once, keep linting the rest
      }
      continue
    }

    if (ICON_RE.test(line)) {
      if (nodeCount === 0) {
        errors.push({ line: lineNo, message: 'icon directive before any node' })
      }
      continue
    }

    const indent = raw.match(/^\s*/)![0].replace(/\t/g, '  ').length
    if (nodeCount === 0) {
      rootIndent = indent
    } else if (indent <= rootIndent) {
      errors.push({
        line: lineNo,
        message: `multiple root nodes — "${line}" is not indented under the root`,
      })
    }
    nodeCount++
  }

  if (nodeCount === 0) {
    errors.push({ line: 1, message: 'no nodes defined' })
  }

  return { valid: errors.length === 0, errors }
}

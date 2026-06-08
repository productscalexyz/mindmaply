export interface ParsedNode {
  id: string
  label: string
  shape: 'rect' | 'circle' | 'pill'
}

export interface ParsedEdge {
  from: string
  to: string
}

export interface ParsedStyle {
  fill?: string
  stroke?: string
  color?: string
  strokeDasharray?: string
}

export interface ParsedAST {
  layout: 'orthogonal' | 'curved'
  direction: 'LR' | 'TD'
  nodes: Map<string, ParsedNode>
  edges: ParsedEdge[]
  styles: Map<string, ParsedStyle>
}

export interface ValidationError {
  /** 1-based line number in the source */
  line: number
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Matches: id["label"]
const QUOTED_RECT_RE = /^(\w+)\["([^"]+)"\]$/
// Matches: id((label))
const CIRCLE_RE = /^(\w+)\(\(([^)]+)\)\)$/
// Matches: id[label]  (unquoted)
const UNQUOTED_RECT_RE = /^(\w+)\[([^\]]+)\]$/
// Matches: id  (bare — no brackets, only word chars)
const BARE_RE = /^(\w+)$/
// Matches: anything --> anything
const EDGE_LINE_RE = /^(.+?)\s*-->\s*(.+)$/
// Matches: style nodeId key:value,...
const STYLE_LINE_RE = /^style\s+(\w+)\s+(.+)$/
// Matches: %%{init: {...}}%%
const INIT_RE = /%%\{init:\s*(\{[\s\S]*?\})\s*\}%%/
// Matches: flowchart TD / flowchart LR (TB is Mermaid's alias for TD)
const FLOWCHART_RE = /^flowchart\s+(\w+)$/i

function parseNodeToken(token: string): ParsedNode | null {
  const t = token.trim()
  let m: RegExpMatchArray | null

  if ((m = t.match(QUOTED_RECT_RE))) return { id: m[1], label: m[2], shape: 'rect' }
  if ((m = t.match(CIRCLE_RE))) return { id: m[1], label: m[2], shape: 'circle' }
  if ((m = t.match(UNQUOTED_RECT_RE))) return { id: m[1], label: m[2], shape: 'rect' }
  if ((m = t.match(BARE_RE))) return { id: m[1], label: m[1].replace(/_/g, ' '), shape: 'rect' }
  return null
}

function parseStyleValue(raw: string): ParsedStyle {
  const style: ParsedStyle = {}
  const parts = raw.split(',')
  for (const part of parts) {
    const colonIdx = part.indexOf(':')
    if (colonIdx === -1) continue
    const key = part.slice(0, colonIdx).trim()
    const value = part.slice(colonIdx + 1).trim()
    if (key === 'fill') style.fill = value
    else if (key === 'stroke') style.stroke = value
    else if (key === 'color') style.color = value
    else if (key === 'stroke-dasharray') style.strokeDasharray = value
  }
  return style
}

export function parse(source: string): ParsedAST {
  const ast: ParsedAST = {
    layout: 'orthogonal',
    direction: 'LR',
    nodes: new Map(),
    edges: [],
    styles: new Map(),
  }

  // Extract init directive before line splitting
  const initMatch = source.match(INIT_RE)
  if (initMatch) {
    try {
      const cfg = JSON.parse(initMatch[1]) as Record<string, unknown>
      const mp = cfg['mindmaply'] as Record<string, unknown> | undefined
      if (mp?.['layout'] === 'curved') ast.layout = 'curved'
    } catch {
      // malformed JSON — ignore, keep default
    }
  }

  function registerNode(node: ParsedNode) {
    if (!ast.nodes.has(node.id)) ast.nodes.set(node.id, node)
  }

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim()

    if (!line) continue
    if (line.startsWith('%%')) continue
    if (/^flowchart\s/i.test(line)) {
      const m = line.match(/^flowchart\s+(TD|TB|LR|RL)\s*$/i)
      if (m) ast.direction = /^(TD|TB)$/i.test(m[1]) ? 'TD' : 'LR'
      continue
    }

    // Style directive
    const styleMatch = line.match(STYLE_LINE_RE)
    if (styleMatch) {
      ast.styles.set(styleMatch[1], parseStyleValue(styleMatch[2]))
      continue
    }

    // Edge line
    const edgeMatch = line.match(EDGE_LINE_RE)
    if (edgeMatch) {
      const fromNode = parseNodeToken(edgeMatch[1])
      const toNode = parseNodeToken(edgeMatch[2])
      if (fromNode && toNode) {
        registerNode(fromNode)
        registerNode(toNode)
        ast.edges.push({ from: fromNode.id, to: toNode.id })
      }
      continue
    }

    // Standalone node declaration
    const node = parseNodeToken(line)
    if (node) registerNode(node)
  }

  return ast
}

/**
 * Lint a Mermaid flowchart source line by line, using the same patterns
 * `parse()` accepts. Unlike `parse()` (which silently skips unrecognized
 * lines so rendering stays best-effort), this reports every line that
 * would be ignored, plus structural problems like a missing root node.
 */
export function validateMermaid(source: string): ValidationResult {
  const errors: ValidationError[] = []
  const nodes = new Set<string>()
  const hasIncoming = new Set<string>()

  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNo = i + 1

    if (!line) continue
    if (line.startsWith('%%')) continue
    if (/^flowchart\s/i.test(line)) {
      if (!FLOWCHART_RE.test(line)) {
        errors.push({ line: lineNo, message: `invalid flowchart header: "${line}"` })
      }
      continue
    }
    if (STYLE_LINE_RE.test(line)) continue

    const edgeMatch = line.match(EDGE_LINE_RE)
    if (edgeMatch) {
      const fromNode = parseNodeToken(edgeMatch[1])
      const toNode = parseNodeToken(edgeMatch[2])
      if (!fromNode) {
        errors.push({ line: lineNo, message: `invalid edge source: "${edgeMatch[1].trim()}"` })
      }
      if (!toNode) {
        errors.push({ line: lineNo, message: `invalid edge target: "${edgeMatch[2].trim()}"` })
      }
      if (fromNode && toNode) {
        nodes.add(fromNode.id)
        nodes.add(toNode.id)
        hasIncoming.add(toNode.id)
      }
      continue
    }

    const node = parseNodeToken(line)
    if (node) {
      nodes.add(node.id)
      continue
    }

    errors.push({ line: lineNo, message: `unrecognized syntax: "${line}"` })
  }

  if (nodes.size === 0) {
    errors.push({ line: 1, message: 'no nodes defined' })
  } else if (![...nodes].some(id => !hasIncoming.has(id))) {
    errors.push({ line: 1, message: 'no root node — every node has an incoming edge' })
  }

  return { valid: errors.length === 0, errors }
}

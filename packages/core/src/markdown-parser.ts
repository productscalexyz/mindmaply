import type { ParsedAST, ValidationError, ValidationResult } from './parser'

// Matches: # Heading … ###### Heading
const HEADING_RE = /^(#{1,6})\s+(.+)$/
// Matches: - item / * item / + item (any indent)
const BULLET_RE = /^(\s*)[-*+]\s+(.+)$/

function slugify(label: string, counter: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'node'
  return `${base}_${counter}`
}

/**
 * Parse a Markdown heading/bullet tree into a ParsedAST.
 *
 * Parsing rules:
 * - `# Title`  → root node (level 0, no parent)
 * - `## Sec`   → L1 child of nearest h1
 * - `### Sub`  → L2 child of nearest h2
 * - `- item`   → child of nearest heading or bullet at lower indent
 * - `  - item` → child of nearest bullet (2 spaces = 1 indent level)
 *
 * Layout defaults to 'curved'. All nodes have shape 'rect'.
 */
export function parseMarkdown(source: string): ParsedAST {
  const ast: ParsedAST = {
    layout: 'curved',
    direction: 'LR',
    nodes: new Map(),
    edges: [],
    styles: new Map(), // markdown has no style directives
  }

  let counter = 0
  // Each entry: [contextDepth, nodeId]
  // Headings use depth = heading level (1–6)
  // Bullets use depth = 7 + floor(indentSpaces / 2)
  const stack: Array<[number, string]> = []

  function addNode(label: string): string {
    const id = slugify(label, counter++)
    ast.nodes.set(id, { id, label, shape: 'rect' })
    return id
  }

  function findParent(depth: number): string | null {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i][0] < depth) return stack[i][1]
    }
    return null
  }

  function pushStack(depth: number, id: string): void {
    while (stack.length > 0 && stack[stack.length - 1][0] >= depth) {
      stack.pop()
    }
    stack.push([depth, id])
  }

  for (const raw of source.split('\n')) {
    const headingMatch = raw.match(HEADING_RE)
    if (headingMatch) {
      const level = headingMatch[1].length
      const label = headingMatch[2].trim()
      const id = addNode(label)
      const parent = findParent(level)
      if (parent !== null) ast.edges.push({ from: parent, to: id })
      pushStack(level, id)
      continue
    }

    const bulletMatch = raw.match(BULLET_RE)
    if (bulletMatch) {
      // Normalise tabs to 2 spaces so tab-indented bullets nest correctly
      const indent = bulletMatch[1].replace(/\t/g, '  ').length
      const label = bulletMatch[2].trim()
      const id = addNode(label)
      const depth = 7 + Math.floor(indent / 2)
      const parent = findParent(depth)
      if (parent !== null) ast.edges.push({ from: parent, to: id })
      pushStack(depth, id)
    }
  }

  return ast
}

/**
 * Lint a Markdown heading/bullet source line by line, using the same
 * patterns `parseMarkdown()` accepts. Reports any non-empty line that is
 * neither a heading nor a bullet (which the parser would silently skip),
 * plus an empty document.
 */
export function validateMarkdownSource(source: string): ValidationResult {
  const errors: ValidationError[] = []
  let nodeCount = 0

  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw.trim()) continue
    if (HEADING_RE.test(raw) || BULLET_RE.test(raw)) {
      nodeCount++
      continue
    }
    errors.push({
      line: i + 1,
      message: `not a heading or bullet: "${raw.trim()}"`,
    })
  }

  if (nodeCount === 0) {
    errors.push({ line: 1, message: 'no nodes defined' })
  }

  return { valid: errors.length === 0, errors }
}

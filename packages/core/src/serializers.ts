import type { ParsedAST, ParsedNode } from './parser'
import type { DocumentConfig } from './config'
import { configToFrontmatter, configToInitDirective } from './config'

function findRoot(ast: ParsedAST): string | null {
  const hasIncoming = new Set(ast.edges.map(e => e.to))
  return [...ast.nodes.keys()].find(id => !hasIncoming.has(id)) ?? null
}

/**
 * Serialize a ParsedAST to Markdown heading/bullet format.
 *
 * depth 0 → # heading
 * depth 1 → ## heading
 * depth 2 → ### heading
 * depth 3+ → - bullet (indented by (depth-3)*2 spaces)
 *
 * The diagram type travels in frontmatter (`diagram: flowchart`) so that
 * converting back to mermaid returns to the same grammar — the language never
 * decides the diagram type. `mindmap` is markdown's default and is omitted
 * unless the document declared it explicitly.
 */
export function toMarkdown(ast: ParsedAST): string {
  const rootId = findRoot(ast)
  if (!rootId) return ''

  const lines: string[] = []

  // Document config travels with the source: emit it as frontmatter so
  // converting formats never silently drops the type/theme/direction/edges.
  const config: DocumentConfig = { ...ast.config }
  if (ast.diagramType === 'flowchart') config.diagram = 'flowchart'
  const frontmatter = configToFrontmatter(config)
  if (frontmatter) lines.push(frontmatter, '')
  const visited = new Set<string>()

  function traverse(nodeId: string, depth: number): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    const node = ast.nodes.get(nodeId)
    if (!node) return

    // Line breaks inside labels would break the outline — carry them as <br/>
    const label = node.label.replace(/\n/g, '<br/>')
    if (depth === 0) {
      lines.push(`# ${label}`)
    } else if (depth === 1) {
      lines.push(`\n## ${label}`)
    } else if (depth === 2) {
      lines.push(`### ${label}`)
    } else {
      const indent = '  '.repeat(depth - 3)
      lines.push(`${indent}- ${label}`)
    }

    for (const edge of ast.edges.filter(e => e.from === nodeId)) {
      traverse(edge.to, depth + 1)
    }
  }

  traverse(rootId, 0)
  return lines.join('\n')
}

// Render one node as a mindmap-grammar token, preserving shape. Labels that
// could read as shape markers are bracketed so they round-trip intact.
function mindmapNodeToken(node: ParsedNode): string {
  const label = node.label.replace(/\n/g, '<br/>')
  if (node.shape === 'circle') return `((${label}))`
  if (node.shape === 'pill') return `(${label})`
  return /[()[\]{}]/.test(label) ? `[${label}]` : label
}

// Serialize to mermaid `mindmap` block grammar (tree walk from the root —
// lossy for non-tree edges, same as markdown). Direction rides in the init
// directive because this grammar has no `flowchart TD|LR` header.
function toMermaidMindmap(ast: ParsedAST, rootId: string, direction?: 'TD' | 'LR'): string {
  const lines: string[] = []

  const config: DocumentConfig = { ...ast.config }
  delete config.diagram // the grammar below declares the type
  const dir = direction ?? ast.direction
  if (dir === 'TD') config.direction = 'TD'
  else delete config.direction // LR is the default — keep the directive lean
  const directive = configToInitDirective(config, { includeDirection: true })
  if (directive) lines.push(directive)

  lines.push('mindmap')

  const visited = new Set<string>()
  function walk(id: string, depth: number): void {
    if (visited.has(id)) return
    visited.add(id)
    const node = ast.nodes.get(id)
    if (!node) return
    lines.push(`${'  '.repeat(depth + 1)}${mindmapNodeToken(node)}`)
    for (const edge of ast.edges.filter(e => e.from === id)) {
      walk(edge.to, depth + 1)
    }
  }
  walk(rootId, 0)

  return lines.join('\n')
}

/**
 * Serialize a ParsedAST to Mermaid syntax, in the grammar matching the AST's
 * diagram type: `mindmap` blocks for mind maps, `flowchart` otherwise — the
 * language switch never changes what kind of diagram it is.
 * Style directives are not preserved (lossy for Mermaid→Markdown→Mermaid).
 *
 * @param direction Direction override. Defaults to the AST's own direction.
 */
export function toMermaid(ast: ParsedAST, direction?: 'TD' | 'LR'): string {
  const rootId = findRoot(ast)
  if (!rootId) return ''

  if (ast.diagramType === 'mindmap') {
    return toMermaidMindmap(ast, rootId, direction)
  }

  const lines: string[] = []

  // Document config travels with the source: emit it as an init directive so
  // converting formats never silently drops the theme/edge style. Direction
  // is carried by the flowchart header below.
  const directive = ast.config ? configToInitDirective(ast.config) : ''
  if (directive) lines.push(directive)

  lines.push(`flowchart ${direction ?? ast.direction ?? 'LR'}`)

  // BFS from root for consistent declaration order
  const order: string[] = []
  const visited = new Set<string>()
  const queue = [rootId]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    order.push(id)
    for (const edge of ast.edges.filter(e => e.from === id)) {
      queue.push(edge.to)
    }
  }

  for (const id of order) {
    const node = ast.nodes.get(id)!
    const label = node.label.replace(/"/g, "'")
    lines.push(`  ${id}["${label}"]`)
  }

  // Only emit edges between nodes that were actually visited (guards against multi-root graphs)
  for (const edge of ast.edges) {
    if (visited.has(edge.from) && visited.has(edge.to)) {
      lines.push(`  ${edge.from} --> ${edge.to}`)
    }
  }

  return lines.join('\n')
}

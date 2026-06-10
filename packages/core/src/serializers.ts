import type { ParsedAST } from './parser'
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
 */
export function toMarkdown(ast: ParsedAST): string {
  const rootId = findRoot(ast)
  if (!rootId) return ''

  const lines: string[] = []

  // Document config travels with the source: emit it as frontmatter so
  // converting formats never silently drops the theme/direction/edge style.
  const frontmatter = ast.config ? configToFrontmatter(ast.config) : ''
  if (frontmatter) lines.push(frontmatter, '')
  const visited = new Set<string>()

  function traverse(nodeId: string, depth: number): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    const node = ast.nodes.get(nodeId)
    if (!node) return

    if (depth === 0) {
      lines.push(`# ${node.label}`)
    } else if (depth === 1) {
      lines.push(`\n## ${node.label}`)
    } else if (depth === 2) {
      lines.push(`### ${node.label}`)
    } else {
      const indent = '  '.repeat(depth - 3)
      lines.push(`${indent}- ${node.label}`)
    }

    for (const edge of ast.edges.filter(e => e.from === nodeId)) {
      traverse(edge.to, depth + 1)
    }
  }

  traverse(rootId, 0)
  return lines.join('\n')
}

/**
 * Serialize a ParsedAST to Mermaid flowchart syntax.
 * Style directives are not preserved (lossy for Mermaid→Markdown→Mermaid).
 *
 * @param direction Flowchart direction for the header. Defaults to the
 *                  AST's own direction, falling back to 'LR'.
 */
export function toMermaid(ast: ParsedAST, direction?: 'TD' | 'LR'): string {
  const rootId = findRoot(ast)
  if (!rootId) return ''

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

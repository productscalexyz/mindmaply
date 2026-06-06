import { PALETTE } from './design'
import type { ParsedAST } from './parser'

export interface ResolvedStyle {
  fillColor: string    // hex — node background (or 'transparent')
  strokeColor: string  // hex — node border and edge color
  textColor: string    // hex — text fill
  strokeDasharray: string | null
  variant: 'filled' | 'outlined' | 'dashed'
}

export interface TreeNode {
  id: string
  label: string
  shape: 'rect' | 'circle' | 'pill'
  depth: number
  branchColor: string  // '' for root, palette color for all others
  resolvedStyle: ResolvedStyle
  children: TreeNode[]
}

function resolveStyle(
  nodeId: string,
  branchColor: string,
  ast: ParsedAST,
): ResolvedStyle {
  const directive = ast.styles.get(nodeId)

  let variant: ResolvedStyle['variant'] = 'filled'
  if (directive?.strokeDasharray) {
    variant = 'dashed'
  } else if (directive?.fill === 'none' || directive?.fill === 'transparent') {
    variant = 'outlined'
  }

  const strokeColor = directive?.stroke ?? branchColor
  const fillColor =
    variant === 'filled' ? (directive?.fill ?? branchColor) : 'transparent'
  const textColor = directive?.color ?? branchColor

  return {
    fillColor,
    strokeColor,
    textColor,
    strokeDasharray: directive?.strokeDasharray ?? null,
    variant,
  }
}

function buildNode(
  nodeId: string,
  depth: number,
  branchColor: string,
  ast: ParsedAST,
  visited: Set<string>,
): TreeNode {
  visited.add(nodeId)

  const parsed = ast.nodes.get(nodeId)!
  const resolvedStyle = resolveStyle(nodeId, branchColor, ast)

  const childEdges = ast.edges.filter(e => e.from === nodeId)
  const children: TreeNode[] = []

  childEdges.forEach((edge, i) => {
    if (visited.has(edge.to)) return // guard against cycles
    const childBranchColor =
      depth === 0 ? PALETTE[i % PALETTE.length] : branchColor
    children.push(buildNode(edge.to, depth + 1, childBranchColor, ast, visited))
  })

  return {
    id: nodeId,
    label: parsed.label,
    shape: parsed.shape,
    depth,
    branchColor,
    resolvedStyle,
    children,
  }
}

export function buildTree(ast: ParsedAST): TreeNode {
  // Root = node with no incoming edges
  const hasIncoming = new Set(ast.edges.map(e => e.to))
  const rootId = [...ast.nodes.keys()].find(id => !hasIncoming.has(id))

  if (!rootId) {
    throw new Error(
      'mindmaply-core: could not find a root node (no node without incoming edges)',
    )
  }

  return buildNode(rootId, 0, '', ast, new Set())
}

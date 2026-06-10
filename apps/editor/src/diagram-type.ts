import { diagramTypeOf, type DiagramType } from 'mindmaply-core'

// Two independent axes — never conflate them, and never link them:
//   Language (the syntax the source is written in): 'mermaid' | 'markdown'
//   Diagram type (the shape that gets drawn):       'flowchart' | 'mindmap'
// The type survives language conversion: mermaid declares it via its grammar
// (mermaid.js nomenclature), markdown via the `diagram:` frontmatter key
// (default mindmap). Rendering style (direction, edge style, theme) is a
// third independent axis and never follows from either of these.
export type Language = 'mermaid' | 'markdown'
export type { DiagramType }

export const DIAGRAM_TYPE_COLORS: Record<DiagramType, string> = {
  flowchart: '#4B96E6', // blue
  mindmap: '#B355D0',   // purple
}

export function diagramType(source: string, language: Language): DiagramType {
  return diagramTypeOf(source, language)
}

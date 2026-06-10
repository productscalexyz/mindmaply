import { isMindmapSource } from 'mindmaply-core'

// Two independent axes — never conflate them:
//   Language (the syntax the source is written in): 'mermaid' | 'markdown'
//   Diagram type (the shape that gets drawn):       'flowchart' | 'mindmap'
// A markdown outline draws as a mind map; a mermaid source draws as either,
// depending on its grammar. Rendering style (direction, edge style, theme)
// is a third independent axis and never follows from either of these.
export type Language = 'mermaid' | 'markdown'
export type DiagramType = 'flowchart' | 'mindmap'

export const DIAGRAM_TYPE_COLORS: Record<DiagramType, string> = {
  flowchart: '#4B96E6', // blue
  mindmap: '#B355D0',   // purple
}

export function diagramType(source: string, language: Language): DiagramType {
  if (language === 'markdown') return 'mindmap'
  return isMindmapSource(source) ? 'mindmap' : 'flowchart'
}

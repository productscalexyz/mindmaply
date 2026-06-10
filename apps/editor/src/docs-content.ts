export interface ColorSwatch {
  id: string
  hex: string
  label: string
}

export interface NavSection {
  id: string
  label: string
}

// The automatic 5-color branch palette (root is white)
export const COLOR_SWATCHES: ColorSwatch[] = [
  { id: 'root', hex: '#FFFFFF', label: 'Root' },
  { id: 'b1', hex: '#4B96E6', label: 'Branch 1' },
  { id: 'b2', hex: '#B355D0', label: 'Branch 2' },
  { id: 'b3', hex: '#55A996', label: 'Branch 3' },
  { id: 'b4', hex: '#E5884B', label: 'Branch 4' },
  { id: 'b5', hex: '#EBB94A', label: 'Branch 5' },
]

export const NAV_SECTIONS: NavSection[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'layouts',   label: 'Edge Styles' },
  { id: 'colors',    label: 'Colors' },
  { id: 'shapes',    label: 'Shapes' },
  { id: 'direction', label: 'Direction' },
  { id: 'mindmap',   label: 'Mindmap Syntax' },
  { id: 'config',    label: 'Config & Themes' },
  { id: 'reference', label: 'Full Reference' },
]

// Every snippet below is real, supported syntax — each one is rendered live
// on the docs page right under its code block, so they must stay valid.
export const SNIPPETS = {
  straight: `flowchart TD
  CEO["Chief Executive"]
  CEO --> ENG["Engineering"]
  CEO --> PROD["Product"]
  CEO --> FIN["Finance"]
  ENG --> FE["Frontend"]
  ENG --> BE["Backend"]`,

  curved: `%%{init: {"mindmaply": {"edgeStyle": "curved"}}}%%
flowchart LR
  root((Topic))
  root --> A[Idea A]
  root --> B[Idea B]
  root --> C[Idea C]`,

  styleOverride: `flowchart LR
  root["Project"]
  root --> a["On track"]
  root --> b["At risk"]
  root --> c["Blocked"]
  style b stroke:#E5884B,color:#E5884B,fill:none
  style c stroke:#E5884B,color:#E5884B,stroke-dasharray:6 4`,

  shapes: `mindmap
  root((Circle))
    [Square]
    (Rounded)
    Plain text`,

  directionTD: `flowchart TD
  Start --> Process
  Process --> Finish`,

  directionLR: `flowchart LR
  Start --> Process
  Process --> Finish`,

  mindmap: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
    Research
      On effectiveness<br/>and features
    Tools
      Pen and paper
      Mermaid`,

  initConfig: `%%{init: {"mindmaply": {
  "direction": "TD",
  "edgeStyle": "curved",
  "theme": {
    "palette": ["#E45858", "#2F9E8F", "#7A5CD0"],
    "fontFamily": "Georgia, serif",
    "fontSize": 14
  }
}}}%%
mindmap
  root((Idea))
    Branch one
    Branch two`,

  frontmatterConfig: `---
diagram: mindmap
direction: TD
edgeStyle: straight
theme.palette: #E45858, #2F9E8F, #7A5CD0
theme.fontFamily: Georgia, serif
theme.fontSize: 14
---
# Idea
- Branch one
- Branch two`,
} as const satisfies Record<string, string>

export type Snippets = typeof SNIPPETS

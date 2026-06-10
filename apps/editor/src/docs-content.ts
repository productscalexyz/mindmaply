export interface ColorSwatch {
  id: string
  hex: string
  label: string
  classDef: string
}

export interface NavSection {
  id: string
  label: string
}


export const COLOR_SWATCHES: ColorSwatch[] = [
  {
    id: 'root',
    hex: '#FFFFFF',
    label: 'Root',
    classDef: 'classDef root fill:#FFFFFF,stroke:#1E293B,stroke-width:1.5px',
  },
  {
    id: 'b1',
    hex: '#4B96E6',
    label: 'Branch 1',
    classDef: 'classDef b1   fill:#4B96E633,stroke:#4B96E6,stroke-width:2px',
  },
  {
    id: 'b2',
    hex: '#B355D0',
    label: 'Branch 2',
    classDef: 'classDef b2   fill:#B355D033,stroke:#B355D0,stroke-width:2px',
  },
  {
    id: 'b3',
    hex: '#55A996',
    label: 'Branch 3',
    classDef: 'classDef b3   fill:#55A99633,stroke:#55A996,stroke-width:2px',
  },
  {
    id: 'b4',
    hex: '#E5884B',
    label: 'Branch 4',
    classDef: 'classDef b4   fill:#E5884B33,stroke:#E5884B,stroke-width:2px',
  },
  {
    id: 'b5',
    hex: '#EBB94A',
    label: 'Branch 5',
    classDef: 'classDef b5   fill:#EBB94A33,stroke:#EBB94A,stroke-width:2px',
  },
]

export const NAV_SECTIONS: NavSection[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'layouts',   label: 'Layouts' },
  { id: 'colors',    label: 'Color Palette' },
  { id: 'shapes',    label: 'Shapes' },
  { id: 'direction', label: 'Direction' },
  { id: 'mindmap',   label: 'Mindmap Syntax' },
  { id: 'config',    label: 'Config & Themes' },
  { id: 'reference', label: 'Full Reference' },
]

export const SNIPPETS = {
  orthogonal: `flowchart TD
    A["Chief Executive"]:::root --> B["Engineering"]:::b1
    A --> C["Product"]:::b2
    A --> D["Finance"]:::b3
    B --> E["Frontend"]
    B --> F["Backend"]
    classDef root fill:#FFFFFF,stroke:#1E293B,stroke-width:1.5px
    classDef b1   fill:#4B96E633,stroke:#4B96E6,stroke-width:2px
    classDef b2   fill:#B355D033,stroke:#B355D0,stroke-width:2px
    classDef b3   fill:#55A99633,stroke:#55A996,stroke-width:2px`,

  curved: `flowchart LR
    root((Topic)):::root --> A[Idea A]:::b1
    root --> B[Idea B]:::b2
    root --> C[Idea C]:::b3
    classDef root fill:#FFFFFF,stroke:#1E293B,stroke-width:1.5px
    classDef b1   fill:#4B96E633,stroke:#4B96E6,stroke-width:2px
    classDef b2   fill:#B355D033,stroke:#B355D0,stroke-width:2px
    classDef b3   fill:#55A99633,stroke:#55A996,stroke-width:2px`,

  shapes: `flowchart TD
    A[Rectangle]
    B(Rounded)
    C((Circle))
    D{Diamond}
    E([Stadium])`,

  directionTD: `flowchart TD
    A[Start] --> B[Process] --> C[End]`,

  directionLR: `flowchart LR
    A[Start] --> B[Process] --> C[End]`,

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
    "palette": ["#4B96E6", "#B355D0", "#55A996"],
    "fontFamily": "Georgia, serif",
    "fontSize": 14
  }
}}}%%
mindmap
  root((Idea))
    Branch one
    Branch two`,

  frontmatterConfig: `---
direction: TD
edgeStyle: straight
theme.palette: #4B96E6, #B355D0, #55A996
theme.fontFamily: Georgia, serif
theme.fontSize: 14
---
# Idea
- Branch one
- Branch two`,
} as const satisfies Record<string, string>

export type Snippets = typeof SNIPPETS

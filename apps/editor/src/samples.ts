export type SampleId = 'org' | 'mm' | 'proc' | 'batman'
export type Direction = 'TD' | 'LR'
export type EdgeStyle = 'curved' | 'straight'

export interface SampleConfig {
  id: SampleId
  label: string
  /** Base name for exports (never displayed in the UI) */
  file: string
  sources: { TD: string; LR: string }
  /** Preferred edge style when the sample is loaded — always changeable in the UI */
  edgeStyle: EdgeStyle
  /** Whether the sample ships distinct TD/LR source variants (direction itself is always toggleable) */
  supportsDirection: boolean
}

// Every sample carries the default theme inline so it is visible and editable
// right in the editor. Converting to Markdown turns this into frontmatter.
const THEME_DIRECTIVE = `%%{init: {"mindmaply": {"theme": {
  "palette": ["#4B96E6", "#B355D0", "#55A996", "#E5884B", "#EBB94A"],
  "fontFamily": "Inter, SF Pro Text, system-ui, sans-serif",
  "fontSize": 16
}}}}%%`

// ── Org Chart (flowchart grammar) ────────────────────────────
const ORG_TD = `${THEME_DIRECTIVE}
flowchart TD
  CEO["Chief Executive"]
  CEO --> CTO["Engineering"]
  CEO --> CPO["Product"]
  CEO --> CFO["Finance"]
  CEO --> CMO["Marketing"]
  CTO --> BE["Backend"]
  CTO --> FE["Frontend"]
  CTO --> Infra["Infra"]
  CPO --> Des["Design"]
  CPO --> PM["Product Mgmt"]
  CFO --> Acct["Accounting"]
  CFO --> Legal["Legal"]
  CMO --> Brand["Brand"]
  CMO --> Growth["Growth"]`

const ORG_LR = ORG_TD.replace('flowchart TD', 'flowchart LR')

// ── Mind Map (mindmap grammar) ───────────────────────────────
const MM_SOURCE = `${THEME_DIRECTIVE}
mindmap
  root((Mindmaply))
    A mind map is
      Organizes information
      Shows hierarchy visually
    We made it faster
      Polished interactions
      Keyboard shortcuts
    Collaborative
      Real-time editing
      Comments and threads
    Beautiful by default
      Auto-colored branches
      Curated palette`

// ── Process Flow (flowchart grammar) ─────────────────────────
const PROC_TD = `${THEME_DIRECTIVE}
flowchart TD
  Start["Start"]
  Start --> Input["User types syntax"]
  Input --> Valid["Valid syntax?"]
  Valid --> Parse["Parse tree"]
  Valid --> Error["Highlight error"]
  Error --> Input
  Parse --> Colors["Assign branch colors"]
  Colors --> Render["Render SVG"]
  Render --> Output["Live diagram updates"]`

const PROC_LR = PROC_TD.replace('flowchart TD', 'flowchart LR')

// ── Batman (mindmap grammar, deep nesting) ───────────────────
const BATMAN_SOURCE = `${THEME_DIRECTIVE}
mindmap
  root((Batman))
    Origins
      Born Bruce Wayne
      Crime Alley
        Vows to fight crime
          Trains across the world
    Allies
      Alfred Pennyworth
      Robin
      Commissioner Gordon
    Rogues
      The Joker
      Two-Face
      Bane
    Gear
      Batsuit
      Batmobile
      Utility belt`

export const SAMPLES: Record<SampleId, SampleConfig> = {
  org: {
    id: 'org',
    label: 'Org Chart',
    file: 'org-chart.mmd',
    sources: { TD: ORG_TD, LR: ORG_LR },
    edgeStyle: 'straight',
    supportsDirection: true,
  },
  mm: {
    id: 'mm',
    label: 'Mind Map',
    file: 'mindmap.mmd',
    sources: { TD: MM_SOURCE, LR: MM_SOURCE },
    edgeStyle: 'curved',
    supportsDirection: false,
  },
  proc: {
    id: 'proc',
    label: 'Process',
    file: 'process.mmd',
    sources: { TD: PROC_TD, LR: PROC_LR },
    edgeStyle: 'straight',
    supportsDirection: false,
  },
  batman: {
    id: 'batman',
    label: 'Batman',
    file: 'batman.mmd',
    sources: { TD: BATMAN_SOURCE, LR: BATMAN_SOURCE },
    edgeStyle: 'curved',
    supportsDirection: false,
  },
}

export function getSampleSource(id: SampleId, dir: Direction): string {
  const s = SAMPLES[id]
  return s.supportsDirection ? s.sources[dir] : s.sources.TD
}

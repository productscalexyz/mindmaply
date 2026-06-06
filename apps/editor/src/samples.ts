export type SampleId = 'org' | 'mm' | 'proc'
export type Direction = 'TD' | 'LR'

export interface SampleConfig {
  id: SampleId
  label: string
  file: string
  sources: { TD: string; LR: string }
  layout: 'orthogonal' | 'curved'
  supportsDirection: boolean
  color: string
  info: (dir: Direction) => string
  statusInfo: string
}

// ── Org Chart ────────────────────────────────────────────────
const ORG_TD = `flowchart TD
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

// ── Mind Map (curved) ────────────────────────────────────────
const MM_SOURCE = `flowchart LR
  root["Mindmaply"]
  root --> A["A mind map is"]
  root --> B["We made it faster"]
  root --> C["Collaborative"]
  root --> D["Beautiful by default"]
  A --> A1["Organizes information"]
  A --> A2["Shows hierarchy visually"]
  B --> B1["Polished interactions"]
  B --> B2["Keyboard shortcuts"]
  C --> C1["Real-time editing"]
  C --> C2["Comments and threads"]
  D --> D1["Auto-colored branches"]
  D --> D2["Curated palette"]`

// ── Process Flow ─────────────────────────────────────────────
const PROC_TD = `flowchart TD
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

export const SAMPLES: Record<SampleId, SampleConfig> = {
  org: {
    id: 'org',
    label: 'Org Chart',
    file: 'org-chart.mmd',
    sources: { TD: ORG_TD, LR: ORG_LR },
    layout: 'orthogonal',
    supportsDirection: true,
    color: '#4B96E6',
    info: (dir) => `Org Chart · graph ${dir} · 14 nodes`,
    statusInfo: '14 nodes · 4 branches',
  },
  mm: {
    id: 'mm',
    label: 'Mind Map',
    file: 'mindmap.mmd',
    sources: { TD: MM_SOURCE, LR: MM_SOURCE },
    layout: 'curved',
    supportsDirection: false,
    color: '#B355D0',
    info: () => 'Mind Map · flowchart LR · 5 branches',
    statusInfo: '13 nodes · 5 branches',
  },
  proc: {
    id: 'proc',
    label: 'Process',
    file: 'process.mmd',
    sources: { TD: PROC_TD, LR: PROC_LR },
    layout: 'orthogonal',
    supportsDirection: false,
    color: '#55A996',
    info: (dir) => `Process Flow · graph ${dir} · 9 nodes`,
    statusInfo: '9 nodes · 3 branches',
  },
}

export function getSampleSource(id: SampleId, dir: Direction): string {
  const s = SAMPLES[id]
  return s.supportsDirection ? s.sources[dir] : s.sources.TD
}

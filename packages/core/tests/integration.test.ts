import { describe, it, expect } from 'vitest'
import { render, renderMarkdown } from '../src/index'

const EMPATHY_MAP = `flowchart LR
  root["Empathy Map"]
  root --> think["Think and feel"]
  think --> Thoughts
  think --> Aspirations
  think --> Emotions
  root --> see["See"]
  see --> Reactions
  see --> Environment
  root --> pain["Pain"]
  pain --> Painpoints
  pain --> Fears
style root fill:#ffffff,stroke:#e2e8f0
style think stroke:#E5884B,fill:none,color:#E5884B
style Thoughts stroke:none,fill:none,color:#E5884B`

const SITE_MAP = `flowchart LR
  root["Site"]
  root --> about["About"]
  root --> products["Products"]
  root --> blog["Blog"]
  about --> team["Team"]
  about --> story["Our Story"]
  products --> p1["Widget A"]
  products --> p2["Widget B"]
  blog --> latest["Latest Posts"]`

describe('render() integration', () => {
  it('renders the empathy map diagram as valid SVG', () => {
    const svg = render(EMPATHY_MAP)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
    expect(svg).toContain('Empathy Map')
    expect(svg).toContain('Think and feel')
    expect(svg).toContain('Thoughts')
    expect(svg).not.toContain('NaN')
    expect(svg).not.toContain('undefined')
  })

  it('renders the site map as orthogonal by default', () => {
    const svg = render(SITE_MAP)
    expect(svg).toContain('Site')
    expect(svg).toContain('About')
    expect(svg).toContain('Team')
    expect(svg).not.toContain('NaN')
  })

  it('renders curved layout when specified in options', () => {
    const svg = render(SITE_MAP, { layout: 'curved' })
    expect(svg).toContain('Site')
    expect(svg).not.toContain('NaN')
  })

  it('respects layout directive in source', () => {
    const src = `%%{init: {"mindmaply": {"layout": "curved"}}}%%\n${SITE_MAP}`
    const svg = render(src)
    expect(svg).toContain('Site')
    expect(svg).not.toContain('NaN')
  })

  it('options.layout overrides source directive', () => {
    const src = `%%{init: {"mindmaply": {"layout": "curved"}}}%%\n${SITE_MAP}`
    // Force orthogonal despite directive
    const svg = render(src, { layout: 'orthogonal' })
    expect(svg).toContain('Site')
  })

  it('applies branch palette colors in SVG', () => {
    const svg = render(SITE_MAP)
    // First branch → PALETTE[0] = #4B96E6
    expect(svg).toContain('#4B96E6')
  })

  it('canvas background is #F4F5F7', () => {
    const svg = render(SITE_MAP)
    expect(svg).toContain('#F4F5F7')
  })
})

const BUZAN_MINDMAP = `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`

describe('render() — mermaid mindmap syntax', () => {
  it('renders the Tony Buzan mindmap end-to-end with curved edges', () => {
    const svg = render(BUZAN_MINDMAP)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toContain('mindmap')
    expect(svg).toContain('Tony Buzan')
    expect(svg).toContain('Creative techniques')
    expect(svg).toContain(' C ') // curved bezier edges by default
    expect(svg).not.toContain('NaN')
    expect(svg).not.toContain('::icon')
  })

  it('the <br/> label renders as two tspan lines', () => {
    const svg = render(BUZAN_MINDMAP)
    expect(svg).toContain('<tspan')
    expect(svg).toContain('On effectiveness')
    expect(svg).toContain('and features')
  })

  it('every render style is configurable on the same source', () => {
    for (const direction of ['LR', 'TD'] as const) {
      for (const edgeStyle of ['curved', 'straight'] as const) {
        const svg = render(BUZAN_MINDMAP, { direction, edgeStyle })
        expect(svg).toContain('Tony Buzan')
        expect(svg).not.toContain('NaN')
      }
    }
  })
})

describe('renderMarkdown() — document config', () => {
  it('frontmatter direction and edgeStyle apply', () => {
    const src = `---
direction: TD
edgeStyle: straight
---
# Root
- one
- two`
    const svg = renderMarkdown(src)
    expect(svg).toContain('Root')
    expect(svg).not.toContain(' C ') // straight elbows, no bezier
    expect(svg).not.toContain('NaN')
  })

  it('markdown supports TD via options too', () => {
    const svg = renderMarkdown('# Root\n- one\n- two', { direction: 'TD' })
    expect(svg).toContain('Root')
    expect(svg).not.toContain('NaN')
  })

  it('theme overrides recolor the output', () => {
    const svg = renderMarkdown('# Root\n- one', {
      theme: { canvasBg: '#101214', palette: ['#FF0000'] },
    })
    expect(svg).toContain('#101214')
    expect(svg).toContain('#FF0000')
    expect(svg).not.toContain('#F4F5F7')
  })
})

describe('backward compatibility', () => {
  it('the deprecated layout option still works', () => {
    const curved = render(SITE_MAP, { layout: 'curved' })
    const viaEdgeStyle = render(SITE_MAP, { edgeStyle: 'curved' })
    expect(curved).toEqual(viaEdgeStyle)
  })

  it('edgeStyle wins when both layout and edgeStyle are passed', () => {
    const svg = render(SITE_MAP, { layout: 'curved', edgeStyle: 'straight' })
    expect(svg).not.toContain(' C ')
  })
})

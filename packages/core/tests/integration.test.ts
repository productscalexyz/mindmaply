import { describe, it, expect } from 'vitest'
import { render } from '../src/index'

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

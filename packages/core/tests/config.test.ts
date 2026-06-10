import { describe, it, expect } from 'vitest'
import {
  DEFAULT_THEME,
  resolveConfig,
  parseFrontmatter,
  documentConfigFromInit,
  configToFrontmatter,
  configToInitDirective,
} from '../src/config'
import { parse, validateMermaid } from '../src/parser'
import { toMarkdown, toMermaid } from '../src/serializers'
import { parseMarkdown, validateMarkdownSource } from '../src/markdown-parser'
import { PALETTE, FONT_FAMILY, FONT_SIZE } from '../src/design'

describe('DEFAULT_THEME', () => {
  it('matches the design tokens exactly', () => {
    expect(DEFAULT_THEME.palette).toEqual([...PALETTE])
    expect(DEFAULT_THEME.fontFamily).toBe(FONT_FAMILY)
    expect(DEFAULT_THEME.fontSize).toBe(FONT_SIZE)
  })
})

describe('resolveConfig() precedence', () => {
  it('options beat document config', () => {
    const config = resolveConfig(
      { direction: 'TD', edgeStyle: 'curved' },
      { direction: 'LR', edgeStyle: 'straight' },
    )
    expect(config.direction).toBe('LR')
    expect(config.edgeStyle).toBe('straight')
  })

  it('document config beats format defaults', () => {
    const config = resolveConfig(
      { direction: 'TD' },
      {},
      { direction: 'LR', edgeStyle: 'curved' },
    )
    expect(config.direction).toBe('TD')
    expect(config.edgeStyle).toBe('curved')
  })

  it('format defaults beat global defaults', () => {
    const config = resolveConfig(undefined, {}, { edgeStyle: 'curved' })
    expect(config.edgeStyle).toBe('curved')
    expect(config.direction).toBe('LR')
  })

  it('global defaults: LR, straight, DEFAULT_THEME', () => {
    const config = resolveConfig(undefined, {})
    expect(config).toEqual({
      direction: 'LR',
      edgeStyle: 'straight',
      theme: DEFAULT_THEME,
    })
  })

  it('theme merges field-by-field across layers', () => {
    const config = resolveConfig(
      { theme: { palette: ['#111111'], fontSize: 12 } },
      { theme: { fontSize: 20 } },
    )
    expect(config.theme.palette).toEqual(['#111111']) // doc
    expect(config.theme.fontSize).toBe(20) // options win
    expect(config.theme.fontFamily).toBe(FONT_FAMILY) // default
  })
})

describe('documentConfigFromInit()', () => {
  it('reads direction, edgeStyle, and theme', () => {
    const config = documentConfigFromInit({
      direction: 'TD',
      edgeStyle: 'curved',
      theme: { palette: ['#123456', '#ABCDEF'], fontFamily: 'Georgia, serif', fontSize: 14 },
    })
    expect(config.direction).toBe('TD')
    expect(config.edgeStyle).toBe('curved')
    expect(config.theme?.palette).toEqual(['#123456', '#ABCDEF'])
    expect(config.theme?.fontFamily).toBe('Georgia, serif')
    expect(config.theme?.fontSize).toBe(14)
  })

  it('accepts the legacy layout key as an edgeStyle alias', () => {
    expect(documentConfigFromInit({ layout: 'curved' }).edgeStyle).toBe('curved')
    expect(documentConfigFromInit({ layout: 'orthogonal' }).edgeStyle).toBe('straight')
  })

  it('drops invalid values instead of breaking', () => {
    const config = documentConfigFromInit({
      direction: 'UP',
      edgeStyle: 'zigzag',
      theme: { palette: ['not-a-color'], fontSize: -3 },
    })
    expect(config).toEqual({})
  })
})

describe('mermaid init directive integration', () => {
  it('flowchart header direction wins over init directive direction', () => {
    const src = `%%{init: {"mindmaply": {"direction": "TD"}}}%%
flowchart LR
  a --> b`
    expect(parse(src).direction).toBe('LR')
  })

  it('init direction applies when no flowchart header sets one', () => {
    const src = `%%{init: {"mindmaply": {"direction": "TD"}}}%%
mindmap
  root
    a`
    expect(parse(src).direction).toBe('TD')
  })

  it('theme from the init directive lands in ast.config', () => {
    const src = `%%{init: {"mindmaply": {"theme": {"canvasBg": "#101214"}}}}%%
flowchart LR
  a --> b`
    expect(parse(src).config?.theme?.canvasBg).toBe('#101214')
  })

  it('malformed init JSON is ignored', () => {
    const src = `%%{init: {bad json}}%%
flowchart LR
  a --> b`
    const ast = parse(src)
    expect(ast.layout).toBe('orthogonal')
    expect(ast.nodes.size).toBe(2)
  })
})

describe('multi-line init directives', () => {
  const SRC = `%%{init: {"mindmaply": {"theme": {
  "palette": ["#4B96E6", "#B355D0"],
  "fontFamily": "Inter, sans-serif",
  "fontSize": 16
}}}}%%
flowchart LR
  a --> b`

  it('parses a pretty-printed theme directive', () => {
    const ast = parse(SRC)
    expect(ast.config?.theme?.palette).toEqual(['#4B96E6', '#B355D0'])
    expect(ast.nodes.size).toBe(2)
  })

  it('validateMermaid does not flag directive lines', () => {
    expect(validateMermaid(SRC)).toEqual({ valid: true, errors: [] })
  })

  it('works above a mindmap block too', () => {
    const mm = `%%{init: {"mindmaply": {"theme": {
  "fontSize": 14
}}}}%%
mindmap
  root((Idea))
    Branch`
    const ast = parse(mm)
    expect(ast.config?.theme?.fontSize).toBe(14)
    expect(ast.nodes.size).toBe(2)
    expect(validateMermaid(mm)).toEqual({ valid: true, errors: [] })
  })
})

describe('config round-trips through format conversion', () => {
  const CONFIG = {
    edgeStyle: 'curved' as const,
    theme: { palette: ['#111111', '#222222'], fontSize: 14 },
  }

  it('configToFrontmatter ⇄ parseFrontmatter', () => {
    const block = configToFrontmatter(CONFIG)
    const { config } = parseFrontmatter(`${block}\n# Root`)
    expect(config).toEqual(CONFIG)
  })

  it('configToInitDirective ⇄ parse', () => {
    const directive = configToInitDirective(CONFIG)
    const ast = parse(`${directive}\nflowchart LR\n  a --> b`)
    expect(ast.config).toEqual(CONFIG)
  })

  it('empty config serializes to empty strings', () => {
    expect(configToFrontmatter({})).toBe('')
    expect(configToInitDirective({})).toBe('')
  })

  it('mermaid → markdown keeps the theme as frontmatter', () => {
    const src = `${configToInitDirective(CONFIG)}\nflowchart LR\n  root["R"]\n  root --> a["A"]`
    const md = toMarkdown(parse(src))
    expect(md).toContain('theme.palette: #111111, #222222')
    expect(md).toContain('edgeStyle: curved')
    expect(parseMarkdown(md).config).toEqual(CONFIG)
  })

  it('markdown → mermaid keeps the theme as an init directive', () => {
    const md = `${configToFrontmatter(CONFIG)}\n# Root\n- A`
    const mermaid = toMermaid(parseMarkdown(md))
    expect(mermaid).toContain('%%{init:')
    expect(parse(mermaid).config).toEqual(CONFIG)
  })
})

describe('parseFrontmatter()', () => {
  it('parses direction, edgeStyle, and dotted theme keys', () => {
    const src = `---
direction: TD
edgeStyle: straight
theme.palette: #4B96E6, #B355D0, #55A996
theme.fontFamily: Georgia, serif
theme.fontSize: 14
---
# Title
- child`
    const { config, body } = parseFrontmatter(src)
    expect(config.direction).toBe('TD')
    expect(config.edgeStyle).toBe('straight')
    expect(config.theme?.palette).toEqual(['#4B96E6', '#B355D0', '#55A996'])
    expect(config.theme?.fontFamily).toBe('Georgia, serif')
    expect(config.theme?.fontSize).toBe(14)
    expect(body).toContain('# Title')
    expect(body).not.toContain('direction: TD')
  })

  it('preserves line numbers by blanking frontmatter lines', () => {
    const src = `---
direction: TD
---
# Title`
    const { body } = parseFrontmatter(src)
    expect(body.split('\n')).toHaveLength(src.split('\n').length)
    expect(body.split('\n')[3]).toBe('# Title')
  })

  it('returns empty config when there is no frontmatter', () => {
    const { config, body, lineCount } = parseFrontmatter('# Title')
    expect(config).toEqual({})
    expect(body).toBe('# Title')
    expect(lineCount).toBe(0)
  })

  it('an unterminated block is treated as content, not config', () => {
    const src = `---
direction: TD
# Title`
    expect(parseFrontmatter(src).config).toEqual({})
  })

  it('ignores unknown keys and invalid values', () => {
    const src = `---
direction: UP
mystery: 42
theme.fontSize: huge
---
# Title`
    expect(parseFrontmatter(src).config).toEqual({})
  })
})

describe('markdown frontmatter integration', () => {
  const SRC = `---
direction: TD
edgeStyle: straight
---
# Root
- one
- two`

  it('parseMarkdown applies frontmatter config', () => {
    const ast = parseMarkdown(SRC)
    expect(ast.direction).toBe('TD')
    expect(ast.layout).toBe('orthogonal')
    expect(ast.config?.edgeStyle).toBe('straight')
    expect(ast.nodes.size).toBe(3)
  })

  it('validateMarkdownSource does not flag frontmatter lines', () => {
    expect(validateMarkdownSource(SRC)).toEqual({ valid: true, errors: [] })
  })

  it('markdown without frontmatter keeps the curved/LR defaults', () => {
    const ast = parseMarkdown('# Root\n- one')
    expect(ast.direction).toBe('LR')
    expect(ast.layout).toBe('curved')
  })
})

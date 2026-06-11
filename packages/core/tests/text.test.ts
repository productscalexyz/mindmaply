import { describe, it, expect } from 'vitest'
import {
  estimateLineWidth,
  wrapLine,
  wrapLabel,
  fontSizeForDepth,
} from '../src/layout/text'
import { DEFAULT_THEME } from '../src/config'
import { FONT_SIZE } from '../src/design'

const LONG = 'Clarify what was at risk, emotionally or otherwise, to make the story compelling'

describe('wrapLine()', () => {
  it('returns a fitting line verbatim (exact string identity)', () => {
    const line = 'short  label' // double space must survive
    expect(wrapLine(line, 260, FONT_SIZE)).toEqual([line])
  })

  it('greedy wrap keeps every line within maxWidth', () => {
    const lines = wrapLine(LONG, 260, FONT_SIZE)
    expect(lines.length).toBeGreaterThan(1)
    for (const l of lines) {
      expect(estimateLineWidth(l, FONT_SIZE)).toBeLessThanOrEqual(260)
    }
    expect(lines.join(' ')).toBe(LONG)
  })

  it('a single word wider than maxWidth gets its own overflowing line', () => {
    const lines = wrapLine('tiny Supercalifragilisticexpialidocious tiny', 60, FONT_SIZE)
    expect(lines).toEqual(['tiny', 'Supercalifragilisticexpialidocious', 'tiny'])
  })

  it('maxWidth <= 0 disables wrapping', () => {
    expect(wrapLine(LONG, 0, FONT_SIZE)).toEqual([LONG])
  })
})

describe('wrapLabel()', () => {
  it('respects hard \\n breaks; each segment wraps independently', () => {
    const lines = wrapLabel(`short\n${LONG}`, 260, FONT_SIZE)
    expect(lines[0]).toBe('short')
    expect(lines.length).toBeGreaterThan(2)
  })

  it('maxWidth = 0 reduces to label.split("\\n")', () => {
    expect(wrapLabel(`a\n${LONG}`, 0, FONT_SIZE)).toEqual(['a', LONG])
  })
})

describe('fontSizeForDepth()', () => {
  it('scaled defaults: 16 / 16 / 14 / 13', () => {
    expect(fontSizeForDepth(0, DEFAULT_THEME)).toBe(16)
    expect(fontSizeForDepth(1, DEFAULT_THEME)).toBe(16)
    expect(fontSizeForDepth(2, DEFAULT_THEME)).toBe(14)
    expect(fontSizeForDepth(3, DEFAULT_THEME)).toBe(13)
  })

  it('clamps at the deepest scale entry', () => {
    expect(fontSizeForDepth(7, DEFAULT_THEME)).toBe(fontSizeForDepth(3, DEFAULT_THEME))
  })

  it('uniform typography returns theme.fontSize at every depth', () => {
    const theme = { ...DEFAULT_THEME, typography: 'uniform' as const }
    for (const depth of [0, 1, 2, 3, 7]) {
      expect(fontSizeForDepth(depth, theme)).toBe(theme.fontSize)
    }
  })

  it('rounds scaled sizes to half-px steps', () => {
    const theme = { ...DEFAULT_THEME, fontSize: 15 }
    const size = fontSizeForDepth(2, theme)
    expect(size * 2).toBe(Math.round(size * 2))
  })
})

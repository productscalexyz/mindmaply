import { describe, it, expect } from 'vitest'
import { PALETTE, CANVAS_BG, ROOT_BG, TEXT_COLOR } from '../src/design'

describe('design system', () => {
  it('palette has exactly 5 colors', () => {
    expect(PALETTE).toHaveLength(5)
  })

  it('palette colors are valid hex strings', () => {
    for (const color of PALETTE) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('canvas background is not pure white', () => {
    expect(CANVAS_BG).not.toBe('#ffffff')
    expect(CANVAS_BG).not.toBe('#FFFFFF')
  })

  it('root background is pure white', () => {
    expect(ROOT_BG.toLowerCase()).toBe('#ffffff')
  })

  it('text color is dark slate', () => {
    expect(TEXT_COLOR.toLowerCase()).toBe('#1e293b')
  })
})

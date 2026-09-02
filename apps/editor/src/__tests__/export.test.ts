import { describe, it, expect } from 'vitest'
import { rasterScale, withEmbeddedStyle, COPY_IMAGE_SCALE } from '../export'

describe('rasterScale', () => {
  it('honours the requested scale for ordinary maps', () => {
    expect(rasterScale(1200, 800, 3)).toBe(3)
  })

  it('shrinks a huge map until the raster fits the pixel budget', () => {
    // 3000×2800 at 3x is 75 MP; the 16 MP ceiling caps it well under 3.
    const s = rasterScale(3000, 2800, 3)
    expect(s).toBeLessThan(3)
    // rounding slack: the canvas rounds each side to whole pixels anyway
    expect(3000 * s * (2800 * s)).toBeLessThanOrEqual(16_000_000 + 1)
  })

  it('respects the per-side ceiling on a very wide map', () => {
    const s = rasterScale(6000, 300, 3)
    expect(6000 * s).toBeLessThanOrEqual(8192)
  })

  it('copies default to 3x', () => {
    expect(COPY_IMAGE_SCALE).toBe(3)
  })
})

describe('withEmbeddedStyle', () => {
  it('drops the style straight after the root tag', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="5"><rect/></svg>'
    const out = withEmbeddedStyle(svg, '<style>x</style>')
    expect(out).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="5"><style>x</style><rect/></svg>',
    )
  })

  it('leaves non-markup alone', () => {
    expect(withEmbeddedStyle('nope', '<style/>')).toBe('nope')
  })
})

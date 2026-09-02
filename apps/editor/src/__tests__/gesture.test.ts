import { describe, it, expect } from 'vitest'
import { distance, midpoint, panForZoom } from '../gesture'

describe('distance / midpoint', () => {
  it('measures between two pointers', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 4 })).toEqual({ x: 5, y: 2 })
  })
})

describe('panForZoom', () => {
  const center = { x: 500, y: 300 }

  // Screen position of a diagram point d (unscaled offset from the centre).
  const screen = (d: { x: number; y: number }, pan: { x: number; y: number }, zoom: number) => ({
    x: center.x + pan.x + d.x * zoom,
    y: center.y + pan.y + d.y * zoom,
  })

  it('keeps the point under the anchor fixed through a zoom', () => {
    const pan = { x: 40, y: -20 }
    const d = { x: 120, y: -60 }
    const anchor = screen(d, pan, 0.8)
    const next = panForZoom(anchor, center, pan, 0.8, 1.6)
    expect(screen(d, next, 1.6).x).toBeCloseTo(anchor.x)
    expect(screen(d, next, 1.6).y).toBeCloseTo(anchor.y)
  })

  it('zooming about the centre leaves the pan alone', () => {
    const pan = { x: 15, y: 25 }
    const anchor = { x: center.x + pan.x, y: center.y + pan.y }
    expect(panForZoom(anchor, center, pan, 1, 2)).toEqual(pan)
  })

  it('is the identity when zoom does not change', () => {
    const pan = { x: -30, y: 10 }
    const next = panForZoom({ x: 100, y: 100 }, center, pan, 0.5, 0.5)
    expect(next.x).toBeCloseTo(pan.x)
    expect(next.y).toBeCloseTo(pan.y)
  })
})

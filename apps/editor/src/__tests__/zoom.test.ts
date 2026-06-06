import { describe, it, expect } from 'vitest'
import { clampZoom, stepZoom, ZOOM_MIN, ZOOM_MAX } from '../zoom'

describe('clampZoom', () => {
  it('returns value as-is when within bounds', () => {
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(0.5)).toBe(0.5)
    expect(clampZoom(2)).toBe(2)
  })
  it('clamps to ZOOM_MIN when below', () => {
    expect(clampZoom(0)).toBe(ZOOM_MIN)
    expect(clampZoom(-1)).toBe(ZOOM_MIN)
  })
  it('clamps to ZOOM_MAX when above', () => {
    expect(clampZoom(5)).toBe(ZOOM_MAX)
    expect(clampZoom(100)).toBe(ZOOM_MAX)
  })
})

describe('stepZoom', () => {
  it('adds delta to current zoom and clamps', () => {
    expect(stepZoom(1, 0.15)).toBeCloseTo(1.15)
    expect(stepZoom(1, -0.15)).toBeCloseTo(0.85)
  })
  it('clamps result at boundaries', () => {
    expect(stepZoom(ZOOM_MIN, -1)).toBe(ZOOM_MIN)
    expect(stepZoom(ZOOM_MAX, +1)).toBe(ZOOM_MAX)
  })
})

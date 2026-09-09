import { describe, it, expect } from 'vitest'
import { renderMarkdown, validate } from 'mindmaply-core'
import { EXAMPLES, exampleVideoUrl, previewSource } from '../examples/manifest'

// These four maps ship on the landing page, so a bad entry is a visibly broken
// card in production. The sources are committed, so all of this is checkable
// offline: nothing here touches the network.

describe('EXAMPLES', () => {
  it('is non-empty', () => {
    expect(EXAMPLES.length).toBeGreaterThan(0)
  })

  it('has unique slugs and share ids', () => {
    expect(new Set(EXAMPLES.map((e) => e.slug)).size).toBe(EXAMPLES.length)
    expect(new Set(EXAMPLES.map((e) => e.shareId)).size).toBe(EXAMPLES.length)
  })

  it('has url-safe slugs', () => {
    for (const e of EXAMPLES) expect(e.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('has share ids the api worker will treat as short ids', () => {
    // Mirrors SHORT_ID_RE in api/src/shortlinks.ts. A share id outside this
    // shape is read as a full payload and the link 302s to the homepage.
    for (const e of EXAMPLES) expect(e.shareId).toMatch(/^[A-Za-z0-9_-]{8,16}$/)
  })

  it('has 11-character youtube video ids', () => {
    for (const e of EXAMPLES) expect(e.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/)
  })

  it('has a title and a blurb', () => {
    for (const e of EXAMPLES) {
      expect(e.title.length).toBeGreaterThan(0)
      expect(e.blurb.length).toBeGreaterThan(0)
    }
  })

  // The model emits curly quotes, en dashes and non-breaking hyphens. They
  // render, but they are miserable to hand-edit, so sources are normalised on
  // the way in and stay that way.
  it('has ascii-only sources', () => {
    for (const e of EXAMPLES) {
      const offenders = [...new Set([...e.source].filter((c) => c.charCodeAt(0) > 127))]
      expect(offenders, `${e.slug} has non-ascii: ${offenders.join(' ')}`).toEqual([])
    }
  })
})

describe('example sources', () => {
  it('every source is valid markdown for the engine', () => {
    for (const e of EXAMPLES) {
      const result = validate(e.source, 'markdown')
      expect(result.valid, `${e.slug}: ${JSON.stringify(result.errors)}`).toBe(true)
    }
  })

  it('every source renders', () => {
    for (const e of EXAMPLES) {
      expect(renderMarkdown(e.source, { direction: 'LR' })).toContain('<svg')
    }
  })
})

describe('previewSource', () => {
  it('keeps the heading and drops everything below depth 1', () => {
    const trimmed = previewSource(['# Root', '- One', '  - Deep', '- Two', '    - Deeper'].join('\n'))
    expect(trimmed).toBe(['# Root', '- One', '- Two'].join('\n'))
  })

  it('leaves every example a renderable map', () => {
    for (const e of EXAMPLES) {
      const preview = previewSource(e.source)
      expect(validate(preview, 'markdown').valid, e.slug).toBe(true)
      expect(renderMarkdown(preview, { direction: 'LR' })).toContain('<svg')
    }
  })

  // The reason previews exist: a full map is about 0.35 wide-to-tall, which in
  // a card that is wider than it is tall renders labels a few pixels high.
  it('produces card-shaped previews, not tall ones', () => {
    for (const e of EXAMPLES) {
      const svg = renderMarkdown(previewSource(e.source), { direction: 'LR' })
      const vb = svg.match(/viewBox="[^"]*?([\d.]+) ([\d.]+)"/)
      expect(vb, e.slug).not.toBeNull()
      const aspect = Number(vb![1]) / Number(vb![2])
      expect(aspect, `${e.slug} aspect ${aspect.toFixed(2)}`).toBeGreaterThan(0.7)
    }
  })

  it('trims each example to a handful of branches', () => {
    for (const e of EXAMPLES) {
      const lines = previewSource(e.source).split('\n').length
      expect(lines, e.slug).toBeGreaterThan(2)
      expect(lines, e.slug).toBeLessThanOrEqual(12)
    }
  })
})

describe('exampleVideoUrl', () => {
  it('points at the source talk', () => {
    expect(exampleVideoUrl(EXAMPLES[0])).toBe(
      `https://www.youtube.com/watch?v=${EXAMPLES[0].videoId}`,
    )
  })
})

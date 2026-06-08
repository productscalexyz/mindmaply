import { describe, it, expect } from 'vitest'
import { highlight } from '../highlight'

/** Reverse of highlighting: strip tags, unescape entities → must equal the source. */
function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

const MERMAID_SOURCE = `flowchart TD
  CEO["Chief Executive"]
  CEO --> CTO["Engineering"]
  CTO --> Infra["Infra"]
  A -->|label| B
  Circle((round))
  style CEO fill:#ff0000
  %% a comment
  classDef hot fill:#f00
  class CEO hot
  "Gro`

const MARKDOWN_SOURCE = `# Root

## Branch A
- Item one
  - Nested <tag> & stuff`

describe('highlight() — text fidelity', () => {
  // The pre sits behind a transparent textarea: rendered text must match the
  // source char-for-char or the caret drifts out of alignment.
  it('mermaid output text is identical to the source', () => {
    expect(visibleText(highlight(MERMAID_SOURCE, 'mermaid'))).toBe(MERMAID_SOURCE)
  })

  it('markdown output text is identical to the source', () => {
    expect(visibleText(highlight(MARKDOWN_SOURCE, 'markdown'))).toBe(MARKDOWN_SOURCE)
  })

  it('does not corrupt injected span attributes on edge lines', () => {
    const html = highlight('  CFO --> Legal["Legal"]', 'mermaid')
    // the old multi-pass version matched the "ar" class attribute as a quoted label
    expect(html).not.toContain('class="<span')
    expect(html).toContain('<span class="ar">--&gt;</span>')
    expect(html).toContain('<span class="str">Legal</span>')
  })

  it('escapes HTML in labels', () => {
    const html = highlight('  A["<b>bold</b> & co"]', 'mermaid')
    expect(html).not.toContain('<b>')
    expect(html).toContain('&lt;b&gt;')
  })
})

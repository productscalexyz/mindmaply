import { describe, it, expect } from 'vitest'
import { validate } from '../src/index'

const VALID_MERMAID = `flowchart TD
  CEO["Chief Executive"]
  CEO --> CTO["Engineering"]
  CEO --> CFO["Finance"]
  style CEO fill:#ff0000
  %% a comment`

const VALID_MARKDOWN = `# Root

## Branch A
### Sub
- Item
  - Nested`

describe('validate() — mermaid', () => {
  it('accepts a valid flowchart', () => {
    const result = validate(VALID_MERMAID, 'mermaid')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('flags a dangling partial line with its line number', () => {
    const source = `${VALID_MERMAID}\n"Gro`
    const result = validate(source, 'mermaid')
    expect(result.valid).toBe(false)
    expect(result.errors[0].line).toBe(7)
    expect(result.errors[0].message).toContain('"Gro')
  })

  it('flags an edge with an invalid endpoint', () => {
    const result = validate('flowchart TD\n  A["Root"]\n  A --> "broken', 'mermaid')
    expect(result.valid).toBe(false)
    expect(result.errors[0].line).toBe(3)
    expect(result.errors[0].message).toContain('edge target')
  })

  it('flags an empty document', () => {
    const result = validate('', 'mermaid')
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('no nodes')
  })

  it('flags a graph with no root node', () => {
    const result = validate('flowchart TD\n  A --> B\n  B --> A', 'mermaid')
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('no root node')
  })

  it('accepts comments, blank lines, and the flowchart header', () => {
    const result = validate('%% hi\n\nflowchart LR\n  A["Root"]', 'mermaid')
    expect(result.valid).toBe(true)
  })
})

describe('validate() — markdown', () => {
  it('accepts valid heading/bullet markdown', () => {
    const result = validate(VALID_MARKDOWN, 'markdown')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('flags a plain-text line with its line number', () => {
    const result = validate('# Root\nsome stray text', 'markdown')
    expect(result.valid).toBe(false)
    expect(result.errors[0].line).toBe(2)
    expect(result.errors[0].message).toContain('stray text')
  })

  it('flags a heading without a space after the hashes', () => {
    const result = validate('# Root\n##Tight', 'markdown')
    expect(result.valid).toBe(false)
    expect(result.errors[0].line).toBe(2)
  })

  it('flags an empty document', () => {
    const result = validate('', 'markdown')
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('no nodes')
  })
})

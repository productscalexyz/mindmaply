import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser'

describe('parse()', () => {
  it('defaults layout to orthogonal', () => {
    const ast = parse('flowchart LR\n  root["Site"]')
    expect(ast.layout).toBe('orthogonal')
  })

  it('reads curved layout from init directive', () => {
    const src = `%%{init: {"mindmaply": {"layout": "curved"}}}%%
flowchart LR
  root["Map"]`
    expect(parse(src).layout).toBe('curved')
  })

  it('parses a quoted-label rect node', () => {
    const ast = parse('flowchart LR\n  root["Empathy Map"]')
    expect(ast.nodes.get('root')).toEqual({
      id: 'root',
      label: 'Empathy Map',
      shape: 'rect',
    })
  })

  it('parses a circle node', () => {
    const ast = parse('flowchart LR\n  root((Center))')
    expect(ast.nodes.get('root')?.shape).toBe('circle')
    expect(ast.nodes.get('root')?.label).toBe('Center')
  })

  it('parses a bare node id as label (underscores → spaces)', () => {
    const ast = parse('flowchart LR\n  Think_and_feel')
    expect(ast.nodes.get('Think_and_feel')).toEqual({
      id: 'Think_and_feel',
      label: 'Think and feel',
      shape: 'rect',
    })
  })

  it('parses an unquoted-label rect node', () => {
    const ast = parse('flowchart LR\n  root[My Label]')
    expect(ast.nodes.get('root')).toEqual({
      id: 'root',
      label: 'My Label',
      shape: 'rect',
    })
  })

  it('parses edge with mixed quoted and unquoted node types', () => {
    const ast = parse('flowchart LR\n  a["Quoted"] --> b[Unquoted]')
    expect(ast.nodes.size).toBe(2)
    expect(ast.edges).toEqual([{ from: 'a', to: 'b' }])
    expect(ast.nodes.get('b')?.label).toBe('Unquoted')
  })

  it('parses edges and registers both endpoint nodes', () => {
    const ast = parse('flowchart LR\n  root["Site"] --> section["Section"]')
    expect(ast.edges).toEqual([{ from: 'root', to: 'section' }])
    expect(ast.nodes.get('root')?.label).toBe('Site')
    expect(ast.nodes.get('section')?.label).toBe('Section')
  })

  it('parses edge with bare right-hand node', () => {
    const ast = parse('flowchart LR\n  root --> Thoughts')
    expect(ast.edges).toEqual([{ from: 'root', to: 'Thoughts' }])
    expect(ast.nodes.get('Thoughts')?.label).toBe('Thoughts')
  })

  it('parses style directives', () => {
    const src = `flowchart LR
  root["Site"]
style root fill:#ffffff,stroke:#e2e8f0,color:#1E293B`
    const ast = parse(src)
    expect(ast.styles.get('root')).toEqual({
      fill: '#ffffff',
      stroke: '#e2e8f0',
      color: '#1E293B',
    })
  })

  it('parses stroke-dasharray in style directive', () => {
    const src = `flowchart LR
  root["Site"]
style root stroke:#4B96E6,stroke-dasharray:5 5`
    const ast = parse(src)
    expect(ast.styles.get('root')?.strokeDasharray).toBe('5 5')
  })

  it('ignores comment lines starting with %%', () => {
    const ast = parse('%% this is a comment\nflowchart LR\n  root["Site"]')
    expect(ast.nodes.size).toBe(1)
  })

  it('handles a multi-branch diagram', () => {
    const src = `flowchart LR
  root["Empathy Map"]
  root --> think["Think and feel"]
  think --> Thoughts
  think --> Aspirations
  root --> see["See"]
  see --> Reactions`
    const ast = parse(src)
    expect(ast.nodes.size).toBe(6)
    expect(ast.edges).toHaveLength(5)
  })
})

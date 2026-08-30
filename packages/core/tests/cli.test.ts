import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync, type ExecFileSyncOptions } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { decodeShare } from '../src/share'

const CLI = join(dirname(fileURLToPath(import.meta.url)), '../dist/cli.js')

interface CliResult {
  stdout: string
  stderr: string
  code: number
}

function run(args: string[], input?: string): CliResult {
  const options: ExecFileSyncOptions = { input, encoding: 'utf8' }
  try {
    const stdout = execFileSync('node', [CLI, ...args], options) as unknown as string
    return { stdout, stderr: '', code: 0 }
  } catch (err) {
    const e = err as { status: number; stdout: unknown; stderr: unknown }
    return { stdout: String(e.stdout ?? ''), stderr: String(e.stderr ?? ''), code: e.status }
  }
}

const MARKDOWN = '# Plan\n- research\n  - competitors\n- build\n'
const FLOWCHART = 'flowchart LR\na[Start] --> b[Review]\nb --> c((Done))\n'
const MINDMAP = 'mindmap\n  root((Ideas))\n    One\n    Two\n'

describe('cli', () => {
  beforeAll(() => {
    // The CLI tests exercise the built binary; `pnpm build` must run first
    // (the root `pnpm test` script already does).
    expect(existsSync(CLI), `missing ${CLI}: run pnpm build first`).toBe(true)
  })

  it('renders markdown from stdin to SVG on stdout', () => {
    const { stdout, code } = run(['render'], MARKDOWN)
    expect(code).toBe(0)
    expect(stdout).toContain('<svg')
    expect(stdout).toContain('Plan')
  })

  it('sniffs mermaid flowchart and mindmap grammars', () => {
    expect(run(['validate'], FLOWCHART).stdout).toContain('valid (mermaid)')
    expect(run(['validate'], MINDMAP).stdout).toContain('valid (mermaid)')
    expect(run(['validate'], MARKDOWN).stdout).toContain('valid (markdown)')
  })

  it('exits 1 with line-numbered errors on invalid source', () => {
    const { stderr, code } = run(['validate'], '# Plan\n**bold junk**\n')
    expect(code).toBe(1)
    expect(stderr).toContain('line 2:')
  })

  it('share prints URLs whose payload round-trips through decodeShare', () => {
    const { stdout, code } = run(['share', '--direction', 'TD'], MARKDOWN)
    expect(code).toBe(0)
    const out = JSON.parse(stdout)
    expect(out.editorUrl).toContain('https://mindmaply.app/#/editor?d=')
    expect(out.sharePageUrl).toContain('https://mindmaply.app/s/')
    expect(out.embedCode).toContain('<iframe')
    const d = out.editorUrl.split('d=')[1]
    const payload = decodeShare(d)
    expect(payload?.source).toBe(MARKDOWN)
    expect(payload?.direction).toBe('TD')
  })

  // --short is best-effort: point it at a dead port and it must still succeed,
  // falling back to the long link rather than failing the whole command.
  it('share --short falls back to the long link when the API is unreachable', () => {
    const { stdout, code } = run(['share', '--short', '--api-base', 'http://127.0.0.1:9'], MARKDOWN)
    expect(code).toBe(0)
    const out = JSON.parse(stdout)
    expect(out.sharePageUrl).toContain('https://mindmaply.app/s/')
    const d = out.sharePageUrl.split('/s/')[1]
    expect(decodeShare(d)?.source).toBe(MARKDOWN)
  })

  it('converts mermaid to a markdown outline', () => {
    const { stdout, code } = run(['convert', '--to', 'markdown'], FLOWCHART)
    expect(code).toBe(0)
    expect(stdout).toContain('# Start')
    expect(stdout).toContain('## Review')
  })

  it('rejects unknown commands and empty input with exit 2', () => {
    expect(run(['bogus'], MARKDOWN).code).toBe(2)
    expect(run(['render'], '  \n').code).toBe(2)
  })
})

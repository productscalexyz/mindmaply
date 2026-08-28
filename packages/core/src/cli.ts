#!/usr/bin/env node
// mindmaply CLI: a thin command-line layer over the library, so agents and
// shell users can render/validate/share without writing a Node script.
// No dependencies beyond the library itself; argv parsing is by hand.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { render, renderMarkdown, validate } from './index'
import { parse, parseMarkdown, toMarkdown, toMermaid } from './index'
import { encodeShare, buildShareUrl, buildEmbedUrl, buildShareLandingUrl } from './share'
import type { SharePayload } from './share'
import { isMindmapSource } from './mindmap-parser'
import type { Direction, EdgeStyle } from './config'

// Where the editor/embed views and the render API live. Overridable with
// --base / --api-base so self-hosters get correct links.
const SITE_BASE = 'https://mindmaply.app/'
const API_BASE = 'https://api.mindmaply.app'

type Format = 'markdown' | 'mermaid'

interface Opts {
  file?: string
  format?: Format
  direction?: Direction
  edgeStyle?: EdgeStyle
  out?: string
  to?: Format
  base?: string
  apiBase?: string
}

const HELP = `mindmaply <command> [file] [options]

Reads Mindmaply source (a Markdown outline or a Mermaid flowchart/mindmap)
from [file] or stdin.

Commands:
  render     Render source to SVG (stdout, or a file with -o)
  validate   Lint source; prints "line N: message" errors and exits 1 if invalid
  share      Print share, embed, and image URLs for the source as JSON
  convert    Convert between formats (--to markdown|mermaid)

Options:
  --format <markdown|mermaid>      Source format (default: auto-detected)
  --direction <LR|TD>              Layout direction override
  --edge-style <curved|straight>   Edge style override
  -o, --out <file>                 Write render output to a file
  --to <markdown|mermaid>          Target format for convert
  --base <url>                     Site base for share links (default ${SITE_BASE})
  --api-base <url>                 API base for image links (default ${API_BASE})
  -h, --help                       Show this help
  -V, --version                    Print the package version

Examples:
  echo '# Plan\\n- research\\n- build' | mindmaply render -o plan.svg
  mindmaply validate notes.md
  mindmaply share notes.md --direction TD
  mindmaply convert flow.mmd --to markdown`

function fail(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(2)
}

function expectValue<T extends string>(flag: string, value: string | undefined, allowed?: readonly T[]): T {
  if (value === undefined) fail(`Missing value for ${flag}`)
  if (allowed && !allowed.includes(value as T)) {
    fail(`Invalid value for ${flag}: "${value}" (expected ${allowed.join(' | ')})`)
  }
  return value as T
}

function parseArgs(argv: string[]): { command: string; opts: Opts } {
  const command = argv[0]
  const opts: Opts = {}
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--format':
        opts.format = expectValue(arg, argv[++i], ['markdown', 'mermaid'] as const)
        break
      case '--direction':
        opts.direction = expectValue(arg, argv[++i], ['LR', 'TD'] as const)
        break
      case '--edge-style':
        opts.edgeStyle = expectValue(arg, argv[++i], ['curved', 'straight'] as const)
        break
      case '-o':
      case '--out':
        opts.out = expectValue(arg, argv[++i])
        break
      case '--to':
        opts.to = expectValue(arg, argv[++i], ['markdown', 'mermaid'] as const)
        break
      case '--base':
        opts.base = expectValue(arg, argv[++i])
        break
      case '--api-base':
        opts.apiBase = expectValue(arg, argv[++i])
        break
      default:
        if (arg.startsWith('-') && arg !== '-') fail(`Unknown option: ${arg}\n\n${HELP}`)
        if (opts.file) fail(`Unexpected extra argument: ${arg}`)
        opts.file = arg
    }
  }
  return { command, opts }
}

async function readSource(file?: string): Promise<string> {
  if (file && file !== '-') return readFileSync(file, 'utf8')
  if (process.stdin.isTTY) fail(`No input: pass a file or pipe source on stdin.\n\n${HELP}`)
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

// Mirror the render API's sniffing, plus the mermaid mindmap grammar (which
// has no arrows, so the API heuristics alone would misread it as markdown).
function sniffFormat(source: string): Format {
  if (isMindmapSource(source)) return 'mermaid'
  return /^\s*(flowchart|graph)\b/m.test(source) || /-->/.test(source) ? 'mermaid' : 'markdown'
}

function version(): string {
  const require = createRequire(import.meta.url)
  return require('../package.json').version as string
}

function cmdRender(source: string, format: Format, opts: Opts): void {
  const options = { direction: opts.direction, edgeStyle: opts.edgeStyle }
  const svg = format === 'markdown' ? renderMarkdown(source, options) : render(source, options)
  if (opts.out) {
    writeFileSync(opts.out, svg)
    process.stderr.write(`Wrote ${opts.out}\n`)
  } else {
    process.stdout.write(svg + '\n')
  }
}

function cmdValidate(source: string, format: Format): void {
  const result = validate(source, format)
  if (result.valid) {
    process.stdout.write(`valid (${format})\n`)
    return
  }
  for (const e of result.errors) process.stderr.write(`line ${e.line}: ${e.message}\n`)
  process.exit(1)
}

function cmdShare(source: string, format: Format, opts: Opts): void {
  const payload: SharePayload = {
    v: 1,
    source,
    format,
    direction: opts.direction ?? 'LR',
    ...(opts.edgeStyle ? { edgeStyle: opts.edgeStyle } : {}),
  }
  const base = opts.base ?? SITE_BASE
  const apiBase = opts.apiBase ?? API_BASE
  const enc = encodeShare(payload)
  const embedUrl = buildEmbedUrl(payload, base)
  const svgUrl = `${apiBase}/svg?d=${enc}`
  process.stdout.write(
    JSON.stringify(
      {
        format,
        direction: payload.direction,
        editorUrl: buildShareUrl(payload, base),
        // The link to paste in chat/social: unfurls with a preview image.
        sharePageUrl: buildShareLandingUrl(payload, base),
        embedUrl,
        embedCode: `<iframe src="${embedUrl}" width="800" height="500" style="border:0;border-radius:12px" loading="lazy"></iframe>`,
        svgUrl,
        imgCode: `<img src="${svgUrl}" alt="mindmap" />`,
        pngUrl: `${apiBase}/png?d=${enc}`,
      },
      null,
      2,
    ) + '\n',
  )
}

function cmdConvert(source: string, format: Format, opts: Opts): void {
  if (!opts.to) fail('convert requires --to markdown|mermaid')
  const ast = format === 'markdown' ? parseMarkdown(source) : parse(source)
  const out = opts.to === 'markdown' ? toMarkdown(ast) : toMermaid(ast, opts.direction)
  process.stdout.write(out + '\n')
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    process.stdout.write(HELP + '\n')
    process.exit(argv.length === 0 ? 2 : 0)
  }
  if (argv[0] === '-V' || argv[0] === '--version') {
    process.stdout.write(version() + '\n')
    return
  }

  const { command, opts } = parseArgs(argv)
  const commands = ['render', 'validate', 'share', 'convert']
  if (!commands.includes(command)) fail(`Unknown command: ${command}\n\n${HELP}`)

  const source = await readSource(opts.file)
  if (!source.trim()) fail('Input is empty.')
  const format: Format = opts.format ?? sniffFormat(source)

  if (command === 'render') cmdRender(source, format, opts)
  else if (command === 'validate') cmdValidate(source, format)
  else if (command === 'share') cmdShare(source, format, opts)
  else cmdConvert(source, format, opts)
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(1)
})

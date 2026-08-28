# mindmaply-core

Render Mermaid flowcharts and Markdown outlines as beautiful, Whimsical-quality
SVG mind maps. Framework-agnostic: no DOM, no React, runs in Node (18+),
browsers, and edge runtimes. Two runtime dependencies (`d3-hierarchy`,
`lz-string`).

This is the engine behind [mindmaply.app](https://mindmaply.app).

## Install

```bash
npm i mindmaply-core
```

Or use the CLI without installing:

```bash
npx -y mindmaply-core render map.md -o map.svg
```

## Library

```ts
import { render, renderMarkdown, validate } from 'mindmaply-core'

// From a Markdown outline (headings + bullets, 2-space indents)
const svg = renderMarkdown(`# Topic
- Idea A
  - Detail
- Idea B`)

// From a Mermaid flowchart (minimal subset) or mindmap block
const svg2 = render(`flowchart LR
a[Start] --> b[Review]
b --> c((Done))`)

// Lint without rendering: line-numbered errors for anything the parser skips
const result = validate('# Topic\n**bold junk**', 'markdown')
// result.valid === false, result.errors[0] = { line: 2, message: '...' }
```

### API surface

- `render(source, options?)`: Mermaid source (flowchart or mindmap block) to an SVG string.
- `renderMarkdown(source, options?)`: Markdown outline to an SVG string.
- `validate(source, format)`: lint with 1-based line numbers; rendering itself is best-effort.
- `parse` / `parseMarkdown`: source to a `ParsedAST`; `toMarkdown(ast)` / `toMermaid(ast, direction?)` serialize back (format round-tripping).
- `encodeShare` / `decodeShare` / `buildShareUrl` / `buildEmbedUrl` / `buildShareLandingUrl`: the mindmaply.app share-link encoding (lz-string compressed payload).
- `resolveConfig`, `parseFrontmatter`, `DEFAULT_THEME` and friends: document config and theming.

`RenderOptions`: `direction` (`LR` | `TD`), `edgeStyle` (`curved` | `straight`),
`theme` (palette, fonts, colors), `padding`. Document-level config can also
travel inline with the source: Markdown frontmatter (`direction:`, `edgeStyle:`,
`diagram:`, `theme.*`) or a Mermaid `%%{init: {"mindmaply": {...}}}%%` directive.

## CLI

```
mindmaply <command> [file] [options]     # reads [file] or stdin

Commands
  render     Render source to SVG (stdout, or a file with -o)
  validate   Lint source; prints "line N: message" and exits 1 if invalid
  share      Print share, embed, and image URLs for the source as JSON
  convert    Convert between formats (--to markdown|mermaid)

Options
  --format <markdown|mermaid>      Source format (default: auto-detected)
  --direction <LR|TD>              Layout direction override
  --edge-style <curved|straight>   Edge style override
  -o, --out <file>                 Write render output to a file (render)
  --to <markdown|mermaid>          Target format (convert)
  --base <url> / --api-base <url>  Link bases for share output
```

Example:

```bash
printf '# Plan\n- research\n- build\n' | npx -y mindmaply-core share
# { "editorUrl": "https://mindmaply.app/#/editor?d=...", "sharePageUrl": ..., "pngUrl": ... }
```

## Input grammars

Two text formats, both deliberately small. `validate` flags anything outside them.

Markdown outline: one `# Title` root, optional `##`/`###` headings, `- ` bullets
nested by 2 spaces per level. Optional `--- ... ---` frontmatter for direction,
edge style, diagram type, and theme.

Mermaid subset: `flowchart LR|TD` header; nodes `id[Label]`, `id["Label"]`,
`id((Circle))`, or bare ids; edges exactly `id --> id` (one per line, no
chaining, no edge labels, no subgraphs); `style` lines; `%%` comments. Mermaid
`mindmap` indentation blocks are also accepted.

Full grammar docs ship in this repo under
[`skills/mindmaply/references`](https://github.com/productscalexyz/mindmaply/tree/main/skills/mindmaply/references),
and live at [mindmaply.app/#/docs](https://mindmaply.app/#/docs).

## Use with AI agents

This repo ships an [Agent Skill](https://agentskills.io) at
[`skills/mindmaply`](https://github.com/productscalexyz/mindmaply/tree/main/skills/mindmaply)
that teaches AI assistants (Claude Code, Codex, Cursor, and other
SKILL.md-compatible agents) to build, validate, and share mind maps with this
package.

## License

MIT

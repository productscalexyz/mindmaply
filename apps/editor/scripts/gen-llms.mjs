#!/usr/bin/env node
// Generates public/llms-full.txt from the Agent Skill's reference docs.
//
// The grammar is already written down in skills/mindmaply/references/*.md, and
// that copy is the one AI agents actually read. Rather than hand-maintaining a
// second prose copy for the website (which would drift the moment either side
// changes), we concatenate those files at build time. Edit the skill; this
// file follows.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const editor = join(here, '..')
const repo = join(editor, '../..')
const skill = join(repo, 'skills/mindmaply')

// Order matters: this reads top to bottom as one document.
const PARTS = [
  ['Markdown outline grammar', 'references/markdown-grammar.md'],
  ['Mermaid grammar', 'references/mermaid-grammar.md'],
  ['Share, embed, and image URLs', 'references/share-encoding.md'],
  ['Worked examples', 'references/examples.md'],
]

// Strip the leading H1 of each reference so the headings nest under ours.
function body(md) {
  return md.replace(/^#\s+.*\n+/, '').trim()
}

const header = `# Mindmaply, full reference for LLMs

> Mindmaply turns a Markdown outline or a Mermaid flowchart into a polished SVG
> mind map, org chart, or process diagram. Same text in, same diagram out, with
> no canvas to drag. This file is the complete input grammar plus the URL and
> API surface, in one document, for agents that want it all at once.

There are three ways to use Mindmaply from an agent:

1. Install the Agent Skill, which teaches the grammar and the whole workflow:
   \`npx skills add productscalexyz/mindmaply\`
2. Call the CLI directly, no install and no network needed to render:
   \`npx -y mindmaply-core render map.md -o map.svg\`
   Commands: render, validate, share, convert. Add --short to share for a
   tidy mindmaply.app/s/<id> link.
3. Call the HTTP API at https://api.mindmaply.app
   POST /render {"source": "..."} returns the SVG plus a parsed \`model\` graph
   (nodes and edges) and every share, embed, and image URL as JSON.
   POST /transform {"text": "..."} builds the map from raw prose.
   POST /yt/transform {"videoId": "..."} builds one from a YouTube video.

Validate before you ship a diagram: \`mindmaply validate map.md\` exits 1 and
prints \`line N: message\` for each bad line.

Docs for humans: https://mindmaply.app/agents/
Source: https://github.com/productscalexyz/mindmaply
`

const sections = PARTS.map(([title, rel]) => {
  const md = readFileSync(join(skill, rel), 'utf8')
  return `\n\n---\n\n## ${title}\n\n${body(md)}`
}).join('')

const out = join(editor, 'public/llms-full.txt')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, header + sections + '\n')
process.stderr.write(`Wrote ${out}\n`)

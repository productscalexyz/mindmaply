---
name: mindmaply
description: Create, validate, render, and share mind maps, concept maps, org charts, flowcharts, and process diagrams as polished SVG. Use when the user asks for a mind map, a flowchart, a diagram of ideas or topics, a visual outline or summary, an org chart, a process flow, or a shareable or embeddable diagram link, and also when they ask to summarize or visualize an article, a document, a transcript, or a YouTube video as a diagram. Takes Markdown outlines or Mermaid flowchart/mindmap source; renders locally via the mindmaply-core npm CLI (npx mindmaply-core) and produces share URLs, embed iframes, and SVG/PNG image links.
license: MIT (see the repository LICENSE file)
compatibility: Requires Node.js 18+ with npx. Network access is needed on the first npx run (package download) and for share/PNG links to resolve (mindmaply.app, api.mindmaply.app). Rendering and validation themselves run fully offline.
metadata:
  author: productscalexyz
  homepage: https://mindmaply.app
  source: https://github.com/productscalexyz/mindmaply
---

# Mindmaply: mind maps and flowcharts as beautiful SVG

Mindmaply turns plain-text source (a Markdown outline or a small Mermaid subset)
into a polished, Whimsical-quality SVG mind map, plus shareable links. Everything
runs through one CLI:

```bash
npx -y mindmaply-core@latest <command> [file] [options]
```

The binary name after install is `mindmaply`. Commands: `render`, `validate`,
`share`, `convert`. Source comes from a file argument or stdin.

## Workflow

1. Write the diagram source to a file (grammar below; Markdown outline is the default choice).
2. Validate it: `npx -y mindmaply-core validate map.md`
   Invalid source exits 1 and prints `line N: message` for every bad line. Fix those lines and re-validate until it passes.
3. Render it: `npx -y mindmaply-core render map.md -o map.svg`
4. If the user wants a link, embed, or image URL: `npx -y mindmaply-core share map.md --short`
   This prints JSON with `editorUrl` (opens in the live editor), `sharePageUrl` (paste in chat/social, unfurls with a preview), `embedUrl` + `embedCode` (iframe), `svgUrl` + `imgCode` (static image), and `pngUrl`.
   `--short` swaps `sharePageUrl` for a tidy `mindmaply.app/s/<id>` link instead of one carrying the whole encoded map. It needs network; without it, or if the call fails, you still get the long link. Prefer `--short` whenever you are handing the URL to a person.

Give the user the SVG file and, when sharing was asked for, the `sharePageUrl` and `embedCode`.

## Source format 1: Markdown outline (default)

Use for notes, topics, lists, summaries, anything hierarchical.

```markdown
# Root Title
- main branch
  - sub item
    - deeper item
- another branch
```

Rules: the first line is exactly one `# Title` heading. `##` and `###` headings
may add levels. Every other line is a `- ` bullet, nested with 2-space
indentation per level. Nothing else: no bold, no links, no numbered lists, no
paragraphs, no blank headings. An optional leading `--- ... ---` frontmatter
block can set `direction: TD|LR`, `edgeStyle: curved|straight`,
`diagram: mindmap|flowchart`, and `theme.*` keys.
Details: [references/markdown-grammar.md](references/markdown-grammar.md)

## Source format 2: Mermaid flowchart (for processes and flows)

Use ONLY when the content clearly describes a process or flow with steps and arrows.

```
flowchart LR
a[Start] --> b[Review the draft]
b --> c["Approved?"]
c --> d((Done))
```

Rules: the first line is `flowchart LR` or `flowchart TD`. Node ids are single
words (letters, digits, underscores). Labels go in `id[Label]`,
`id["Label with punctuation"]`, or `id((Circle label))`. Edges are exactly
`id --> id`, one per line: no chaining (`a --> b --> c` is invalid), no labels
on arrows, no subgraphs, no dashed arrows, no semicolons. At least one node must
have no incoming arrow. This is a deliberately minimal subset: most full-Mermaid
documents will NOT validate. A Mermaid `mindmap` block (indentation grammar) is
also accepted. Details: [references/mermaid-grammar.md](references/mermaid-grammar.md)

## Quality rules for generated maps

- Stay faithful to the input: use its actual wording, never invent topics.
- Condense long sentences into short labels (under about 8 words). Never use em dashes in labels.
- Be thorough, not superficial. For substantial inputs (articles, talks, transcripts) aim for roughly 25-70 nodes and 3-4 levels: main themes as branches, sub-topics beneath them, and concrete specifics (key claims, names, numbers, steps, examples) as leaves. A reader should be able to reconstruct the substance from the map, not just its table of contents.
- Only very short inputs deserve small maps.
- Keep source under 20,000 characters if share links are needed (the API caps there).

## CLI reference

```
mindmaply render   [file] [--format markdown|mermaid] [--direction LR|TD]
                          [--edge-style curved|straight] [-o out.svg]
mindmaply validate [file] [--format ...]        # exit 1 + line errors if invalid
mindmaply share    [file] [--format ...] [--direction LR|TD] [--edge-style ...]
                          [--short]                     # short mindmaply.app/s/<id> link
mindmaply convert  [file] --to markdown|mermaid
```

`--format` is auto-detected when omitted (flowchart/mindmap headers or `-->`
mean mermaid, otherwise markdown). Default direction is LR; use TD for org
charts and top-down flows. Mind maps default to curved edges, flowcharts to
straight.

## Alternatives to the CLI

- Library: `npm i mindmaply-core`, then `render(source)` / `renderMarkdown(source)` return SVG strings.
- HTTP: `POST https://api.mindmaply.app/render` with `{"source": "..."}` returns SVG plus every share artifact as JSON; `GET /svg?source=...` and `GET /png?source=...` return images directly. `POST /transform` with `{"text": "..."}` (or `{"image": {"base64": "...", "mimeType": "..."}}`) has the API's own AI build the map from raw prose or a picture. `POST /yt/transform` with `{"videoId": "..."}` does the same for a YouTube video, returning `title`, `author`, the generated `source`, and a short map-first `sharePageUrl`.
- Share URL mechanics (for building links without the CLI): [references/share-encoding.md](references/share-encoding.md)
- Worked examples of good maps: [references/examples.md](references/examples.md)

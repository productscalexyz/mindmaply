# mindmaply

[![CI](https://github.com/productscalexyz/mindmaply/actions/workflows/ci.yml/badge.svg)](https://github.com/productscalexyz/mindmaply/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mindmaply-core)](https://www.npmjs.com/package/mindmaply-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Render Mermaid flowcharts and Markdown outlines as beautiful, Whimsical-quality SVG mind maps.

You write standard [Mermaid flowchart](https://mermaid.js.org/syntax/flowchart.html) syntax — or just Markdown headings and bullets — and mindmaply applies an opinionated visual layer: a curated color palette, clean typography, and two polished layout engines (orthogonal and curved).

**Try it live at [mindmaply.app](https://mindmaply.app)** · [Syntax docs](https://mindmaply.app/#/docs)

## What's in this repo

A pnpm monorepo with a clean split between the **rendering engine** and the **web app**:

| Path | What it is |
| --- | --- |
| [`packages/core`](./packages/core) | **`mindmaply-core`** — the framework-agnostic rendering engine, published to [npm](https://www.npmjs.com/package/mindmaply-core). Parser → tree → layout → SVG. One runtime dependency (`d3-hierarchy`). No DOM, no React. |
| [`apps/editor`](./apps/editor) | The web app at mindmaply.app — a React frontend (landing page, live editor, and docs) that consumes `mindmaply-core`. Format switching (Mermaid ⇄ Markdown), sharing, zoom/pan. |

The engine knows nothing about the app; the app depends on the engine via the workspace. You can use `mindmaply-core` standalone in any JS/TS project.

## Use the library

```bash
npm install mindmaply-core
```

```ts
import { render, renderMarkdown } from 'mindmaply-core'

const svg = render(`flowchart LR
  root((Topic)):::root --> A[Idea A]:::b1
  root --> B[Idea B]:::b2
  classDef root fill:#FFFFFF,stroke:#1E293B,stroke-width:1.5px
  classDef b1   fill:#4B96E633,stroke:#4B96E6,stroke-width:2px
  classDef b2   fill:#B355D033,stroke:#B355D0,stroke-width:2px`)

// or from a Markdown outline
const svg2 = renderMarkdown(`# Topic
- Idea A
- Idea B`)
```

Full API in the [core package README](./packages/core/README.md).

## Develop

Requirements: Node ≥ 18, [pnpm](https://pnpm.io) 9.

```bash
pnpm install
pnpm dev      # editor app at http://localhost:5173
pnpm test     # core + editor test suites
pnpm build    # production build of the editor
```

## Contributing

Contributions are very welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow (TDD, Conventional Commits, changesets for releases) and look for [`good first issue`](https://github.com/productscalexyz/mindmaply/labels/good%20first%20issue) labels.

## License

[MIT](./LICENSE)

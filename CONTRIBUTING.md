# Contributing to mindmaply

Thanks for your interest in contributing! This repo is a pnpm monorepo containing the rendering engine (`packages/core`, published as `mindmaply-core`) and the web editor (`apps/editor`).

## Development setup

Requirements: Node ≥ 18, [pnpm](https://pnpm.io) 9.

```bash
git clone https://github.com/productscalexyz/mindmaply.git
cd mindmaply
pnpm install
pnpm test     # run both test suites
pnpm dev      # editor app at http://localhost:5173
```

## Workflow

1. **Open an issue first** for anything beyond a small fix — let's agree on the approach before you invest time.
2. Fork, branch from `main`, keep PRs focused on one change.
3. **Tests are required.** The codebase is test-driven — add or update tests alongside your change and make sure `pnpm test` passes.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`), scoped where helpful (`feat(core): ...`, `fix(editor): ...`).
5. **If your PR changes `packages/core`, add a changeset:**

   ```bash
   pnpm changeset
   ```

   Pick the bump type (patch/minor) and write a one-line summary — this becomes the CHANGELOG entry. PRs that only touch the editor or docs don't need one.

## Project layout

| Path | What it is |
| --- | --- |
| `packages/core/src/parser.ts` | Mermaid flowchart parser → `ParsedAST` |
| `packages/core/src/markdown-parser.ts` | Markdown outline parser → `ParsedAST` |
| `packages/core/src/serializers.ts` | AST → Mermaid / Markdown serializers |
| `packages/core/src/tree.ts` | AST → styled tree (palette resolution) |
| `packages/core/src/layout/` | `orthogonal` and `curved` layout engines |
| `packages/core/src/renderer/` | Layout tree → SVG string |
| `packages/core/src/design.ts` | Design tokens (colors, spacing, typography) |
| `packages/core/tests/` | Vitest suites, one per module |
| `apps/editor/src/` | React app — pages, components, editor CSS |

## Releases

Releases of `mindmaply-core` are automated with [Changesets](https://github.com/changesets/changesets) — see [RELEASING.md](./RELEASING.md). As a contributor you only ever need `pnpm changeset`.

## Reporting bugs

Open an issue with the Mermaid/Markdown source that reproduces the problem and what you expected the output to look like.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be kind.

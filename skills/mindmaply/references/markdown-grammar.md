# Markdown outline grammar

The Markdown parser accepts ONLY headings and bullets. Any other line is a
validation error (`mindmaply validate` reports it with its line number).

## Structure

- `# Title`: the root node. Exactly one, on the first content line.
- `## Section`: level-1 child of the nearest `#`.
- `### Sub`: level-2 child of the nearest `##`. Headings go down to `######`.
- `- item` (also `* item` or `+ item`): child of the nearest heading, or of the nearest bullet at a lower indent.
- `  - item`: 2 spaces of indent = 1 level deeper. Always indent in steps of exactly 2 spaces.
- `<br/>` inside a label becomes a line break in the node.

Not supported (will fail validation): paragraphs, numbered lists, bold/italic
markup, links, code fences, blockquotes, tables, blank headings.

## Frontmatter (optional)

A leading block sets document config that travels with the source:

```markdown
---
direction: TD
edgeStyle: straight
diagram: flowchart
theme.palette: #4B96E6, #B355D0, #55A996, #E5884B, #EBB94A
theme.fontFamily: Inter, system-ui, sans-serif
theme.fontSize: 16
---
# Root
- branch
```

- `direction`: `LR` (default) or `TD`.
- `edgeStyle`: `curved` (default for mindmaps) or `straight` (default for flowcharts).
- `diagram`: `mindmap` (default) or `flowchart`. This decides what gets drawn; the language never does.
- `theme.*` keys: `palette` (comma-separated hex colors, cycled across top-level branches), `fontFamily`, `fontSize`, `textColor`, `canvasBg`, `rootBg`, `nodeBg`, `edgeStrokeWidth`, `wrapWidth`, `typography` (`scaled` | `uniform`), `nodeStyle` (`card` | `plain`).

## Example

```markdown
# Trip Planning
## Destination
### Research
- Compare flight prices across airlines
## Budget
### Daily costs
- Track accommodation, food, and transport separately
```

Long labels auto-wrap, deeper levels scale down, and every node gets a card
with a branch color. No styling work is needed for a good-looking result.
